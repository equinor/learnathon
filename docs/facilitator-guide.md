# Facilitator Guide

**Event:** Learnathon 2026 — EDC, March 18
**Format:** Full day, 8:00–16:30, ~60 participants, ~20 teams of 3
**Facilitators needed:** ~5–6 (1 lead + 4–5 coaches on the floor)

---

## The Day at a Glance

| Time | Phase | Lead |
|------|-------|------|
| 8:00 | Welcome, team formation, Codespace setup check | Lead |
| 8:45 | Learn: Toolbox + Live Demo | Lead (demo) |
| 9:45 | Lab 1: Mini-spec + Plan | Coaches on floor |
| 10:30 | Lab 2: Build Sprint 1 | Coaches on floor |
| 11:50 | Lunch | — |
| 12:35 | Security Pulse (15 min) | Lead (brief) |
| 12:50 | Lab 3: Build Sprint 2 | Coaches on floor |
| 14:30 | Break — prep for demos | — |
| 14:50 | Ceremony: Show & Tell + Awards | Lead (MC) |
| 16:30 | Done | — |

---

## Phase-by-Phase Script

### 8:00 — Welcome & Setup (45 min)

**Goal:** Everyone in a team, Codespace open, no one left behind.

Say something like:
> "Welcome to Learnathon 2026. Today you're going to build something real using AI-assisted tools — and then tell us what you learned. The demos at the end matter less than the story you tell about what surprised you."

**Actions:**
- Display team list / pairing help on screen
- Walk through: open your team repo → Code → New Codespace → wait for setup
- Verify: everyone can see `claude --version` in terminal
- Common issues: Codespace slow to start (wait), API key not set (check Codespaces secrets)

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

### 10:30 — Lab 2: Build Sprint 1 (80 min, to lunch)

**Goal:** First working version of something, committed.

Coaches: walk the room every 15–20 minutes. Check in on:
- Is the team committing regularly? (If not: "Commit now, even if it's rough.")
- Is anyone stuck and not asking for help? (Make yourself available)
- Is any team going off-track from their spec?

At 11:35: announce "15 minutes to lunch — commit what you have."

---

### 12:35 — Security Pulse (15 min)

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

### 12:50 — Lab 3: Build Sprint 2 (100 min)

**Goal:** Polish, fix, prepare the demo. Scope *down* if needed.

At 13:45: announce "45 minutes left in the sprint — finish features, start preparing your story."
At 14:15: announce "Wrap up features. Spend last 15 min preparing what you'll say."

**Preparing for the ceremony:**
- What will you demo?
- What surprised you?
- What technique worked / didn't work?
- What would you do differently?

---

### 14:50 — Ceremony: Show & Tell + Awards (100 min)

Run this from the voting app admin panel (`/admin.html`). The panel tells you what to do next at every step — follow the coloured guidance banner at the top.

**Key design:** Teams present one at a time (~2.5 min each). After each presentation, participants rate that team on all 6 categories using 5-star ratings. Self-vote blocking prevents teams from rating themselves. After all teams have presented, winners are revealed one category at a time in a dramatic staggered sequence.

20 teams × ~2.5 min = ~50 min presentations + ~40 min awards reveal + buffer.

**Before the ceremony (during the break at 14:30):**
1. Open `admin.html` on your laptop → log in with the admin token
2. Enter all team names in the Team Setup section → click **Save Teams**
3. Set the presentation queue order
4. Do a quick test: advance through a couple of phases, check ratings work on a phone → **Reset All** to clear before the real thing

**Running the ceremony:**

The ceremony follows a phase-based state machine: idle → queue → setup → presenting → voting → reveal → (tiebreaker if needed) → done.

| Phase | You do | Participants see | Time |
|-------|--------|-----------------|------|
| **Queue** | Set team order and start the ceremony | Upcoming team list | — |
| **Presenting** | Advance to next team. Team presents pecha-kucha style. | Current team name + timer (~2.5 min) | ~2.5 min |
| **Voting** | After the presentation, open voting for that team | 5-star rating sliders for all 6 categories (self-vote blocked) | ~1 min |
| | Repeat presenting → voting for each team | — | — |
| **Reveal** | Build suspense. Reveal winners one category at a time. | Staggered finalist animation, winner highlighted | — |
| **Reveal 1** | Click **Reveal Next** | Best Fail Story results | ~2 min |
| **Reveal 2** | Click **Reveal Next** | Best Risk Catch results | ~2 min |
| **Reveal 3** | Click **Reveal Next** | Best Safety Practice results | ~2 min |
| **Reveal 4** | Click **Reveal Next** | Most Creative AI Use results | ~2 min |
| **Reveal 5** | Click **Reveal Next** | Best Creation results | ~2 min |
| **Reveal 6** | Click **Reveal Next** | People's Choice results | ~2 min |
| **Reveal 7** | Click **Reveal Next** | Overall Winner (aggregate of all categories) | ~2 min |

**Tiebreakers:** If two teams are tied for a category, the app triggers a multi-stage tiebreaker: bingo card check → compliment battle → audience pick-one vote → accept tie. Follow the admin panel prompts.

**After all 7 reveals:** Announce winners, hand out stickers.

**If something goes wrong:**
- App not loading on phones → read the URL off the screen slowly, check wifi
- Wrong team name → it's fine, fix it after the event
- Accidentally reset → votes are gone, do a quick show of hands instead

---

### How to Run the Ceremony Well

The app handles the mechanics. Your job is the energy. Here's how to make it feel like a gameshow rather than a meeting.

#### Category order (matters more than you'd think)

Run them in this order (the app enforces this automatically):

| # | Category | Why here |
|---|----------|---------|
| 1 | 😂 Best Fail Story | Light opener — gets laughs and lowers the stakes. |
| 2 | 🚨 Best Risk Catch | Natural follow-on. Still accessible. |
| 3 | 🔐 Best Safety Practice | The serious one. Give it its own moment mid-ceremony. |
| 4 | 🎨 Most Creative AI Use | Gets more interesting. Energy building. |
| 5 | 🥇 Best Creation | The big technical award. High stakes. |
| 6 | 🤝 People's Choice | The crowd favourite. Broadest category, most drama. |
| 7 | 🏆 Overall Winner | Aggregate of all categories. The grand finale. |

#### The script for each presentation (~4 minutes)

**Step 1 — Introduce the team (15 sec)**
Call the team up. Set the stage briefly.

> *"Next up — Team Rocket. Let's see what they built."*

**Step 2 — Team presents (~2.5 min)**
The timer runs automatically. Let the team demo and share learnings pecha-kucha style.

**Step 3 — Open rating (60 sec)**
After the presentation, advance to the voting phase. Say:

> *"Phones out — rate this team across all 6 categories. You've got 60 seconds. Remember, 1 to 5 stars."*

Watch the admin panel for rating progress. Self-votes are blocked automatically.

**Step 4 — Move to next team**
Repeat steps 1–3 for each team.

#### The script for each reveal (~2 minutes)

**Step 1 — Introduce the category (30 sec)**
Don't just read the name. Say what it means and why it matters.

> *"Best Safety Practice goes to the team that stopped, looked at what the AI built, and asked the hard security questions. Not because they had to — because they understood why it matters."*

**Step 2 — The reveal (30–60 sec)**
Click **Reveal Next**. Pause. Let the silence sit for 3–5 seconds. Then:

> *"And the winner of Best Safety Practice is..."*

Let the finalist animation play. The winner highlights gold. Pause again — let the room react before you say the name.

**Step 3 — The winner's moment (30 sec)**
Don't rush past it. Say one thing about *why* they won — reference the specific moment from their demo. Give them 10 seconds of applause. If they're nearby, make eye contact or gesture to them.

**Step 4 — Handle tiebreakers (if prompted)**
The app will guide you through multi-stage tiebreakers: bingo check, compliment battle, audience vote, or accept tie. Follow the admin panel.

#### Fairness

- **Recency bias is real.** Teams that demoed last are more memorable. The nominees step counteracts this by reminding the room of earlier teams.
- **If one team is sweeping.** After they win their second category, gently say: *"If you've already voted for this team today, maybe give someone else a moment."* It's an honour system — that's fine.
- **Ties.** The app handles tiebreakers automatically with a multi-stage process: bingo card check → compliment battle → audience pick-one vote → accept tie. Follow the admin panel prompts.
- **People's Choice last.** It's the fairest category because the audience has seen all 20 demos by then. It's also the most democratic — no nominees, no coaching. Pure crowd vote.

#### Ending it

After People's Choice, don't rush to wrap up. Let it breathe. Then:

> *"Seven awards. Seven teams who did something worth celebrating today. But honestly — every team in this room built something real, learned something real, and shared it. That's the whole point. Thank you."*

Hand out swag. Take a photo. Remind people about the retrospective on March 25.

---

## Swag Checklist

Order/print these before the event. Bring them in a bag to the ceremony.

- [ ] Learnathon 2026 sticker — all participants
- [ ] Legend sticker — bingo full card completions
- [ ] Winner sticker — category winners
- [ ] Custom keycap — category winners
- [ ] Custom socks — category winners

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
| Voting app crashes mid-ceremony | Restart server — state reloads from file. Refresh admin page. |
| Voting app not reachable on phones | Check everyone is on the same wifi; read URL from screen slowly |
