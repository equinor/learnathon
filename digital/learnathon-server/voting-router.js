// voting-router.js — Ceremony + Voting System
const express = require('express');
const path = require('path');
const fs = require('fs');
const { computeAllRankings, computeCategoryRanking } = require('./scoring');

const router = express.Router();
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-dev';
const STATE_FILE = path.join('/tmp', 'voting-state.json');

// --- Categories ---
const CATEGORIES = [
  { id: 'best-creation', label: 'Best Creation', emoji: '🥇', question: 'Rate their product' },
  { id: 'most-creative', label: 'Most Creative AI Use', emoji: '🎨', question: 'Rate their creativity' },
  { id: 'best-safety', label: 'Best Safety Practice', emoji: '🔐', question: 'Rate their safety practice' },
  { id: 'best-risk-catch', label: 'Best Risk Catch', emoji: '🚨', question: 'Rate their risk awareness' },
  { id: 'best-fail', label: 'Best Fail Story', emoji: '😂', question: 'Rate their fail story' },
  { id: 'peoples-choice', label: "People's Choice", emoji: '🤝', question: 'Overall impression' },
];
const CATEGORY_IDS = CATEGORIES.map(c => c.id);

// Reveal order (spec section 9)
const REVEAL_ORDER = [
  'best-fail', 'best-risk-catch', 'best-safety',
  'most-creative', 'best-creation', 'peoples-choice', 'overall',
];

// --- Initial State ---
function createInitialState() {
  return {
    phase: 'idle',
    teams: [],
    teamCount: 0,
    presentationOrder: [],
    currentIndex: -1,
    completed: [],
    timer: null,
    voters: {},
    ratings: {},
    categories: CATEGORIES,
    revealedAwards: [],
    currentReveal: null,
    overallStandings: null,
    tiebreaker: null,
  };
}

// --- Persistence ---
let state = createInitialState();
try {
  const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  state = { ...createInitialState(), ...saved };
} catch (_) { /* fresh state */ }

function save() {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// --- SSE Broadcast (filtered for learners — spec section 3) ---
const clients = new Set();

function getFilteredState() {
  const filtered = { ...state };
  // Only show next 3 teams in presentation order
  if (state.presentationOrder.length > 0 && state.currentIndex >= 0) {
    filtered.upNext = state.presentationOrder
      .slice(state.currentIndex, state.currentIndex + 4)
      .map(i => state.teams[i]);
  } else if (state.presentationOrder.length > 0) {
    filtered.upNext = state.presentationOrder.slice(0, 3).map(i => state.teams[i]);
  } else {
    filtered.upNext = [];
  }
  filtered.currentTeam = getCurrentTeam();
  // Remove sensitive data from learner view
  delete filtered.ratings;
  delete filtered.presentationOrder;
  delete filtered.voters;
  return filtered;
}

function broadcast() {
  const data = `data: ${JSON.stringify(getFilteredState())}\n\n`;
  for (const res of clients) {
    res.write(data);
  }
  save();
}

// Admin SSE gets unfiltered state
const adminClients = new Set();

function broadcastAdmin() {
  const data = `data: ${JSON.stringify(state)}\n\n`;
  for (const res of adminClients) {
    res.write(data);
  }
}

function broadcastAll() {
  broadcast();
  broadcastAdmin();
}

// --- Timer System ---
let timerTimeout = null;
let timerCallback = null; // Store current callback to fix extend bug

function startTimer(durationSeconds, onExpire) {
  clearTimer();
  timerCallback = onExpire;
  const now = Date.now();
  state.timer = {
    endsAt: new Date(now + durationSeconds * 1000).toISOString(),
    duration: durationSeconds,
    paused: false,
    remaining: durationSeconds,
  };
  timerTimeout = setTimeout(() => {
    state.timer = null;
    timerTimeout = null;
    timerCallback = null;
    onExpire();
  }, durationSeconds * 1000);
}

function clearTimer() {
  if (timerTimeout) {
    clearTimeout(timerTimeout);
    timerTimeout = null;
  }
  timerCallback = null;
  state.timer = null;
}

function pauseTimer() {
  if (!state.timer || state.timer.paused) return false;
  clearTimeout(timerTimeout);
  timerTimeout = null;
  const remaining = Math.max(0, (new Date(state.timer.endsAt).getTime() - Date.now()) / 1000);
  state.timer.paused = true;
  state.timer.remaining = Math.ceil(remaining);
  return true;
}

function resumeTimer() {
  if (!state.timer || !state.timer.paused || !timerCallback) return false;
  const remaining = state.timer.remaining;
  const cb = timerCallback;
  state.timer.paused = false;
  state.timer.endsAt = new Date(Date.now() + remaining * 1000).toISOString();
  timerTimeout = setTimeout(() => {
    state.timer = null;
    timerTimeout = null;
    timerCallback = null;
    cb();
  }, remaining * 1000);
  return true;
}

function extendTimer(seconds) {
  if (!state.timer) return false;
  if (state.timer.paused) {
    state.timer.remaining += seconds;
    state.timer.duration += seconds;
  } else {
    const newEnd = new Date(new Date(state.timer.endsAt).getTime() + seconds * 1000);
    state.timer.endsAt = newEnd.toISOString();
    state.timer.duration += seconds;
    clearTimeout(timerTimeout);
    const remaining = Math.max(0, newEnd.getTime() - Date.now());
    const cb = timerCallback;
    timerTimeout = setTimeout(() => {
      state.timer = null;
      timerTimeout = null;
      timerCallback = null;
      if (cb) cb();
    }, remaining);
  }
  return true;
}

// --- Phase Transitions ---
function getCurrentTeam() {
  if (state.currentIndex < 0 || state.currentIndex >= state.presentationOrder.length) return null;
  return state.teams[state.presentationOrder[state.currentIndex]];
}

function advancePhase() {
  const team = getCurrentTeam();
  switch (state.phase) {
    case 'setup':
      state.phase = 'presenting';
      startTimer(90, advancePhase);
      break;
    case 'presenting':
      state.phase = 'voting';
      startTimer(30, advancePhase);
      break;
    case 'voting':
      if (team) state.completed.push(team);
      state.phase = 'queue';
      clearTimer();
      break;
    default:
      break;
  }
  broadcastAll();
}

// --- Input Sanitization ---
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>"'&]/g, '').replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 40);
}

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
function hasForbiddenKeys(obj) {
  return Object.keys(obj).some(k => FORBIDDEN_KEYS.has(k));
}

// --- Static Files ---
router.use(express.static(path.join(__dirname, 'public', 'voting')));

// --- SSE Endpoint (learner — filtered state) ---
router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write(`data: ${JSON.stringify(getFilteredState())}\n\n`);
  clients.add(res);
  req.on('close', () => clients.delete(res));
});

// --- SSE Endpoint (admin — full state) ---
router.get('/admin/events', (req, res) => {
  const token = req.query.token;
  if (token !== ADMIN_TOKEN) return res.status(401).json({ error: 'unauthorized' });
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write(`data: ${JSON.stringify(state)}\n\n`);
  adminClients.add(res);
  req.on('close', () => adminClients.delete(res));
});

// --- Public State (filtered) ---
router.get('/state', (req, res) => {
  res.json(getFilteredState());
});

// --- Voter Registration ---
router.post('/register', express.json(), (req, res) => {
  const voter = sanitize(req.body?.voter);
  const team = req.body?.team;
  if (!voter) return res.status(400).json({ error: 'voter name required' });
  if (!team || !state.teams.includes(team)) {
    return res.status(400).json({ error: 'invalid team', teams: state.teams });
  }
  if (state.voters[voter] && state.voters[voter] !== team) {
    return res.status(409).json({ error: 'already registered to ' + state.voters[voter] });
  }
  state.voters[voter] = team;
  broadcastAll();
  res.json({ ok: true, voter, team });
});

// --- Rate a Team ---
router.post('/rate', express.json(), (req, res) => {
  if (state.phase !== 'voting') {
    return res.status(400).json({ error: 'voting is not open' });
  }
  const voter = sanitize(req.body?.voter);
  const forTeam = req.body?.forTeam;
  const ratings = req.body?.ratings;

  if (!voter || !state.voters[voter]) {
    return res.status(400).json({ error: 'voter not registered' });
  }
  const voterTeam = state.voters[voter];
  const currentTeam = getCurrentTeam();

  if (forTeam !== currentTeam) {
    return res.status(400).json({ error: 'can only rate the currently presenting team', currentTeam });
  }
  if (voterTeam === currentTeam) {
    return res.status(403).json({ error: 'cannot rate your own team' });
  }
  if (!ratings || typeof ratings !== 'object' || hasForbiddenKeys(ratings)) {
    return res.status(400).json({ error: 'invalid ratings' });
  }

  for (const catId of CATEGORY_IDS) {
    const value = ratings[catId];
    if (value === undefined) {
      return res.status(400).json({ error: `missing rating for ${catId}`, required: CATEGORY_IDS });
    }
    if (typeof value !== 'number' || value < 1 || value > 5 || !Number.isInteger(value)) {
      return res.status(400).json({ error: `rating must be integer 1-5, got ${value} for ${catId}` });
    }
  }
  for (const catId of Object.keys(ratings)) {
    if (!CATEGORY_IDS.includes(catId)) {
      return res.status(400).json({ error: `unknown category: ${catId}` });
    }
  }

  if (!state.ratings[currentTeam]) state.ratings[currentTeam] = {};
  for (const [catId, value] of Object.entries(ratings)) {
    if (!state.ratings[currentTeam][catId]) state.ratings[currentTeam][catId] = {};
    state.ratings[currentTeam][catId][voter] = value;
  }

  broadcastAll();
  res.json({ ok: true, voter, forTeam: currentTeam });
});

// --- Tiebreak Vote ---
router.post('/tiebreak-vote', express.json(), (req, res) => {
  if (!state.tiebreaker || state.tiebreaker.stage !== 'vote') {
    return res.status(400).json({ error: 'tiebreak voting is not open' });
  }
  const voter = sanitize(req.body?.voter);
  const vote = req.body?.vote;

  if (!voter || !state.voters[voter]) {
    return res.status(400).json({ error: 'voter not registered' });
  }
  if (!vote || !state.tiebreaker.teams.includes(vote)) {
    return res.status(400).json({ error: 'invalid vote choice', options: state.tiebreaker.teams });
  }
  const voterTeam = state.voters[voter];
  if (state.tiebreaker.teams.includes(voterTeam)) {
    return res.status(403).json({ error: 'your team is in the tiebreaker, cannot vote' });
  }

  state.tiebreaker.votes[voter] = vote;
  broadcastAll();
  res.json({ ok: true, voter, vote });
});

// --- Admin Middleware ---
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token !== ADMIN_TOKEN) return res.status(401).json({ error: 'unauthorized' });
  next();
}

// --- Admin: Start Ceremony ---
router.post('/admin/start-ceremony', requireAdmin, async (req, res) => {
  if (state.phase !== 'idle') {
    return res.status(400).json({ error: 'ceremony already started' });
  }

  try {
    const bingoUrl = `http://localhost:${process.env.PORT || 8080}/bingo/state`;
    const bingoRes = await fetch(bingoUrl);
    const bingoState = await bingoRes.json();
    const teams = Object.keys(bingoState.teams || {});
    if (teams.length === 0) {
      return res.status(400).json({ error: 'no teams found in bingo' });
    }

    state.teams = teams;
    state.teamCount = teams.length;

    const order = teams.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    state.presentationOrder = order;
    state.currentIndex = -1;
    state.completed = [];
    state.ratings = {};
    state.phase = 'queue';

    broadcastAll();
    res.json({ ok: true, teamCount: teams.length });
  } catch (err) {
    res.status(500).json({ error: 'failed to fetch bingo teams: ' + err.message });
  }
});

// --- Admin: Next Team ---
router.post('/admin/next-team', requireAdmin, (req, res) => {
  if (state.phase !== 'queue') {
    return res.status(400).json({ error: 'not in queue phase' });
  }
  state.currentIndex++;
  if (state.currentIndex >= state.presentationOrder.length) {
    return res.status(400).json({ error: 'all teams have presented' });
  }
  state.phase = 'setup';
  startTimer(30, advancePhase);
  broadcastAll();
  res.json({ ok: true, team: getCurrentTeam() });
});

// --- Admin: Timer Controls ---
router.post('/admin/pause', requireAdmin, (req, res) => {
  if (!pauseTimer()) return res.status(400).json({ error: 'no timer to pause' });
  broadcastAll();
  res.json({ ok: true });
});

router.post('/admin/resume', requireAdmin, (req, res) => {
  if (!resumeTimer()) return res.status(400).json({ error: 'no paused timer' });
  broadcastAll();
  res.json({ ok: true });
});

router.post('/admin/extend', requireAdmin, express.json(), (req, res) => {
  const seconds = req.body?.seconds || 30;
  if (!extendTimer(seconds)) return res.status(400).json({ error: 'no timer to extend' });
  broadcastAll();
  res.json({ ok: true, addedSeconds: seconds });
});

router.post('/admin/skip-phase', requireAdmin, (req, res) => {
  if (!state.timer && !['setup', 'presenting', 'voting'].includes(state.phase)) {
    return res.status(400).json({ error: 'nothing to skip' });
  }
  clearTimer();
  advancePhase();
  res.json({ ok: true, phase: state.phase });
});

// --- Admin: Reveal ---
router.post('/admin/start-reveal', requireAdmin, (req, res) => {
  if (state.phase !== 'queue' || state.completed.length === 0) {
    return res.status(400).json({ error: 'cannot start reveal yet' });
  }
  state.phase = 'reveal';
  state.revealedAwards = [];
  state.currentReveal = null;
  broadcastAll();
  res.json({ ok: true });
});

router.post('/admin/reveal-next', requireAdmin, (req, res) => {
  // During tiebreaker bingo check, advance the reveal step
  if (state.tiebreaker && state.tiebreaker.stage === 'bingo-check') {
    const steps = ['legend', 'lines', 'squares'];
    const currentStep = state.tiebreaker.bingoRevealStep;
    const currentIdx = currentStep ? steps.indexOf(currentStep) : -1;

    if (currentIdx < steps.length - 1) {
      const nextStep = steps[currentIdx + 1];
      state.tiebreaker.bingoRevealStep = nextStep;

      const teams = state.tiebreaker.teams;
      const data = state.tiebreaker.bingoData;
      let resolved = false;
      let winner = null;

      if (nextStep === 'legend') {
        const legends = teams.filter(t => data[t]?.isLegend);
        const nonLegends = teams.filter(t => !data[t]?.isLegend);
        if (legends.length === 1) { resolved = true; winner = legends[0]; }
        else if (legends.length > 0 && nonLegends.length > 0) {
          state.tiebreaker.teams = legends;
        }
      } else if (nextStep === 'lines') {
        const sorted = [...teams].sort((a, b) => (data[b]?.lineCount || 0) - (data[a]?.lineCount || 0));
        if ((data[sorted[0]]?.lineCount || 0) > (data[sorted[1]]?.lineCount || 0)) {
          resolved = true; winner = sorted[0];
        }
      } else if (nextStep === 'squares') {
        const sorted = [...teams].sort((a, b) => (data[b]?.squareCount || 0) - (data[a]?.squareCount || 0));
        if ((data[sorted[0]]?.squareCount || 0) > (data[sorted[1]]?.squareCount || 0)) {
          resolved = true; winner = sorted[0];
        }
      }

      if (resolved && winner) {
        state.currentReveal.winner = winner;
        state.currentReveal.phase = 'winner';
        state.revealedAwards.push(state.currentReveal.awardId);
        state.phase = 'reveal';
        state.tiebreaker = null;
      }

      broadcastAll();
      return res.json({ ok: true, bingoRevealStep: nextStep, resolved, winner });
    }
    return res.status(400).json({ error: 'bingo check complete, still tied — use next-complimenter to start compliment battle or accept-tie' });
  }

  if (state.phase !== 'reveal') {
    return res.status(400).json({ error: 'not in reveal phase' });
  }

  // If current reveal is showing finalists, advance to winner
  if (state.currentReveal && state.currentReveal.phase === 'finalists') {
    const ranking = state.currentReveal.finalists;
    const topRank = ranking[0]?.rank;
    const tied = ranking.filter(r => r.rank === topRank);

    if (tied.length > 1) {
      return res.status(409).json({
        error: 'tie detected',
        tiedTeams: tied.map(t => t.team),
        message: 'use /admin/resolve-tie to start tiebreaker',
      });
    }

    state.currentReveal.winner = ranking[0].team;
    state.currentReveal.phase = 'winner';
    state.revealedAwards.push(state.currentReveal.awardId);
    broadcastAll();
    return res.json({ ok: true, winner: ranking[0].team });
  }

  // Find next unrevealed award
  const nextAwardId = REVEAL_ORDER.find(id => !state.revealedAwards.includes(id));
  if (!nextAwardId) {
    state.phase = 'done';
    broadcastAll();
    return res.json({ ok: true, phase: 'done' });
  }

  const allRankings = computeAllRankings(state.ratings, CATEGORIES);

  if (nextAwardId === 'overall') {
    const standings = allRankings.overall;
    state.overallStandings = standings;
    state.currentReveal = {
      awardId: 'overall',
      phase: 'finalists',
      finalists: standings.slice(0, 3).map(s => ({ team: s.team, rank: s.rank, score: s.points })),
      winner: null,
    };
  } else {
    const ranking = allRankings.categories[nextAwardId] || [];
    if (allRankings.skippedCategories.includes(nextAwardId)) {
      state.revealedAwards.push(nextAwardId);
      broadcastAll();
      return res.json({ ok: true, skipped: nextAwardId, reason: 'fewer than 2 ranked teams' });
    }
    state.currentReveal = {
      awardId: nextAwardId,
      phase: 'finalists',
      finalists: ranking.slice(0, 3).map(r => ({ team: r.team, rank: r.rank, score: r.average })),
      winner: null,
    };
  }

  broadcastAll();
  res.json({ ok: true, awardId: nextAwardId, phase: 'finalists' });
});

// --- Admin: Tiebreaker ---
router.post('/admin/resolve-tie', requireAdmin, async (req, res) => {
  if (!state.currentReveal || state.currentReveal.phase !== 'finalists') {
    return res.status(400).json({ error: 'no reveal in progress' });
  }
  const topRank = state.currentReveal.finalists[0]?.rank;
  const tiedTeams = state.currentReveal.finalists
    .filter(r => r.rank === topRank)
    .map(r => r.team);

  if (tiedTeams.length < 2) {
    return res.status(400).json({ error: 'no tie to resolve' });
  }

  let bingoData = {};
  try {
    const bingoUrl = `http://localhost:${process.env.PORT || 8080}/bingo/state`;
    const bingoRes = await fetch(bingoUrl);
    const bingoState = await bingoRes.json();
    for (const team of tiedTeams) {
      const td = bingoState.teams?.[team];
      bingoData[team] = {
        isLegend: td?.isLegend || false,
        lineCount: td?.completedLines?.length || 0,
        squareCount: td?.squares?.filter(Boolean)?.length || 0,
      };
    }
  } catch (err) {
    bingoData = null;
  }

  state.phase = 'tiebreaker';
  state.tiebreaker = {
    awardId: state.currentReveal.awardId,
    teams: tiedTeams,
    stage: bingoData ? 'bingo-check' : 'compliment',
    bingoData: bingoData || {},
    bingoRevealStep: null,
    currentComplimenter: 0,
    votes: {},
  };

  broadcastAll();
  res.json({ ok: true, stage: state.tiebreaker.stage, teams: tiedTeams });
});

router.post('/admin/next-complimenter', requireAdmin, (req, res) => {
  if (!state.tiebreaker) return res.status(400).json({ error: 'no tiebreaker active' });

  if (state.tiebreaker.stage === 'bingo-check') {
    state.tiebreaker.stage = 'compliment';
    state.tiebreaker.currentComplimenter = 0;
    startTimer(30, () => { broadcastAll(); });
    broadcastAll();
    return res.json({ ok: true, stage: 'compliment', team: state.tiebreaker.teams[0] });
  }

  if (state.tiebreaker.stage !== 'compliment') {
    return res.status(400).json({ error: 'not in compliment stage' });
  }

  clearTimer();
  state.tiebreaker.currentComplimenter++;
  if (state.tiebreaker.currentComplimenter >= state.tiebreaker.teams.length) {
    return res.json({ ok: true, allDone: true, message: 'use /admin/start-tiebreak-vote' });
  }
  startTimer(30, () => { broadcastAll(); });
  broadcastAll();
  res.json({ ok: true, complimenter: state.tiebreaker.teams[state.tiebreaker.currentComplimenter] });
});

router.post('/admin/start-tiebreak-vote', requireAdmin, (req, res) => {
  if (!state.tiebreaker || state.tiebreaker.stage !== 'compliment') {
    return res.status(400).json({ error: 'not ready for tiebreak vote' });
  }
  clearTimer();
  state.tiebreaker.stage = 'vote';
  state.tiebreaker.votes = {};
  startTimer(30, () => {
    resolveTiebreakVote();
  });
  broadcastAll();
  res.json({ ok: true, stage: 'vote' });
});

function resolveTiebreakVote() {
  if (!state.tiebreaker) return;
  const voteCounts = {};
  for (const team of state.tiebreaker.teams) voteCounts[team] = 0;
  for (const vote of Object.values(state.tiebreaker.votes)) {
    if (voteCounts[vote] !== undefined) voteCounts[vote]++;
  }

  const sorted = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
  if (sorted.length >= 2 && sorted[0][1] > sorted[1][1]) {
    state.currentReveal.winner = sorted[0][0];
    state.currentReveal.phase = 'winner';
    state.revealedAwards.push(state.tiebreaker.awardId);
    state.tiebreaker = null;
    state.phase = 'reveal';
  } else {
    // Vote was tied — transition tiebreaker to signal admin should accept-tie or re-vote
    state.tiebreaker.stage = 'accepted-tie';
  }
  broadcastAll();
}

router.post('/admin/accept-tie', requireAdmin, (req, res) => {
  if (!state.tiebreaker) return res.status(400).json({ error: 'no tiebreaker active' });

  state.currentReveal.winner = state.tiebreaker.teams.join(' & ');
  state.currentReveal.phase = 'winner';
  state.revealedAwards.push(state.tiebreaker.awardId);
  state.tiebreaker = null;
  state.phase = 'reveal';
  clearTimer();
  broadcastAll();
  res.json({ ok: true, coWinners: true });
});

// --- Admin: Reset Voter ---
router.post('/admin/reset-voter', requireAdmin, express.json(), (req, res) => {
  const voter = req.body?.voter;
  if (!voter || !state.voters[voter]) {
    return res.status(400).json({ error: 'voter not found' });
  }
  delete state.voters[voter];
  broadcastAll();
  res.json({ ok: true });
});

// --- Admin: Full Results ---
router.get('/admin/results', requireAdmin, (req, res) => {
  const allRankings = computeAllRankings(state.ratings, CATEGORIES);
  res.json({
    ratings: state.ratings,
    rankings: allRankings,
    voters: state.voters,
    teams: state.teams,
  });
});

// --- Admin: Reset ---
router.post('/admin/reset', requireAdmin, (req, res) => {
  clearTimer();
  Object.assign(state, createInitialState());
  broadcastAll();
  res.json({ ok: true });
});

// --- State Export/Import for backup/restore ---
function getState() { return state; }
function setState(newState) {
  if (newState.teams) {
    newState.teams = newState.teams.map(t => sanitize(t));
  }
  Object.assign(state, { ...createInitialState(), ...newState });
  broadcast();
}

router.getState = getState;
router.setState = setState;

module.exports = router;
