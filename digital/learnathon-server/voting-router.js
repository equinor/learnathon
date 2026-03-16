const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// --- Config ---
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-dev';

// --- Persistence ---
const STATE_FILE = '/tmp/voting-state.json';

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
  revealedUpTo: -1,
  votes: {},
});

// --- SSE ---
const clients = new Set();

function broadcast() {
  const message = `data: ${JSON.stringify(state)}\n\n`;
  clients.forEach(res => res.write(message));
}

// Static files for /voting/*.html
router.use(express.static(path.join(__dirname, 'public', 'voting')));

router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write(`data: ${JSON.stringify(state)}\n\n`);
  clients.add(res);
  req.on('close', () => clients.delete(res));
});

// --- Public API ---

router.get('/state', (req, res) => res.json(state));

router.post('/vote', (req, res) => {
  const { team, category } = req.body;

  // Prevent prototype-polluting keys from being used as object properties
  const forbiddenKeys = ['__proto__', 'constructor', 'prototype'];
  if (forbiddenKeys.includes(category) || forbiddenKeys.includes(team)) {
    return res.status(400).json({ error: 'Invalid vote parameters' });
  }

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

router.post('/admin/teams', requireAdmin, (req, res) => {
  const { teams } = req.body;
  if (!Array.isArray(teams)) {
    return res.status(400).json({ error: 'teams must be an array' });
  }
  state.teams = teams.map(t => t.trim().replace(/[<>"'&]/g, '').slice(0, 40)).filter(Boolean);
  saveState();
  broadcast();
  res.json({ ok: true, teams: state.teams });
});

router.post('/admin/open', requireAdmin, (req, res) => {
  if (!state.teams.length) {
    return res.status(400).json({ error: 'Set teams first' });
  }
  state.votingOpen = true;
  saveState();
  broadcast();
  res.json({ ok: true });
});

router.post('/admin/close', requireAdmin, (req, res) => {
  state.votingOpen = false;
  saveState();
  broadcast();
  res.json({ ok: true });
});

router.post('/admin/reveal-next', requireAdmin, (req, res) => {
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

router.post('/admin/reset', requireAdmin, (req, res) => {
  state.votingOpen = false;
  state.revealedUpTo = -1;
  state.votes = {};
  saveState();
  broadcast();
  res.json({ ok: true });
});

// Expose state for backup/restore
router.getState = () => state;
router.setState = (data) => {
  // Sanitise restored team names to prevent stored XSS via innerHTML
  const sanitisedTeams = (data.teams || []).map(
    t => String(t).trim().replace(/[<>"'&]/g, '').slice(0, 40)
  ).filter(Boolean);
  state = { ...data, categories: CATEGORIES, teams: sanitisedTeams };
  saveState();
  broadcast();
};

module.exports = router;
