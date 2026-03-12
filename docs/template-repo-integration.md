# Template Repo Integration

How to connect the participant template repo (`equinor/edc2026-vibe-environment`) with the main learnathon repo (`equinor/learnathon`).

## Current State

**Template repo has:**
- Devcontainer (Node 22, Python 3.12, Claude Code, VS Code plugin)
- TruffleHog pre-commit hook for secret scanning
- `.claude/settings.json` with `apiKeyHelper` for `CLAUDE_KEY`
- `skill-audit` security gate skill
- Sensible `.gitignore`

**Template repo is missing:**
- Event context (AGENTS.md, CLAUDE.md, copilot-instructions.md)
- Submission skills (submit-gotcha, submit-project)
- Challenge track guidance
- Learning material links
- MCP server config (bingo/voting connection)

---

## Decision: API Key Name

The template repo uses `CLAUDE_KEY`. The learnathon repo documents `ANTHROPIC_API_KEY`.

Pick one and align everywhere:

| Option | Pros | Cons |
|--------|------|------|
| `ANTHROPIC_API_KEY` | Standard Claude Code default, no apiKeyHelper needed | Need to update template repo settings.json and README |
| `CLAUDE_KEY` | Already set up in template repo with apiKeyHelper | Non-standard, every doc in learnathon repo references the wrong name |

**Recommendation:** Switch to `ANTHROPIC_API_KEY` — it's the Claude Code default and avoids confusion.

---

## Add to Template Repo (`equinor/edc2026-vibe-environment`)

### Must add

- [ ] **`AGENTS.md`** — copy from `equinor/learnathon/AGENTS.md` (event context, workflow, skills, challenge tracks, security conventions)
- [ ] **`CLAUDE.md`** — copy from `equinor/learnathon/CLAUDE.md` (thin wrapper pointing to AGENTS.md)
- [ ] **`.github/copilot-instructions.md`** — copy from `equinor/learnathon/.github/copilot-instructions.md` (thin Copilot wrapper)
- [ ] **`skills/submit-gotcha.md`** — copy from `equinor/learnathon/skills/submit-gotcha.md`
- [ ] **`skills/submit-project.md`** — copy from `equinor/learnathon/skills/submit-project.md`
- [ ] **`.claude/skills/submit-gotcha/SKILL.md`** — pointer: "Read and follow the instructions in `skills/submit-gotcha.md`."
- [ ] **`.claude/skills/submit-project/SKILL.md`** — pointer: "Read and follow the instructions in `skills/submit-project.md`."
- [ ] **`.github/skills/submit-gotcha/SKILL.md`** — pointer with YAML frontmatter (copy from learnathon repo)
- [ ] **`.github/skills/submit-project/SKILL.md`** — pointer with YAML frontmatter (copy from learnathon repo)
- [ ] **Fix API key name** — if switching to `ANTHROPIC_API_KEY`:
  - Update `.claude/settings.json`: change `apiKeyHelper` to `echo $ANTHROPIC_API_KEY` (or remove it entirely since it's the default)
  - Update `README.md`: change `CLAUDE_KEY` references to `ANTHROPIC_API_KEY`

### Should add

- [ ] **`mini-spec-template.md`** — copy from `equinor/learnathon/templates/mini-spec-template.md` so teams can start speccing immediately
- [ ] **Learning materials links in README** — add links to:
  - Workflow: `https://github.com/equinor/learnathon/blob/main/learning/workflow-card.md`
  - Gotchas: `https://github.com/equinor/learnathon/blob/main/learning/gotchas.md`
  - Tool comparison: `https://github.com/equinor/learnathon/blob/main/learning/tool-comparison.md`
- [ ] **Challenge track overview in README** — short section explaining the 4 tracks (Conference Game, MCP Server, Custom Agent, BYOI) with links to templates in the learnathon repo
- [ ] **MCP server config** — if bingo/voting apps are deployed to Azure, add the server URLs to `.claude/settings.json` under `mcpServers` so participants can use bingo/voting tools

### Nice to have

- [ ] **Install OpenCode** — add to `postCreate.sh` if still a supported tool
- [ ] **`.github/copilot-chat/` extensions** — pre-configure Copilot chat context

---

## Add to Learnathon Repo (`equinor/learnathon`)

### Must update

- [ ] **`environments/sandbox-setup.md`** — reference the template repo (`equinor/edc2026-vibe-environment`) instead of internal `environments/` paths. Update the "Create Team Repos" section to use this template.
- [ ] **`CLAUDE.md` / `AGENTS.md`** — mention that participants start from the template repo, not from the learnathon repo directly
- [ ] **`docs/facilitator-guide.md`** — update onboarding steps to reference the template repo URL
- [ ] **API key name** — if switching to `ANTHROPIC_API_KEY`, confirm all docs already use that name (they do in the learnathon repo)

### Should update

- [ ] **`environments/tool-configs/`** — either remove (since the template repo replaces it) or mark as "reference only, the real config lives in edc2026-vibe-environment"
- [ ] **README.md** — add the template repo URL in the directory structure or environment section

---

## Participant Flow (after integration)

```
1. Go to github.com/equinor/edc2026-vibe-environment
2. Click "Use this template" -> create repo in Equinor Playground
   Name: edc2026-learnathon-[SHORTNAME]
3. Open Codespace on new repo
4. Devcontainer builds: Node, Python, Claude Code, TruffleHog
5. ANTHROPIC_API_KEY injected from Codespaces secret
6. AGENTS.md gives all tools the event context
7. Skills available: /submit-gotcha, /submit-project
8. Start building: read mini-spec-template.md, follow the workflow
```
