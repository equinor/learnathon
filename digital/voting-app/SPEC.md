# Mini-Spec: Learnathon Voting App

**What:** A live audience voting app for the Learnathon awards ceremony. Participants vote for which team wins each of 6 award categories. The facilitator controls the flow gameshow-style — one category at a time.

**Who:** Three audiences: participants on their phones (voters), the facilitator (controller), and the big room screen (display).

**Why:** Make the awards ceremony interactive and theatrical. Everyone votes live, results appear dramatically on the projector.

**Scope:** Three views — mobile voting page, facilitator admin panel, big screen display. In-memory state (a restart resets everything, which is fine for one day). No login for voters — honor system. Simple admin token for facilitator panel. Real-time updates via SSE.

**Done when:** Facilitator can open a category, participants tap their phone to vote for a team, screen shows live vote counts, facilitator reveals winner dramatically, advances to next category. Runs in Docker.

---

## Security Questions

- Takes user input? **Yes** — team name from a button click (not free text, so low XSS risk)
- Connects to external services? **No**
- Stores data? **In-memory only** — cleared on restart
- Admin panel protected? **Yes** — `ADMIN_TOKEN` env var, checked server-side
- Could someone misuse it? **Honor system on votes** — not a real election, it's fine
