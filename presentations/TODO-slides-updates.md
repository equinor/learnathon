# Slides updates for ceremony overhaul

These changes were prepared but reverted from `vibe-coding.md` to be applied manually later.

## 1. MCP example (line ~223)

Change "Cast a vote" to "Rate a team during the ceremony":

```
Examples at this event:
- Mark a bingo square
- Rate a team during the ceremony
- Search Confluence
- Read from a database
```

## 2. Add "How to use a skill" slide (after line ~240)

After the "Skills in practice" slide, add a new slide:

```markdown
---

### How to use a skill

1. Open Claude Code (terminal or VS Code)
2. Type `/submit-gotcha` or `/submit-project`
3. Answer the questions — Claude gathers the details
4. Review the draft, confirm, done

**No setup needed. Already in your repo.**
```

## 3. Update "Vote + Awards" section (lines ~648-677)

Replace the current section with:

```markdown
## 🗳️ Ceremony + Awards

*14:50 — 16:30*

---

### How voting works

You rated each team **during their presentation** — 5 stars across 6 categories.

Your agent can do this too: `rate_team` via MCP.

*(Can't rate your own team — the system blocks it.)*

---

### And the winners are...

🥇 🎨 🔐 🚨 😂 🤝 🏆

*Revealed one by one — 3rd, 2nd, 1st.*

*Tied? Bingo progress breaks it. Still tied? Compliment battle + audience vote.*
```
