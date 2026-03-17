# AGENTS.md — Learnathon 2026

This is the single source of truth for all AI coding tools working in this repo. Both `CLAUDE.md` and `.github/copilot-instructions.md` point here.

## Event Context

You are helping a team at **Learnathon 2026** — a hands-on AI-assisted software engineering event (March 18, 2026). ~60 participants in ~20 teams, each building a project in one day using AI coding tools.

## The Workflow

Follow this loop for everything you build:

**spec -> plan -> build -> verify -> secure -> ship**

1. **Spec** — Write a short description: what, who, why, scope, done-when
2. **Plan** — Propose architecture, list files, identify risks. Wait for approval.
3. **Build** — Work in small steps. Commit after each working change.
4. **Verify** — Run it. Check it does what was asked. Catch hallucinations.
5. **Secure** — Check for hardcoded secrets, unsanitised input, unnecessary deps.
6. **Ship** — Prepare a demo. Something real, even if incomplete.

See `learning/workflow-card.md` for the full version.

## Skills Available

You have two submission skills for contributing back to the event:

- **submit-gotcha** (`skills/submit-gotcha.md`) — Share an AI pitfall or lesson learned. Creates a GitHub issue with the `gotcha` label on the main repo. Invoke with `/submit-gotcha` or ask "submit a gotcha".
- **submit-project** (`skills/submit-project.md`) — Register your team's project for the showcase. Creates a GitHub issue with the `project` label. Invoke with `/submit-project` or ask "submit a project".

Both Claude Code and Copilot discover these skills automatically via pointers in `.claude/skills/` and `.github/skills/`.

## MCP Tools Available

If the MCP server is configured, you have access to:

- `get_bingo_status` — Check your team's bingo card progress
- `list_bingo_squares` — List all available bingo squares
- `mark_bingo_square` — Mark a bingo square as completed
- `get_ceremony_status` — Get current ceremony phase, presenting team, timer, and upcoming teams
- `register_voter(name, team)` — Register yourself to your team before voting (required)
- `rate_team(voter, for_team, ratings)` — Submit 5-star ratings (1-5) for the presenting team across all categories
- `cast_tiebreak_vote(voter, vote)` — Cast a pick-one vote during a tiebreaker round
- `get_voting_status` — Alias for get_ceremony_status (backward compatible)
- `get_gotchas` — Get the community-contributed list of AI gotchas

## Challenge Tracks

Teams pick one track to build in:

| Track | What you build |
|-------|---------------|
| **Conference Game** | An interactive game for the EDC conference stand |
| **MCP Server** | A Model Context Protocol server that does something useful |
| **Custom Agent** | A specialised AI agent for a specific task |
| **BYOI** | Bring Your Own Idea — anything goes |

The participant environment (Codespace template) is at [equinor/edc2026-vibe-environment](https://github.com/equinor/edc2026-vibe-environment).

## Security Conventions

These apply to everything you build:

- Never hardcode secrets or API keys — use environment variables
- Sanitise all user input before using it in queries, commands, or HTML
- Minimise dependencies — ask "do we need this package?" before installing
- Run `git diff` before committing — check for accidentally included secrets
- When in doubt, ask the user: "Is any user input used without sanitisation?"

## Working Style

- **Small steps** — one feature at a time, commit after each working change
- **Read before you write** — understand existing code before modifying it
- **Don't over-engineer** — the simplest thing that works is the right answer
- **Don't add extras** — only build what was asked for
- **Ask when uncertain** — a question is better than a wrong assumption
- No build step — use plain HTML/CSS/JS served from `public/` where possible
- Express for backends, SSE for real-time updates, JSON file for persistence

## Reference Docs

- `learning/workflow-card.md` — Full workflow guide
- `learning/tool-comparison.md` — When to use which tool
- `learning/gotchas.md` — Known AI pitfalls (and where to add yours)
- `docs/` — Facilitator and organiser documentation
