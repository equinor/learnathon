# GitHub Copilot — Getting Started

GitHub Copilot is already enabled in your Codespace via the VS Code extension. It works in two modes: **autocomplete** (suggestions as you type) and **Copilot Chat** (conversation in the sidebar).

## Autocomplete

Just start typing. Copilot suggests completions — press `Tab` to accept, `Esc` to dismiss.

## Copilot Chat

Open with `Ctrl+Alt+I` (or click the Copilot icon in the sidebar).

Useful commands in chat:

```
@workspace — asks Copilot about your entire codebase
@terminal — asks about your terminal output
/explain — explain selected code
/fix — suggest a fix for selected code or an error
/tests — generate tests for selected code
/doc — generate documentation
```

## Agent Mode (Copilot Edits)

In VS Code: open Copilot Chat → switch to **Edit** mode. This lets Copilot make changes across multiple files at once, similar to Claude Code but inside the editor.

Open with `Ctrl+Shift+I`.

## Custom Instructions

Create `.github/copilot-instructions.md` in your project to give Copilot context about your project. Use the template in `environments/tool-configs/.github/copilot-instructions.md`.

## Auth

Uses your GitHub Copilot Enterprise subscription — no additional API keys needed. You're signed in via your GitHub account in VS Code.

## Tips

- Use `@workspace` in chat to ask questions about the whole project
- Copilot Chat is great for explaining code that an agent (Claude Code/OpenCode) wrote
- The inline suggestions are best for writing new code; chat is better for understanding and reviewing
