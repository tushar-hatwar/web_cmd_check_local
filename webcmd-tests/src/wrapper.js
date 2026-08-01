import { execFile } from 'node:child_process';
import process from 'node:process';

/**
 * Redacts potential sensitive data such as tokens, auth keys, passwords, or session secrets.
 * @param {string} text 
 * @returns {string}
 */
export function redactSecrets(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/(bearer\s+)[A-Za-z0-9\-\._~\+\/]+=*/gi, '$1[REDACTED]')
    .replace(/("?(?:token|secret|password|auth|apiKey|session_id)"?\s*:\s*")[^"]+(")/gi, '$1[REDACTED]$2')
    .replace(/((?:token|secret|password|auth|apiKey)=)[^\s&]+/gi, '$1[REDACTED]');
}

/**
 * Custom Error class for WebCMD execution failures.
 */
export class WebcmdError extends Error {
  /**
   * @param {string} message 
   * @param {string} code - Classified error code ('TIMEOUT' | 'NON_ZERO_EXIT' | 'JSON_PARSE_ERROR' | 'CLI_NOT_FOUND')
   * @param {object} [details]
   */
  constructor(message, code, details = {}) {
    super(redactSecrets(message));
    this.name = 'WebcmdError';
    this.code = code;
    this.exitCode = details.exitCode ?? null;
    this.stdout = redactSecrets(details.stdout ?? '');
    this.stderr = redactSecrets(details.stderr ?? '');
    this.args = details.args ?? [];
  }
}

/**
 * Execute a webcmd command with `execFile`.
 * 
 * @param {string[]} args - Array of command arguments (e.g., ['district', 'search', 'Kalki', '-f', 'json'])
 * @param {object} [options] - Execution options
 * @param {number} [options.timeoutMs=30000] - Timeout in milliseconds
 * @param {boolean} [options.parseJson=true] - Attempt to parse stdout as JSON if -f json is present or requested
 * @param {string} [options.execPath] - Executable name or path (defaults to webcmd.cmd on Windows, webcmd elsewhere)
 * @returns {Promise<{ stdout: string, stderr: string, exitCode: number, data?: any, executionTimeMs: number }>}
 * @throws {WebcmdError} Classified error on failure
 */
export function execWebcmd(args, options = {}) {
  const {
    timeoutMs = 45000,
    parseJson = true,
    execPath = process.platform === 'win32' ? 'webcmd.cmd' : 'webcmd'
  } = options;

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const isJsonFormat = args.includes('-f') && args[args.indexOf('-f') + 1] === 'json' || args.includes('json');

    // On Windows with shell: true, Node concatenates args without quoting.
    // Quote any arg containing cmd.exe metacharacters to preserve single-argument semantics.
    const WIN_SHELL_META = /[ "&^|<>%!()]/;
    const safeArgs = process.platform === 'win32'
      ? args.map(arg => typeof arg === 'string' && WIN_SHELL_META.test(arg)
          ? `"${arg.replace(/"/g, '""')}"`
          : arg)
      : args;

    const execOptions = {
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024,
      shell: process.platform === 'win32'
    };

    execFile(execPath, safeArgs, execOptions, (error, stdout, stderr) => {
      const executionTimeMs = Date.now() - startTime;
      const cleanStdout = redactSecrets(stdout || '');
      const cleanStderr = redactSecrets(stderr || '');

      if (error) {
        if (error.code === 'ENOENT') {
          return reject(new WebcmdError(
            `webcmd CLI executable not found: "${execPath}". Ensure webcmd is installed globally via npm install -g @agentrhq/webcmd`,
            'CLI_NOT_FOUND',
            { args, stdout: cleanStdout, stderr: cleanStderr }
          ));
        }

        if (error.killed || error.signal === 'SIGTERM' || (error.code === null && executionTimeMs >= timeoutMs)) {
          return reject(new WebcmdError(
            `webcmd execution timed out after ${timeoutMs}ms (command: webcmd ${args.join(' ')})`,
            'TIMEOUT',
            { args, stdout: cleanStdout, stderr: cleanStderr }
          ));
        }

        const exitCode = typeof error.code === 'number' ? error.code : 1;
        return reject(new WebcmdError(
          `webcmd failed with exit code ${exitCode}: ${cleanStderr || cleanStdout || error.message}`,
          'NON_ZERO_EXIT',
          { exitCode, args, stdout: cleanStdout, stderr: cleanStderr }
        ));
      }

      let parsedData = undefined;
      if (parseJson && isJsonFormat) {
        try {
          parsedData = JSON.parse(stdout);
        } catch (parseErr) {
          return reject(new WebcmdError(
            `Failed to parse JSON response from webcmd: ${parseErr.message}\nRaw stdout: ${cleanStdout.slice(0, 200)}...`,
            'JSON_PARSE_ERROR',
            { exitCode: 0, args, stdout: cleanStdout, stderr: cleanStderr }
          ));
        }
      }

      resolve({
        stdout: cleanStdout,
        stderr: cleanStderr,
        exitCode: 0,
        data: parsedData,
        executionTimeMs
      });
    });
  });
}
