# Learnathon MCP Server

An MCP (Model Context Protocol) server built for the Learnathon event itself.
This is both a working tool for the day **and** a live demo of what an MCP server is.

> **Status:** To be built using the tools — Claude Code + Spark/Node.js

---

## What It Does

Exposes these tools to any MCP-enabled AI agent (Claude Code, OpenCode, etc.):

| Tool | Description |
|------|-------------|
| `get_schedule` | Returns the current event schedule and which phase we're in |
| `get_teams` | Lists all teams, their challenge track, and repo link |
| `mark_bingo` | Marks a bingo square as completed for a team |
| `get_bingo_status` | Returns the bingo board for a team or all teams |
| `submit_gotcha` | Adds a new entry to the Gotchas Deck |
| `get_gotchas` | Returns all submitted gotchas |

---

## Why Build This?

1. **It's useful on the day** — coaches can ask "what teams are still on Lab 1?" via their agent
2. **It demonstrates MCP servers** — participants in the MCP Server challenge track can use this as a reference
3. **It's a live meta-demo** — we built an event tool using the tools we're teaching

---

## Building It

This will be built using Claude Code (or OpenCode) as the primary tool, following the Learnathon workflow:

```
spec → plan → build → verify → secure → ship
```

See `SPEC.md` (to be created) for the mini-spec.

**Tech stack (proposed):**
- Node.js / TypeScript
- `@modelcontextprotocol/sdk` (the official MCP TypeScript SDK)
- Simple JSON file for state (no database needed for a one-day event)

---

## Connect to Claude Code

Once running, add to `~/.claude/mcp_servers.json`:

```json
{
  "mcpServers": {
    "learnathon": {
      "command": "node",
      "args": ["/path/to/learnathon-mcp/dist/index.js"]
    }
  }
}
```

Then in any Claude Code session:
```
"What teams have completed Lab 1?"
"Mark Team 7's bingo square for 'Use agent mode to scaffold'"
"Show me all gotchas submitted so far"
```

---

## Stretch Goals

- Bingo board displayed on screen (separate web view)
- Real-time updates via SSE
- Integration with the voting app
