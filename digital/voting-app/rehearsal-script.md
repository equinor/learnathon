# Rehearsal Script: Building the Voting App Live

This is the script for the **8:45 live demo** — you rebuild a version of this app in front of 60 people using GitHub Spark or Claude Code, narrating as you go.

The goal is not to rebuild this exact app. The goal is to show the **workflow** — spec, plan, build, verify, secure — in real time. The result should work. The journey is the point.

**Target time:** ~25 minutes
**Tool:** GitHub Spark (recommended) or Claude Code in Codespace

---

## Before You Go On Stage

- [ ] Rehearse this at least once fully (Trondheim test run, or before Mar 16 dry run)
- [ ] If using Spark: be logged in and have a blank Spark open, ready to go
- [ ] If using Claude Code: Codespace open, terminal ready, `ANTHROPIC_API_KEY` set
- [ ] Have this script open on a second screen or printed — but don't read from it verbatim
- [ ] Set a visible timer for yourself (25 min)
- [ ] Have a fallback: the finished app in this repo. If the live build fails badly, switch to it.

---

## The Script

### Part 1 — Write the Spec (3 min)

**Say out loud:**
> "Before I touch any AI tool, I write what I'm building. Five sentences. No more."

**Type or show this spec (use `SPEC.md` as a reference, but type it fresh):**

```
What: A live audience voting app for the awards ceremony.
Who: Participants vote on their phones. Facilitator controls the flow. Big screen shows results.
Why: Make the awards theatrical — everyone votes live, results revealed one by one.
Scope: Mobile voting page, admin control panel, screen display. No login, honor system.
Done when: Participants can vote on all 6 categories at once, facilitator reveals winners one by one on the big screen.
```

**Say:**
> "Notice what I'm NOT writing: how it works, what tech stack, what files. That's the agent's job. My job is to say what and why."

---

### Part 2 — Ask for a Plan (3 min)

**In Spark or Claude Code, paste:**

```
Read this spec and propose a simple architecture.
What are the main components? What could go wrong?
Keep it simple — this is a one-day demo, not production.

[paste spec here]
```

**When the plan comes back — read it out loud. Then push back on at least one thing:**

> "It's suggesting a database — do we really need one? We're using this for one ceremony. Let's use in-memory state instead."

**Say:**
> "This is the most important habit: read the plan before you say yes. Push back when it's over-engineering."

---

### Part 3 — Build (12 min)

**Give the go-ahead:**

```
Good. Use in-memory state, no database. Build the voting page first —
mobile-friendly, shows the active category and team buttons to tap.
One step at a time.
```

**While it builds, narrate what you see:**
> "It's creating files... let me read this code before it keeps going..."

**After the first working piece — STOP and commit (or in Spark, checkpoint):**
> "It works. I'm saving this now before we add anything else. Small steps."

**Continue with the screen view:**
```
Good. Now add the big screen view — shows "VOTING IS OPEN" with the URL
when voting is active, then switches to a reveal view where the facilitator
can show results one category at a time. Same server, new HTML file.
```

**If something breaks:** Don't panic. Say:
> "This is what actually happens. Let me tell it what went wrong."

```
That's broken — the vote counts aren't updating in real time.
What's the issue?
```

Show the fix. This is more valuable than a perfect demo.

---

### Part 4 — Verify (2 min)

Open it. Click a vote button. Show it working.

Then ask:
```
What could go wrong with this? What edge cases haven't we handled?
```

Read the answer out loud. Pick one and say:
> "That's a real risk. We'd fix it before using this in production. For today, it's fine."

---

### Part 5 — Security Pulse (2 min)

**Say:**
> "Even for a silly voting app, I do a quick check."

**Run:**
```
Quick security review: any hardcoded secrets, any unsanitised input,
anything that calls external services we didn't intend?
```

Show the result. It should be clean. Say:
> "Clean. That's what we want. It takes 30 seconds and it's a habit worth building."

---

### Part 6 — Wrap (1 min)

Step back. Show the running app. Say:

> "25 minutes. A working voting app. We'll actually use this today at 15:45.
> I read every piece of code. I pushed back on the plan. I committed when it worked.
> I asked the hard questions. That's the loop.
> Your turn."

---

## If the Live Build Breaks Badly

If the build is fundamentally broken at the 20-minute mark, switch to the pre-built version in this repo:

```bash
cd digital/voting-app
npm install
node server.js
```

Open `http://localhost:3000/vote.html`

Say:
> "The live build hit a snag — and that's actually fine. This is what happened and why.
> Here's the finished version. The workflow is the same either way."

This is honest and still teaches the process.

---

## Key Lines to Memorise

These are the moments that land with the audience. Know them cold:

- *"Before I touch any AI tool, I write what I'm building."*
- *"Read the plan before you say yes. Push back when it's over-engineering."*
- *"It works. I'm saving this now before we add anything else."*
- *"This is what actually happens."* (when something breaks)
- *"That takes 30 seconds and it's a habit worth building."* (on security check)
- *"That's the loop. Your turn."*
