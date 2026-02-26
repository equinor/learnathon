#!/bin/bash
set -e

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║         Learnathon 2026 — Setting up your env        ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# --- Claude Code ---
echo "→ Installing Claude Code..."
npm install -g @anthropic-ai/claude-code
echo "  ✓ claude installed ($(claude --version 2>/dev/null || echo 'version check failed'))"

# --- OpenCode ---
# OpenCode: open-source terminal AI coding assistant (sst/opencode)
# Install via the official installer
echo "→ Installing OpenCode..."
if curl -fsSL https://opencode.ai/install | bash 2>/dev/null; then
  echo "  ✓ opencode installed"
else
  echo "  ⚠ OpenCode install failed — try manually: curl -fsSL https://opencode.ai/install | bash"
  echo "    See: https://github.com/sst/opencode"
fi

# --- Claude Code base config ---
echo "→ Configuring Claude Code..."
mkdir -p ~/.claude
# Only write default settings if none exist (don't overwrite participant customisations)
if [ ! -f ~/.claude/settings.json ]; then
  cat > ~/.claude/settings.json << 'EOF'
{
  "permissions": {
    "defaultMode": "default",
    "deny": [
      "Bash(rm -rf /)",
      "Bash(sudo rm -rf*)",
      "Bash(:(){ :|:& };:*)"
    ]
  }
}
EOF
  echo "  ✓ ~/.claude/settings.json written"
else
  echo "  ✓ ~/.claude/settings.json already exists, skipping"
fi

# --- Check API key ---
echo ""
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "⚠  ANTHROPIC_API_KEY is not set."
  echo "   Set it as a Codespaces secret named ANTHROPIC_API_KEY."
  echo "   See: https://docs.github.com/en/codespaces/managing-your-codespaces/managing-secrets-for-your-codespaces"
else
  echo "✓  ANTHROPIC_API_KEY is set — Claude Code and OpenCode are ready."
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  Setup complete! Available commands:                 ║"
echo "║    claude     — Claude Code (agentic AI coding)      ║"
echo "║    opencode   — OpenCode (multi-provider AI coding)  ║"
echo "║                                                      ║"
echo "║  Both tools use your ANTHROPIC_API_KEY.              ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
