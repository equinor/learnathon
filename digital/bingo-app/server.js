const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3001;

// --- Bingo config ---

const SQUARES = [
  { id: 0, label: 'Use agent mode to scaffold' },
  { id: 1, label: 'Implement at least 1 AI suggestion' },
  { id: 2, label: 'Create architecture drawing' },
  { id: 3, label: 'Customize your AI' },
  { id: 4, label: '⭐ TRY A NEW TOOL ⭐', center: true },
  { id: 5, label: "Don't touch the keyboard" },
  { id: 6, label: 'Ask AI to explain code' },
  { id: 7, label: 'Generate tests for your code' },
  { id: 8, label: 'Identify a RISK with AI output' },
];

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diagonals
];

// --- State ---
const STATE_FILE = path.join(__dirname, 'state.json');

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
    completedLines: [],   // array of line arrays e.g. [[0,1,2], [0,4,8]]
    isLegend: false,
    joinedAt: new Date().toISOString(),
  };
}

function checkLines(squares) {
  return LINES.filter(line => line.every(i => squares[i]));
}

function sanitise(str) {
  return String(str).trim().replace(/[<>"'&]/g, '').slice(0, 40);
}

// --- SSE ---
const clients = new Set();

function broadcast() {
  const data = `data: ${JSON.stringify({ teams, squares: SQUARES })}\n\n`;
  clients.forEach(res => res.write(data));
}

app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write(`data: ${JSON.stringify({ teams, squares: SQUARES })}\n\n`);
  clients.add(res);
  req.on('close', () => clients.delete(res));
});

app.get('/state', (req, res) => res.json({ teams, squares: SQUARES }));

// --- Join ---
app.post('/join', (req, res) => {
  const name = sanitise(req.body.name || '');
  if (!name) return res.status(400).json({ error: 'Team name required' });

  if (!teams[name]) {
    teams[name] = newTeam(name);
    saveState();
    broadcast();
  }

  res.json({ ok: true, team: teams[name] });
});

// --- Mark / unmark a square ---
app.post('/mark', (req, res) => {
  const name = sanitise(req.body.name || '');
  const square = Number(req.body.square);
  const marked = Boolean(req.body.marked);

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

// --- Admin reset ---
app.post('/reset', (req, res) => {
  teams = {};
  saveState();
  broadcast();
  console.log('🔄 All bingo cards reset by admin.');
  res.json({ ok: true });
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`\nLearnathon Bingo App running on http://localhost:${PORT}`);
  console.log(`  Team card:  http://localhost:${PORT}/card.html`);
  console.log(`  Wall view:  http://localhost:${PORT}/wall.html`);
  console.log(`  Admin:      http://localhost:${PORT}/admin.html`);
  const teamCount = Object.keys(teams).length;
  console.log(`\n✓  State persisted to: ${STATE_FILE}`);
  if (teamCount > 0) {
    console.log(`   Resumed ${teamCount} team${teamCount !== 1 ? 's' : ''} from previous session.`);
  }
  console.log();
});
