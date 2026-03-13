# Sandbox Setup Guide

How to create and manage the isolated GitHub environment for the Learnathon.

## Overview

Each team gets a repo in a dedicated GitHub org. Codespaces run inside that org with pre-set spend limits. Everything is torn down after the event.

```
learnathon-edc2026 (GitHub org)
├── Codespace spend limit: NOK X (set before event)
├── Copilot access: inherited from Equinor org
├── Codespaces secret: ANTHROPIC_API_KEY (prepaid credits key)
├── team-01/  ← fork of a challenge template
├── team-02/
├── ...
└── team-20/
```

## Before the Event

### 1. Create the GitHub Org

1. Create org: `learnathon-edc2026` (or similar)
2. Set **Codespaces spending limit** under Billing → Spending limits
3. Enable Copilot for the org (or confirm Enterprise license covers it)

### 2. Set the Anthropic API Key

In the org settings → Codespaces → Secrets:
- Name: `ANTHROPIC_API_KEY`
- Value: The prepaid credits API key from console.anthropic.com
- Access: All repositories

This key is automatically injected into every Codespace as `$ANTHROPIC_API_KEY`.

> **Spend control**: Set a hard limit on the Anthropic console for the key. Recommended: estimate max usage and set limit at 2×. Monitor during the event.

### 3. Set Up Challenge Template Repos

Each challenge track has a template repo in this repo under `templates/`. Before the event:

```bash
# For each challenge template, create a repo in the org
gh repo create learnathon-edc2026/template-conference-game --template ./templates/conference-game --public
gh repo create learnathon-edc2026/template-mcp-server --template ./templates/mcp-server --public
gh repo create learnathon-edc2026/template-custom-agent --template ./templates/custom-agent --public
gh repo create learnathon-edc2026/template-byoi --template ./templates/byoi --public
```

### 4. Create Team Repos

For 20 teams:

```bash
for i in $(seq -w 1 20); do
  CHALLENGE="byoi"  # or assigned per team
  gh repo fork learnathon-edc2026/template-$CHALLENGE \
    --org learnathon-edc2026 \
    --fork-name "team-$i" \
    --clone=false
done
```

Alternatively: each team forks their chosen template at the start of the day.

### 5. Invite Participants

- Add all 60 participants as members of the org (member role, not owner)
- They get Codespace access automatically

### 6. Participant Pre-Event Setup (Personal Codespaces Secret)

Each participant needs to add the API key as a personal Codespaces secret **before the event day**. Include this in participant comms:

1. Go to [github.com/settings/codespaces](https://github.com/settings/codespaces) (Settings → Codespaces → Secrets)
2. Click **New secret**
3. Name: `ANTHROPIC_API_KEY`
4. Value: *(provided in the event invite email)*
5. Repository access: select `learnathon-edc2026/*` (all repos in the org)

This ensures the key is available in every Codespace they open, even for repos they fork or create themselves.

> **Alternative**: If using an org-level secret (step 2 above), participants do NOT need to set this up individually. Choose one approach — org-level is simpler for the event but requires all repos to be in the org.

## On the Day

- Participants open their team repo and click **Code → Codespaces → New Codespace**
- The `post-create.sh` installs Claude Code + OpenCode and checks for the API key
- Facilitators have admin access to all repos

## After the Event

```bash
# Archive all repos
for repo in $(gh repo list learnathon-edc2026 --json name -q '.[].name'); do
  gh repo archive learnathon-edc2026/$repo --yes
done

# Revoke the Anthropic API key in the Anthropic console
# Delete or suspend the GitHub org
```

## Checklist

- [ ] GitHub org created
- [ ] Codespaces spend limit set
- [ ] `ANTHROPIC_API_KEY` secret added to org
- [ ] Anthropic console spend limit set on the key
- [ ] Template repos created and tested
- [ ] Team repos created (or ready-to-fork)
- [ ] All participants added to org
- [ ] Dry-run: one Codespace opened and tested end-to-end
- [ ] Post-event teardown steps agreed
