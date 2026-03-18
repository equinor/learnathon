# Mini-Spec: Learnathon Bingo App

**What:** An interactive bingo card app for teams during the Learnathon. Each team marks off techniques as they try them. A shared wall view shows all teams' progress in real time.

**Who:** Two audiences — teams on their own device (marking squares), and the room (wall view on the projector showing everyone's progress).

**Why:** Make the learning techniques visible and social. Teams can see who's close to a line, coaches can spot who needs encouragement. Legend status rewards teams who try everything.

**Scope:** Team card view (mobile/laptop) + wall view (projector). Shared server state via SSE. In-memory storage — a server restart resets state, which is acceptable if the server stays up all day. No admin panel needed — teams self-register with a team name.

**Done when:** Team opens card, enters name, marks squares as they complete techniques. Wall view shows all teams live. Line completion triggers confetti + blinking border. Full card earns permanent Legend status with fire emojis.

---

## Bingo Squares (3×3)

| | | |
|:--|:--|:--|
| Spend time writing a spec | Push an architecture drawing to your repo | Use an MCP tool |
| Intentionally customize your AI | ⭐ TRY A NEW TOOL ⭐ | Deploy to Radix playground |
| Help another team | Create a skill | Identify a RISK with AI output |

Center square (TRY A NEW TOOL) must be earned — it is not a free space.

---

## Security Questions

- Takes user input? **Yes** — team name (free text, sanitised before use)
- Stores data? **In-memory only** — no personal data, just team names and square states
- External services? **No**
- Admin protection? **No admin needed** — self-service, honor system
