import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE_URL = (process.env.LEARNATHON_URL || "https://server-learnathon-prod.playground.radix.equinor.com").replace(/\/+$/, '');
const BINGO_URL = `${BASE_URL}/bingo`;
const VOTING_URL = `${BASE_URL}/voting`;

const server = new McpServer({
  name: "learnathon",
  version: "1.0.0",
});

// --- Bingo tools ---

server.tool(
  "get_bingo_status",
  "Get bingo board status for all teams or a specific team",
  { team: z.string().optional().describe("Team name (omit for all teams)") },
  async ({ team }) => {
    try {
      const res = await fetch(`${BINGO_URL}/state`);
      const state = await res.json();

      if (team) {
        const teamData = state.teams[team];
        if (!teamData) {
          return { content: [{ type: "text", text: `Team "${team}" not found. Known teams: ${Object.keys(state.teams).join(", ") || "none"}` }] };
        }
        return { content: [{ type: "text", text: JSON.stringify({ team: teamData, squares: state.squares }, null, 2) }] };
      }

      return { content: [{ type: "text", text: JSON.stringify(state, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Could not reach the Learnathon server at ${BASE_URL}. Is LEARNATHON_URL set correctly? Error: ${err.message}` }] };
    }
  }
);

server.tool(
  "list_bingo_squares",
  "List all bingo square indices and their labels, so you know which square number to mark",
  {},
  async () => {
    try {
      const res = await fetch(`${BINGO_URL}/state`);
      const state = await res.json();

      const lines = state.squares.map(s => `${s.id}: ${s.label}`);
      return { content: [{ type: "text", text: lines.join("\n") }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Could not reach the Learnathon server at ${BASE_URL}. Is LEARNATHON_URL set correctly? Error: ${err.message}` }] };
    }
  }
);

server.tool(
  "mark_bingo_square",
  "Mark (or unmark) a bingo square for your team. A new team will be created if the name doesn't already exist.",
  {
    team: z.string().describe("Your team name"),
    square: z.number().min(0).max(8).describe("Square index (0-8, left to right, top to bottom)"),
    marked: z.boolean().default(true).describe("true to mark, false to unmark"),
  },
  async ({ team, square, marked }) => {
    try {
      await fetch(`${BINGO_URL}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: team }),
      });

      const res = await fetch(`${BINGO_URL}/mark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: team, square, marked }),
      });

      const result = await res.json();
      if (result.error) {
        return { content: [{ type: "text", text: `Error: ${result.error}` }] };
      }

      let msg = `Marked square ${square} for team "${team}".`;
      if (result.newLine) msg += " New bingo line completed!";
      if (result.newLegend) msg += " LEGEND STATUS ACHIEVED!";
      return { content: [{ type: "text", text: msg }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Could not reach the Learnathon server at ${BASE_URL}. Is LEARNATHON_URL set correctly? Error: ${err.message}` }] };
    }
  }
);

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

// --- Collective learning tools ---

server.tool(
  "get_gotchas",
  "Fetch gotchas (AI pitfalls and lessons learned) submitted by all teams during the event. This is the collective hivemind — every team's mistakes become everyone's wisdom. Check this when you hit a problem or before starting something new.",
  {},
  async () => {
    try {
      const res = await fetch(`${BINGO_URL}/api/issues?label=gotcha`);
      if (!res.ok) {
        return { content: [{ type: "text", text: `Could not fetch gotchas: ${res.status} ${res.statusText}` }] };
      }
      const issues = await res.json();

      if (issues.length === 0) {
        return { content: [{ type: "text", text: "No gotchas submitted yet. Be the first — use /submit-gotcha to share a lesson learned!" }] };
      }

      const formatted = issues.map(issue =>
        `### ${issue.title}\n${issue.body}\n---`
      ).join("\n\n");

      return { content: [{ type: "text", text: `## Collective Gotchas (${issues.length} submitted by teams today)\n\nThese are real mistakes and lessons from other teams at this event. Learn from the hivemind.\n\n${formatted}` }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Could not reach the Learnathon server at ${BASE_URL}. Is LEARNATHON_URL set correctly? Error: ${err.message}` }] };
    }
  }
);

// --- Start ---

const transport = new StdioServerTransport();
await server.connect(transport);
