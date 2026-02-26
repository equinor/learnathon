# Learnathon Voting App

Live audience voting for the awards ceremony — vote once on all categories, reveal winners one by one.

> **Primary candidate for the live demo at 8:45** — see `rehearsal-script.md`

---

## How It Works

1. Facilitator enters team names in the admin panel
2. Opens voting — participants see all 6 categories on their phone and vote one team per category
3. After 2–3 min, facilitator closes voting
4. Facilitator reveals winners one at a time on the big screen (gameshow-style)

Three views:
- **`/vote.html`** — mobile voting page for participants
- **`/screen.html`** — projector view with bar charts and reveals
- **`/admin.html`** — facilitator control panel with guidance banners

---

## Award Categories (reveal order)

1. Best Creation
2. Most Creative AI Use
3. Best Safety Practice
4. Best Risk Catch
5. Best Fail Story
6. People's Choice

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
