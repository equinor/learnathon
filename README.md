# Learnathon 2026

> **Learn by building, reflect by sharing, win by exploring**

A hands-on learning event where teams explore AI-assisted software engineering by building something real — with security baked in throughout.

| | |
|---|---|
| **Date** | March 18, 2026 |
| **Time** | 8:15 – 16:00 |
| **Venue** | EDC, one big room |
| **Participants** | ~60 people, ~20 teams of 3 |

---

## The Day

| Time | Phase | What Happens |
|------|-------|--------------|
| 8:15 | 🎯 Welcome & Setup | Form teams, open your Codespace, verify tools |
| 8:45 | 📚 Learn: Toolbox & Workflow | Live demo of the full loop: spec → plan → build → verify → secure → ship |
| 9:45 | 🔨 Lab 1: Mini-spec & Plan | Define what you'll build, get an AI-generated plan, push back, agree |
| 10:30 | 🔨 Lab 2: Build Sprint 1 | First build iteration — small commits, continuous verification |
| 11:30 | 🍕 Lunch | |
| 12:15 | 🔐 Security Pulse | 15-minute security review of your codebase |
| 12:30 | 🔨 Lab 3: Build Sprint 2 | Polish, fix, prepare your demo |
| 13:45 | ☕ Break | Prep for demos |
| 14:00 | 🎤 Show & Tell | Every team presents: 2 min demo, 2 min learnings, 1 min Q&A |
| 15:30 | 🗳️ Vote & Awards | Audience votes, winners revealed one by one |
| 16:00 | 🎉 Done | |

---

## The Workflow

**Spec → Plan → Build → Verify → Secure → Ship**

This is the loop you'll use all day. Write a mini-spec, let the agent plan, review the plan, build in small steps, verify as you go, check for security issues, and ship it.

---

## Tools

Your Codespace comes pre-configured with everything you need.

| Tool | What It Does |
|------|--------------|
| **GitHub Copilot Enterprise** | AI pair programming in VS Code — autocomplete + chat + agent mode |
| **GitHub Spark** | Natural language → hosted web app (included in Copilot) |
| **Claude Code** | Agentic coding in the terminal (`claude` command) |
| **OpenCode** | Open-source alternative terminal agent (`opencode` command) |
| **MCP Servers** | Custom tool integrations — connect your agent to external systems |

Optional tools (Lovable, Bolt, v0, Cursor) are welcome but not supported. See `learning/tool-comparison.md` for details.

---

## Pick Your Challenge

| Challenge | What You Build |
|-----------|----------------|
| 🎮 **Conference Stand Game** | Fun interactive game for the EDC booth |
| 🔌 **Useful MCP Server** | Reusable tool for the community |
| 🤖 **Custom Agent** | Shareable agent configuration |
| 💡 **Bring Your Own Idea** | Your passion project — demoable in 3–5 min |

---

## Learning Bingo

Each team gets a bingo card with methods to try. Not mandatory — but earns recognition!

| | | |
|:---:|:---:|:---:|
| Use plan mode before building | Create architecture drawing | Use an MCP tool |
| Customize your AI | ⭐ **TRY A NEW TOOL** ⭐ | Deploy to Radix playground |
| Help another team | Use or create a skill | Identify a RISK with AI output |

Get a line = recognition. Fill the card = **legend status**.

*Tiebreaker: if two teams tie in an award vote, bingo progress decides.*

---

## Awards (You Vote!)

After Show & Tell, you vote on all 6 categories at once. Winners are revealed one by one.

| | Category | What It Rewards |
|---|----------|-----------------|
| 🥇 | **Best Creation** | Most impressive or useful output |
| 🎨 | **Most Creative AI Use** | Unexpected or clever usage |
| 🔐 | **Best Safety Practice** | Great security awareness |
| 🚨 | **Best Risk Catch** | Spotted an important AI limitation |
| 😂 | **Best Fail Story** | Funniest "AI went wrong" moment |
| 🤝 | **People's Choice** | Overall crowd favourite |

---

## Show & Tell

This is where the magic happens. Every team presents:

| Part | Time |
|------|------|
| Demo your creation | 2 min |
| Share your learnings | 2 min |
| Q&A | 1 min |
| **Total per team** | **5 min** |

The learning story matters more than the polish. If your demo breaks live — that's a Learnathon moment. Tell us what happened.

---

## Getting Started

1. **Create your repo** from the template link (on screen / in chat)
2. **Open in Codespaces** — it takes a minute to start
3. **Add your API key** at `github.com/settings/codespaces` → New secret → `ANTHROPIC_API_KEY`
4. **Verify**: run `claude --version` in the terminal

See `environments/sandbox-setup.md` for detailed setup instructions.

---

## Submit Your Work

Use these skills in your repo to share what you've learned:

```
/submit-gotcha     — share an AI pitfall or lesson learned
/submit-project    — register your team's project
```

---

## Resources

| Resource | Where |
|----------|-------|
| Workflow card | `learning/workflow-card.md` |
| Tool comparison | `learning/tool-comparison.md` |
| Community gotchas | `learning/gotchas.md` |
| Mini-spec template | `templates/mini-spec-template.md` |
| Facilitator guide | `docs/facilitator-guide.md` |
| Coach cheatsheet | `docs/coach-cheatsheet.md` |
