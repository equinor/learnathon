# Copilot Instructions — Learnathon 2026

Read `AGENTS.md` in the repository root for full context: event info, workflow, security conventions, and working style.

## Copilot-Specific Notes

- When suggesting code, follow the security conventions in `AGENTS.md` — especially input sanitisation and no hardcoded secrets.
- Prefer simple, readable code over clever abstractions.
- Use plain HTML/CSS/JS for frontend code unless the project specifically requires a framework.
- When the user asks about submitting a gotcha or project, point them to the skills described in `AGENTS.md` (they can use Claude Code's `/submit-gotcha` and `/submit-project`, or run the `gh issue create` commands manually).
