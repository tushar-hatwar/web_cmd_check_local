# WebCMD Test Harness for SeatSync

A standalone test harness designed to validate, explore, and document the `webcmd` CLI commands for District by Zomato browser automation used by SeatSync.

This harness acts as a sandbox to:
1. **Verify** that each `webcmd district` command works as expected.
2. **Understand** output schemas (fields, data types).
3. **Capture** realistic JSON fixtures for offline adapter testing.
4. **Simulate** error conditions (timeouts, missing CLI, invalid inputs, non-zero exits).
5. **Provide** a reference implementation of the `execFile` wrapper for SeatSync.

---

## Prerequisites

- **Node.js**: v18+ (latest LTS recommended)
- **WebCMD CLI**: Installed globally via npm:
  ```bash
  npm install -g @agentrhq/webcmd
  ```
- Verify webcmd is installed before running:
  ```bash
  webcmd --version
  ```

---

## Quick Start

1. Navigate to the harness directory:
   ```bash
   cd webcmd-tests
   ```

2. Run the full test suite:
   ```bash
   npm test
   ```

3. Verify captured JSON fixtures:
   ```bash
   npm run verify-fixtures
   ```

---

## Session Authentication

Some District commands (such as `seats` and `checkout`) may require an authenticated session in the webcmd profile.

To log in beforehand:
```bash
webcmd district login
```

Check session status at any time:
```bash
webcmd district whoami
```

---

## Folder Structure

```
webcmd-tests/
├── package.json            # Scripts & project metadata
├── src/
│   ├── wrapper.js          # The safe execFile wrapper with secret redaction
│   ├── commands/           # Command-specific test modules
│   │   ├── helpers.js      # Fixture storage & path resolution
│   │   ├── auth.js         # district whoami / login
│   │   ├── search.js       # district search <query>
│   │   ├── locations.js    # district locations <query>
│   │   ├── set-location.js # district set-location <location>
│   │   ├── showtimes.js    # district showtimes <movie>
│   │   ├── seats.js        # district seats <show>
│   │   └── checkout.js     # district checkout <show> --payment review
│   └── fixtures/           # Captured JSON responses for offline testing
│       ├── search.json
│       ├── locations.json
│       ├── showtimes.json
│       └── seats.json
├── test/
│   ├── run-all.js          # Main test harness entry point
│   └── verify-fixtures.js  # Schema & JSON structure validator
└── README.md               # Documentation & usage guide
```

---

## Command Reference Summary

| Command | Flags Tested | Purpose |
|---|---|---|
| `district search` | `<query> -f json` | Discover movies and events |
| `district locations` | `<query> -f json` | Resolve cities and area options |
| `district set-location` | `<location> -f json` | Pin browser session location |
| `district showtimes` | `<movie> --city <city> --cinema <cinema> -f json` | Fetch filtered showtimes |
| `district seats` | `<show> --count <N> --together <bool> --class <class> --max-price <price> -f json` | Seat selection & map extraction |
| `district checkout` | `<show> --seats <seats> --payment review -f json` | Booking handoff review |
| `district whoami` | `-f json` | Session state check |

> ⚠️ **Safety Notice**: `district checkout` is executed with `--payment review` mode to prevent generating payment QR codes or placing actual bookings.

---

## Classified Error Handling in `src/wrapper.js`

`execWebcmd` safely executes commands using `child_process.execFile` without shell interpolation. Errors are wrapped into `WebcmdError` instances with standardized error codes:

- `CLI_NOT_FOUND`: The `webcmd` executable is not installed or not present in PATH.
- `TIMEOUT`: The process exceeded the configured timeout limit (`timeoutMs`).
- `NON_ZERO_EXIT`: Command returned a non-zero exit code (stderr and stdout attached).
- `JSON_PARSE_ERROR`: The command output could not be parsed as valid JSON.

### Secret Redaction
All stdout, stderr, and exception messages pass through `redactSecrets()` to mask sensitive fields (tokens, passwords, authorization headers) before logging.

---

## Using Captured Fixtures in SeatSync

The captured fixtures in `src/fixtures/` (`search.json`, `locations.json`, `showtimes.json`, `seats.json`) provide real API payload shapes. SeatSync adapters can import or read these files to run offline unit tests without requiring live web connections.
