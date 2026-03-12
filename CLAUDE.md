# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

Planning and asset repository for the **Learnathon 2026** — a hands-on AI-assisted software engineering event at EDC, March 18, 2026 (~60 participants, ~20 teams).

This repo contains: event planning docs, participant learning materials, facilitator guides, environment configs, agent customization files, challenge templates, and digital products to be built and demoed at the event.

## Directory Structure

```
environments/         Sandbox setup and agent config files
  .devcontainer/      Codespaces devcontainer (copies into template repos)
  tool-configs/       Base agent config files (.claude/, .github/, CLAUDE.md)
  sandbox-setup.md    How to create the GitHub org + spend limits

learning/             Participant-facing learning content
  workflow-card.md    The spec→plan→build→verify→secure→ship loop
  tool-comparison.md  When to use which tool (primary 4 + optional)
  gotchas.md          Community-contributed AI pitfalls deck

docs/                 Facilitator and organiser docs
  facilitator-guide.md  Hour-by-hour run script
  coach-cheatsheet.md   Quick reference for floor coaches
  live-demo-plan.md     Plan for the 8:45 live demo
  tools/              Per-tool getting-started guides

templates/            Starter repos per challenge track
  mini-spec-template.md
  conference-game/
  mcp-server/
  custom-agent/
  byoi/

digital/              Products built by organisers, using the tools
  voting-app/         Live audience voting (built live at 8:45 demo)
  bingo-app/          Interactive bingo card
  mcp-server/         Learnathon MCP server (bingo, teams, gotchas, schedule)
```

## Primary Tools (Supported at Event)

- **GitHub Copilot Enterprise** — VS Code autocomplete + chat (Equinor subscription)
- **GitHub Spark** — natural language → hosted web app (included in Copilot sub)
- **Claude Code** — terminal agentic AI (`claude` command, uses `ANTHROPIC_API_KEY`)
- **OpenCode** — open-source terminal agentic AI (`opencode` command, same key)

Optional tools (Lovable, Bolt, v0, Cursor) are documented in `learning/tool-comparison.md` but not supported.

## Environment

Participants run in GitHub Codespaces inside a dedicated org (`learnathon-edc2026`). The `ANTHROPIC_API_KEY` is injected from an org-level Codespaces secret backed by prepaid Anthropic credits. See `environments/sandbox-setup.md` for full setup.

## Agent Config Files

When working on any template or digital product in this repo:
- Copy `environments/tool-configs/CLAUDE.md` into the project root and fill in the project context
- Copy `environments/tool-configs/.github/copilot-instructions.md` into `.github/`
- The `.claude/settings.json` is pre-deployed to `~/.claude/` by `post-create.sh`

## Content Conventions

- Sections marked `⚠️` are open questions or things not yet decided
- Sections marked `💡` are suggestions needing review
- The workflow (`spec → plan → build → verify → secure → ship`) and security emphasis are the two core themes — keep them consistent across all docs
- The gotchas deck (`learning/gotchas.md`) is designed for community contribution — keep the contribution format at the top
- Timeline reference: Trondheim test run Feb 17–21, materials ready Feb 24, participant comms Mar 10, dry run Mar 16, event Mar 18
