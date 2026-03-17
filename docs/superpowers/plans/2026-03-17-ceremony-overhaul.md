# Ceremony & Voting Overhaul Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the voting app with a unified ceremony system: presentation queue with timers, 5-star per-person ratings, dramatic winner reveals, and multi-stage tiebreakers.

**Architecture:** Single Express router (`voting-router.js`) with a phase-based state machine, server-authoritative timers, and SSE broadcast. Scoring logic extracted to a pure-function module (`scoring.js`). Sound effects in a shared client-side module (`sounds.js`). Three frontend pages: learner (`vote.html`), facilitator (`admin.html`), results (`results.html`).

**Tech Stack:** Express.js, vanilla HTML/CSS/JS, Web Audio API, SSE, JSON file persistence.

**Spec:** `docs/superpowers/specs/2026-03-17-ceremony-overhaul-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `digital/learnathon-server/scoring.js` | Pure scoring functions: compute averages, rankings, overall standings, threshold enforcement |
| `digital/learnathon-server/public/voting/sounds.js` | Web Audio API sound module with all ceremony sound cues |
| `digital/learnathon-server/public/voting/results.html` | Post-ceremony results lookup page |

### Modified Files
| File | Change |
|------|--------|
| `digital/learnathon-server/voting-router.js` | Complete rewrite: state machine, timers, ceremony/voting/reveal/tiebreaker routes |
| `digital/learnathon-server/public/voting/vote.html` | Complete rewrite: phase-aware learner UI with registration + star ratings |
| `digital/learnathon-server/public/voting/admin.html` | Complete rewrite: ceremony control panel |
| `digital/mcp-server/server.js` | Replace `cast_vote` with `register_voter`, `rate_team`, `cast_tiebreak_vote`, add `get_ceremony_status` |
| `digital/learnathon-server/server.js` | Minor: ensure getState/setState still work with new state shape |
| `AGENTS.md` | Update MCP tool documentation |

### Removed Files
| File | Reason |
|------|--------|
| `digital/learnathon-server/public/voting/screen.html` | No longer needed (no big screen app) |

---

## Chunk 1: Server-Side Foundation

### Task 1: Create scoring.js — Pure scoring functions

**Files:**
- Create: `digital/learnathon-server/scoring.js`
- Create: `digital/learnathon-server/scoring.test.js`

This module has zero dependencies — pure functions that take ratings data and return rankings. Testable in isolation.

- [ ] **Step 1: Write test for `computeCategoryRanking`**

```js
// scoring.test.js
const { computeCategoryRanking } = require('./scoring');
const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('computeCategoryRanking', () => {
  it('ranks teams by average rating', () => {
    const ratings = {
      'Alice': 5, 'Bob': 4, 'Carol': 3  // avg = 4.0
    };
    const ratings2 = {
      'Alice': 3, 'Bob': 3, 'Carol': 3  // avg = 3.0
    };
    const result = computeCategoryRanking({
      'Team A': ratings,
      'Team B': ratings2,
    });
    assert.strictEqual(result[0].team, 'Team A');
    assert.strictEqual(result[0].rank, 1);
    assert.strictEqual(result[1].team, 'Team B');
    assert.strictEqual(result[1].rank, 2);
  });

  it('excludes teams with fewer than 3 ratings', () => {
    const result = computeCategoryRanking({
      'Team A': { 'Alice': 5, 'Bob': 4, 'Carol': 3 },
      'Team B': { 'Alice': 5, 'Bob': 4 },  // only 2 ratings
    });
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].team, 'Team A');
  });

  it('detects ties at rank 1', () => {
    const result = computeCategoryRanking({
      'Team A': { 'Alice': 5, 'Bob': 4, 'Carol': 3 },
      'Team B': { 'Dave': 5, 'Eve': 4, 'Frank': 3 },
    });
    assert.strictEqual(result[0].rank, 1);
    assert.strictEqual(result[1].rank, 1);
    assert.strictEqual(result[0].average, result[1].average);
  });

  it('returns empty array when no team meets threshold', () => {
    const result = computeCategoryRanking({
      'Team A': { 'Alice': 5 },
    });
    assert.deepStrictEqual(result, []);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd digital/learnathon-server && node --test scoring.test.js`
Expected: FAIL — `Cannot find module './scoring'`

- [ ] **Step 3: Implement `computeCategoryRanking`**

```js
// scoring.js
const MIN_RATINGS = 3;

/**
 * Compute ranking for a single category.
 * @param {Object} categoryRatings - { teamName: { voterName: rating } }
 * @returns {Array<{ team, rank, average, ratingCount }>} sorted by rank
 */
function computeCategoryRanking(categoryRatings) {
  const teams = [];
  for (const [team, voterRatings] of Object.entries(categoryRatings)) {
    const values = Object.values(voterRatings);
    if (values.length < MIN_RATINGS) continue;
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    teams.push({ team, average: Math.round(average * 100) / 100, ratingCount: values.length });
  }
  teams.sort((a, b) => b.average - a.average);

  // Assign ranks with tie handling
  let rank = 1;
  for (let i = 0; i < teams.length; i++) {
    if (i > 0 && teams[i].average < teams[i - 1].average) {
      rank = i + 1;
    }
    teams[i].rank = rank;
  }
  return teams;
}

module.exports = { computeCategoryRanking };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd digital/learnathon-server && node --test scoring.test.js`
Expected: All 4 tests PASS

- [ ] **Step 5: Write test for `computeOverallStandings`**

Add to `scoring.test.js`:

```js
const { computeOverallStandings } = require('./scoring');

describe('computeOverallStandings', () => {
  it('sums rank points across categories, lowest wins', () => {
    // Team A: rank 1 + rank 2 + rank 1 = 4 points
    // Team B: rank 2 + rank 1 + rank 2 = 5 points
    const categoryRankings = {
      'best-creation': [
        { team: 'Team A', rank: 1 }, { team: 'Team B', rank: 2 },
      ],
      'most-creative': [
        { team: 'Team B', rank: 1 }, { team: 'Team A', rank: 2 },
      ],
      'best-safety': [
        { team: 'Team A', rank: 1 }, { team: 'Team B', rank: 2 },
      ],
    };
    const result = computeOverallStandings(categoryRankings);
    assert.strictEqual(result[0].team, 'Team A');
    assert.strictEqual(result[0].points, 4);
    assert.strictEqual(result[1].team, 'Team B');
    assert.strictEqual(result[1].points, 5);
  });

  it('requires ranking in at least 3 categories to qualify', () => {
    const categoryRankings = {
      'best-creation': [{ team: 'Team A', rank: 1 }],
      'most-creative': [{ team: 'Team A', rank: 1 }],
      // Only 2 categories — Team A should not qualify
    };
    const result = computeOverallStandings(categoryRankings);
    assert.strictEqual(result.length, 0);
  });

  it('handles ties in total points', () => {
    const categoryRankings = {
      'best-creation': [
        { team: 'Team A', rank: 1 }, { team: 'Team B', rank: 2 },
      ],
      'most-creative': [
        { team: 'Team B', rank: 1 }, { team: 'Team A', rank: 2 },
      ],
      'best-safety': [
        { team: 'Team A', rank: 1 }, { team: 'Team B', rank: 1 },
      ],
    };
    // Team A: 1+2+1=4, Team B: 2+1+1=4 → tie
    const result = computeOverallStandings(categoryRankings);
    assert.strictEqual(result[0].rank, 1);
    assert.strictEqual(result[1].rank, 1);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `cd digital/learnathon-server && node --test scoring.test.js`
Expected: FAIL — `computeOverallStandings is not a function`

- [ ] **Step 7: Implement `computeOverallStandings`**

Add to `scoring.js`:

```js
const MIN_CATEGORIES_FOR_OVERALL = 3;

/**
 * Compute overall winner standings by aggregating category ranks.
 * @param {Object} categoryRankings - { categoryId: [{ team, rank }] }
 * @returns {Array<{ team, points, rankedIn, ranks, rank }>}
 */
function computeOverallStandings(categoryRankings) {
  const teamData = {};

  for (const [categoryId, rankings] of Object.entries(categoryRankings)) {
    for (const { team, rank } of rankings) {
      if (!teamData[team]) {
        teamData[team] = { team, points: 0, rankedIn: 0, ranks: {} };
      }
      teamData[team].points += rank;
      teamData[team].rankedIn++;
      teamData[team].ranks[categoryId] = rank;
    }
  }

  const qualified = Object.values(teamData)
    .filter(t => t.rankedIn >= MIN_CATEGORIES_FOR_OVERALL);

  qualified.sort((a, b) => a.points - b.points);

  // Assign ranks with tie handling
  let rank = 1;
  for (let i = 0; i < qualified.length; i++) {
    if (i > 0 && qualified[i].points > qualified[i - 1].points) {
      rank = i + 1;
    }
    qualified[i].rank = rank;
  }
  return qualified;
}

module.exports = { computeCategoryRanking, computeOverallStandings };
```

- [ ] **Step 8: Run all tests**

Run: `cd digital/learnathon-server && node --test scoring.test.js`
Expected: All 7 tests PASS

- [ ] **Step 9: Write test for `computeAllRankings` (orchestration function)**

Add to `scoring.test.js`:

```js
const { computeAllRankings } = require('./scoring');

describe('computeAllRankings', () => {
  const CATEGORIES = [
    { id: 'best-creation' }, { id: 'most-creative' }, { id: 'best-safety' },
    { id: 'best-risk-catch' }, { id: 'best-fail' }, { id: 'peoples-choice' },
  ];

  it('computes rankings for all categories plus overall', () => {
    const ratings = {
      'Team A': {
        'best-creation': { 'Alice': 5, 'Bob': 4, 'Carol': 5 },
        'most-creative': { 'Alice': 4, 'Bob': 3, 'Carol': 4 },
        'best-safety': { 'Alice': 3, 'Bob': 3, 'Carol': 3 },
        'best-risk-catch': { 'Alice': 4, 'Bob': 4, 'Carol': 4 },
        'best-fail': { 'Alice': 2, 'Bob': 2, 'Carol': 2 },
        'peoples-choice': { 'Alice': 4, 'Bob': 4, 'Carol': 4 },
      },
      'Team B': {
        'best-creation': { 'Alice': 3, 'Bob': 3, 'Carol': 3 },
        'most-creative': { 'Alice': 5, 'Bob': 5, 'Carol': 5 },
        'best-safety': { 'Alice': 4, 'Bob': 4, 'Carol': 4 },
        'best-risk-catch': { 'Alice': 3, 'Bob': 3, 'Carol': 3 },
        'best-fail': { 'Alice': 5, 'Bob': 5, 'Carol': 5 },
        'peoples-choice': { 'Alice': 3, 'Bob': 3, 'Carol': 3 },
      },
    };
    const result = computeAllRankings(ratings, CATEGORIES);

    assert.ok(result.categories['best-creation']);
    assert.ok(result.categories['peoples-choice']);
    assert.ok(result.overall.length > 0);
    // Team A wins best-creation (avg 4.67 vs 3.0)
    assert.strictEqual(result.categories['best-creation'][0].team, 'Team A');
    // Team B wins most-creative (avg 5.0 vs 3.67)
    assert.strictEqual(result.categories['most-creative'][0].team, 'Team B');
  });

  it('skips categories with fewer than 2 ranked teams', () => {
    const ratings = {
      'Team A': {
        'best-creation': { 'Alice': 5, 'Bob': 4, 'Carol': 5 },
        'most-creative': { 'Alice': 4 }, // only 1 rating — unranked
      },
    };
    const result = computeAllRankings(ratings, [
      { id: 'best-creation' }, { id: 'most-creative' },
    ]);
    assert.strictEqual(result.categories['best-creation'].length, 1);
    assert.strictEqual(result.skippedCategories.includes('most-creative'), true);
  });
});
```

- [ ] **Step 10: Implement `computeAllRankings`**

Add to `scoring.js`:

```js
/**
 * Compute all rankings from raw ratings data.
 * @param {Object} ratings - { presentedTeam: { categoryId: { voter: rating } } }
 * @param {Array} categories - [{ id }]
 * @returns {{ categories: { id: ranking[] }, overall: standing[], skippedCategories: string[] }}
 */
function computeAllRankings(ratings, categories) {
  const categoryRankings = {};
  const skippedCategories = [];

  for (const { id } of categories) {
    // Collect all ratings for this category across all presented teams
    const categoryData = {};
    for (const [team, teamRatings] of Object.entries(ratings)) {
      if (teamRatings[id]) {
        categoryData[team] = teamRatings[id];
      }
    }
    const ranking = computeCategoryRanking(categoryData);
    if (ranking.length < 2) {
      skippedCategories.push(id);
    }
    categoryRankings[id] = ranking;
  }

  const overall = computeOverallStandings(categoryRankings);

  return { categories: categoryRankings, overall, skippedCategories };
}

module.exports = { computeCategoryRanking, computeOverallStandings, computeAllRankings };
```

- [ ] **Step 11: Run all tests**

Run: `cd digital/learnathon-server && node --test scoring.test.js`
Expected: All 9 tests PASS

- [ ] **Step 12: Commit scoring module**

```bash
git add digital/learnathon-server/scoring.js digital/learnathon-server/scoring.test.js
git commit -m "feat: add scoring module with category rankings and overall standings"
```

---

### Task 2: Rewrite voting-router.js — State machine, timers, all routes

**Files:**
- Modify: `digital/learnathon-server/voting-router.js` (complete rewrite, currently 181 lines)
- Modify: `digital/learnathon-server/server.js` (minor adjustment for new state shape)

The router is the heart of the system. It manages:
- Phase-based state machine with transitions
- Server-authoritative timers with auto-advance
- Ceremony control routes (admin)
- Public routes (register, rate, tiebreak-vote)
- SSE broadcast
- State persistence

- [ ] **Step 1a: Write voting-router.js — state, timer, SSE helpers**

Replace the entire file. Start with the top section (state, persistence, SSE, timer):

```js
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
  { id: 'best-creation', label: 'Best Creation', emoji: '\u{1F947}', question: 'Rate their product' },
  { id: 'most-creative', label: 'Most Creative AI Use', emoji: '\u{1F3A8}', question: 'Rate their creativity' },
  { id: 'best-safety', label: 'Best Safety Practice', emoji: '\u{1F510}', question: 'Rate their safety practice' },
  { id: 'best-risk-catch', label: 'Best Risk Catch', emoji: '\u{1F6A8}', question: 'Rate their risk awareness' },
  { id: 'best-fail', label: 'Best Fail Story', emoji: '\u{1F602}', question: 'Rate their fail story' },
  { id: 'peoples-choice', label: "People's Choice", emoji: '\u{1F91D}', question: 'Overall impression' },
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
  state.timer.remaining = Math.ceil(remaining); // ceil to avoid rounding down to 0
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
    // Reschedule timeout using stored callback
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
```

- [ ] **Step 1b: Write voting-router.js — static files, SSE endpoints, public routes**

Continue appending to the same file:

```js
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
  // Locked to first team — re-registration rejected
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

  // forTeam must match current — prevents race conditions on phase transition
  if (forTeam !== currentTeam) {
    return res.status(400).json({ error: 'can only rate the currently presenting team', currentTeam });
  }
  if (voterTeam === currentTeam) {
    return res.status(403).json({ error: 'cannot rate your own team' });
  }
  if (!ratings || typeof ratings !== 'object' || hasForbiddenKeys(ratings)) {
    return res.status(400).json({ error: 'invalid ratings' });
  }

  // Validate all 6 categories provided with valid values
  for (const catId of CATEGORY_IDS) {
    const value = ratings[catId];
    if (value === undefined) {
      return res.status(400).json({ error: `missing rating for ${catId}`, required: CATEGORY_IDS });
    }
    if (typeof value !== 'number' || value < 1 || value > 5 || !Number.isInteger(value)) {
      return res.status(400).json({ error: `rating must be integer 1-5, got ${value} for ${catId}` });
    }
  }
  // Reject extra keys
  for (const catId of Object.keys(ratings)) {
    if (!CATEGORY_IDS.includes(catId)) {
      return res.status(400).json({ error: `unknown category: ${catId}` });
    }
  }

  // Store ratings
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
  // Self-vote block: members of tied teams cannot vote
  const voterTeam = state.voters[voter];
  if (state.tiebreaker.teams.includes(voterTeam)) {
    return res.status(403).json({ error: 'your team is in the tiebreaker, cannot vote' });
  }

  state.tiebreaker.votes[voter] = vote;
  broadcastAll();
  res.json({ ok: true, voter, vote });
});

```

- [ ] **Step 1c: Write voting-router.js — admin ceremony control routes**

Continue appending:

```js
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

  // Fetch teams from bingo
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

    // Fisher-Yates shuffle
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

```

- [ ] **Step 1d: Write voting-router.js — reveal and tiebreaker routes**

Continue appending:

```js
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

      // Check if this step resolves the tie
      const teams = state.tiebreaker.teams;
      const data = state.tiebreaker.bingoData;
      let resolved = false;
      let winner = null;

      if (nextStep === 'legend') {
        const legends = teams.filter(t => data[t]?.isLegend);
        const nonLegends = teams.filter(t => !data[t]?.isLegend);
        if (legends.length === 1) { resolved = true; winner = legends[0]; }
        else if (legends.length > 0 && nonLegends.length > 0) {
          // Filter to only legends for next steps
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
        // Tiebreaker resolved!
        state.currentReveal.winner = winner;
        state.currentReveal.phase = 'winner';
        state.tiebreaker = null;
      }

      broadcastAll();
      return res.json({ ok: true, bingoRevealStep: nextStep, resolved, winner });
    }
    // All bingo steps exhausted, still tied — facilitator must start compliment battle
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
      // Tie detected — need tiebreaker
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

  // Compute rankings
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
      // Skip this category — not enough ranked teams
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

  // Fetch bingo data
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
    // If bingo unavailable, skip to compliment battle
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
    // Bingo didn't resolve — move to compliment battle
    state.tiebreaker.stage = 'compliment';
    state.tiebreaker.currentComplimenter = 0;
    startTimer(30, () => { broadcastAll(); }); // 30s per compliment
    broadcastAll();
    return res.json({ ok: true, stage: 'compliment', team: state.tiebreaker.teams[0] });
  }

  if (state.tiebreaker.stage !== 'compliment') {
    return res.status(400).json({ error: 'not in compliment stage' });
  }

  clearTimer();
  state.tiebreaker.currentComplimenter++;
  if (state.tiebreaker.currentComplimenter >= state.tiebreaker.teams.length) {
    // All teams have complimented — ready for audience vote
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
    // Timer expired — resolve
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
    // Clear winner
    state.currentReveal.winner = sorted[0][0];
    state.currentReveal.phase = 'winner';
    state.revealedAwards.push(state.tiebreaker.awardId);
    state.tiebreaker = null;
    state.phase = 'reveal';
  }
  // If still tied, facilitator uses accept-tie
  broadcastAll();
}

router.post('/admin/accept-tie', requireAdmin, (req, res) => {
  if (!state.tiebreaker) return res.status(400).json({ error: 'no tiebreaker active' });

  // Co-winners
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
  // Sanitize team names
  if (newState.teams) {
    newState.teams = newState.teams.map(t => sanitize(t));
  }
  Object.assign(state, { ...createInitialState(), ...newState });
  broadcast();
}

router.getState = getState;
router.setState = setState;

module.exports = router;
```

- [ ] **Step 1e: Verify server.js compatibility**

The backup/restore logic in `server.js` calls `votingRouter.getState()` and `votingRouter.setState()`. The new router exports the same interface. Verify:

Run: `cd digital/learnathon-server && node -e "const r = require('./voting-router'); console.log('getState:', typeof r.getState, 'setState:', typeof r.setState); const s = r.getState(); console.log('phase:', s.phase, 'has categories:', s.categories.length)"`
Expected: `getState: function setState: function` and `phase: idle has categories: 6`

- [ ] **Step 3: Run the server to verify it starts**

Run: `cd digital/learnathon-server && node -e "const r = require('./voting-router'); console.log('Router loaded, methods:', Object.keys(r).filter(k => typeof r[k] === 'function'))"`
Expected: `Router loaded, methods: [ 'getState', 'setState' ]` (plus Express router methods)

- [ ] **Step 4: Commit the router rewrite**

```bash
git add digital/learnathon-server/voting-router.js
git commit -m "feat: rewrite voting router with ceremony state machine, timers, and phase-based flow"
```

---

### Task 3: Delete screen.html

**Files:**
- Delete: `digital/learnathon-server/public/voting/screen.html`

- [ ] **Step 1: Remove the file**

```bash
rm digital/learnathon-server/public/voting/screen.html
```

- [ ] **Step 2: Commit**

```bash
git add -u digital/learnathon-server/public/voting/screen.html
git commit -m "chore: remove screen.html — no longer needed in ceremony system"
```

---

## Chunk 2: Frontend — Sounds, Learner UI, Admin UI, Results

### Task 4: Create sounds.js — Shared Web Audio sound module

**Files:**
- Create: `digital/learnathon-server/public/voting/sounds.js`

- [ ] **Step 1: Write sounds.js**

```js
// sounds.js — Web Audio API sound effects for ceremony
// Pentatonic scale frequencies
const NOTES = {
  C3: 130.81, C4: 261.63, D4: 293.66, E4: 329.63,
  G4: 392.00, A4: 440.00, C5: 523.25,
};

let audioCtx = null;
let soundMuted = localStorage.getItem('learnathon-ceremony-muted') === 'true';

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function tone(freq, startTime, duration, gain = 0.1) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, startTime);
  g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

function play(fn) {
  if (soundMuted) return;
  try { fn(getCtx()); } catch (_) {}
}

// --- Sound cues ---

function playTeamCalledUp() {
  play(ctx => {
    const t = ctx.currentTime;
    [NOTES.C4, NOTES.E4, NOTES.G4, NOTES.C5].forEach((f, i) =>
      tone(f, t + i * 0.12, 0.2, 0.1));
  });
}

function playPresentationStart() {
  play(ctx => tone(NOTES.G4, ctx.currentTime, 0.3, 0.12));
}

function playWarning30s() {
  play(ctx => {
    const t = ctx.currentTime;
    tone(NOTES.A4, t, 0.1, 0.08);
    tone(NOTES.A4, t + 0.2, 0.1, 0.08);
  });
}

function playTimeUp() {
  play(ctx => {
    const t = ctx.currentTime;
    [NOTES.C5, NOTES.G4, NOTES.E4].forEach((f, i) =>
      tone(f, t + i * 0.15, 0.4, 0.12));
  });
}

function playApplause() {
  play(ctx => {
    const t = ctx.currentTime;
    [NOTES.C4, NOTES.E4, NOTES.G4].forEach(f =>
      tone(f, t, 1.5, 0.15));
  });
}

function playVotingOpens() {
  play(ctx => {
    const t = ctx.currentTime;
    tone(NOTES.C4, t, 0.15, 0.1);
    tone(NOTES.E4, t + 0.15, 0.15, 0.1);
  });
}

function playVotingCloses() {
  play(ctx => {
    const t = ctx.currentTime;
    tone(NOTES.E4, t, 0.15, 0.1);
    tone(NOTES.C4, t + 0.15, 0.15, 0.1);
  });
}

function playRevealFinalists() {
  play(ctx => {
    const t = ctx.currentTime;
    for (let i = 0; i < 16; i++) {
      const f = i % 2 === 0 ? NOTES.C4 : NOTES.E4;
      tone(f, t + i * 0.125, 0.12, 0.08);
    }
  });
}

function playRevealWinner() {
  play(ctx => {
    const t = ctx.currentTime;
    [NOTES.C4, NOTES.E4, NOTES.G4, NOTES.C5].forEach((f, i) =>
      tone(f, t + i * 0.12, 0.2, 0.12));
    // Held chord
    setTimeout(() => {
      [NOTES.C4, NOTES.E4, NOTES.G4].forEach(f =>
        tone(f, getCtx().currentTime, 1.0, 0.15));
    }, 500);
  });
}

function playTiebreakerAnnounced() {
  play(ctx => {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(NOTES.C3, t);
    osc.frequency.linearRampToValueAtTime(NOTES.C4, t + 1.5);
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 1.5);
  });
}

function playStarTap() {
  play(ctx => {
    const f = [NOTES.C4, NOTES.D4, NOTES.E4, NOTES.G4, NOTES.A4][Math.floor(Math.random() * 5)];
    tone(f, ctx.currentTime, 0.15, 0.08);
  });
}

function toggleMute() {
  soundMuted = !soundMuted;
  localStorage.setItem('learnathon-ceremony-muted', soundMuted);
  if (!soundMuted) getCtx();
  return soundMuted;
}

function isMuted() { return soundMuted; }
```

- [ ] **Step 2: Commit**

```bash
git add digital/learnathon-server/public/voting/sounds.js
git commit -m "feat: add sounds.js Web Audio module for ceremony sound cues"
```

---

### Task 5: Rewrite vote.html — Learner page

**Files:**
- Modify: `digital/learnathon-server/public/voting/vote.html` (complete rewrite, currently 595 lines)

This is the main participant-facing page. It handles registration, phase display, star ratings, tiebreak voting, and reveal viewing. Mobile-first, dark theme.

- [ ] **Step 1: Write the new vote.html**

Write the complete file (~600-700 lines). CSS follows existing dark theme (`#0f0f1a` bg, `#7c3aed` purple, `#d97706` amber, mobile-first). The HTML structure and JavaScript logic are specified below. Use the existing `vote.html` as a CSS reference.

**HTML structure:**

```html
<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Learnathon 2026 — Ceremony</title>
  <style>/* Dark theme CSS: see style guide below */</style>
</head><body>
  <!-- Registration Modal (shown when no voter in localStorage) -->
  <div id="register-modal" class="modal">
    <h2>Join the Ceremony</h2>
    <input id="voter-name" placeholder="Your name" maxlength="40">
    <select id="voter-team"><option value="">Select your team...</option></select>
    <button id="register-btn" onclick="register()">Join</button>
    <div id="register-error" class="error"></div>
  </div>

  <!-- Persistent Banner (top) -->
  <div id="banner">
    <div id="phase-label">Idle</div>
    <div id="current-team"></div>
    <div id="timer-display"></div>
  </div>

  <!-- Main Content Area (swapped per phase) -->
  <div id="content">
    <div id="phase-idle" class="phase">Ceremony hasn't started yet</div>
    <div id="phase-queue" class="phase">Waiting for next team...</div>
    <div id="phase-setup" class="phase"><span id="setup-team"></span> is getting ready</div>
    <div id="phase-presenting" class="phase">
      <div id="present-team" class="big-team-name"></div>
      <div id="present-timer" class="big-timer"></div>
      <div class="hint">Voting opens after the presentation</div>
    </div>
    <div id="phase-voting" class="phase"><!-- Star rating UI injected here --></div>
    <div id="phase-voting-self" class="phase">You're presenting! No self-voting.</div>
    <div id="phase-reveal" class="phase"><!-- Reveal content injected here --></div>
    <div id="phase-tiebreaker" class="phase"><!-- Tiebreaker content injected here --></div>
    <div id="phase-done" class="phase">Ceremony complete!</div>
  </div>

  <!-- Persistent Up-Next (bottom bar) -->
  <div id="up-next-bar">
    <div id="up-next-list"></div>
    <div id="progress"></div>
  </div>

  <!-- Mute Toggle -->
  <button id="mute-btn" onclick="doToggleMute()">🔊</button>

  <script src="sounds.js"></script>
  <script>/* Main JS: see below */</script>
</body></html>
```

**JavaScript logic (complete):**

```js
// --- State ---
let currentState = null;
let previousPhase = null;
let myVoter = localStorage.getItem('ceremony-voter');
let myTeam = localStorage.getItem('ceremony-team');
let currentRatings = {}; // { categoryId: 1-5 }
let timerInterval = null;

// --- Registration ---
function register() {
  const name = document.getElementById('voter-name').value.trim();
  const team = document.getElementById('voter-team').value;
  if (!name || !team) return;
  fetch('/voting/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voter: name, team }),
  }).then(r => r.json()).then(data => {
    if (data.ok) {
      myVoter = name; myTeam = team;
      localStorage.setItem('ceremony-voter', name);
      localStorage.setItem('ceremony-team', team);
      document.getElementById('register-modal').style.display = 'none';
    } else {
      document.getElementById('register-error').textContent = data.error;
    }
  });
}

// --- Timer ---
function updateTimer() {
  if (!currentState?.timer) {
    document.getElementById('timer-display').textContent = '';
    return;
  }
  const t = currentState.timer;
  let remaining;
  if (t.paused) {
    remaining = t.remaining;
  } else {
    remaining = Math.max(0, Math.ceil((new Date(t.endsAt) - Date.now()) / 1000));
  }
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}s`;
  document.getElementById('timer-display').textContent = display;
  document.getElementById('timer-display').classList.toggle('warning', remaining <= 30);
  // Also update the big timer in presenting phase
  const bigTimer = document.getElementById('present-timer');
  if (bigTimer) bigTimer.textContent = display;
}

// --- Star Rating UI ---
function buildVotingUI() {
  const container = document.getElementById('phase-voting');
  if (!currentState) return;
  const categories = currentState.categories || [];
  let html = '<div class="rating-form">';
  for (const cat of categories) {
    const isPeoplesChoice = cat.id === 'peoples-choice';
    html += `<div class="rating-row${isPeoplesChoice ? ' peoples-choice' : ''}" data-cat="${cat.id}">
      <div class="rating-label">${cat.emoji} ${cat.question}</div>
      <div class="stars">`;
    for (let i = 1; i <= 5; i++) {
      const filled = (currentRatings[cat.id] || 0) >= i;
      html += `<span class="star ${filled ? 'filled' : ''}" data-cat="${cat.id}" data-val="${i}" onclick="setStar('${cat.id}',${i})">★</span>`;
    }
    html += '</div></div>';
  }
  html += `<button id="submit-btn" onclick="submitRatings()">Submit Ratings ⭐</button>
    <div class="hint">You can update your ratings until the timer ends</div></div>`;
  container.innerHTML = html;
}

function setStar(catId, value) {
  // Tap same star to deselect
  if (currentRatings[catId] === value) {
    delete currentRatings[catId];
  } else {
    currentRatings[catId] = value;
  }
  playStarTap();
  buildVotingUI(); // Re-render stars
}

function submitRatings() {
  if (!myVoter || !currentState?.currentTeam) return;
  // Check all 6 categories rated
  const cats = (currentState.categories || []).map(c => c.id);
  const missing = cats.filter(c => !currentRatings[c]);
  if (missing.length > 0) {
    alert('Please rate all categories before submitting');
    return;
  }
  fetch('/voting/rate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voter: myVoter, forTeam: currentState.currentTeam, ratings: currentRatings }),
  }).then(r => r.json()).then(data => {
    if (data.ok) {
      playVotingCloses(); // confirmation sound
      document.getElementById('submit-btn').textContent = 'Updated! ✓';
    } else {
      alert(data.error);
    }
  });
}

// --- Tiebreaker Vote UI ---
function buildTiebreakerUI() {
  const tb = currentState?.tiebreaker;
  const container = document.getElementById('phase-tiebreaker');
  if (!tb) return;

  if (tb.stage === 'bingo-check') {
    // Show bingo cards side by side with reveal steps
    let html = '<h3>Tiebreaker: Bingo Check</h3><div class="bingo-compare">';
    for (const team of tb.teams) {
      const d = tb.bingoData?.[team] || {};
      html += `<div class="bingo-card-mini"><h4>${team}</h4>`;
      if (tb.bingoRevealStep === 'legend' || tb.bingoRevealStep === 'lines' || tb.bingoRevealStep === 'squares') {
        html += `<div>Legend: ${d.isLegend ? '✓ YES' : '✗ No'}</div>`;
      }
      if (tb.bingoRevealStep === 'lines' || tb.bingoRevealStep === 'squares') {
        html += `<div>Lines: ${d.lineCount}</div>`;
      }
      if (tb.bingoRevealStep === 'squares') {
        html += `<div>Squares: ${d.squareCount}</div>`;
      }
      html += '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
  } else if (tb.stage === 'compliment') {
    const complimenter = tb.teams[tb.currentComplimenter];
    let html = `<h3>Compliment Battle!</h3>`;
    for (const team of tb.teams) {
      const isActive = team === complimenter;
      html += `<div class="compliment-team ${isActive ? 'active' : ''}">${team}${isActive ? ' 🎤' : ''}</div>`;
    }
    container.innerHTML = html;
  } else if (tb.stage === 'vote') {
    // Pick-one vote
    const voterTeam = myTeam;
    if (tb.teams.includes(voterTeam)) {
      container.innerHTML = '<h3>Your team is in the tiebreaker — sit tight!</h3>';
    } else {
      let html = '<h3>Vote for the winner!</h3><div class="tiebreak-options">';
      for (const team of tb.teams) {
        html += `<button class="tiebreak-btn" onclick="castTiebreakVote('${team}')">${team}</button>`;
      }
      html += '</div>';
      container.innerHTML = html;
    }
  } else if (tb.stage === 'accepted-tie') {
    container.innerHTML = `<h3>Shared Victory!</h3><p>${tb.teams.join(' & ')} are co-winners!</p>`;
  }
}

function castTiebreakVote(team) {
  fetch('/voting/tiebreak-vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voter: myVoter, vote: team }),
  }).then(r => r.json()).then(data => {
    if (!data.ok) alert(data.error);
  });
}

// --- Reveal UI ---
function buildRevealUI() {
  const reveal = currentState?.currentReveal;
  const container = document.getElementById('phase-reveal');
  if (!reveal) {
    container.innerHTML = '<h3>Preparing next award...</h3>';
    return;
  }
  const cat = CATEGORIES_MAP[reveal.awardId] || { label: 'Overall Winner', emoji: '🏆' };
  let html = `<h3>${cat.emoji} ${cat.label}</h3>`;
  if (reveal.phase === 'finalists') {
    html += '<div class="finalists">';
    // Show 3rd, 2nd, 1st (reverse order for drama)
    const sorted = [...reveal.finalists].sort((a, b) => b.rank - a.rank);
    for (const f of sorted) {
      html += `<div class="finalist rank-${f.rank}">${ordinal(f.rank)} — ${f.team}</div>`;
    }
    html += '</div>';
  } else if (reveal.phase === 'winner') {
    html += `<div class="winner-reveal">${reveal.winner}</div>`;
  }
  container.innerHTML = html;
}

// Helper: categories as a map for reveal
const CATEGORIES_MAP = {};

function ordinal(n) {
  return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : n + 'th';
}

// --- Render ---
function render(s) {
  currentState = s;
  // Build categories map on first render
  if (s.categories && Object.keys(CATEGORIES_MAP).length === 0) {
    for (const c of s.categories) CATEGORIES_MAP[c.id] = c;
    // Populate team dropdown if registration modal is showing
    const sel = document.getElementById('voter-team');
    if (sel && sel.options.length <= 1) {
      for (const t of s.teams || []) {
        const opt = document.createElement('option');
        opt.value = t; opt.textContent = t;
        sel.appendChild(opt);
      }
    }
  }

  // Show/hide registration modal
  document.getElementById('register-modal').style.display = myVoter ? 'none' : 'flex';

  // Phase banner
  const phaseLabels = {
    idle: 'Waiting', queue: 'Up Next', setup: 'Setting Up',
    presenting: 'Presenting', voting: 'Vote Now!',
    reveal: 'Awards', tiebreaker: 'Tiebreaker!', done: 'Done!',
  };
  document.getElementById('phase-label').textContent = phaseLabels[s.phase] || s.phase;
  document.getElementById('current-team').textContent = s.currentTeam || '';

  // Sound cues on phase transition
  if (previousPhase && previousPhase !== s.phase) {
    if (s.phase === 'setup') playTeamCalledUp();
    if (s.phase === 'presenting') playPresentationStart();
    if (s.phase === 'voting') { playApplause(); setTimeout(playVotingOpens, 1600); }
    if (s.phase === 'tiebreaker') playTiebreakerAnnounced();
    if (s.phase === 'voting' && s.currentTeam) currentRatings = {}; // Reset for new team
  }
  previousPhase = s.phase;

  // Show/hide phase sections
  document.querySelectorAll('.phase').forEach(el => el.style.display = 'none');
  const isSelf = myTeam && s.currentTeam === myTeam;
  if (s.phase === 'voting' && isSelf) {
    document.getElementById('phase-voting-self').style.display = 'block';
  } else if (s.phase === 'voting') {
    document.getElementById('phase-voting').style.display = 'block';
    buildVotingUI();
  } else if (s.phase === 'reveal') {
    document.getElementById('phase-reveal').style.display = 'block';
    buildRevealUI();
  } else if (s.phase === 'tiebreaker') {
    document.getElementById('phase-tiebreaker').style.display = 'block';
    buildTiebreakerUI();
  } else {
    const el = document.getElementById(`phase-${s.phase}`);
    if (el) el.style.display = 'block';
  }

  // Setup phase team name
  if (s.phase === 'setup') {
    document.getElementById('setup-team').textContent = s.currentTeam || '';
  }
  if (s.phase === 'presenting') {
    document.getElementById('present-team').textContent = s.currentTeam || '';
  }

  // Up-next bar
  const upNext = s.upNext || [];
  document.getElementById('up-next-list').innerHTML = upNext
    .map((t, i) => `<span class="up-next-item${i === 0 ? ' current' : ''}">${t}</span>`)
    .join('');
  document.getElementById('progress').textContent =
    `${s.completed?.length || 0} of ${s.teamCount || '?'} presented`;

  // Winner reveal sound
  if (s.currentReveal?.phase === 'winner' && s.currentReveal?.winner) {
    playRevealWinner();
  }
}

// --- SSE ---
const es = new EventSource('/voting/events');
es.onmessage = e => render(JSON.parse(e.data));
es.onerror = () => setTimeout(() => {}, 2000);

// --- Timer interval ---
timerInterval = setInterval(updateTimer, 250);

// --- Mute ---
function doToggleMute() {
  const muted = toggleMute();
  document.getElementById('mute-btn').textContent = muted ? '🔇' : '🔊';
}
document.getElementById('mute-btn').textContent = isMuted() ? '🔇' : '🔊';
```

**CSS style guide** (follow existing `vote.html` patterns):
- Body: `background: #0f0f1a; color: #e2e8f0; font-family: system-ui, sans-serif;`
- Banner: fixed top, `background: #1a1a2e; border-bottom: 2px solid #7c3aed;`
- Timer warning class: `color: #ef4444;` when <= 30s
- Stars: `font-size: 28px; cursor: pointer;` filled=gold, unfilled=`opacity: 0.3`
- Rating rows: `background: #1a1a2e; border-radius: 12px; padding: 12px 16px;`
- People's Choice row: `border: 1px solid #7c3aed;`
- Up-next bar: fixed bottom, `background: #1a1a2e;`
- Mute button: fixed bottom-right
- Phase sections: `display: none;` by default, shown via JS
- Modal: centered overlay with `background: rgba(0,0,0,0.8);`
- Winner reveal: large text with `color: #d97706;` gold animation
- Finalist ranks: 1st gold, 2nd silver, 3rd bronze colors

- [ ] **Step 2: Test manually in browser**

Run: `cd digital/learnathon-server && PORT=8080 node server.js`
Open: `http://localhost:8080/voting/vote.html`
Expected: Registration modal appears, can enter name and select team (will be empty until ceremony starts)

- [ ] **Step 3: Commit**

```bash
git add digital/learnathon-server/public/voting/vote.html
git commit -m "feat: rewrite vote.html with registration, star ratings, and phase-aware UI"
```

---

### Task 6: Rewrite admin.html — Facilitator page

**Files:**
- Modify: `digital/learnathon-server/public/voting/admin.html` (complete rewrite, currently 400 lines)

The facilitator control panel. Shows full state and provides all ceremony controls.

- [ ] **Step 1: Write the new admin.html**

Write complete file (~500-600 lines). Same dark theme CSS. Uses admin SSE endpoint (`/voting/admin/events?token=TOKEN`) to get full unfiltered state.

**HTML structure:**

```html
<!-- Login screen (same pattern as current admin.html) -->
<div id="login"><input id="token-input" placeholder="Admin token"><button onclick="login()">Login</button></div>

<!-- App (hidden until login) -->
<div id="app" style="display:none">
  <!-- Phase Banner -->
  <div id="phase-banner"><!-- color-coded: idle=purple, queue=blue, setup=green, presenting=amber, voting=red, reveal=gold --></div>

  <!-- Timer + Controls -->
  <div id="timer-section">
    <div id="admin-timer" class="big-timer"></div>
    <div id="timer-controls">
      <button onclick="adminAction('pause')">⏸ Pause</button>
      <button onclick="adminAction('resume')">▶ Resume</button>
      <button onclick="adminAction('extend', {seconds:30})">+30s</button>
      <button onclick="adminAction('skip-phase')">⏭ Skip</button>
    </div>
  </div>

  <!-- Context-sensitive action buttons -->
  <div id="actions">
    <button id="btn-start" onclick="adminAction('start-ceremony')">Start Ceremony</button>
    <button id="btn-next" onclick="adminAction('next-team')">Next Team ▶</button>
    <button id="btn-reveal-start" onclick="adminAction('start-reveal')">Start Reveal 🏆</button>
    <button id="btn-reveal-next" onclick="adminAction('reveal-next')">Reveal Next ▶</button>
    <button id="btn-resolve-tie" onclick="adminAction('resolve-tie')">Resolve Tie</button>
    <button id="btn-next-compliment" onclick="adminAction('next-complimenter')">Next Complimenter</button>
    <button id="btn-tiebreak-vote" onclick="adminAction('start-tiebreak-vote')">Start Tiebreak Vote</button>
    <button id="btn-accept-tie" onclick="adminAction('accept-tie')">Accept Tie</button>
    <button id="btn-reset" onclick="if(confirm('Reset all?')) adminAction('reset')">Reset ⚠</button>
  </div>

  <!-- Queue List -->
  <div id="queue-section"><h3>Teams</h3><div id="queue-list"></div></div>

  <!-- Live Vote Count -->
  <div id="vote-count-section"><h3>Ratings for current team</h3><div id="vote-counts"></div></div>

  <!-- Reveal Progress -->
  <div id="reveal-section"><h3>Awards</h3><div id="reveal-list"></div></div>
</div>
```

**JavaScript logic:**

```js
let token = '';
let state = null;
let timerInterval = null;

function login() {
  token = document.getElementById('token-input').value;
  fetch('/voting/state').then(r => r.json()).then(() => {
    document.getElementById('login').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    // Connect admin SSE (full state)
    const es = new EventSource(`/voting/admin/events?token=${token}`);
    es.onmessage = e => render(JSON.parse(e.data));
  });
}

function adminAction(action, body) {
  fetch(`/voting/admin/${action}`, {
    method: 'POST',
    headers: { 'x-admin-token': token, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }).then(r => r.json()).then(data => {
    if (data.error) showToast(data.error + (data.message ? ' ' + data.message : ''), 'error');
    else showToast('OK', 'success');
  });
}

function render(s) {
  state = s;

  // Phase banner
  const phaseColors = { idle:'#7c3aed', queue:'#3b82f6', setup:'#22c55e',
    presenting:'#d97706', voting:'#ef4444', reveal:'#d97706', tiebreaker:'#ef4444', done:'#22c55e' };
  document.getElementById('phase-banner').style.borderColor = phaseColors[s.phase];
  document.getElementById('phase-banner').innerHTML =
    `<strong>${s.phase.toUpperCase()}</strong>${s.currentTeam ? ' — ' + s.teams[s.presentationOrder[s.currentIndex]] : ''}`;

  // Button visibility based on phase
  const show = (id, visible) => document.getElementById(id).style.display = visible ? 'inline-block' : 'none';
  show('btn-start', s.phase === 'idle');
  show('btn-next', s.phase === 'queue' && s.currentIndex + 1 < s.presentationOrder.length);
  show('btn-reveal-start', s.phase === 'queue' && s.completed.length === s.teamCount && s.teamCount > 0);
  show('btn-reveal-next', s.phase === 'reveal');
  show('btn-resolve-tie', s.phase === 'reveal' && s.currentReveal?.phase === 'finalists');
  show('btn-next-compliment', s.tiebreaker?.stage === 'bingo-check' || s.tiebreaker?.stage === 'compliment');
  show('btn-tiebreak-vote', s.tiebreaker?.stage === 'compliment');
  show('btn-accept-tie', !!s.tiebreaker);
  document.getElementById('timer-controls').style.display = s.timer ? 'flex' : 'none';

  // Queue list — show all teams with status
  document.getElementById('queue-list').innerHTML = s.presentationOrder
    .map((idx, pos) => {
      const team = s.teams[idx];
      const status = s.completed.includes(team) ? '✓' :
        (pos === s.currentIndex ? '▶' : '');
      const cls = s.completed.includes(team) ? 'completed' :
        (pos === s.currentIndex ? 'current' : 'upcoming');
      return `<div class="queue-item ${cls}">${status} ${team}</div>`;
    }).join('');

  // Vote counts during voting phase
  if (s.phase === 'voting' && s.ratings) {
    const team = s.teams[s.presentationOrder[s.currentIndex]];
    const teamRatings = s.ratings[team] || {};
    const voterCount = new Set(Object.values(teamRatings).flatMap(Object.keys)).size;
    document.getElementById('vote-counts').textContent = `${voterCount} voters have rated`;
    document.getElementById('vote-count-section').style.display = 'block';
  } else {
    document.getElementById('vote-count-section').style.display = 'none';
  }

  // Reveal progress
  if (s.revealedAwards?.length > 0 || s.phase === 'reveal') {
    const REVEAL_ORDER = ['best-fail','best-risk-catch','best-safety','most-creative','best-creation','peoples-choice','overall'];
    document.getElementById('reveal-list').innerHTML = REVEAL_ORDER.map(id => {
      const revealed = s.revealedAwards.includes(id);
      const isCurrent = s.currentReveal?.awardId === id;
      return `<div class="reveal-item ${revealed ? 'revealed' : ''} ${isCurrent ? 'current' : ''}">
        ${revealed ? '✓' : (isCurrent ? '▶' : '○')} ${id}
        ${revealed && s.currentReveal?.awardId === id ? ': ' + (s.currentReveal.winner || '...') : ''}
      </div>`;
    }).join('');
    document.getElementById('reveal-section').style.display = 'block';
  }
}

// Timer
timerInterval = setInterval(() => {
  if (!state?.timer) { document.getElementById('admin-timer').textContent = ''; return; }
  const t = state.timer;
  const rem = t.paused ? t.remaining : Math.max(0, Math.ceil((new Date(t.endsAt) - Date.now()) / 1000));
  document.getElementById('admin-timer').textContent = `${Math.floor(rem/60)}:${String(rem%60).padStart(2,'0')}`;
}, 250);

function showToast(msg, type) { /* brief toast notification — append div, fade out after 2s */ }
```

- [ ] **Step 2: Test manually**

Open: `http://localhost:8080/voting/admin.html`
Login with token, verify "Start Ceremony" button appears

- [ ] **Step 3: Commit**

```bash
git add digital/learnathon-server/public/voting/admin.html
git commit -m "feat: rewrite admin.html with full ceremony control panel"
```

---

### Task 7: Create results.html — Post-ceremony results

**Files:**
- Create: `digital/learnathon-server/public/voting/results.html`

Simple page that fetches `/voting/admin/results` and displays:
- Rankings per category with average star ratings
- Overall winner breakdown (points per category)
- JSON download button

- [ ] **Step 1: Write results.html**

~250-300 lines. Same dark theme. Fetches `/voting/admin/results?token=TOKEN`.

Structure:
1. **Login screen** — same admin token pattern
2. **Category sections** — one card per category showing ranked teams with:
   - Rank position (1st/2nd/3rd)
   - Team name
   - Average star rating (displayed as stars + numeric)
   - Rating count
   - Raw score distribution: show individual ratings as a histogram (how many 1s, 2s, 3s, 4s, 5s)
3. **Overall Winner section** — table showing: team, total points, rank in each category
4. **Skipped categories** — list any categories that were skipped (< 2 ranked teams)
5. **Download button** — `JSON.stringify(data)` → download as `ceremony-results.json`

**Key JS logic:**

```js
function renderResults(data) {
  const { rankings, ratings } = data;
  // For each category in rankings.categories:
  //   Show ranked teams with averages
  //   For each team, compute distribution from ratings[team][categoryId] values
  //   Display as: ★1: 2, ★2: 1, ★3: 5, ★4: 8, ★5: 3
  // For overall: render rankings.overall as a table with points breakdown
  // Download button: new Blob([JSON.stringify(data, null, 2)])
}
```

- [ ] **Step 2: Test manually**

Open: `http://localhost:8080/voting/results.html`
Expected: Login screen, after auth shows "No results yet" (no ceremony data)

- [ ] **Step 3: Commit**

```bash
git add digital/learnathon-server/public/voting/results.html
git commit -m "feat: add results.html for post-ceremony score lookup"
```

---

## Chunk 3: MCP Server, Documentation, Integration Test

### Task 8: Update MCP server tools

**Files:**
- Modify: `digital/mcp-server/server.js` (lines 94-152: voting tools section)

Replace `cast_vote` with new tools. Keep `get_voting_status` as alias.

- [ ] **Step 1: Rewrite voting tools section**

Replace lines 94-152 in `digital/mcp-server/server.js` with:

```js
// --- Ceremony Tools ---

server.tool('get_ceremony_status', 'Get current ceremony status: phase, presenting team, timer, next teams, progress', {}, async () => {
  try {
    const res = await fetch(`${VOTING_URL}/state`);
    const state = await res.json();
    const lines = [];
    lines.push(`Phase: ${state.phase}`);
    if (state.currentTeam) lines.push(`Current team: ${state.currentTeam}`);
    if (state.timer) {
      const remaining = state.timer.paused
        ? state.timer.remaining
        : Math.max(0, Math.round((new Date(state.timer.endsAt) - Date.now()) / 1000));
      lines.push(`Timer: ${remaining}s remaining${state.timer.paused ? ' (PAUSED)' : ''}`);
    }
    if (state.upNext?.length > 0) lines.push(`Up next: ${state.upNext.join(', ')}`);
    lines.push(`Progress: ${state.completed?.length || 0} of ${state.teamCount} presented`);
    if (state.tiebreaker) lines.push(`Tiebreaker: ${state.tiebreaker.stage} for ${state.tiebreaker.awardId}`);
    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (err) {
    return { content: [{ type: 'text', text: `Error: ${err.message}. Is LEARNATHON_URL set?` }] };
  }
});

// Backward compatibility alias — same output as get_ceremony_status
server.tool('get_voting_status', 'Get current ceremony/voting status (alias for get_ceremony_status)', {}, async () => {
  try {
    const res = await fetch(`${VOTING_URL}/state`);
    const state = await res.json();
    const lines = [];
    lines.push(`Phase: ${state.phase}`);
    if (state.currentTeam) lines.push(`Current team: ${state.currentTeam}`);
    if (state.timer) {
      const remaining = state.timer.paused
        ? state.timer.remaining
        : Math.max(0, Math.round((new Date(state.timer.endsAt) - Date.now()) / 1000));
      lines.push(`Timer: ${remaining}s remaining${state.timer.paused ? ' (PAUSED)' : ''}`);
    }
    if (state.upNext?.length > 0) lines.push(`Up next: ${state.upNext.join(', ')}`);
    lines.push(`Progress: ${state.completed?.length || 0} of ${state.teamCount} presented`);
    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (err) {
    return { content: [{ type: 'text', text: `Error: ${err.message}` }] };
  }
});

server.tool('register_voter',
  'Register a person to a team for voting. Must be called before submitting any ratings. The agent must clearly state who it is registering.',
  {
    name: { type: 'string', description: 'The person\'s name (who the agent is acting on behalf of)' },
    team: { type: 'string', description: 'The team name this person belongs to' },
  },
  async ({ name, team }) => {
    try {
      const res = await fetch(`${VOTING_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voter: name, team }),
      });
      const data = await res.json();
      if (!res.ok) return { content: [{ type: 'text', text: `Error: ${data.error}. ${data.teams ? 'Available teams: ' + data.teams.join(', ') : ''}` }] };
      return { content: [{ type: 'text', text: `Registered ${name} to ${team}` }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `Error: ${err.message}` }] };
    }
  }
);

server.tool('rate_team',
  'Submit 5-star ratings for the currently presenting team. The agent MUST state who it is voting on behalf of.',
  {
    voter: { type: 'string', description: 'Name of the person this vote is on behalf of (must be registered)' },
    for_team: { type: 'string', description: 'The team being rated (must match currently presenting team)' },
    ratings: {
      type: 'object',
      description: 'Ratings per category (1-5 stars each). Keys: best-creation, most-creative, best-safety, best-risk-catch, best-fail, peoples-choice',
    },
  },
  async ({ voter, for_team, ratings }) => {
    try {
      const res = await fetch(`${VOTING_URL}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voter, forTeam: for_team, ratings }),
      });
      const data = await res.json();
      if (!res.ok) return { content: [{ type: 'text', text: `Error: ${data.error}` }] };
      return { content: [{ type: 'text', text: `Ratings submitted by ${voter} for ${for_team}` }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `Error: ${err.message}` }] };
    }
  }
);

server.tool('cast_tiebreak_vote',
  'Cast a pick-one vote during a tiebreaker. The agent MUST state who it is voting on behalf of.',
  {
    voter: { type: 'string', description: 'Name of the person this vote is on behalf of (must be registered)' },
    vote: { type: 'string', description: 'The team to vote for (must be one of the tied teams)' },
  },
  async ({ voter, vote }) => {
    try {
      const res = await fetch(`${VOTING_URL}/tiebreak-vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voter, vote }),
      });
      const data = await res.json();
      if (!res.ok) return { content: [{ type: 'text', text: `Error: ${data.error}. ${data.options ? 'Options: ' + data.options.join(', ') : ''}` }] };
      return { content: [{ type: 'text', text: `${voter} voted for ${vote} in tiebreaker` }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `Error: ${err.message}` }] };
    }
  }
);
```

- [ ] **Step 2: Verify MCP server loads**

Run: `cd digital/mcp-server && node -e "require('./server.js')" 2>&1 | head -5`
Expected: No import errors (may hang waiting for stdio — that's normal)

- [ ] **Step 3: Commit**

```bash
git add digital/mcp-server/server.js
git commit -m "feat: update MCP server with ceremony tools (register, rate, tiebreak-vote)"
```

---

### Task 9: Update AGENTS.md

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Update the MCP tools section**

Find the section listing `get_voting_status` and `cast_vote` and replace with:

```markdown
- `get_ceremony_status` — Get current ceremony phase, presenting team, timer, and upcoming teams
- `register_voter(name, team)` — Register yourself to your team before voting (required)
- `rate_team(voter, for_team, ratings)` — Submit 5-star ratings (1-5) for the presenting team across all categories
- `cast_tiebreak_vote(voter, vote)` — Cast a pick-one vote during a tiebreaker round
- `get_voting_status` — Alias for get_ceremony_status (backward compatible)
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: update AGENTS.md with new ceremony MCP tools"
```

---

### Task 10: End-to-end integration test

- [ ] **Step 1: Start the server and run through a mini ceremony**

```bash
cd digital/learnathon-server && PORT=8080 ADMIN_TOKEN=test node server.js
```

In another terminal, run this integration script:

```bash
BASE=http://localhost:8080
TOKEN="x-admin-token: test"
CT="Content-Type: application/json"

# Create 3 bingo teams
curl -s -X POST $BASE/bingo/join -H "$CT" -d '{"name":"Team Alpha"}'
curl -s -X POST $BASE/bingo/join -H "$CT" -d '{"name":"Team Beta"}'
curl -s -X POST $BASE/bingo/join -H "$CT" -d '{"name":"Team Gamma"}'

# Start ceremony
curl -s -X POST $BASE/voting/admin/start-ceremony -H "$TOKEN"
echo "--- Ceremony started ---"

# Register voters
curl -s -X POST $BASE/voting/register -H "$CT" -d '{"voter":"Alice","team":"Team Alpha"}'
curl -s -X POST $BASE/voting/register -H "$CT" -d '{"voter":"Bob","team":"Team Beta"}'
curl -s -X POST $BASE/voting/register -H "$CT" -d '{"voter":"Carol","team":"Team Gamma"}'

# Get current team
CURRENT=$(curl -s $BASE/voting/state | python3 -c "import sys,json; print(json.load(sys.stdin).get('currentTeam',''))")

# --- LOOP: present all 3 teams ---
for i in 1 2 3; do
  curl -s -X POST $BASE/voting/admin/next-team -H "$TOKEN"
  CURRENT=$(curl -s $BASE/voting/state | python3 -c "import sys,json; print(json.load(sys.stdin).get('currentTeam',''))")
  echo "Team $i presenting: $CURRENT"

  # Skip setup + presenting to get to voting
  curl -s -X POST $BASE/voting/admin/skip-phase -H "$TOKEN"
  curl -s -X POST $BASE/voting/admin/skip-phase -H "$TOKEN"

  # Rate from non-self voters (all 6 categories required)
  RATINGS='{"best-creation":4,"most-creative":3,"best-safety":5,"best-risk-catch":4,"best-fail":3,"peoples-choice":4}'
  for VOTER in Alice Bob Carol; do
    TEAM=$(curl -s $BASE/voting/state | python3 -c "import sys,json; print('skip')" 2>/dev/null)
    RESP=$(curl -s -X POST $BASE/voting/rate -H "$CT" \
      -d "{\"voter\":\"$VOTER\",\"forTeam\":\"$CURRENT\",\"ratings\":$RATINGS}")
    echo "  $VOTER rating $CURRENT: $RESP"
  done

  # Skip voting timer
  curl -s -X POST $BASE/voting/admin/skip-phase -H "$TOKEN"
done

# Test self-vote rejection explicitly
echo "--- Self-vote test ---"
curl -s -X POST $BASE/voting/admin/next-team -H "$TOKEN" 2>/dev/null
# (will fail: all teams presented — expected)

# Start reveal
echo "--- Starting reveal ---"
curl -s -X POST $BASE/voting/admin/start-reveal -H "$TOKEN"

# Reveal first category (best-fail)
curl -s -X POST $BASE/voting/admin/reveal-next -H "$TOKEN"
echo "Finalists shown"
curl -s -X POST $BASE/voting/admin/reveal-next -H "$TOKEN"
echo "Winner revealed"

# Check results
echo "--- Full results ---"
curl -s "$BASE/voting/admin/results?token=test" | python3 -m json.tool | head -30
```

Expected:
- Ceremony starts with 3 teams in random order
- Self-votes return 403 error
- Reveal shows finalists then winner
- Results endpoint returns full ratings data

- [ ] **Step 2: Test the admin UI and voter UI in browser**

Open two browser tabs:
- `http://localhost:8080/voting/admin.html` — log in with token "test"
  - Verify: phase indicator shows current phase, timer counts down, buttons enable/disable per phase
- `http://localhost:8080/voting/vote.html` — register with a name and team
  - Verify: registration modal works, phase banner updates via SSE, star rating UI appears during voting, up-next list visible

- [ ] **Step 3: Final commit**

```bash
git add digital/learnathon-server/ digital/mcp-server/server.js AGENTS.md
git commit -m "feat: complete ceremony & voting overhaul — all pages, sounds, MCP tools"
```
