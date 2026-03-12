# GitHub Copilot Instructions

This file is read by GitHub Copilot Chat as project context.
Copy into `.github/copilot-instructions.md` in your project and fill in the sections below.

---

## Project

**Challenge:** [FILL IN: Conference Stand Game / MCP Server / Custom Agent / BYOI]
**Goal:** [FILL IN: What are we building?]
**Tech stack:** [FILL IN: e.g. TypeScript, Node, React]

## Conventions

- [FILL IN: e.g. "Use named exports, not default exports"]
- [FILL IN: e.g. "All async functions should handle errors explicitly"]
- Keep code simple and readable — this is a one-day prototype

## Security Principles

- No hardcoded secrets or API keys — use environment variables
- Sanitise all user input before rendering or storing it
- Prefer well-known, widely-used packages over obscure ones
- If you suggest installing a new dependency, explain what it does

## Context

We are at a hackathon. The goal is a working demo by 14:00. Favour:
- Simplicity over completeness
- Working code over perfect code
- Clear code over clever code

## Out of Scope

Don't suggest:
- Authentication systems (unless that's the project)
- Database migrations, production deployment configs
- Complex testing infrastructure
