# Claude Code — Getting Started

Claude Code is an agentic AI coding assistant that lives in your terminal. It can read your codebase, plan features, write and edit files, and run commands — all from a conversation.

## Start a Session

```bash
claude
```

That's it. You're now in an interactive session. Describe what you want to do.

## Key Concepts

**It asks before it acts.** In `default` mode (the Learnathon setting), Claude Code will ask your permission before running commands or making file changes. Read each request. Approve what makes sense. Push back on what doesn't.

**It reads your CLAUDE.md.** If there's a `CLAUDE.md` in your project root, Claude Code reads it at the start of every session. This is how you tell it about your project, your conventions, and your rules. Use the template in `environments/tool-configs/CLAUDE.md`.

**It's a conversation.** If it does something wrong, tell it. "That's not what I wanted — undo that and try again with..." is a valid prompt.

## Starting a New Project

```bash
# In your team's repo
cp /workspaces/learnathon/environments/tool-configs/CLAUDE.md ./CLAUDE.md
# Edit CLAUDE.md — fill in your project context
claude
```

First message:
> "Read my CLAUDE.md and my mini-spec (SPEC.md). Propose a simple architecture for what we're building. List the main files and what each will do."

## Useful Prompts

```
# Start with a plan
"Read my spec and propose an architecture. What are the 3 main risks?"

# Build iteratively
"Implement [specific feature] only. Nothing else."

# Stay in scope
"Only change [this file]. Don't touch anything else."

# Security check
"Review this codebase for hardcoded secrets, unsafe user input handling, and packages we can't explain."

# Understand what was written
"Explain what [this function] does, line by line."

# Recover from a bad change
"That broke things. Revert [that change] and take a different approach."
```

## Tips

- **Short, specific prompts beat long ones.** "Add a submit button to the form in `form.html`" is better than "Add form submission functionality."
- **Commit before each new feature.** If the next change breaks things, you can get back easily.
- **When it asks permission, read the request.** That's the learning moment — what is it actually doing?
- **Fresh chat when you're lost.** Long sessions degrade. Start new, paste your context.

## API Key

Claude Code uses the `ANTHROPIC_API_KEY` environment variable. In your Codespace this is set automatically from the org secret. Verify with:

```bash
echo $ANTHROPIC_API_KEY | cut -c1-10  # shows first 10 chars only
```

## Config File

Your settings are at `~/.claude/settings.json`. The Learnathon default is pre-set. See `environments/tool-configs/.claude/settings.json`.
