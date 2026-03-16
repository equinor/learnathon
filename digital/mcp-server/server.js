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

// --- Voting tools ---

server.tool(
  "get_voting_status",
  "Get current voting state — teams, categories, whether voting is open, and results",
  {},
  async () => {
    try {
      const res = await fetch(`${VOTING_URL}/state`);
      const state = await res.json();
      return { content: [{ type: "text", text: JSON.stringify(state, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Could not reach the Learnathon server at ${BASE_URL}. Is LEARNATHON_URL set correctly? Error: ${err.message}` }] };
    }
  }
);

server.tool(
  "cast_vote",
  "Cast a vote for a team in a category (only works when voting is open). Use get_voting_status first to see available teams and categories.",
  {
    team: z.string().describe("Team name to vote for"),
    category: z.string().describe("Vote category — use get_voting_status to see the available categories"),
  },
  async ({ team, category }) => {
    try {
      // Pre-check: fetch voting state to validate inputs
      const stateRes = await fetch(`${VOTING_URL}/state`);
      const state = await stateRes.json();

      if (!state.votingOpen) {
        return { content: [{ type: "text", text: "Voting is not currently open. Wait for the facilitator to open voting." }] };
      }

      if (!state.teams.includes(team)) {
        return { content: [{ type: "text", text: `Team "${team}" not found. Available teams: ${state.teams.join(", ") || "none"}` }] };
      }

      const categoryIds = state.categories.map((c) => c.id);
      if (!categoryIds.includes(category)) {
        return { content: [{ type: "text", text: `Category "${category}" not found. Available categories: ${categoryIds.join(", ")}` }] };
      }

      const res = await fetch(`${VOTING_URL}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team, category }),
      });

      const result = await res.json();
      if (result.error) {
        return { content: [{ type: "text", text: `Error: ${result.error}` }] };
      }
      return { content: [{ type: "text", text: `Vote cast for "${team}" in ${category}.` }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Could not reach the Learnathon server at ${BASE_URL}. Is LEARNATHON_URL set correctly? Error: ${err.message}` }] };
    }
  }
);

// --- Start ---

const transport = new StdioServerTransport();
await server.connect(transport);
