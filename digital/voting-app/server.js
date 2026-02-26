const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Config ---
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-dev';
const PORT = process.env.PORT || 3000;

// --- State ---
const CATEGORIES = [
  { id: 'best-creation',    label: 'Best Creation',          emoji: '🥇' },
  { id: 'most-creative',    label: 'Most Creative AI Use',   emoji: '🎨' },
  { id: 'best-safety',      label: 'Best Safety Practice',   emoji: '🔐' },
  { id: 'best-risk-catch',  label: 'Best Risk Catch',        emoji: '🚨' },
  { id: 'peoples-choice',   label: "People's Choice",        emoji: '🤝' },
  { id: 'best-fail',        label: 'Best Fail Story',        emoji: '😂' },
];

let state = {
  teams: [],
  categories: CATEGORIES,
  currentCategoryIndex: -1,  // -1 = not started
  votingOpen: false,
  revealed: false,
  votes: {},                  // { categoryId: { teamName: count } }
};

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

  // Send current state immediately on connect
  res.write(`data: ${JSON.stringify(state)}\n\n`);

  clients.add(res);
  req.on('close', () => clients.delete(res));
});

// --- Public API ---

app.get('/state', (req, res) => res.json(state));

app.post('/vote', (req, res) => {
  const { team } = req.body;

  if (!state.votingOpen) {
    return res.status(400).json({ error: 'Voting is not open' });
  }
  if (state.currentCategoryIndex < 0) {
    return res.status(400).json({ error: 'No active category' });
  }
  if (!state.teams.includes(team)) {
    return res.status(400).json({ error: 'Unknown team' });
  }

  const categoryId = state.categories[state.currentCategoryIndex].id;
  if (!state.votes[categoryId]) state.votes[categoryId] = {};
  state.votes[categoryId][team] = (state.votes[categoryId][team] || 0) + 1;

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
  broadcast();
  res.json({ ok: true, teams: state.teams });
});

app.post('/admin/next', requireAdmin, (req, res) => {
  if (state.currentCategoryIndex >= state.categories.length - 1) {
    return res.status(400).json({ error: 'No more categories' });
  }
  state.votingOpen = false;
  state.revealed = false;
  state.currentCategoryIndex += 1;
  broadcast();
  res.json({ ok: true, category: state.categories[state.currentCategoryIndex] });
});

app.post('/admin/open', requireAdmin, (req, res) => {
  if (state.currentCategoryIndex < 0) {
    return res.status(400).json({ error: 'Advance to a category first' });
  }
  state.votingOpen = true;
  broadcast();
  res.json({ ok: true });
});

app.post('/admin/close', requireAdmin, (req, res) => {
  state.votingOpen = false;
  broadcast();
  res.json({ ok: true });
});

app.post('/admin/reveal', requireAdmin, (req, res) => {
  state.revealed = true;
  broadcast();
  res.json({ ok: true });
});

app.post('/admin/reset', requireAdmin, (req, res) => {
  state.currentCategoryIndex = -1;
  state.votingOpen = false;
  state.revealed = false;
  state.votes = {};
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
    console.log('  ⚠️  Using default dev token — set ADMIN_TOKEN env var in production\n');
  }
});
