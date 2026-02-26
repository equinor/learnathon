# Facilitator Guide

**Event:** Learnathon 2026 — EDC, March 18
**Format:** Full day, 8:15–16:15, ~60 participants, ~20 teams of 3
**Facilitators needed:** ~5–6 (1 lead + 4–5 coaches on the floor)

---

## The Day at a Glance

| Time | Phase | Lead |
|------|-------|------|
| 8:15 | Welcome, team formation, Codespace setup check | Lead |
| 8:45 | Learn: Toolbox + Live Demo | Lead (demo) |
| 9:30 | Coffee break | — |
| 9:45 | Lab 1: Mini-spec + Plan | Coaches on floor |
| 10:30 | Lab 2: Build Sprint 1 | Coaches on floor |
| 12:00 | Lunch | — |
| 12:30 | Security Pulse (15 min) | Lead (brief) |
| 12:45 | Lab 3: Build Sprint 2 | Coaches on floor |
| 14:00 | Break — prep for demos | — |
| 14:15 | Show & Tell | Lead (MC) |
| 15:45 | Vote + Awards | Lead |
| 16:15 | Done | — |

---

## Phase-by-Phase Script

### 8:15 — Welcome & Setup (30 min)

**Goal:** Everyone in a team, Codespace open, no one left behind.

Say something like:
> "Welcome to Learnathon 2026. Today you're going to build something real using AI-assisted tools — and then tell us what you learned. The demos at the end matter less than the story you tell about what surprised you."

**Actions:**
- Display team list / pairing help on screen
- Walk through: open your team repo → Code → New Codespace → wait for setup
- Verify: everyone can see `claude --version` in terminal
- Common issues: Codespace slow to start (wait), API key not set (see sandbox-setup.md)

---

### 8:45 — Learn: Toolbox + Live Demo (45 min)

**Goal:** Participants understand the tools and see the full workflow in action.

Structure:
1. **Toolbox overview** (10 min) — what each tool does, when to use it (use `learning/tool-comparison.md` as your talking points)
2. **Live demo** (25 min) — build something small in real time using the full `spec → plan → build → verify → secure → ship` loop. Narrate your thinking. Show the ugly parts.
3. **Methods + Bingo** (10 min) — walk through the bingo card, explain each technique

> See `docs/live-demo-plan.md` for the planned live demo script and what to build.

**Key thing to emphasise:**
> "Read the code before you commit it. You're responsible for what goes into your repo, even if an AI wrote it."

---

### 9:45 — Lab 1: Mini-spec + Plan (45 min)

**Goal:** Every team has a written mini-spec and an AI-generated plan they've reviewed and agreed on.

**Prompt teams to use:** `templates/mini-spec-template.md`

Coaches: walk the room. Ask every team: *"What are you building? What does done look like today?"*
If a team is vague → sit with them and help them write the spec.
If a team is overambitious → help them cut scope.

**Lab 1 is done when:**
- The mini-spec is written and committed
- The team has asked their agent to plan, read the plan, and pushed back or approved
- The team knows what they're building first

---

### 10:30 — Lab 2: Build Sprint 1 (90 min, to lunch)

**Goal:** First working version of something, committed.

Coaches: walk the room every 15–20 minutes. Check in on:
- Is the team committing regularly? (If not: "Commit now, even if it's rough.")
- Is anyone stuck and not asking for help? (Make yourself available)
- Is any team going off-track from their spec?

At 11:45: announce "15 minutes to lunch — commit what you have."

---

### 12:30 — Security Pulse (15 min)

**Not a full audit — a quick honest check.**

Lead says:
> "Take 5 minutes and run this prompt on your codebase..."

Display on screen:
```
Review this codebase for: (1) hardcoded secrets or API keys, (2) user input used without sanitisation, (3) packages installed that we can't explain, (4) any calls to external services we didn't intend.
```

> "Fix anything you find before the afternoon sprint. If you find something interesting — good or bad — that's a Bingo square and a demo story."

This is a **15-minute** phase. Keep it tight. Don't let it run into Lab 3.

---

### 12:45 — Lab 3: Build Sprint 2 (75 min)

**Goal:** Polish, fix, prepare the demo. Scope *down* if needed.

At 13:30: announce "45 minutes to demo time."
At 13:45: announce "Wrap up features. Spend last 15 min preparing what you'll say."

**Preparing for Show & Tell:**
- What will you demo?
- What surprised you?
- What technique worked / didn't work?
- What would you do differently?

---

### 14:15 — Show & Tell (90 min)

**Format per team: 5 min**
- 2 min: demo
- 2 min: learnings
- 1 min: Q&A

MC role:
- Keep time visibly (timer on screen)
- After each team: brief audience reaction ("anyone else hit that same problem?")
- Celebrate honest failure as much as polished demos
- If a demo breaks live: "That's a Learnathon moment — what happened?"

Rough schedule for 20 teams × 5 min = 100 min. You have 90 min — keep it moving.

---

### 15:45 — Vote + Awards (30 min)

**Voting:** Participants vote using the [digital voting app] (link TBD) or paper ballots.

Categories:
- Best Creation
- Most Creative AI Use
- Best Safety Practice
- Best Risk Catch
- People's Choice
- Best Fail Story

Announce winners. Give out stickers. Remind people about the blog post / follow-up.

---

## Facilitator Principles

1. **Your job is to unblock, not to build.** Help teams get unstuck, not do it for them.
2. **Celebrate the learning, not just the polish.** A team that built half and learned a lot is better than a team that copied a tutorial.
3. **Time is the enemy.** The schedule will slip. Keep announcing time remaining in each phase.
4. **Watch for: the team that's silent.** Teams not asking for help are often the most stuck.
5. **The security pulse matters.** Don't skip it even if time is tight — it's the point.

---

## If Things Go Wrong

| Problem | Response |
|---------|----------|
| Codespace won't start | Try a new Codespace; check org membership |
| API key not working | Check Codespaces secret is set at org level; verify key in Anthropic console |
| Team has no idea what to build | Mini-spec template + 3 questions: who, what, done-when |
| Team's agent is looping | Fresh chat, paste context summary |
| Build sprint running way over | "Commit what you have, we're moving on" |
| Team's demo is broken | Demo the code, not the running app — "here's what it should do" |
