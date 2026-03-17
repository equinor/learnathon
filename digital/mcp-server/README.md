# Learnathon MCP Server

An MCP (Model Context Protocol) server that connects AI coding agents to the Learnathon 2026 bingo and ceremony/voting apps. Runs locally via stdio transport in each participant's Codespace.

---

## Tools

| Tool | Description |
|------|-------------|
| `get_bingo_status` | Get bingo board status for all teams or a specific team |
| `list_bingo_squares` | List all bingo squares with their index numbers and labels |
| `mark_bingo_square` | Mark (or unmark) a bingo square — auto-creates the team if new |
| `get_ceremony_status` | Get current ceremony phase, presenting team, timer, and upcoming teams |
| `register_voter` | Register yourself to your team before voting (required before rating) |
| `rate_team` | Submit 5-star ratings (1–5) for the presenting team across all 6 categories |
| `cast_tiebreak_vote` | Cast a pick-one vote during a tiebreaker round |

---

## Setup

### In Claude Code

Add to your project's `.claude/mcp.json`:

```json
{
  "mcpServers": {
    "learnathon": {
      "command": "node",
      "args": ["/path/to/learnathon/digital/mcp-server/server.js"],
      "env": {
        "LEARNATHON_URL": "https://server-learnathon-prod.playground.radix.equinor.com"
      }
    }
  }
}
```

The `LEARNATHON_URL` defaults to the production Radix URL, so the `env` block is optional during the event.

### Local development

To point at a local server instead:

```bash
LEARNATHON_URL=http://localhost:8080 node server.js
```

---

## Tech Stack

- Node.js (plain JS, no build step)
- `@modelcontextprotocol/sdk` — official MCP SDK
- `zod` — input validation
- Stdio transport (one process per participant)

---

## Backend

The MCP server proxies to the unified learnathon server:

- **Bingo API:** `{LEARNATHON_URL}/bingo/*`
- **Ceremony/Voting API:** `{LEARNATHON_URL}/voting/*`

The backend is deployed on Radix Playground at `server-learnathon-prod.playground.radix.equinor.com`.
