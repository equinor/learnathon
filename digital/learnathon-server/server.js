const express = require('express');
const path = require('path');
const RateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;
const isProdLikeEnv =
  process.env.NODE_ENV === 'production' ||
  !!process.env.RADIX_CLUSTERNAME ||
  !!process.env.RADIX_ENVIRONMENT_NAME;

if (!process.env.ADMIN_TOKEN && isProdLikeEnv) {
  console.error(
    'FATAL: ADMIN_TOKEN environment variable must be set in production/Radix environments.'
  );
  process.exit(1);
}

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-dev';

// Helper to ensure we only accept plain objects (not null/arrays/primitives)
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

const landingPageLimiter = RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs for the landing page
});

// --- Mount app routers ---
const bingoRouter = require('./bingo-router');
const votingRouter = require('./voting-router');

app.use('/bingo', bingoRouter);
app.use('/voting', votingRouter);

// --- Landing page ---
app.get('/', landingPageLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Health check ---
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// --- Admin: backup both states ---
app.get('/admin/backup', (req, res) => {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({
    timestamp: new Date().toISOString(),
    bingo: bingoRouter.getState(),
    voting: votingRouter.getState(),
  });
});

// --- Admin: restore both states ---
app.post('/admin/restore', (req, res) => {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const body = req.body || {};
  if (typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  const { bingo, voting } = body;

  // Validate that any provided state is a plain object (not null/array)
  if (bingo !== undefined && !isPlainObject(bingo)) {
    return res.status(400).json({ error: "Invalid 'bingo' state: expected an object" });
  }
  if (voting !== undefined && !isPlainObject(voting)) {
    return res.status(400).json({ error: "Invalid 'voting' state: expected an object" });
  }

  if (bingo !== undefined) bingoRouter.setState(bingo);
  if (voting !== undefined) votingRouter.setState(voting);
  console.log('Admin: State restored from backup.');
  res.json({ ok: true });
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`\nLearnathon Server running on http://localhost:${PORT}`);
  console.log(`  Bingo card:     http://localhost:${PORT}/bingo/card.html`);
  console.log(`  Bingo wall:     http://localhost:${PORT}/bingo/wall.html`);
  console.log(`  Bingo admin:    http://localhost:${PORT}/bingo/admin.html`);
  console.log(`  Dashboard:      http://localhost:${PORT}/bingo/dashboard.html`);
  console.log(`  Voting:         http://localhost:${PORT}/voting/vote.html`);
  console.log(`  Voting screen:  http://localhost:${PORT}/voting/screen.html`);
  console.log(`  Voting admin:   http://localhost:${PORT}/voting/admin.html`);
  console.log(`  Health:         http://localhost:${PORT}/health`);
  console.log(`\nAdmin token: ${ADMIN_TOKEN === 'admin-dev' ? 'admin-dev (set ADMIN_TOKEN env var in production)' : '(set)'}`);
  console.log();
});
