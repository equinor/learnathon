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

Run this from the voting app admin panel (`/admin.html`). The panel tells you what to do next at every step — follow the coloured guidance banner at the top.

**Before 15:45 (during the break at 14:00):**
1. Open `admin.html` on your laptop → log in with the admin token
2. Open `screen.html` on the projector (full screen, browser in presentation mode)
3. Enter all team names in the Team Setup section → click **Save Teams**
4. Do a quick test: click **Next Category**, **Open Voting**, vote on your phone, **Close Voting**, **Reveal Results** — then **Reset All** to clear it before the real thing

**Running the ceremony (6 rounds, ~4 min each):**

| Step | You do | Participants see |
|------|--------|-----------------|
| 1 | Click **▶ Next Category** | Category name appears on screen |
| 2 | Announce the category out loud — build suspense | Screen shows category, no votes yet |
| 3 | Click **🔓 Open Voting** | Vote URL appears on screen + their phones show team buttons |
| 4 | Wait 60–90 seconds, watch votes come in on admin panel | Phones show live "voting open" state |
| 5 | Click **🔒 Close Voting** | Phones show "watch the screen for results" |
| 6 | Pause for drama… then click **✨ Reveal Results** | Bar chart appears, winner highlighted in gold |
| 7 | Announce the winner! Give the team a moment. | Winner's bar glows gold |
| 8 | Repeat from step 1 for the next category | — |

**After all 6 categories:** Click nothing — just announce winners, hand out stickers.

**If something goes wrong:**
- App not loading on phones → read the URL off the screen slowly, check wifi
- Wrong team name → it's fine, fix it after the event
- Accidentally reset → votes are gone, do a quick show of hands instead

---

### How to Run the Ceremony Well

The app handles the mechanics. Your job is the energy. Here's how to make it feel like a gameshow rather than a meeting.

#### Category order (matters more than you'd think)

Run them in this order:

| # | Category | Why here |
|---|----------|---------|
| 1 | 🥇 Best Creation | Concrete, visual — easy for everyone to vote on. Warm-up round. |
| 2 | 🎨 Most Creative AI Use | Gets more interesting. Teams start to engage. |
| 3 | 🔐 Best Safety Practice | The serious one. Give it its own moment mid-ceremony. |
| 4 | 🚨 Best Risk Catch | Natural follow-on from security. Still thoughtful. |
| 5 | 😂 Best Fail Story | Comic relief after two serious categories. Energy picks back up. |
| 6 | 🤝 People's Choice | The finale. Broadest category, most votes, most drama. Save the best for last. |

#### The script for each round (~4 minutes)

**Step 1 — Introduce the category (30 sec)**
Don't just read the name. Say what it means and why it matters.

> *"Best Safety Practice goes to the team that stopped, looked at what the AI built, and asked the hard security questions. Not because they had to — because they understood why it matters."*

**Step 2 — Name nominees (30–60 sec)** *(optional but highly recommended)*
During Show & Tell, coaches should be quietly flagging 2–3 standout teams per category. Before opening voting, name them. People vote more thoughtfully when they're reminded of specific moments.

> *"I want to call out three teams who stood out for this one: Team Rocket caught a hardcoded API key before it shipped. Team Copilot ran the security prompt on their whole codebase at lunch. Team Vibe found a prompt injection risk in their own app. Three great examples — but you're voting, not me."*

If you don't have nominees ready, skip this — don't make it up.

**Step 3 — Open voting (60–90 sec)**
Click **Open Voting**. The URL appears on screen. Say:

> *"Phones out — you've got 60 seconds. Vote for the team you think earned it."*

Watch the admin panel. Call out the action:
> *"Votes coming in... it's close... ten seconds..."*

**Step 4 — The reveal (30–60 sec)**
Click **Close Voting**. Pause. Let the silence sit for 3–5 seconds. Then:

> *"And the winner of Best Safety Practice is..."*

Click **Reveal Results**. Let the bars animate. The winner highlights gold. Pause again — let the room react before you say the name.

**Step 5 — The winner's moment (30 sec)**
Don't rush past it. Say one thing about *why* they won — reference the specific moment from their demo. Give them 10 seconds of applause. If they're nearby, make eye contact or gesture to them.

#### Fairness

- **Recency bias is real.** Teams that demoed last are more memorable. The nominees step counteracts this by reminding the room of earlier teams.
- **If one team is sweeping.** After they win their second category, gently say: *"If you've already voted for this team today, maybe give someone else a moment."* It's an honour system — that's fine.
- **Ties.** Award it to both. More generous, more fun, more stickers. If you want drama: *"We have a tie! 30-second tiebreaker!"* — your call.
- **People's Choice last.** It's the fairest category because the audience has seen all 20 demos by then. It's also the most democratic — no nominees, no coaching. Pure crowd vote.

#### Ending it

After People's Choice, don't rush to wrap up. Let it breathe. Then:

> *"Six categories. Six teams who did something worth celebrating today. But honestly — every team in this room built something real, learned something real, and shared it. That's the whole point. Thank you."*

Hand out stickers. Take a photo. Remind people about the retrospective on March 25.

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
| Voting app crashes mid-ceremony | Restart server — state reloads from file. Refresh admin + screen. |
| Voting app not reachable on phones | Check everyone is on the same wifi; read URL from screen slowly |
