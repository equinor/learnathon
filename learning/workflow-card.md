# The Learnathon Workflow

> **spec → plan → build → verify → secure → ship**

Security is not the last step. It lives inside every step.

---

## 1. SPEC (5–10 min)

Write 5 sentences — no more.

| Answer | Example |
|--------|---------|
| **What** | A browser-based quiz game for the conference stand |
| **Who** | Visitors at the EDC booth, no login required |
| **Why** | Engage people with AI trivia, showcase Learnathon energy |
| **Scope** | Single-player, 5 questions, score at the end. That's it. |
| **Done when** | It runs in a browser and looks good enough to show someone |

**Security question to ask at spec time:**
*"What data does this touch? Does it store anything? Does it talk to the internet?"*

Use `templates/mini-spec-template.md` to fill this in.

---

## 2. PLAN (ask your agent)

Give your agent the spec and ask:

> "Read my spec and propose an architecture. List the main files you'll create and what each does. What are the top 3 risks or things that could go wrong?"

**Before you say yes:**
- Read the plan. Does it match what you asked for?
- Is it simpler than expected? (Good.) More complex? (Push back.)
- Does it want to install packages? Ask why each one is needed.

**Security question to ask at plan time:**
*"Does this plan introduce any user input handling, external calls, or file system access? How will those be handled safely?"*

---

## 3. BUILD (short sprints)

- Work in **small steps** — one feature at a time
- **Commit after each working change**, even if it's tiny
- **Read the code** before you commit it — you're responsible for what's in your repo
- If the agent runs a command you didn't expect, ask why before continuing

**Signs to slow down:**
- The agent is making changes outside the project folder
- It's installing something you haven't heard of
- It's been going for 10+ minutes without asking you anything
- The code is getting complicated fast

**Security check every commit:**
Quick scan: `git diff` — any hardcoded strings that look like keys or passwords?

---

## 4. VERIFY (continuously)

Run it. Then ask yourself:

- Does it do what the spec said it should?
- Did anything happen that you didn't ask for?
- Ask your agent: *"What could go wrong with this? What edge cases haven't we handled?"*

This is also where you catch hallucinations — libraries that don't exist, APIs that work differently than described, logic that sounds right but isn't.

---

## 5. SECURE (pulse check — 15 min at lunch)

Not a full audit. A quick honest look. Use this prompt:

> "Review this codebase for the following: (1) any hardcoded secrets or API keys, (2) user input that isn't sanitised before use, (3) packages installed that we don't need or can't explain, (4) anything that calls an external service we didn't intend."

Then fix what you find before the final sprint.

> **On timing:** If the security pulse eats into build time, that's okay — it's the point. A smaller working demo with clean code beats a bigger broken one.

---

## 6. SHIP (demo time)

You have 5 minutes. Structure it:

| | What to say |
|-|------------|
| **2 min** | Show what you built (live demo if possible) |
| **2 min** | Share what you learned — what surprised you, what worked, what broke |
| **1 min** | Q&A |

**The best demos show something real, even if incomplete.**
"We got halfway there and learned why it's hard" is a great demo.

---

## Quick Reminders

| | |
|-|-|
| Agent going in circles? | Start a new chat. Paste a fresh context summary. |
| Got something that works? | Commit it now before continuing. |
| Confused by the code? | Ask the agent to explain it. If it can't, that's a red flag. |
| Feeling behind? | Scope down. One thing that works > five things half-done. |
