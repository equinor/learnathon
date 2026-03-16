const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

// --- Helpers ---

let server;
let base;

function url(path) { return `${base}${path}`; }

function json(path, opts = {}) {
  const { headers: extraHeaders, ...rest } = opts;
  return fetch(url(path), {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  }).then(async r => ({ status: r.status, body: await r.json() }));
}

function get(path, opts = {}) {
  return fetch(url(path), opts);
}

const ADMIN_HEADERS = { 'x-admin-token': 'admin-dev' };

// --- Setup / Teardown ---

before(async () => {
  // Clean state files
  for (const f of ['/tmp/bingo-state.json', '/tmp/voting-state.json']) {
    try { fs.unlinkSync(f); } catch {}
  }

  // Clear require cache for fresh state
  for (const mod of ['./bingo-router', './voting-router']) {
    delete require.cache[require.resolve(mod)];
  }

  const express = require('express');
  const RateLimit = require('express-rate-limit');
  const app = express();
  app.use(express.json());

  const fileLimiter = RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs for file-serving route
  });

  const bingoRouter = require('./bingo-router');
  const votingRouter = require('./voting-router');

  app.use('/bingo', bingoRouter);
  app.use('/voting', votingRouter);

  app.get('/', fileLimiter, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-dev';

  app.get('/admin/backup', (req, res) => {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (token !== ADMIN_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
    res.json({ timestamp: new Date().toISOString(), bingo: bingoRouter.getState(), voting: votingRouter.getState() });
  });

  app.post('/admin/restore', (req, res) => {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (token !== ADMIN_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
    const body = req.body || {};
    if (typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    const { bingo, voting } = body;
    if (bingo) bingoRouter.setState(bingo);
    if (voting) votingRouter.setState(voting);
    res.json({ ok: true });
  });

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      base = `http://localhost:${server.address().port}`;
      resolve();
    });
  });
});

after(() => {
  if (server) server.close();
  for (const f of ['/tmp/bingo-state.json', '/tmp/voting-state.json']) {
    try { fs.unlinkSync(f); } catch {}
  }
});

// =====================================================
// Health & Landing
// =====================================================

describe('Health & Landing', () => {
  it('GET /health returns 200 with status ok', async () => {
    const { status, body } = await json('/health');
    assert.equal(status, 200);
    assert.equal(body.status, 'ok');
    assert.equal(typeof body.uptime, 'number');
  });

  it('GET / returns 200 with landing page HTML', async () => {
    const res = await get('/');
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('Learnathon 2026'), 'landing page should contain title');
    assert.ok(html.includes('/bingo/card.html'), 'landing page should link to bingo');
    assert.ok(html.includes('/voting/vote.html'), 'landing page should link to voting');
  });
});

// =====================================================
// Bingo Routes
// =====================================================

describe('Bingo API', () => {
  it('GET /bingo/state returns empty teams and 9 squares', async () => {
    const { status, body } = await json('/bingo/state');
    assert.equal(status, 200);
    assert.deepEqual(body.teams, {});
    assert.equal(body.squares.length, 9);
  });

  it('POST /bingo/join creates a team', async () => {
    const { status, body } = await json('/bingo/join', {
      method: 'POST',
      body: JSON.stringify({ name: 'TeamAlpha' }),
    });
    assert.equal(status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.team.name, 'TeamAlpha');
    assert.equal(body.team.squares.length, 9);
    assert.ok(body.team.squares.every(s => s === false), 'all squares should start unmarked');
  });

  it('POST /bingo/join with empty name returns 400', async () => {
    const { status, body } = await json('/bingo/join', {
      method: 'POST',
      body: JSON.stringify({ name: '' }),
    });
    assert.equal(status, 400);
    assert.ok(body.error);
  });

  it('POST /bingo/join is idempotent', async () => {
    const { body: first } = await json('/bingo/join', {
      method: 'POST',
      body: JSON.stringify({ name: 'TeamAlpha' }),
    });
    const { body: second } = await json('/bingo/join', {
      method: 'POST',
      body: JSON.stringify({ name: 'TeamAlpha' }),
    });
    assert.deepEqual(first.team, second.team);
  });

  it('POST /bingo/mark marks a square', async () => {
    const { status, body } = await json('/bingo/mark', {
      method: 'POST',
      body: JSON.stringify({ name: 'TeamAlpha', square: 0, marked: true }),
    });
    assert.equal(status, 200);
    assert.equal(body.ok, true);
  });

  it('POST /bingo/mark with invalid square returns 400', async () => {
    const { status } = await json('/bingo/mark', {
      method: 'POST',
      body: JSON.stringify({ name: 'TeamAlpha', square: 99, marked: true }),
    });
    assert.equal(status, 400);
  });

  it('POST /bingo/mark for unknown team returns 404', async () => {
    const { status } = await json('/bingo/mark', {
      method: 'POST',
      body: JSON.stringify({ name: 'NoSuchTeam', square: 0, marked: true }),
    });
    assert.equal(status, 404);
  });

  it('POST /bingo/mark detects line completion', async () => {
    // Mark squares 0, 1, 2 (top row) for a new team
    await json('/bingo/join', { method: 'POST', body: JSON.stringify({ name: 'LineTeam' }) });
    await json('/bingo/mark', { method: 'POST', body: JSON.stringify({ name: 'LineTeam', square: 0, marked: true }) });
    await json('/bingo/mark', { method: 'POST', body: JSON.stringify({ name: 'LineTeam', square: 1, marked: true }) });
    const { body } = await json('/bingo/mark', {
      method: 'POST',
      body: JSON.stringify({ name: 'LineTeam', square: 2, marked: true }),
    });
    assert.equal(body.newLine, true, 'should detect new line on top row');
  });

  it('POST /bingo/mark detects legend status (all 9 squares)', async () => {
    await json('/bingo/join', { method: 'POST', body: JSON.stringify({ name: 'LegendTeam' }) });
    for (let i = 0; i < 8; i++) {
      await json('/bingo/mark', { method: 'POST', body: JSON.stringify({ name: 'LegendTeam', square: i, marked: true }) });
    }
    const { body } = await json('/bingo/mark', {
      method: 'POST',
      body: JSON.stringify({ name: 'LegendTeam', square: 8, marked: true }),
    });
    assert.equal(body.newLegend, true);
    assert.equal(body.isLegend, true);
  });

  it('GET /bingo/state reflects marked squares', async () => {
    const { body } = await json('/bingo/state');
    assert.equal(body.teams['TeamAlpha'].squares[0], true);
  });

  it('GET /bingo/events returns SSE stream', async () => {
    const res = await get('/bingo/events');
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'text/event-stream');
    // Read first chunk and close
    const reader = res.body.getReader();
    const { value } = await reader.read();
    reader.cancel();
    const text = new TextDecoder().decode(value);
    assert.ok(text.startsWith('data: '), 'SSE should start with data:');
    const payload = JSON.parse(text.replace('data: ', '').trim());
    assert.ok(payload.teams, 'SSE payload should contain teams');
    assert.ok(payload.squares, 'SSE payload should contain squares');
  });

  it('POST /bingo/reset without token returns 401', async () => {
    const { status, body } = await json('/bingo/reset', { method: 'POST' });
    assert.equal(status, 401);
    assert.ok(body.error.includes('Unauthorized'));
  });

  it('POST /bingo/reset with valid token clears all teams', async () => {
    const { status, body } = await json('/bingo/reset', {
      method: 'POST',
      headers: ADMIN_HEADERS,
    });
    assert.equal(status, 200);
    assert.equal(body.ok, true);

    const { body: state } = await json('/bingo/state');
    assert.deepEqual(state.teams, {});
  });
});

// =====================================================
// Voting Routes
// =====================================================

describe('Voting API', () => {
  it('GET /voting/state returns initial state', async () => {
    const { status, body } = await json('/voting/state');
    assert.equal(status, 200);
    assert.equal(body.votingOpen, false);
    assert.equal(body.revealedUpTo, -1);
    assert.equal(body.categories.length, 6);
    assert.deepEqual(body.teams, []);
  });

  it('POST /voting/vote fails when voting is closed', async () => {
    const { status, body } = await json('/voting/vote', {
      method: 'POST',
      body: JSON.stringify({ team: 'A', category: 'best-fail' }),
    });
    assert.equal(status, 400);
    assert.ok(body.error.includes('not open'));
  });

  it('POST /voting/admin/teams requires auth', async () => {
    const { status } = await json('/voting/admin/teams', {
      method: 'POST',
      body: JSON.stringify({ teams: ['A', 'B'] }),
    });
    assert.equal(status, 401);
  });

  it('POST /voting/admin/teams sets teams', async () => {
    const { status, body } = await json('/voting/admin/teams', {
      method: 'POST',
      headers: ADMIN_HEADERS,
      body: JSON.stringify({ teams: ['Alpha', 'Beta', 'Gamma'] }),
    });
    assert.equal(status, 200);
    assert.equal(body.ok, true);
    assert.deepEqual(body.teams, ['Alpha', 'Beta', 'Gamma']);
  });

  it('POST /voting/admin/open opens voting', async () => {
    const { status, body } = await json('/voting/admin/open', {
      method: 'POST',
      headers: ADMIN_HEADERS,
      body: '{}',
    });
    assert.equal(status, 200);
    assert.equal(body.ok, true);

    const { body: state } = await json('/voting/state');
    assert.equal(state.votingOpen, true);
  });

  it('POST /voting/vote succeeds when open', async () => {
    const { status, body } = await json('/voting/vote', {
      method: 'POST',
      body: JSON.stringify({ team: 'Alpha', category: 'best-creation' }),
    });
    assert.equal(status, 200);
    assert.equal(body.ok, true);
  });

  it('POST /voting/vote rejects unknown team', async () => {
    const { status, body } = await json('/voting/vote', {
      method: 'POST',
      body: JSON.stringify({ team: 'NoSuchTeam', category: 'best-creation' }),
    });
    assert.equal(status, 400);
    assert.ok(body.error.includes('Unknown team'));
  });

  it('POST /voting/vote rejects unknown category', async () => {
    const { status, body } = await json('/voting/vote', {
      method: 'POST',
      body: JSON.stringify({ team: 'Alpha', category: 'not-a-category' }),
    });
    assert.equal(status, 400);
    assert.ok(body.error.includes('Unknown category'));
  });

  it('POST /voting/admin/close closes voting', async () => {
    const { body } = await json('/voting/admin/close', {
      method: 'POST',
      headers: ADMIN_HEADERS,
      body: '{}',
    });
    assert.equal(body.ok, true);

    const { body: state } = await json('/voting/state');
    assert.equal(state.votingOpen, false);
  });

  it('POST /voting/admin/reveal-next reveals first category', async () => {
    const { status, body } = await json('/voting/admin/reveal-next', {
      method: 'POST',
      headers: ADMIN_HEADERS,
      body: '{}',
    });
    assert.equal(status, 200);
    assert.equal(body.ok, true);
    assert.ok(body.revealed);

    const { body: state } = await json('/voting/state');
    assert.equal(state.revealedUpTo, 0);
  });

  it('POST /voting/admin/reveal-next while voting open returns 400', async () => {
    // Open voting, then try reveal
    await json('/voting/admin/reset', { method: 'POST', headers: ADMIN_HEADERS, body: '{}' });
    await json('/voting/admin/teams', { method: 'POST', headers: ADMIN_HEADERS, body: JSON.stringify({ teams: ['A'] }) });
    await json('/voting/admin/open', { method: 'POST', headers: ADMIN_HEADERS, body: '{}' });

    const { status, body } = await json('/voting/admin/reveal-next', {
      method: 'POST',
      headers: ADMIN_HEADERS,
      body: '{}',
    });
    assert.equal(status, 400);
    assert.ok(body.error.includes('Close voting'));

    // Clean up
    await json('/voting/admin/close', { method: 'POST', headers: ADMIN_HEADERS, body: '{}' });
  });

  it('GET /voting/events returns SSE stream', async () => {
    const res = await get('/voting/events');
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'text/event-stream');
    const reader = res.body.getReader();
    const { value } = await reader.read();
    reader.cancel();
    const text = new TextDecoder().decode(value);
    assert.ok(text.startsWith('data: '));
    const payload = JSON.parse(text.replace('data: ', '').trim());
    assert.ok('votingOpen' in payload);
    assert.ok('categories' in payload);
  });

  it('POST /voting/admin/reset clears votes and reveals', async () => {
    const { body } = await json('/voting/admin/reset', {
      method: 'POST',
      headers: ADMIN_HEADERS,
      body: '{}',
    });
    assert.equal(body.ok, true);

    const { body: state } = await json('/voting/state');
    assert.equal(state.votingOpen, false);
    assert.equal(state.revealedUpTo, -1);
    assert.deepEqual(state.votes, {});
  });
});

// =====================================================
// Admin Backup & Restore
// =====================================================

describe('Admin Backup & Restore', () => {
  it('GET /admin/backup without token returns 401', async () => {
    const { status } = await json('/admin/backup');
    assert.equal(status, 401);
  });

  it('GET /admin/backup returns both states', async () => {
    const { status, body } = await json('/admin/backup', {
      headers: ADMIN_HEADERS,
    });
    assert.equal(status, 200);
    assert.ok(body.timestamp);
    assert.ok('bingo' in body);
    assert.ok('voting' in body);
  });

  it('POST /admin/restore without token returns 401', async () => {
    const { status } = await json('/admin/restore', {
      method: 'POST',
      body: JSON.stringify({ bingo: {}, voting: {} }),
    });
    assert.equal(status, 401);
  });

  it('POST /admin/restore restores bingo state', async () => {
    const fakeState = {
      TestTeam: {
        name: 'TestTeam',
        squares: [true, true, true, false, false, false, false, false, false],
        completedLines: [[0, 1, 2]],
        isLegend: false,
        joinedAt: new Date().toISOString(),
      },
    };

    const { body } = await json('/admin/restore', {
      method: 'POST',
      headers: ADMIN_HEADERS,
      body: JSON.stringify({ bingo: fakeState }),
    });
    assert.equal(body.ok, true);

    const { body: state } = await json('/bingo/state');
    assert.equal(state.teams['TestTeam'].name, 'TestTeam');
    assert.deepEqual(state.teams['TestTeam'].squares.slice(0, 3), [true, true, true]);

    // Clean up
    await json('/bingo/reset', { method: 'POST', headers: ADMIN_HEADERS });
  });
});

// =====================================================
// Static Files — correct paths
// =====================================================

describe('Static HTML files are served', () => {
  const pages = [
    '/bingo/card.html',
    '/bingo/wall.html',
    '/bingo/admin.html',
    '/bingo/dashboard.html',
    '/voting/vote.html',
    '/voting/screen.html',
    '/voting/admin.html',
  ];

  for (const page of pages) {
    it(`GET ${page} returns 200`, async () => {
      const res = await get(page);
      assert.equal(res.status, 200, `${page} should return 200`);
      const ct = res.headers.get('content-type');
      assert.ok(ct.includes('text/html'), `${page} should be HTML`);
    });
  }
});

describe('Bingo HTML files have prefixed paths', () => {
  const bingoPages = ['card.html', 'wall.html', 'admin.html', 'dashboard.html'];

  for (const page of bingoPages) {
    it(`/bingo/${page} has no unprefixed fetch or EventSource calls`, async () => {
      const res = await get(`/bingo/${page}`);
      const html = await res.text();

      // Should not have fetch('/join'), fetch('/mark'), etc. — only fetch('/bingo/...')
      const unprefixedFetch = html.match(/fetch\(\s*['"]\/(?!bingo\/|voting\/|http)/g);
      assert.equal(unprefixedFetch, null, `${page} has unprefixed fetch: ${unprefixedFetch}`);

      const unprefixedSSE = html.match(/EventSource\(\s*['"]\/(?!bingo\/)/g);
      assert.equal(unprefixedSSE, null, `${page} has unprefixed EventSource: ${unprefixedSSE}`);
    });
  }
});

describe('Voting HTML files have prefixed paths', () => {
  const votingPages = ['vote.html', 'screen.html', 'admin.html'];

  for (const page of votingPages) {
    it(`/voting/${page} has no unprefixed fetch or EventSource calls`, async () => {
      const res = await get(`/voting/${page}`);
      const html = await res.text();

      // Check for template-literal fetches too: fetch(`/${...}`) should be fetch(`/voting/${...}`)
      const unprefixedFetch = html.match(/fetch\(\s*['"`]\/(?!bingo\/|voting\/|http)/g);
      assert.equal(unprefixedFetch, null, `${page} has unprefixed fetch: ${unprefixedFetch}`);

      const unprefixedSSE = html.match(/EventSource\(\s*['"]\/(?!voting\/)/g);
      assert.equal(unprefixedSSE, null, `${page} has unprefixed EventSource: ${unprefixedSSE}`);
    });
  }
});

// =====================================================
// State persistence to /tmp
// =====================================================

describe('State persistence', () => {
  it('bingo state is written to /tmp/bingo-state.json', async () => {
    await json('/bingo/join', { method: 'POST', body: JSON.stringify({ name: 'PersistTeam' }) });
    const raw = fs.readFileSync('/tmp/bingo-state.json', 'utf8');
    const data = JSON.parse(raw);
    assert.ok(data['PersistTeam'], 'state file should contain team');
  });

  it('voting state is written to /tmp/voting-state.json', async () => {
    await json('/voting/admin/teams', {
      method: 'POST',
      headers: ADMIN_HEADERS,
      body: JSON.stringify({ teams: ['PTeam'] }),
    });
    const raw = fs.readFileSync('/tmp/voting-state.json', 'utf8');
    const data = JSON.parse(raw);
    assert.ok(data.teams.includes('PTeam'), 'state file should contain team');
  });
});

// =====================================================
// Cross-app isolation
// =====================================================

describe('App isolation', () => {
  it('bingo and voting have independent SSE streams', async () => {
    const bingoRes = await get('/bingo/events');
    const votingRes = await get('/voting/events');

    const bingoReader = bingoRes.body.getReader();
    const votingReader = votingRes.body.getReader();

    const { value: bingoData } = await bingoReader.read();
    const { value: votingData } = await votingReader.read();

    const bingo = JSON.parse(new TextDecoder().decode(bingoData).replace('data: ', '').trim());
    const voting = JSON.parse(new TextDecoder().decode(votingData).replace('data: ', '').trim());

    // Bingo state has 'squares' array, voting has 'categories'
    assert.ok(bingo.squares, 'bingo SSE should have squares');
    assert.ok(voting.categories, 'voting SSE should have categories');
    assert.ok(!bingo.categories, 'bingo SSE should not have voting categories');
    assert.ok(!voting.squares, 'voting SSE should not have bingo squares');

    bingoReader.cancel();
    votingReader.cancel();
  });

  it('routes do not leak between apps', async () => {
    // /voting/join should not exist (voting has no join endpoint)
    const r1 = await fetch(url('/voting/join'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'X' }),
    });
    // Should be 404 or not return {ok: true}
    const isJson1 = (r1.headers.get('content-type') || '').includes('json');
    if (isJson1) {
      const body = await r1.json();
      assert.notEqual(body.ok, true, '/voting/join should not succeed');
    } else {
      assert.notEqual(r1.status, 200, '/voting/join should not return 200');
    }

    // /bingo/vote should not exist (bingo has no vote endpoint)
    const r2 = await fetch(url('/bingo/vote'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team: 'X', category: 'best-fail' }),
    });
    const isJson2 = (r2.headers.get('content-type') || '').includes('json');
    if (isJson2) {
      const body = await r2.json();
      assert.notEqual(body.ok, true, '/bingo/vote should not succeed');
    } else {
      assert.notEqual(r2.status, 200, '/bingo/vote should not return 200');
    }
  });
});

// =====================================================
// Radix deployment readiness
// =====================================================

describe('Radix: server defaults to port 8080', () => {
  it('server.js defaults PORT to 8080', () => {
    const src = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
    assert.ok(src.includes('8080'), 'server.js should default to port 8080');
  });
});

describe('Radix: no hardcoded localhost in HTML pages', () => {
  const allPages = [
    'public/bingo/card.html',
    'public/bingo/wall.html',
    'public/bingo/admin.html',
    'public/bingo/dashboard.html',
    'public/voting/vote.html',
    'public/voting/screen.html',
    'public/voting/admin.html',
  ];

  for (const page of allPages) {
    it(`${page} has no hardcoded localhost in fetch/EventSource/API calls`, () => {
      const html = fs.readFileSync(path.join(__dirname, page), 'utf8');
      // Allowed: window.location.origin (dynamic), display text
      // Not allowed: fetch('http://localhost...), new EventSource('http://localhost...)
      const hardcoded = html.match(/(?:fetch|EventSource)\s*\(\s*['"`]https?:\/\/localhost/g);
      assert.equal(hardcoded, null,
        `${page} has hardcoded localhost in API calls: ${hardcoded}`);
    });
  }
});

describe('Radix: no secrets in source files', () => {
  const sourceFiles = [
    'server.js',
    'bingo-router.js',
    'voting-router.js',
    'Dockerfile',
  ];

  for (const file of sourceFiles) {
    it(`${file} does not contain hardcoded secrets`, () => {
      const src = fs.readFileSync(path.join(__dirname, file), 'utf8');
      // Check for common secret patterns (actual tokens, not env var references)
      const tokenPattern = /['"]ghp_[A-Za-z0-9]+['"]/g;
      assert.equal(src.match(tokenPattern), null,
        `${file} contains what looks like a GitHub token`);

      // No hardcoded admin tokens (admin-dev is the dev fallback, that's OK)
      const secretEnvPattern = /ADMIN_TOKEN\s*=\s*['"][^'"]{10,}['"]/g;
      assert.equal(src.match(secretEnvPattern), null,
        `${file} contains what looks like a hardcoded production token`);
    });
  }

  it('Dockerfile does not contain ENV with secrets', () => {
    const dockerfile = fs.readFileSync(path.join(__dirname, 'Dockerfile'), 'utf8');
    assert.ok(!dockerfile.includes('ADMIN_TOKEN'),
      'Dockerfile should not set ADMIN_TOKEN — use Radix secrets');
    assert.ok(!dockerfile.includes('GITHUB_TOKEN'),
      'Dockerfile should not set GITHUB_TOKEN — use Radix secrets');
  });
});

describe('Radix: Dockerfile meets container requirements', () => {
  it('uses non-root user', () => {
    const dockerfile = fs.readFileSync(path.join(__dirname, 'Dockerfile'), 'utf8');
    assert.ok(dockerfile.includes('USER'), 'should switch to non-root user');
    assert.ok(
      dockerfile.includes('appuser') || dockerfile.includes('1001'),
      'should create non-root user'
    );
  });

  it('exposes port 8080', () => {
    const dockerfile = fs.readFileSync(path.join(__dirname, 'Dockerfile'), 'utf8');
    assert.ok(dockerfile.includes('EXPOSE 8080'), 'should EXPOSE 8080');
  });

  it('uses npm ci for reproducible builds', () => {
    const dockerfile = fs.readFileSync(path.join(__dirname, 'Dockerfile'), 'utf8');
    assert.ok(dockerfile.includes('npm ci'), 'should use npm ci, not npm install');
  });

  it('copies package-lock.json for npm ci', () => {
    const dockerfile = fs.readFileSync(path.join(__dirname, 'Dockerfile'), 'utf8');
    assert.ok(
      dockerfile.includes('package-lock.json'),
      'should copy package-lock.json for deterministic installs'
    );
  });
});

describe('Radix: radixconfig.yaml', () => {
  let radix;
  before(() => {
    radix = fs.readFileSync(path.join(__dirname, '..', '..', 'radixconfig.yaml'), 'utf8');
  });

  it('references ADMIN_TOKEN as a secret', () => {
    assert.ok(radix.includes('ADMIN_TOKEN'), 'should reference ADMIN_TOKEN secret');
  });

  it('references GITHUB_TOKEN as a secret', () => {
    assert.ok(radix.includes('GITHUB_TOKEN'), 'should reference GITHUB_TOKEN secret');
  });

  it('uses port 8080', () => {
    assert.ok(radix.includes('8080'), 'should use port 8080');
  });

  it('has health probe on /health', () => {
    assert.ok(radix.includes('/health'), 'should have health probe path');
  });

  it('uses exactly 1 replica (SSE state is in-memory)', () => {
    assert.ok(
      radix.includes('replicas: 1') || radix.includes('replicas:1'),
      'should use 1 replica — SSE state is in-memory and cannot be shared'
    );
  });

  it('sets publicPort for external access', () => {
    assert.ok(radix.includes('publicPort'), 'should have publicPort for external access');
  });
});

// =====================================================
// MCP server works against unified server
// =====================================================

describe('MCP server configuration', () => {
  it('uses single LEARNATHON_URL env var (not separate BINGO_URL / VOTING_URL)', () => {
    const mcpSource = fs.readFileSync(
      path.join(__dirname, '..', 'mcp-server', 'server.js'),
      'utf8'
    );
    assert.ok(mcpSource.includes('LEARNATHON_URL'), 'should use LEARNATHON_URL');
    // BINGO_URL/VOTING_URL should derive from BASE_URL, not be standalone env vars
    assert.ok(
      !mcpSource.match(/process\.env\.BINGO_URL/),
      'should not read BINGO_URL from env — derive from LEARNATHON_URL'
    );
    assert.ok(
      !mcpSource.match(/process\.env\.VOTING_URL/),
      'should not read VOTING_URL from env — derive from LEARNATHON_URL'
    );
  });

  it('defaults to http://localhost:8080 (matching server default port)', () => {
    const mcpSource = fs.readFileSync(
      path.join(__dirname, '..', 'mcp-server', 'server.js'),
      'utf8'
    );
    assert.ok(
      mcpSource.includes('http://localhost:8080'),
      'MCP default URL should match server default port 8080'
    );
  });

  it('prefixes bingo routes with /bingo', () => {
    const mcpSource = fs.readFileSync(
      path.join(__dirname, '..', 'mcp-server', 'server.js'),
      'utf8'
    );
    // Should build BINGO_URL as BASE_URL + /bingo
    assert.ok(mcpSource.includes('/bingo'), 'should prefix bingo routes');
  });

  it('prefixes voting routes with /voting', () => {
    const mcpSource = fs.readFileSync(
      path.join(__dirname, '..', 'mcp-server', 'server.js'),
      'utf8'
    );
    assert.ok(mcpSource.includes('/voting'), 'should prefix voting routes');
  });
});

// =====================================================
// MCP routes work end-to-end against unified server
// =====================================================

describe('MCP routes work against unified server', () => {
  it('MCP bingo state route (/bingo/state) returns valid state', async () => {
    const { status, body } = await json('/bingo/state');
    assert.equal(status, 200);
    assert.ok('teams' in body, 'bingo state should have teams');
    assert.ok('squares' in body, 'bingo state should have squares');
  });

  it('MCP bingo join+mark flow works via /bingo/ prefix', async () => {
    // This is the exact flow the MCP server does: join then mark
    const joinRes = await json('/bingo/join', {
      method: 'POST',
      body: JSON.stringify({ name: 'MCPTeam' }),
    });
    assert.equal(joinRes.body.ok, true);

    const markRes = await json('/bingo/mark', {
      method: 'POST',
      body: JSON.stringify({ name: 'MCPTeam', square: 2, marked: true }),
    });
    assert.equal(markRes.body.ok, true);
  });

  it('MCP voting state route (/voting/state) returns valid state', async () => {
    const { status, body } = await json('/voting/state');
    assert.equal(status, 200);
    assert.ok('votingOpen' in body, 'voting state should have votingOpen');
    assert.ok('categories' in body, 'voting state should have categories');
  });

  it('MCP voting vote route (/voting/vote) reachable via /voting/ prefix', async () => {
    // Should fail with "not open" — but the route is reachable, not 404
    const { status, body } = await json('/voting/vote', {
      method: 'POST',
      body: JSON.stringify({ team: 'X', category: 'best-fail' }),
    });
    assert.equal(status, 400);
    assert.ok(body.error.includes('not open'), 'should reach voting route and get business logic error');
  });
});

// =====================================================
// XSS prevention
// =====================================================

describe('XSS: bingo setState sanitises team names', () => {
  it('strips HTML from team names on restore', async () => {
    const xssPayload = {
      '<img src=x onerror=alert(1)>': {
        name: '<img src=x onerror=alert(1)>',
        squares: new Array(9).fill(false),
        completedLines: [],
        isLegend: false,
        joinedAt: new Date().toISOString(),
      },
    };

    await json('/admin/restore', {
      method: 'POST',
      headers: ADMIN_HEADERS,
      body: JSON.stringify({ bingo: xssPayload }),
    });

    const { body: state } = await json('/bingo/state');
    const names = Object.keys(state.teams);
    for (const name of names) {
      assert.ok(!name.includes('<'), `team key should not contain <: ${name}`);
      assert.ok(!name.includes('>'), `team key should not contain >: ${name}`);
      assert.ok(!state.teams[name].name.includes('<'), `team name should not contain <`);
    }

    // Clean up
    await json('/bingo/reset', { method: 'POST', headers: ADMIN_HEADERS });
  });
});

describe('XSS: voting admin/teams sanitises team names', () => {
  it('strips HTML from team names', async () => {
    const { body } = await json('/voting/admin/teams', {
      method: 'POST',
      headers: ADMIN_HEADERS,
      body: JSON.stringify({ teams: ['Good Team', '<script>alert(1)</script>', 'Normal'] }),
    });
    assert.equal(body.ok, true);
    for (const team of body.teams) {
      assert.ok(!team.includes('<'), `team name should not contain <: ${team}`);
      assert.ok(!team.includes('>'), `team name should not contain >: ${team}`);
    }

    // Clean up
    await json('/voting/admin/reset', { method: 'POST', headers: ADMIN_HEADERS, body: '{}' });
  });
});

describe('XSS: voting setState sanitises team names', () => {
  it('strips HTML from team names on restore', async () => {
    await json('/admin/restore', {
      method: 'POST',
      headers: ADMIN_HEADERS,
      body: JSON.stringify({
        voting: {
          teams: ['OK', '<img onerror=alert(1)>', '"><script>xss</script>'],
          votingOpen: false,
          revealedUpTo: -1,
          votes: {},
        },
      }),
    });

    const { body: state } = await json('/voting/state');
    for (const team of state.teams) {
      assert.ok(!team.includes('<'), `team name should not contain <: ${team}`);
      assert.ok(!team.includes('>'), `team name should not contain >: ${team}`);
      assert.ok(!team.includes('"'), `team name should not contain ": ${team}`);
    }

    // Clean up
    await json('/voting/admin/reset', { method: 'POST', headers: ADMIN_HEADERS, body: '{}' });
  });
});

describe('XSS: HTML pages use escapeHtml for team names', () => {
  const pagesNeedingEscape = [
    { file: 'public/bingo/wall.html', desc: 'bingo wall' },
    { file: 'public/bingo/dashboard.html', desc: 'bingo dashboard' },
    { file: 'public/voting/vote.html', desc: 'voting vote' },
    { file: 'public/voting/screen.html', desc: 'voting screen' },
    { file: 'public/voting/admin.html', desc: 'voting admin' },
  ];

  for (const { file, desc } of pagesNeedingEscape) {
    it(`${desc} defines escapeHtml()`, () => {
      const html = fs.readFileSync(path.join(__dirname, file), 'utf8');
      assert.ok(html.includes('function escapeHtml'), `${desc} should define escapeHtml`);
    });
  }
});

// =====================================================
// HTML pages use relative/origin-based URLs for Radix
// =====================================================

describe('Radix: HTML display URLs use window.location.origin', () => {
  it('bingo wall shows dynamic join URL (not hardcoded)', () => {
    const html = fs.readFileSync(
      path.join(__dirname, 'public', 'bingo', 'wall.html'), 'utf8'
    );
    assert.ok(
      html.includes('window.location.origin'),
      'wall.html should use window.location.origin for the join URL display'
    );
  });

  it('voting screen shows dynamic vote URL (not hardcoded)', () => {
    const html = fs.readFileSync(
      path.join(__dirname, 'public', 'voting', 'screen.html'), 'utf8'
    );
    assert.ok(
      html.includes('window.location.origin'),
      'screen.html should use window.location.origin for the vote URL display'
    );
  });

  it('voting admin shows dynamic vote URL (not hardcoded)', () => {
    const html = fs.readFileSync(
      path.join(__dirname, 'public', 'voting', 'admin.html'), 'utf8'
    );
    assert.ok(
      html.includes('window.location.origin'),
      'admin.html should use window.location.origin for the vote URL display'
    );
  });
});

// =====================================================
// Admin ping endpoints for login validation
// =====================================================

describe('Admin ping endpoints', () => {
  it('GET /voting/admin/ping without token returns 401', async () => {
    const { status } = await json('/voting/admin/ping');
    assert.equal(status, 401);
  });

  it('GET /voting/admin/ping with valid token returns 200', async () => {
    const { status, body } = await json('/voting/admin/ping', {
      headers: ADMIN_HEADERS,
    });
    assert.equal(status, 200);
    assert.equal(body.ok, true);
  });

  it('GET /bingo/admin/ping without token returns 401', async () => {
    const { status } = await json('/bingo/admin/ping');
    assert.equal(status, 401);
  });

  it('GET /bingo/admin/ping with valid token returns 200', async () => {
    const { status, body } = await json('/bingo/admin/ping', {
      headers: ADMIN_HEADERS,
    });
    assert.equal(status, 200);
    assert.equal(body.ok, true);
  });
});

// =====================================================
// Admin restore handles missing/invalid body
// =====================================================

describe('Admin restore body validation', () => {
  it('POST /admin/restore with empty body succeeds (no-op)', async () => {
    const { status, body } = await json('/admin/restore', {
      method: 'POST',
      headers: ADMIN_HEADERS,
      body: JSON.stringify({}),
    });
    assert.equal(status, 200);
    assert.equal(body.ok, true);
  });
});

// =====================================================
// Control character sanitisation
// =====================================================

describe('Sanitisation: control characters stripped from team names', () => {
  it('voting admin/teams strips control chars', async () => {
    const { body } = await json('/voting/admin/teams', {
      method: 'POST',
      headers: ADMIN_HEADERS,
      body: JSON.stringify({ teams: ['Good\nTeam', 'Bad\rName', 'Tab\there'] }),
    });
    assert.equal(body.ok, true);
    for (const team of body.teams) {
      assert.ok(!/[\x00-\x1f\x7f]/.test(team), `team name should not contain control chars: ${JSON.stringify(team)}`);
    }
    // Clean up
    await json('/voting/admin/reset', { method: 'POST', headers: ADMIN_HEADERS, body: '{}' });
  });

  it('bingo join strips control chars', async () => {
    const { body } = await json('/bingo/join', {
      method: 'POST',
      body: JSON.stringify({ name: 'Team\nNewline' }),
    });
    assert.equal(body.ok, true);
    assert.ok(!/[\x00-\x1f\x7f]/.test(body.team.name), `team name should not contain control chars: ${JSON.stringify(body.team.name)}`);
    // Clean up
    await json('/bingo/reset', { method: 'POST', headers: ADMIN_HEADERS });
  });
});

// =====================================================
// Bingo admin has login flow and token in reset
// =====================================================

describe('Bingo admin HTML login flow', () => {
  it('bingo admin.html has login screen with token input', () => {
    const html = fs.readFileSync(path.join(__dirname, 'public', 'bingo', 'admin.html'), 'utf8');
    assert.ok(html.includes('id="login-screen"'), 'should have login screen');
    assert.ok(html.includes('id="token-input"'), 'should have token input');
    assert.ok(html.includes('/bingo/admin/ping'), 'should validate against /bingo/admin/ping');
  });

  it('bingo admin.html sends x-admin-token header in doReset', () => {
    const html = fs.readFileSync(path.join(__dirname, 'public', 'bingo', 'admin.html'), 'utf8');
    assert.ok(html.includes("'x-admin-token': adminToken"), 'doReset should send admin token header');
  });
});

// =====================================================
// Voting admin login validates against admin/ping
// =====================================================

describe('Voting admin HTML login flow', () => {
  it('voting admin.html validates against /voting/admin/ping', () => {
    const html = fs.readFileSync(path.join(__dirname, 'public', 'voting', 'admin.html'), 'utf8');
    assert.ok(html.includes('/voting/admin/ping'), 'login should use /voting/admin/ping endpoint');
  });
});

// =====================================================
// MCP server normalises BASE_URL
// =====================================================

describe('MCP server URL normalisation', () => {
  it('strips trailing slashes from BASE_URL', () => {
    const mcpSource = fs.readFileSync(path.join(__dirname, '..', 'mcp-server', 'server.js'), 'utf8');
    assert.ok(
      mcpSource.includes('.replace(/\\/+$/, \'\')') || mcpSource.includes('.replace(/\\/+$/,'),
      'MCP server should strip trailing slashes from LEARNATHON_URL'
    );
  });
});
