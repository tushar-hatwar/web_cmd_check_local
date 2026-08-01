/**
 * server.js - Local webcmd proxy server for the CineGroup UI.
 * Bridges the React frontend with the webcmd CLI.
 *
 * Run: node server.js
 * API prefix: http://localhost:3001/api
 */

import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// ──────────────────────────────────────────────────────────────
// Shared webcmd executor
// ──────────────────────────────────────────────────────────────
async function runWebcmd(args, { timeoutMs = 30000 } = {}) {
  // Quote arguments that contain spaces
  const safeArgs = args.map(arg => typeof arg === 'string' && arg.includes(' ') ? `"${arg}"` : arg);
  const cmdStr = `webcmd ${safeArgs.join(' ')}`;
  console.log(`\n[webcmd] RUNNING: ${cmdStr}`);
  try {
    const { stdout, stderr } = await execAsync(cmdStr, {
      timeout: timeoutMs,
      env: { ...process.env },
    });
    console.log(`[webcmd] STDOUT: ${stdout.trim().substring(0, 200)}...`);
    if (stderr) console.error(`[webcmd] STDERR: ${stderr}`);
    const raw = stdout.trim();
    try {
      return { ok: true, data: JSON.parse(raw) };
    } catch {
      return { ok: true, data: raw };
    }
  } catch (err) {
    console.error(`[webcmd] ERROR:`, err.message || err);
    if (err.stdout) console.log(`[webcmd] ERROR STDOUT: ${err.stdout}`);
    if (err.stderr) console.error(`[webcmd] ERROR STDERR: ${err.stderr}`);
    const msg = err.stderr || err.stdout || err.message || 'webcmd failed';
    return { ok: false, error: msg, exitCode: err.code };
  }
}

// ──────────────────────────────────────────────────────────────
// GET /api/health — Check webcmd login status
// ──────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  const result = await runWebcmd(['district', 'auth', 'status', '-f', 'json']);
  res.json(result);
});

// ──────────────────────────────────────────────────────────────
// POST /api/showtimes — Fetch showtimes for a movie
// Body: { movie, city, date?, language?, format? }
// ──────────────────────────────────────────────────────────────
app.post('/api/showtimes', async (req, res) => {
  const { movie, city, date, language } = req.body;
  if (!movie || !city) return res.status(400).json({ ok: false, error: 'movie and city are required.' });

  const args = ['district', 'showtimes', movie, '--city', city, '-f', 'json'];
  if (date) args.push('--date', date);
  if (language) args.push('--language', language);

  const result = await runWebcmd(args, { timeoutMs: 45000 });
  res.json(result);
});

// ──────────────────────────────────────────────────────────────
// POST /api/seats — Get available seats for a show
// Body: { showId, formatId?, contentId?, count?, together? }
// ──────────────────────────────────────────────────────────────
app.post('/api/seats', async (req, res) => {
  const { showId, formatId, contentId, count = 2, together = true } = req.body;
  if (!showId) return res.status(400).json({ ok: false, error: 'showId is required.' });

  const args = ['district', 'seats', showId, '-f', 'json', '--count', String(count)];
  if (together) args.push('--together');
  if (formatId) args.push('--format-id', formatId);
  if (contentId) args.push('--content-id', contentId);

  const result = await runWebcmd(args, { timeoutMs: 45000 });
  res.json(result);
});

// ──────────────────────────────────────────────────────────────
// POST /api/checkout — Launch checkout in browser
// Body: { showId, seats[], formatId?, contentId? }
// ──────────────────────────────────────────────────────────────
app.post('/api/checkout', async (req, res) => {
  const { showId, seats, formatId, contentId } = req.body;
  if (!showId || !seats?.length) return res.status(400).json({ ok: false, error: 'showId and seats are required.' });

  const safeSeats = Array.isArray(seats) ? seats.join(',') : seats;
  const args = [
    'district', 'checkout', showId,
    '--seats', safeSeats,
    '--window', 'foreground',
    '--payment', 'review',  // Stop at order review page — safe for demo
    '--timeout', '120',
    '-f', 'json',
  ];
  if (formatId) args.push('--format-id', formatId);
  if (contentId) args.push('--content-id', contentId);

  const safeArgs = args.map(arg => typeof arg === 'string' && arg.includes(' ') ? `"${arg}"` : arg);
  const cmdStr = `webcmd ${safeArgs.join(' ')}`;
  console.log(`\n[webcmd] CHECKOUT LAUNCHING: ${cmdStr}`);

  // Fire-and-forget: respond to UI immediately, run checkout in background
  res.json({ ok: true, data: { status: 'launched', message: 'District checkout opened in browser. Complete your payment there.' } });

  // Run checkout asynchronously after responding
  exec(cmdStr, { timeout: 130000, env: { ...process.env } }, (err, stdout, stderr) => {
    if (err) {
      console.error(`[webcmd] CHECKOUT ERROR: ${err.message}`);
      if (stderr) console.error(`[webcmd] CHECKOUT STDERR: ${stderr}`);
    } else {
      console.log(`[webcmd] CHECKOUT DONE: ${stdout.trim().substring(0, 300)}`);
    }
  });
});

// ──────────────────────────────────────────────────────────────
// Start server
// ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 CineGroup Proxy Server running at http://localhost:${PORT}`);
  console.log(`   Bridging React UI → webcmd CLI\n`);
});
