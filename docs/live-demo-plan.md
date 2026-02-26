# Live Demo Plan

The 25-minute live demo at 8:45 is the most important teaching moment of the day.

The goal: show the full `spec → plan → build → verify → secure` loop on something *real*, narrating your thinking the whole way. It should feel honest — not rehearsed perfection.

---

## What to Build (Options — Pick One)

The demo project should be:
- **Simple enough** to reach a working state in 20 minutes live
- **Interesting enough** to be worth watching
- **Relevant** — ideally something that will actually be used at the event

### Option A: The Voting App (Recommended)
Build the live voting app that participants will use at 15:45.

Why this works:
- It's genuinely useful (they'll use it in 6 hours)
- It's scoped perfectly (no auth, no database needed, just a simple form + vote counter)
- You can build it using Spark (fast UI) or Claude Code (if you want to show terminal workflow)
- The security pulse is natural — it takes user input

Mini-spec for the demo:
> A simple voting page where participants vote on one of 6 award categories by clicking a button. No login. Shows live vote counts. Admin can reset votes. Must work on mobile. Done when it runs and anyone can vote.

### Option B: The Bingo App
Build the interactive bingo card app.
- More complex than Option A — risky for 20 minutes live
- But very visual and fun to watch

### Option C: Something Participants Will Build
Pick one of the challenge tracks and build a tiny version of it.
- Makes it directly relevant to their work
- Risk: might anchor teams to your specific approach

---

## Demo Script (Voting App, ~25 min)

### Step 1 — Write the spec out loud (2 min)
Type the mini-spec in a file (`SPEC.md`) while narrating:
> "First I write what I'm building. Just 5 sentences. Who, what, why, scope, done-when. I'm not asking the AI anything yet."

### Step 2 — Open your agent and ask for a plan (3 min)
In terminal / Spark:
> "Read my spec. Propose a simple architecture. What files will you create? What are the risks?"

Read the plan out loud. Ask one pushback question:
> "You suggested using a database — do we really need one for today? Can we use in-memory state?"

Show them you can (and should) push back.

### Step 3 — Build (10 min)
Accept the simplified plan. Let the agent start building.
Narrate what you see happening:
> "It's creating an HTML file... okay. It's adding a vote button... let me read this code..."

**Commit something after the first working piece.** Show the commit.
> "It runs. Something works. I commit now. Small commits."

### Step 4 — Verify (3 min)
Open it in the browser. Click a vote button.
Ask the agent:
> "What could go wrong with this? What haven't we handled?"

Show it identifying an edge case.

### Step 5 — Security pulse (3 min)
Run the security prompt live:
> "Before I go further — let me check for basic issues."

If it finds anything, fix it. If it doesn't, say:
> "Clean. Let's keep going."

### Step 6 — Wrap + show it works (2 min)
Show the final running app.
Step back and narrate:
> "20 minutes. Working app. Small commits. I read every piece of code. I asked the hard questions. That's the loop."

---

## Rehearsal Checklist

- [ ] Demo project decided
- [ ] Spec written in advance (so you're not blank-paging live)
- [ ] Full run-through done at least once — know where the risky moments are
- [ ] Have a fallback: if the live build breaks, switch to a pre-built version and explain what happened
- [ ] Timer visible to you during the demo
- [ ] Screen font large enough for the room

---

## What to Narrate (The Meta-Commentary)

The narration matters as much as the code. Things to say out loud:

- "I'm reading this before I accept it — I want to understand what's happening"
- "I could let it keep going but I'm going to commit now while it works"
- "It wants to install X — let me ask why before I say yes"
- "This surprised me — I didn't expect it to do that"
- "That's wrong — let me correct it"
- "This is the security check — I'm not skipping this even in a demo"
