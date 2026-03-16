const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// --- Bingo config ---

const SQUARES = [
  { id: 0, label: 'Use plan mode before building' },
  { id: 1, label: 'Create architecture drawing' },
  { id: 2, label: 'Use an MCP tool' },
  { id: 3, label: 'Customize your AI' },
  { id: 4, label: '⭐ TRY A NEW TOOL ⭐', center: true },
  { id: 5, label: 'Deploy to Radix playground' },
  { id: 6, label: 'Help another team' },
  { id: 7, label: 'Use or create a skill' },
  { id: 8, label: 'Identify a RISK with AI output' },
];

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diagonals
];

// --- State ---
const STATE_FILE = '/tmp/bingo-state.json';

function loadState() {
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveState() {
  fs.writeFileSync(STATE_FILE, JSON.stringify(teams, null, 2));
}

let teams = loadState();

function newTeam(name) {
  return {
    name,
    squares: new Array(9).fill(false),
    completedLines: [],
    isLegend: false,
    joinedAt: new Date().toISOString(),
  };
}

function checkLines(squares) {
  return LINES.filter(line => line.every(i => squares[i]));
}

function sanitise(str) {
  return String(str).trim().replace(/[<>"'&]/g, '').replace(/[\x00-\x1f\x7f]/g, '').slice(0, 40);
}

function isUnsafeKey(key) {
  return key === '__proto__' || key === 'constructor' || key === 'prototype';
}

// --- SSE ---
const clients = new Set();

function broadcast() {
  const data = `data: ${JSON.stringify({ teams, squares: SQUARES })}\n\n`;
  clients.forEach(res => res.write(data));
}

// Static files for /bingo/*.html
router.use(express.static(path.join(__dirname, 'public', 'bingo')));

router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write(`data: ${JSON.stringify({ teams, squares: SQUARES })}\n\n`);
  clients.add(res);
  req.on('close', () => clients.delete(res));
});

router.get('/state', (req, res) => res.json({ teams, squares: SQUARES }));

// --- Join ---
router.post('/join', (req, res) => {
  const name = sanitise(req.body.name || '');
  if (!name) return res.status(400).json({ error: 'Team name required' });
  if (isUnsafeKey(name)) {
    return res.status(400).json({ error: 'Invalid team name' });
  }

  if (!teams[name]) {
    teams[name] = newTeam(name);
    saveState();
    broadcast();
  }

  res.json({ ok: true, team: teams[name] });
});

// --- Mark / unmark a square ---
router.post('/mark', (req, res) => {
  const name = sanitise(req.body.name || '');
  const square = Number(req.body.square);
  const marked = Boolean(req.body.marked);

  if (isUnsafeKey(name)) {
    return res.status(400).json({ error: 'Invalid team name' });
  }
  if (!teams[name]) return res.status(404).json({ error: 'Team not found. Join first.' });
  if (isNaN(square) || square < 0 || square > 8) {
    return res.status(400).json({ error: 'Invalid square index' });
  }

  const team = teams[name];
  const prevLineCount = team.completedLines.length;
  const wasLegend = team.isLegend;

  team.squares[square] = marked;
  team.completedLines = checkLines(team.squares);
  team.isLegend = team.squares.every(Boolean);

  const newLine = team.completedLines.length > prevLineCount;
  const newLegend = team.isLegend && !wasLegend;

  saveState();
  broadcast();
  res.json({ ok: true, newLine, newLegend, isLegend: team.isLegend });
});

// --- GitHub Issues proxy (for dashboard) ---
const issuesCache = { gotcha: { data: null, ts: 0 }, project: { data: null, ts: 0 } };
const CACHE_TTL = 15_000;

router.get('/api/issues', async (req, res) => {
  const label = req.query.label;
  if (label !== 'gotcha' && label !== 'project') {
    return res.status(400).json({ error: 'label must be "gotcha" or "project"' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(503).json({ error: 'GITHUB_TOKEN not configured' });
  }

  const cached = issuesCache[label];
  if (cached.data && Date.now() - cached.ts < CACHE_TTL) {
    return res.json(cached.data);
  }

  try {
    const repo = process.env.GITHUB_REPO || 'equinor/learnathon';
    const url = `https://api.github.com/repos/${repo}/issues?labels=${label}&state=open&per_page=50&sort=created&direction=desc`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'learnathon-bingo-app',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `GitHub API: ${response.statusText}` });
    }

    const issues = await response.json();
    const data = issues.map(issue => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body,
      created_at: issue.created_at,
      user: issue.user?.login,
      html_url: issue.html_url,
    }));

    issuesCache[label] = { data, ts: Date.now() };
    res.json(data);
  } catch (err) {
    console.error('GitHub API error:', err.message);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

// --- Admin middleware ---
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  const adminToken = process.env.ADMIN_TOKEN || 'admin-dev';
  if (token !== adminToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// --- Admin API ---

router.get('/admin/ping', requireAdmin, (req, res) => {
  res.json({ ok: true });
});

router.post('/reset', requireAdmin, (req, res) => {
  teams = {};
  saveState();
  broadcast();
  console.log('Bingo: All cards reset by admin.');
  res.json({ ok: true });
});

// Expose state for backup/restore
router.getState = () => teams;
router.setState = (data) => {
  // Sanitise restored team names to prevent stored XSS via innerHTML
  // Use a null-prototype object and skip unsafe keys to avoid prototype pollution
  const cleaned = Object.create(null);
  const unsafeKeys = ['__proto__', 'constructor', 'prototype'];
  for (const [key, team] of Object.entries(data || {})) {
    const safeName = sanitise((team && team.name) || key);
    if (!safeName || unsafeKeys.includes(safeName)) {
      continue;
    }
    cleaned[safeName] = { ...team, name: safeName };
  }
  teams = cleaned;
  saveState();
  broadcast();
};

module.exports = router;
