# Gotchas Deck

> A living document. Participants: add your gotcha at the top using the template below.
> The best stories from the day will be shared after the event. You're building this together.

---

## How to Add a Gotcha

Copy this template and paste it at the top of the "Participant Gotchas" section:

```markdown
### [Short title — what went wrong]

- **Scenario**: What were you trying to do?
- **What happened**: What did the AI actually do?
- **How we fixed it**: What got you unstuck?
- **The lesson**: One sentence takeaway.
- **Tool**: [Claude Code / Copilot / Spark / OpenCode / Other]
- **Contributed by**: Team [X], Learnathon 2026
```

---

## Participant Gotchas

*(Add yours here during the event)*

---

## Starter Gotchas

These are known, common AI coding pitfalls. Learn them now so you can spot them faster.

---

### 1. The Hallucinated Library

**Scenario**: Asked the agent to add a feature. It installed a package and wrote code using it.
**What happened**: The package either doesn't exist, was deprecated, or the API it used doesn't match the actual library.
**How to spot it**: The code looks right but throws import errors or type errors on first run.
**The fix**: Ask the agent: *"Does this package actually exist? Can you verify the API you used matches its current version?"* Then check npmjs.com or PyPI yourself.
**The lesson**: AI is very confident about things it's slightly wrong about. Verify unfamiliar packages before committing.

---

### 2. The Context Window Cliff

**Scenario**: A long session going well. Then the agent starts contradicting earlier decisions or "forgetting" the architecture.
**What happened**: The context window filled up. The model is now working from a truncated version of your conversation.
**How to spot it**: The agent suggests something you explicitly said not to do, or asks about something already decided.
**The fix**: Start a new chat. Paste a short summary: the spec, key decisions made, and what you're working on next. Your `CLAUDE.md` or `copilot-instructions.md` helps prevent this — it's always in context.
**The lesson**: Long sessions degrade. Checkpoint your progress in files, not just chat.

---

### 3. The Confident Wrong Answer

**Scenario**: Asked the agent a technical question. It gave a detailed, well-formatted, totally wrong answer.
**What happened**: The model generates plausible-sounding text even when it doesn't know. It doesn't say "I'm not sure."
**How to spot it**: Something feels off, or the code based on that answer doesn't work.
**The fix**: Ask a follow-up: *"Are you certain about this? What's your confidence level, and is there anything you'd want me to double-check?"* Then verify against documentation.
**The lesson**: AI confidence is not correlated with AI accuracy. Trust the running code, not the explanation.

---

### 4. The Security Blindspot

**Scenario**: Built a form or input field. Agent wrote the backend handler.
**What happened**: The agent didn't sanitise the input — it just used it directly in a query, file path, or HTML output.
**How to spot it**: Look for places where user input (`req.body.x`, form values) flows directly into database queries, shell commands, file reads, or rendered HTML without validation or escaping.
**The fix**: Ask explicitly: *"Is any user input in this code used without sanitisation? Show me every place user input touches the system."*
**The lesson**: AI won't volunteer security concerns unless you ask. Always ask.

---

### 5. The Scope Creep Loop

**Scenario**: Asked for a simple feature. The agent added three related features "while it was there."
**What happened**: The agent optimised for completeness, not for your actual goal.
**How to spot it**: The diff is much larger than expected. New files appeared. The code does more than you asked.
**The fix**: Be explicit: *"Only implement what I asked for. Don't add anything extra. If you see related improvements, mention them but don't implement them."*
**The lesson**: AI defaults to "more is better." You have to actively hold the scope boundary.

---

### 6. The Unstoppable Refactor

**Scenario**: Asked for a bug fix. The agent rewrote the whole file.
**What happened**: The agent decided the existing code was "suboptimal" and rewrote it.
**How to spot it**: Git diff shows massive changes for a small ask.
**The fix**: Be surgical in your prompt: *"Fix only the specific bug in the `handleSubmit` function. Do not change anything else."*
**The lesson**: Narrow prompts produce narrow changes. Vague prompts give the agent permission to do whatever it thinks is best.

---

### 7. The "It Worked in My Test" Hallucination

**Scenario**: Agent said "I tested this and it works." But you didn't see it run anything.
**What happened**: Some models claim to have tested or verified things they can't actually test. They generate the *claim* of testing, not the test itself.
**How to spot it**: No actual test run in the terminal history. No test file added to the repo.
**The fix**: Always run it yourself. Trust the running code, not the agent's claims about the running code.
**The lesson**: "I verified this" from an AI means "this looks correct to me." Not the same thing.

---

### 9. The Missing .gitignore

**Scenario**: Built something, ran `npm install`, then committed the project.
**What happened**: `node_modules/` — all 600 packages — went into the commit. The diff was 46,000 files.
**How we fixed it**: Added a `.gitignore` with `node_modules/`, then `git rm -r --cached node_modules/` to remove them from tracking without deleting them locally. Then a clean follow-up commit.
**The lesson**: Create your `.gitignore` before your first commit. For Node projects: `node_modules/`. For everyone: `.env`.
**Tool**: Git (not AI's fault — but AI won't remind you either)
**Contributed by**: The Learnathon organisers, building the voting app

> *This actually happened while building this repo. Hence the entry.*

---

### 8. The Dependency Explosion

**Scenario**: Started a small project. After a few hours, `node_modules` has 400 packages.
**What happened**: Each feature request led to a new dependency. No one pushed back.
**How to spot it**: `cat package.json` — are there packages you can't explain?
**The fix**: Before accepting any `npm install`, ask: *"What does this package do, and could we solve this without it?"* Prefer built-in language features and standard library.
**The lesson**: Dependencies have maintenance cost, security surface, and licence implications. Own what you install.
