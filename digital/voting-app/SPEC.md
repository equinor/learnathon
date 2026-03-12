# Mini-Spec: Learnathon Voting App

**What:** A live audience voting app for the Learnathon awards ceremony. Participants vote on all 6 award categories at once, then the facilitator reveals winners one by one gameshow-style.

**Who:** Three audiences: participants on their phones (voters), the facilitator (controller), and the big room screen (display).

**Why:** Make the awards ceremony interactive and theatrical. Everyone votes live, results are revealed one category at a time for maximum drama. Voting all at once saves ~10 minutes compared to per-round voting.

**Scope:** Three views — mobile voting page, facilitator admin panel, big screen display. State persisted to JSON file (survives restarts). No login for voters — honor system. Simple admin token for facilitator panel. Real-time updates via SSE.

**Done when:** Facilitator opens voting, participants vote for one team per category on their phone, facilitator closes voting and reveals winners one by one on the big screen. Runs in Docker.

---

## Flow

1. Facilitator enters team names → saves
2. Facilitator clicks **Open Voting** → all participants see all 6 categories with team buttons
3. After 2–3 minutes, facilitator clicks **Close Voting**
4. Facilitator clicks **Reveal Next** × 6 — each click reveals one category's winner on the big screen
5. Reset clears votes but keeps teams

## Security Questions

- Takes user input? **Yes** — team name from a button click (not free text, so low XSS risk)
- Connects to external services? **No**
- Stores data? **JSON file** — persists across restarts, cleared by reset
- Admin panel protected? **Yes** — `ADMIN_TOKEN` env var, checked server-side
- Could someone misuse it? **Honor system on votes** — not a real election, it's fine
