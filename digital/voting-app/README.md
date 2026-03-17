# Learnathon Ceremony + Voting App

Phase-based ceremony system for the awards — teams present one at a time, get rated by the audience, then winners are revealed in a dramatic staggered sequence.

> **Primary candidate for the live demo at 8:45** — see `rehearsal-script.md`

---

## How It Works

1. Facilitator enters team names and sets the presentation queue in the admin panel
2. Teams present one at a time (pecha-kucha style, ~2.5 min each)
3. After each presentation, participants rate that team with 5-star ratings across all 6 categories (self-vote blocking prevents rating your own team)
4. After all teams have presented, the facilitator reveals winners one category at a time with staggered finalist animation
5. Tiebreakers are resolved via a multi-stage process: bingo check → compliment battle → audience vote → accept tie

**Phases:** idle → queue → setup → presenting → voting → reveal → tiebreaker → done

Two views:
- **`/vote.html`** — mobile page for participants (register, rate teams, tiebreak votes)
- **`/admin.html`** — facilitator control panel with guidance banners

---

## Award Categories (reveal order)

1. Best Fail Story
2. Best Risk Catch
3. Best Safety Practice
4. Most Creative AI Use
5. Best Creation
6. People's Choice
7. Overall Winner (aggregate of all categories)

---

## Run Locally

```bash
npm install
node server.js
# → http://localhost:3000
```

Default admin token: `admin-dev` (set `ADMIN_TOKEN` env var in production).

State is persisted to `state.json` — survives restarts. Use **Reset All** in admin to clear.

---

## Docker

```bash
docker build -t voting-app .
docker run -p 3000:3000 -e ADMIN_TOKEN=my-secret voting-app
```

---

## Security Note

This takes no sensitive user input — just button clicks for team names. Low security risk. Still worth running the security pulse on as a teaching moment ("even simple apps deserve a check").
