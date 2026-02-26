# Learnathon MCP Server

An MCP (Model Context Protocol) server built for the Learnathon event itself.
This is both a working tool for the day **and** a live example of what the MCP Server challenge track produces.

> **Status:** Sketched — to be built before the event

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

## Security

**Event token**: A short random string generated before the event. Distributed via the event Slack channel and injected into all Codespaces as an org-level secret (`LEARNATHON_EVENT_TOKEN`). Every request must include it as a Bearer token. This keeps the server closed to the outside world without requiring individual logins.

Teams identify themselves by team name/number in the request body. We trust participants not to mark each other's bingo — and if they do, it's a teachable moment.

---

## Hosting: Radix (Equinor)

Deploy as a Radix application for the day. Radix is Equinor's internal Kubernetes platform — easy to spin up, easy to tear down.

```
Spin up:  1 day before the event
Tear down: 1 day after the event
```

A `radixconfig.yaml` will be provided in this directory. After the event, archive the repo, delete the Radix app. Done.

---

## Equinor MCP Server Template (Varia)

This project will also serve as a **reusable template** for teams at Equinor who want to build and deploy their own MCP servers on Radix. After the event, publish to Varia:

- Working Node.js MCP server with auth pattern
- `radixconfig.yaml` for Radix deployment
- `Dockerfile`
- README explaining the pattern

> **Goal:** Any Equinor team should be able to fork this and have a running MCP server on Radix within a day.

---

## Connect to Claude Code

Once running, add to `~/.claude/mcp_servers.json`:

```json
{
  "mcpServers": {
    "learnathon": {
      "type": "http",
      "url": "https://learnathon-mcp.radix.equinor.com",
      "headers": {
        "Authorization": "Bearer ${LEARNATHON_EVENT_TOKEN}"
      }
    }
  }
}
```

Then in any Claude Code session:
```
"What teams have completed Lab 1?"
"Mark our bingo square for 'Use agent mode to scaffold'"
"Show me all gotchas submitted so far"
```

---

## Tech Stack (Proposed)

- Node.js + TypeScript
- `@modelcontextprotocol/sdk` (official MCP TypeScript SDK)
- HTTP + SSE transport (one server, all participants connect)
- JSON file for state persistence across restarts
- Docker + `radixconfig.yaml` for Radix deployment

---

## Stretch Goals

- Bingo board as a live web view (separate from the MCP interface)
- Integration with the voting app
- Post-event: publish as Varia article + template repo
