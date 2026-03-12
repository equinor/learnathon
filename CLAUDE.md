# CLAUDE.md

Read `AGENTS.md` in this repository root for full context: event info, workflow, challenge tracks, security conventions, and working style guidelines.

## Claude Code Specific

- Use **compact** mode for routine tasks to save context: `/compact`
- Skills are in `.claude/skills/` — use `/submit-gotcha` and `/submit-project` to contribute back to the event
- The MCP server config is in `.claude/settings.json` if configured
- When Claude asks for permission to run a command, read what it wants to do before approving
- Commit often — small, working changes with clear commit messages

## Repository Structure

```
AGENTS.md             Tool-agnostic instructions (read this first)
learning/             Participant-facing learning content
docs/                 Facilitator and organiser docs
templates/            Starter repos per challenge track
digital/              Products built by organisers (bingo, voting, MCP server)
environments/         Sandbox setup and agent config files
```

## Content Conventions

- Sections marked with warning symbols are open questions or things not yet decided
- The workflow (spec -> plan -> build -> verify -> secure -> ship) and security emphasis are the two core themes
- The gotchas deck (`learning/gotchas.md`) is designed for community contribution
