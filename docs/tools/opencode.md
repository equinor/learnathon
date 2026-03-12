# OpenCode — Getting Started

OpenCode is an open-source terminal-based AI coding assistant made by SST. It does similar things to Claude Code but is provider-agnostic (works with Claude, GPT-4, Gemini, and others) and has a different terminal UI.

GitHub: [sst/opencode](https://github.com/sst/opencode)

## Start a Session

```bash
opencode
```

## How it Differs from Claude Code

| | Claude Code | OpenCode |
|--|--|--|
| Made by | Anthropic | SST (open source) |
| Default model | Claude | Configurable |
| UI | Simple terminal chat | Terminal UI with file panels |
| Config | `~/.claude/settings.json` | `~/.config/opencode/` |

Both use your `ANTHROPIC_API_KEY` when pointed at Claude. In the Learnathon Codespace, that key is already set.

## Why Try It?

- See how a different UI changes your workflow
- Try running the same task in both Claude Code and OpenCode and compare the results
- It's open source — you can see exactly how it works
- "Try a new tool" Bingo square

## API Key

Same as Claude Code — uses `ANTHROPIC_API_KEY` from your environment.

## Troubleshooting

If opencode isn't installed or the install failed:
```bash
curl -fsSL https://opencode.ai/install | bash
```
See the [install docs](https://opencode.ai) or ask a facilitator.
