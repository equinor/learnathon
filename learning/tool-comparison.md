# Tool Comparison

Which tool for what job? Here's the quick guide.

## Primary Tools

These are available in your Codespace and supported by facilitators.

| | GitHub Copilot | GitHub Spark | Claude Code | OpenCode |
|--|--|--|--|--|
| **Interface** | VS Code editor | Browser | Terminal (in Codespace) | Terminal (in Codespace) |
| **Mode** | Autocomplete + Chat | Natural language → app | Autonomous agent | Autonomous agent |
| **Manages files** | Suggests only — you apply | Yes (in Spark's environment) | Yes (in your repo) | Yes (in your repo) |
| **Runs commands** | No | No | Yes (asks permission) | Yes (asks permission) |
| **Deployable output** | Your code | Live Spark URL | Your code | Your code |
| **Auth** | GitHub Copilot subscription | GitHub Copilot subscription | Anthropic API key | Anthropic API key |
| **Best for** | Writing code with guidance | Rapid web app prototypes | Multi-step autonomous tasks | Multi-step tasks, exploring models |

### When to reach for which tool

**GitHub Copilot** when you're in VS Code writing code and want inline suggestions, tab-completions, or a chat conversation about the code in front of you. Best for developers who want to stay in control and use AI as a co-pilot (as the name suggests).

**GitHub Spark** when you want a running web app *from a description*, fast, with no deployment friction. Great for quick UIs, interactive demos, simple tools. The output lives in Spark's environment — you can share a URL immediately.

**Claude Code** when you want an agent to *do things*: read your codebase, plan an architecture, write multiple files, run tests, refactor across the whole project. It works in your Codespace terminal. It asks before running commands (`default` mode) so you stay in the loop.

**OpenCode** when you want the same autonomous-agent experience as Claude Code but want to experiment with how different models or providers handle the same task. Also useful if you prefer its terminal UI or want to compare outputs side by side.

### Using them together

They complement each other well:
- Use **Spark** to quickly prototype a UI → export the code → continue in Claude Code
- Use **Copilot Chat** to understand code that Claude Code wrote
- Use **OpenCode** vs **Claude Code** on the same task to compare approaches

---

## Optional Tools

Not set up in the Codespace, but available on the web. Try them if you're curious — bring your own account or use a free tier.

| Tool | What it does | Access |
|------|-------------|--------|
| **Lovable** (lovable.dev) | Full-stack app generator with Supabase backend, design-forward | Free tier available |
| **Bolt.new** | Frontend-heavy apps in a browser sandbox — instant preview, no install | Free tier available |
| **v0 by Vercel** | React/Next.js UI generation from descriptions | Free tier available |
| **Cursor** | AI-first code editor (like VS Code but with deeper AI integration) | Requires local install |

> These are not supported by facilitators during the event, but they're fair game for the "Try a new tool" Bingo square.

---

## MCP Tools

**Model Context Protocol (MCP)** lets AI agents call external tools — like giving your assistant hands to interact with the world.

Your Codespace comes with a pre-configured MCP server that connects to the event infrastructure. If it's set up, your agent can:

- Check and mark squares on your team's **bingo card**
- Check voting status and **cast votes** during the ceremony
- Read the community **gotchas** list

You don't need to configure anything — just ask your agent (e.g. "mark the MCP bingo square" or "what's on our bingo card?").

The **MCP Server challenge track** is about building your *own* MCP server that does something useful. Your event MCP server is a working example of the pattern.

---

## OpenCode vs Claude Code — Closer Look

Both are terminal-based autonomous agents. The differences:

| | Claude Code | OpenCode |
|--|--|--|
| **Made by** | Anthropic | SST (open source) |
| **Model** | Claude (Anthropic) | Configurable — Claude, GPT-4, Gemini, etc. |
| **Install** | `npm install -g @anthropic-ai/claude-code` | `curl -fsSL https://opencode.ai/install \| bash` |
| **Config** | `~/.claude/settings.json` + `CLAUDE.md` in project | `~/.config/opencode/` |
| **UI** | Terminal, simple | Terminal UI with panels |
| **Open source** | No | Yes |

Both use your `ANTHROPIC_API_KEY` if you point them at Claude.
