# Coach Cheat Sheet

Quick reference for the floor. Print this.

---

## Your Role

Walk the room. Every 15–20 min, check every team:
1. Are they **building** or are they **stuck**?
2. Are they **committing** regularly?
3. Is their scope **realistic** for the time left?

---

## Quick Unstuck Patterns

### "The agent is going in circles"
```
Stop the current session.
Start a fresh chat.
Ask the team: "In 3 sentences — what are you building, what works now, what are you trying to do next?"
Paste that as the first message in the new chat.
```

### "We don't know what to build"
Ask them these three questions in order:
1. *"Who will use this today at the demo?"*
2. *"What is the one thing it must do?"*
3. *"What does done look like at 14:50?"*
→ That's the mini-spec. Write it down.

### "The code works but I don't understand it"
```
Ask your agent: "Explain this file/function to me line by line.
What would break if I removed [specific part]?"
```
If the agent can't explain it clearly → that's a red flag worth flagging in the demo story.

### "It worked 5 minutes ago and now it's broken"
```
git diff
```
See what changed. Revert to the last working commit. Make smaller changes.

### "The agent installed something unexpected"
1. `cat package.json` — what's actually there?
2. Ask the agent: *"What does [package name] do and why did you install it?"*
3. If you can't justify it → remove it: `npm uninstall [package]`

### "We're running out of time"
Hard question: "If you had to demo in 5 minutes, what would you show?"
Help them cut to that. Commit what works. Stop adding features.

### "The demo is broken"
Not the end of the world. Two options:
1. Demo the *code* — explain what it does, show the structure
2. Demo a *screenshot* of when it worked

"Our demo crashed and here's what we learned" is a perfectly valid Show & Tell.

---

## Security Pulse (12:35)

Help teams run this prompt on their code:
```
Review this codebase for: (1) hardcoded secrets or API keys,
(2) user input used without sanitisation, (3) packages installed
that we can't explain, (4) calls to external services we didn't intend.
```

If they find something → encourage them to fix it AND share it in the demo.
That's the "Best Risk Catch" award territory.

---

## Bingo Squares — Quick Explanations

If a team asks what a square means:

| Square | What it means |
|--------|--------------|
| Use plan mode before building | Use the agent's plan mode to design before coding |
| Create architecture drawing | Ask AI to draw a diagram (ASCII, Mermaid, etc.) of the system |
| Use an MCP tool | Connect to an external system via MCP (bingo, voting, etc.) |
| Customize your AI | Write/modify the CLAUDE.md or .github/copilot-instructions.md |
| TRY A NEW TOOL | Use something not in the primary toolbox |
| Deploy to Radix playground | Get your solution running on Radix for others to try |
| Help another team | Go to another team and help them get unstuck |
| Use or create a skill | Use an existing skill or write a new SKILL.md |
| Identify a RISK with AI output | Catch a hallucination, wrong suggestion, or security issue |

---

## Timing Cues

Call out at these times:
- **11:05** (Lab 2): "45 minutes to lunch — commit what you have now"
- **11:35**: "15 minutes to lunch — wrap up and commit"
- **13:45**: "45 minutes to ceremony — finish features, start preparing your story"
- **14:15**: "No new features. Polish what you have. Prepare your demo."
