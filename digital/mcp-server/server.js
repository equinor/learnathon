import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE_URL = (process.env.LEARNATHON_URL || "http://localhost:8080").replace(/\/+$/, '');
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
  }
);

server.tool(
  "mark_bingo_square",
  "Mark (or unmark) a bingo square for your team",
  {
    team: z.string().describe("Your team name"),
    square: z.number().min(0).max(8).describe("Square index (0-8, left to right, top to bottom)"),
    marked: z.boolean().default(true).describe("true to mark, false to unmark"),
  },
  async ({ team, square, marked }) => {
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
  }
);

// --- Voting tools ---

server.tool(
  "get_voting_status",
  "Get current voting state — teams, categories, whether voting is open, and results",
  {},
  async () => {
    const res = await fetch(`${VOTING_URL}/state`);
    const state = await res.json();
    return { content: [{ type: "text", text: JSON.stringify(state, null, 2) }] };
  }
);

server.tool(
  "cast_vote",
  "Cast a vote for a team in a category (only works when voting is open)",
  {
    team: z.string().describe("Team name to vote for"),
    category: z.enum([
      "best-creation",
      "most-creative",
      "best-safety",
      "best-risk-catch",
      "best-fail",
      "peoples-choice",
    ]).describe("Vote category"),
  },
  async ({ team, category }) => {
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
  }
);

// --- Start ---

const transport = new StdioServerTransport();
await server.connect(transport);
