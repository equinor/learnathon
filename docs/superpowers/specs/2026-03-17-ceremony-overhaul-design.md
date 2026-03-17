# Ceremony & Voting Overhaul — Design Spec

## Overview

Replace the current voting app with a unified Ceremony + Voting system that orchestrates team presentations (pecha-kucha style), 5-star audience ratings, dramatic winner reveals, and multi-stage tiebreakers. The ceremony runs 18 teams at ~2.5 minutes each (~45 min total).

## Flow Summary

Each team goes through: **Queue → Setup (30s) → Present (90s) → Vote (30s) → next team**. After all teams, the facilitator runs a **category-by-category winner reveal** with tiebreaker resolution.

---

## 1. State Machine

### Phases

```
idle → queue → setup → presenting → voting → [loop back to queue] → reveal → tiebreaker → done
```

| Phase | Description | Timer |
|-------|-------------|-------|
| `idle` | No ceremony active | — |
| `queue` | Ceremony started, showing next 3 teams, waiting for facilitator to advance | — |
| `setup` | Current team preparing | 30s |
| `presenting` | Team is presenting | 90s |
| `voting` | Audience rating the team | 30s |
| `reveal` | Post-ceremony, revealing winners category by category | — |
| `tiebreaker` | Resolving a tie for a category | 30s (compliment/vote phases) |
| `done` | All categories revealed, ceremony complete | — |

### Phase Transitions

- **idle → queue**: Facilitator clicks "Start Ceremony". Teams pulled from bingo app, order randomized.
- **queue → setup**: Facilitator clicks "Next Team". 30s timer starts.
- **setup → presenting**: Auto-advance when timer expires. 90s timer starts.
- **presenting → voting**: Auto-advance when timer expires. 30s timer starts. Applause prompt sound plays.
- **voting → queue**: Auto-advance when timer expires. If more teams remain, return to queue. If all teams done, stay in queue awaiting facilitator to start reveal.
- **queue → reveal**: Facilitator clicks "Start Reveal" after all 18 teams have presented.
- **reveal → tiebreaker**: Automatic when a category's top rank is tied.
- **tiebreaker → reveal**: When tie is resolved (or accepted), continue revealing remaining categories.
- **reveal → done**: All 7 awards revealed.

### Facilitator Overrides

Available during any timed phase:
- **Pause** — freeze timer
- **Resume** — continue timer
- **Extend** — add 30s to current timer
- **Skip phase** — immediately advance to next phase

---

## 2. Data Model

### Server State

```js
{
  phase: 'idle' | 'queue' | 'setup' | 'presenting' | 'voting' | 'reveal' | 'tiebreaker' | 'done',

  // Teams
  teams: ['Team Alpha', 'Team Beta', ...],           // 18 teams, pulled from bingo
  presentationOrder: [3, 17, 0, ...],                 // shuffled indices into teams[]
  currentIndex: -1,                                    // position in presentationOrder (-1 = not started)
  completed: [],                                       // team names that have presented

  // Timer
  timer: null | { endsAt: ISO, duration: number, paused: boolean, remaining: number },

  // Voter registry — person → team mapping
  voters: {
    'Alice': 'Team Alpha',
    'Bob': 'Team Alpha',
    'Carol': 'Team Beta',
    // ...
  },

  // Ratings — one vote per person per presenting team
  ratings: {
    'Team Quantum': {                                  // the team being rated
      'best-creation': { 'Alice': 4, 'Bob': 5, 'Carol': 3, ... },
      'most-creative': { 'Alice': 3, 'Carol': 5, ... },
      'best-safety': { ... },
      'best-risk-catch': { ... },
      'best-fail': { ... },
      'peoples-choice': { ... }
    }
  },

  // Categories (fixed)
  categories: [
    { id: 'best-creation', label: 'Best Creation', emoji: '🥇', question: 'Rate their product' },
    { id: 'most-creative', label: 'Most Creative AI Use', emoji: '🎨', question: 'Rate their creativity' },
    { id: 'best-safety', label: 'Best Safety Practice', emoji: '🔐', question: 'Rate their safety practice' },
    { id: 'best-risk-catch', label: 'Best Risk Catch', emoji: '🚨', question: 'Rate their risk awareness' },
    { id: 'best-fail', label: 'Best Fail Story', emoji: '😂', question: 'Rate their fail story' },
    { id: 'peoples-choice', label: "People's Choice", emoji: '🤝', question: 'Overall impression' }
  ],

  // Reveal state
  revealedAwards: [],                                  // award IDs revealed so far (6 categories + 'overall')
  currentReveal: null | {
    awardId: string,                                   // category ID or 'overall'
    phase: 'finalists' | 'winner',
    finalists: [{ team, rank }],
    winner: string | null
  },

  // Tiebreaker state
  tiebreaker: null | {
    awardId: string,
    teams: ['Team A', 'Team B'],
    stage: 'bingo-check' | 'compliment' | 'vote' | 'accepted-tie',
    bingoData: { 'Team A': { legend, lines, squares }, ... },
    bingoRevealStep: 'legend' | 'lines' | 'squares' | null,
    currentComplimenter: 0,                            // index into teams[]
    votes: { 'Alice': 'Team A', 'Bob': 'Team A', 'Carol': 'Team B', ... }  // per-person pick-one votes
  }
}
```

### Voter Registration

Each individual registers with a name and team before voting:
- **Learner app**: First visit prompts name entry + team selection (dropdown of 18 bingo teams). Stored in localStorage.
- **MCP agent**: Calls `register_voter(name, team)` to register on behalf of its user.
- Server maintains a `voters` registry mapping person names to teams.
- Registration is required before submitting any ratings.

### Scoring Rules

- **Per-category ranking**: Average of all star ratings (1-5) received for that category.
- **Minimum vote threshold**: A team must receive ratings from at least 3 different individuals on a category to be ranked for that category.
- **People's Choice**: Uses the "Overall impression" (category 6) ratings. Same 3-vote minimum.
- **Overall Winner**: Aggregate ranking across all 6 categories. Each category ranking gives points (1st = 1 point, 2nd = 2, etc.). Lowest total wins. Team must be ranked in at least 3 of 6 categories to qualify for Overall Winner.
- **Self-voting block**: Server looks up the voter's team and rejects ratings where the voter's team matches the presenting team (hard enforcement).

### One Vote Per Person

Each individual gets exactly one vote per presenting team. The vote is identified by voter name in the payload. If a person submits via the learner app and then their MCP agent also submits (or vice versa), the later submission overwrites the earlier one (same voter name = same slot). This applies to both star ratings and tiebreak votes.

---

## 3. API Routes

### Ceremony Control (admin — requires `x-admin-token`)

| Method | Route | Body | Description |
|--------|-------|------|-------------|
| POST | `/admin/start-ceremony` | — | Pull teams from bingo, shuffle, enter `queue` |
| POST | `/admin/next-team` | — | Advance to next team, enter `setup`, start 30s timer |
| POST | `/admin/pause` | — | Pause current timer |
| POST | `/admin/resume` | — | Resume timer |
| POST | `/admin/extend` | `{ seconds: 30 }` | Add time to current timer |
| POST | `/admin/skip-phase` | — | Jump to next phase immediately |
| POST | `/admin/start-reveal` | — | Enter reveal phase |
| POST | `/admin/reveal-next` | — | Show finalists, then winner for next category |
| POST | `/admin/resolve-tie` | — | Enter tiebreaker for current category |
| POST | `/admin/next-complimenter` | — | Advance compliment battle to next team |
| POST | `/admin/start-tiebreak-vote` | — | Open pick-one audience vote |
| POST | `/admin/accept-tie` | — | Accept tie, co-winners, move on |
| POST | `/admin/reset` | — | Reset all state |
| GET | `/admin/results` | — | Full raw ratings, averages, rankings |

### Learner Routes (public)

| Method | Route | Body | Description |
|--------|-------|------|-------------|
| GET | `/state` | — | Filtered state (next 3 teams only, no raw ratings) |
| GET | `/events` | — | SSE stream |
| POST | `/register` | `{ voter: 'Alice', team: 'Team Alpha' }` | Register a voter to a team |
| POST | `/rate` | `{ voter: 'Alice', ratings: { categoryId: 1-5 } }` | Submit star ratings for current presenting team |
| POST | `/tiebreak-vote` | `{ voter: 'Alice', vote: 'Team X' }` | Cast pick-one tiebreak vote |

### State Filtering for `/state` and SSE

Learners receive a filtered view:
- `presentationOrder` shows only the next 3 teams (not full order)
- `ratings` not included (teams cannot see other teams' ratings)
- Own submission status included (which teams they've rated)
- Timer info included (for countdown display)

---

## 4. Frontend Pages

### 4.1 Learner Page (`vote.html`)

Mobile-first responsive design. Three persistent elements across all phases:

**Persistent banner (top):**
- Current phase label + presenting team name
- Countdown timer (when active)

**Persistent up-next list (compact, bottom or sidebar):**
- Next 3 teams, always visible
- Progress indicator: "7 of 18 presented"

**Main content area (changes per phase):**

| Phase | Content |
|-------|---------|
| `idle` | "Ceremony hasn't started" waiting screen |
| `queue` | "Waiting for next team..." with up-next list prominent |
| `setup` | "Team X is getting ready" + countdown |
| `presenting` | Team name + large countdown timer + "Voting opens after" |
| `voting` | 6-row star rating UI (tap stars 1-5 per category) + submit button |
| `voting` (self) | "You're presenting! No self-voting" message |
| `reveal` | Finalists/winner display matching facilitator reveals |
| `tiebreaker` | Pick-one vote buttons during audience vote stage |
| `done` | "Ceremony complete!" with confetti |

**Star rating UI details:**
- 6 categories displayed vertically, each with emoji + question text + 5 tappable stars
- People's Choice row has a subtle purple border to distinguish it
- Submit button at bottom, full width
- "You can update your ratings until the timer ends" helper text
- Sound cue on star tap (mark sound from bingo)
- Sound cue on submit (line sound from bingo)

### 4.2 Facilitator Page (`admin.html`)

Full control panel showing all state:

**Top section:**
- Current phase indicator (large, color-coded)
- Presenting team name
- Timer with pause/resume/extend/skip buttons

**Control section:**
- "Start Ceremony" (idle phase)
- "Next Team" (queue phase)
- "Start Reveal" (after all teams presented)
- "Reveal Next" (reveal phase)
- Tiebreaker controls (resolve tie, next complimenter, start tiebreak vote, accept tie)
- "Reset" with confirmation

**Info section:**
- Full queue (all teams, highlighting completed/current/upcoming)
- Live vote count per category as ratings come in for current team
- Reveal progress per category

### 4.3 Results Page (`results.html`)

Post-ceremony lookup page, accessible with admin token:
- Rankings per category with average star ratings
- Raw score distributions per team per category
- Overall winner aggregation breakdown
- Exportable/viewable after the event

### 4.4 Removed: `screen.html`

No big-screen app. The projector is used by presenting teams for their demos. Timer and queue live on facilitator laptop and learner devices.

---

## 5. Sound Design

Web Audio API, pentatonic sine waves — same musical family as bingo app. Extracted into a shared `sounds.js` module.

| Moment | Sound | Technical |
|--------|-------|-----------|
| Team called up | Rising arpeggio C4→E4→G4→C5 | 4 notes, 0.12s apart, 0.2s sustain |
| Presentation starts | Single clear G4 | 0.3s sustain |
| 30 seconds remaining | Two soft pips A4, A4 | 0.1s each, 0.2s gap |
| Time's up | Descending chime C5→G4→E4 | 0.15s apart, 0.4s sustain |
| Applause prompt | Warm chord C4+E4+G4 | 1.5s sustain, simultaneous |
| Voting opens | Ascending pair C4→E4 | 0.15s apart |
| Voting closes | Descending pair E4→C4 | 0.15s apart |
| Reveal: finalists | Tremolo (rapid alternating) | Rapid C4/E4 alternation, 2s |
| Reveal: winner | Triumphant C4→E4→G4→C5 + held chord | Arpeggio + 1s chord |
| Tiebreaker announced | Low C3 with slow rise to C4 | 1.5s glide |

Sounds play on both facilitator and learner devices. Mute toggle preserved (localStorage).

---

## 6. Tiebreaker System

### Resolution Order

For each category, if the top-ranked teams are tied:

**Stage 1 — Bingo Card Check (dramatic reveal)**

Server fetches bingo state from `/bingo/state`. Resolution priority:
1. **Legend status** — legend beats non-legend
2. **Line count** — more completed lines wins
3. **Square count** — more marked squares wins

Displayed with dramatic animation:
- Show tied teams' bingo cards side by side
- Reveal legend status with suspense pause per team
- If still tied, reveal line counts with animated counters
- If still tied, reveal square counts
- Each step pauses before showing result

If resolved: winner announced with celebration effects.

**Stage 2 — Compliment Battle**

If bingo check doesn't resolve:
- Tied teams announced on screen ("It's a compliment battle!")
- Each team gets 30s to compliment the other team(s)
- Facilitator clicks "Next Complimenter" to advance between teams
- Currently complimenting team is highlighted on all screens

**Stage 3 — Audience Vote**

After compliments:
- Learner apps show pick-one vote between tied teams
- One vote per person (same person-identified voting, self-vote block applies)
- 30s timer
- Winner = most votes

**Stage 4 — Accept Tie**

If audience vote is also tied:
- Facilitator clicks "Accept Tie"
- Both teams celebrated as co-winners
- "Shared victory!" announcement with confetti for both

---

## 7. MCP Server Updates

### New Tools

| Tool | Parameters | Description |
|------|-----------|-------------|
| `get_ceremony_status` | — | Current phase, presenting team, timer, next 3 teams, progress |
| `register_voter` | `name: string, team: string` | Register a person to a team. Must be called before voting. Agent must clearly identify who it is registering. |
| `rate_team` | `voter: string, ratings: { 'best-creation': 4, ... }` | Submit star ratings for current presenting team. Voter must be registered. Agent must explicitly state who it is voting on behalf of. All 6 categories, values 1-5. |
| `cast_tiebreak_vote` | `voter: string, vote: string` | Pick-one vote during tiebreaker. Voter must be registered. Agent must explicitly state who it is voting on behalf of. |

### Removed Tools
- `cast_vote` — replaced by `rate_team`

### Kept Tools
- `get_voting_status` — alias for `get_ceremony_status` (backward compatibility)

### Agent Identity Requirement

All MCP tools that submit votes require the `voter` parameter — the name of the person the agent is acting on behalf of. The agent must:
1. Know which person and team it represents (via `register_voter` or prior registration)
2. Always pass the voter's name explicitly in every vote submission
3. Make it clear in its responses to the user who it voted for and on which team's behalf

Same HTTP proxy pattern, same Zod validation, same stdio transport.

---

## 8. Technical Approach

### What stays the same
- Express + vanilla HTML/CSS/JS, no build step
- SSE for real-time sync (single stream, full filtered state)
- JSON file persistence (`/tmp/voting-state.json`)
- Dark theme: `#0a0a14` bg, `#7c3aed` purple, `#d97706` amber
- Admin token auth (`x-admin-token` header)
- Bingo app untouched (queried read-only during tiebreaker)
- Confetti system (canvas-based particle animation)

### What's reworked
- `voting-router.js` — complete rewrite: state machine, timer logic, new routes
- `vote.html` — complete rewrite: phase-aware UI with star ratings
- `admin.html` — complete rewrite: ceremony control panel

### What's new
- `sounds.js` — shared Web Audio sound module (extracted from bingo, extended)
- `results.html` — post-ceremony detailed results page
- Timer system — server-authoritative (`endsAt` timestamps), auto-phase-advance via `setTimeout`
- Bingo API client — server-side fetch to bingo state for tiebreaker

### What's removed
- `screen.html` — no longer needed (no big screen app)

---

## 9. Reveal Sequence (7 Awards)

The facilitator reveals awards one at a time in this order:

1. Best Fail Story (lightest category, warm up the crowd)
2. Best Risk Catch
3. Best Safety Practice
4. Most Creative AI Use
5. Best Creation
6. People's Choice
7. Overall Winner (grand finale)

For each award:
1. Category name + emoji announced with suspense sound
2. Top 3 finalists appear: 3rd → 2nd → 1st with pauses
3. Winner highlighted with triumphant sound + confetti
4. If tied for 1st → tiebreaker flow instead of winner announcement

For Overall Winner: show the aggregated point totals and final ranking.
