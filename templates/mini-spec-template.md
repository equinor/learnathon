# Mini-Spec Template

Fill this in before you talk to your AI agent. Keep it to 5 sentences.
Commit this file. It's your contract with the team.

---

## [Project Name]

**What:** [What does it do? One sentence.]

**Who:** [Who uses it? Who is the intended audience?]

**Why:** [Why are we building this today? What's the value?]

**Scope:** [What is explicitly IN scope? What are we explicitly NOT building?]

**Done when:** [How will we know we're done? What does the demo look like at 14:50?]

---

## Security Questions (Answer Before You Build)

- Does this project take user input? **Yes / No**
- If yes: where does that input go? (Displayed? Stored? Sent somewhere?)
- Does it connect to any external service or API? **Yes / No**
- Does it store any data? **Yes / No**
- Could someone misuse this if it were public? **Yes / No / Not sure**

---

## Example (filled in)

**What:** A browser-based quiz game with 5 AI trivia questions and a score at the end.

**Who:** EDC conference visitors stopping at the booth. No login, no account needed.

**Why:** Engage people with a fun interactive demo that showcases AI at the event.

**Scope:** Single-player only. 5 hardcoded questions. Score shown at the end. No leaderboard, no backend, no data storage. Static HTML/JS is fine.

**Done when:** It runs in a browser, questions work, score shows, and it looks good enough to not embarrass us at the booth.

**Security:** Takes no sensitive user input. No external APIs. No data stored. Low risk.
