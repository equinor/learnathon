const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Config ---
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-dev';
const PORT = process.env.PORT || 3000;

// --- Persistence ---
const STATE_FILE = path.join(__dirname, 'state.json');

function loadState(defaults) {
  try {
    const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    return { ...saved, categories: defaults.categories };
  } catch {
    return defaults;
  }
}

function saveState() {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// --- State ---
// Reveal order: concrete → creative → serious → comic relief → finale
const CATEGORIES = [
  { id: 'best-creation',   label: 'Best Creation',          emoji: '🥇' },
  { id: 'most-creative',   label: 'Most Creative AI Use',   emoji: '🎨' },
  { id: 'best-safety',     label: 'Best Safety Practice',   emoji: '🔐' },
  { id: 'best-risk-catch', label: 'Best Risk Catch',        emoji: '🚨' },
  { id: 'best-fail',       label: 'Best Fail Story',        emoji: '😂' },
  { id: 'peoples-choice',  label: "People's Choice",        emoji: '🤝' },
];

let state = loadState({
  teams: [],
  categories: CATEGORIES,
  votingOpen: false,
  revealedUpTo: -1,   // -1 = none revealed, 0 = first, ..., 5 = all
  votes: {},           // { categoryId: { teamName: count } }
});

// --- SSE ---
const clients = new Set();

function broadcast() {
  const message = `data: ${JSON.stringify(state)}\n\n`;
  clients.forEach(res => res.write(message));
}

app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write(`data: ${JSON.stringify(state)}\n\n`);
  clients.add(res);
  req.on('close', () => clients.delete(res));
});

// --- Public API ---

app.get('/state', (req, res) => res.json(state));

app.post('/vote', (req, res) => {
  const { team, category } = req.body;

  if (!state.votingOpen) {
    return res.status(400).json({ error: 'Voting is not open' });
  }
  if (!state.teams.includes(team)) {
    return res.status(400).json({ error: 'Unknown team' });
  }
  if (!state.categories.find(c => c.id === category)) {
    return res.status(400).json({ error: 'Unknown category' });
  }

  if (!state.votes[category]) state.votes[category] = {};
  state.votes[category][team] = (state.votes[category][team] || 0) + 1;

  saveState();
  broadcast();
  res.json({ ok: true });
});

// --- Admin middleware ---
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// --- Admin API ---

app.post('/admin/teams', requireAdmin, (req, res) => {
  const { teams } = req.body;
  if (!Array.isArray(teams)) {
    return res.status(400).json({ error: 'teams must be an array' });
  }
  state.teams = teams.map(t => t.trim()).filter(Boolean);
  saveState();
  broadcast();
  res.json({ ok: true, teams: state.teams });
});

app.post('/admin/open', requireAdmin, (req, res) => {
  if (!state.teams.length) {
    return res.status(400).json({ error: 'Set teams first' });
  }
  state.votingOpen = true;
  saveState();
  broadcast();
  res.json({ ok: true });
});

app.post('/admin/close', requireAdmin, (req, res) => {
  state.votingOpen = false;
  saveState();
  broadcast();
  res.json({ ok: true });
});

app.post('/admin/reveal-next', requireAdmin, (req, res) => {
  if (state.votingOpen) {
    return res.status(400).json({ error: 'Close voting first' });
  }
  if (state.revealedUpTo >= state.categories.length - 1) {
    return res.status(400).json({ error: 'All categories revealed' });
  }
  state.revealedUpTo += 1;
  saveState();
  broadcast();
  res.json({ ok: true, revealed: state.categories[state.revealedUpTo] });
});

app.post('/admin/reset', requireAdmin, (req, res) => {
  state.votingOpen = false;
  state.revealedUpTo = -1;
  state.votes = {};
  saveState();
  broadcast();
  res.json({ ok: true });
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`\nLearnathon Voting App running on http://localhost:${PORT}`);
  console.log(`  Voting page:  http://localhost:${PORT}/vote.html`);
  console.log(`  Screen view:  http://localhost:${PORT}/screen.html`);
  console.log(`  Admin panel:  http://localhost:${PORT}/admin.html`);
  console.log(`\nAdmin token: ${ADMIN_TOKEN}`);
  if (ADMIN_TOKEN === 'admin-dev') {
    console.log('  ⚠️  Using default dev token — set ADMIN_TOKEN env var in production');
  }
  console.log(`✓  State persisted to: ${STATE_FILE}`);
  if (Object.keys(state.votes).length > 0) {
    console.log(`   Resumed with existing vote data.`);
  }
  console.log();
});
