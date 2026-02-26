# CLAUDE.md

This file is read by Claude Code at the start of every session.
Copy this file into the root of your project and customise the sections below.

---

## Project Context

**Event:** Learnathon 2026 — EDC, March 18
**Challenge:** [FILL IN: Conference Stand Game / MCP Server / Custom Agent / BYOI]
**Team:** [FILL IN: Team name or number]
**Goal:** [FILL IN: One sentence — what are we building and why?]

## What We're Building

[FILL IN: 3–5 sentences. What does it do? Who uses it? What does "done" look like for today?]

Example:
> We're building an interactive quiz game for the EDC conference stand. Visitors answer AI trivia questions and get a score. It runs in a browser, requires no login, and must be demoable by 14:00.

## Tech Stack

[FILL IN when decided — e.g. "TypeScript, Node.js, plain HTML/CSS frontend"]

## Working Style

- Make small, focused changes. Commit after each working step.
- Before running a command that installs packages or modifies files outside this project, tell me what you're about to do and why.
- When you're unsure about a direction, ask. Don't assume.
- Prefer simple solutions over clever ones. This is a demo, not production.

## Security — Always Check

Before committing anything, check:
- No secrets, API keys, or tokens hardcoded in files
- No `eval()`, no SQL string concatenation, no unsanitised user input rendered as HTML
- If this project accepts user input: treat all input as untrusted

## What NOT to Do

- Don't install global packages without asking
- Don't make network requests to external services without checking with the team
- Don't add features beyond what's in the spec — we have limited time
