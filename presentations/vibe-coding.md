# "Secure" Vibe Coding
## From vibes to production
### EDC Learnathon 2026

-----

## Before we start

We're building something **real** today with AI tools.

But first — let's get set up while we talk.

---

### 1. Form your team

**3 people.** Mix of experience levels is great.

Find your people. Say hi.

---

### 2. Create your repo

Go to the **template repo** link *(on screen / in chat)*

**Use this template** → **Create a new repository** → Open in **Codespaces**

*This takes a minute — let it run while we continue.*

---

### 3. Setup API key

`github.com/settings/codespaces` → **New secret**

- **Name:** `ANTHROPIC_API_KEY`
- **Value:** *(from the event invite)*
- **Repository access:** your new repo

---

### 4. Verify

```bash
claude --version
```

Version number? You're good. ✓

*Having issues? Raise your hand — coaches are on the floor.*

-----

## The Learnathon

---

### What we're doing today

Teams of 3 build something real using AI-assisted tools.

At the end of the day: **Show & Tell** — you demo what you built *and* share what you learned.

The learning matters more than the polish.

---

### The workflow

@embed(/presentations/images/workflow-loop.svg, width=80%)

This is the loop. You'll use it all day.

-----

## What is vibe coding?

---

### The term

> "You fully give in to the vibes, embrace exponentials, and forget that the code even exists."
>
> — Andrej Karpathy, Feb 2025

---

### Cheap. Fast. Results only.

![Drake vibe coding](/presentations/images/drake.jpg) <!-- .element style="max-height:350px" -->



---

### Natural language is your interface

Talk to the AI. Describe what you want.

Type it. Say it. Doesn't matter.

The AI figures out the *how*.

You focus on the *what*.

---

### Who cares about maintainability?

Sometimes **nobody**.

- A throwaway prototype
- A proof of concept for tomorrow
- A game for a conference booth
- A one-off internal tool

Vibe coding is **perfect** for these.

But what about when you *do* care?

That's what the rest of this talk is about.

-----

## How to vibe code

---

### Context engineering

![Galaxy brain](/presentations/images/galaxybrain.jpg) <!-- .element style="max-height:380px" -->

---

### Anthropic's four pillars

@embed(/presentations/images/four-pillars.svg, width=90%)

---

### Where context lives in your repo

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Always loaded — project rules, conventions, boundaries |
| `AGENTS.md` | Tool-agnostic instructions for any AI assistant |
| `copilot-instructions.md` | Copilot-specific context |
| `mini-spec.md` | What you're building and why |

**Write these first. Code second.**

---

### Agent engineering

![Captain Phillips](/presentations/images/captainnow.jpg) <!-- .element style="max-height:350px" -->

**Copilot Agent Mode** and **Claude Code** are both agents.

---

### You are the orchestrator

Your job:

1. Set the context
2. Give a clear, scoped task
3. Review the output
4. Steer when it drifts

**Small tasks. Tight feedback loops.**

---

### Subagents

@embed(/presentations/images/subagent-delegation.svg, width=85%)

Think of it as **delegation** — same as managing a team.

---

### MCPs vs Skills

@embed(/presentations/images/kitchen-vs-recipe.svg, width=90%)

---

### MCP in practice

```
Agent ←→ MCP Server ←→ External System
```

Examples at this event:
- Mark a bingo square
- Cast a vote
- Search Confluence
- Read from a database

**MCP gives agents new capabilities.**

---

### Skills in practice

```
/submit-gotcha  → creates a GitHub issue with your AI pitfall
/submit-project → registers your team's project
```

Skills live in your repo as `SKILL.md` files.

Any team member can invoke them.

---

### Progressive disclosure

@embed(/presentations/images/progressive-disclosure-iceberg.svg, width=60%)

---

### Example workflow

*(Sean's Miro illustration)*

---

### Step by step

```
1. Write a mini-spec         ← what, why, constraints
2. "Plan this"               ← agent creates a plan
3. Review the plan           ← push back, adjust scope
4. "Build step 1"            ← review → commit
5. "Build step 2"            ← review → commit
6. "Run the tests"           ← fix what breaks
7. "Check for security"      ← ask the hard questions
8. Ship it
```

**Spec → Plan → Build → Verify → Secure → Ship**

---

### Vibe debugging

When things go wrong (and they will):

- **"Explain what this code does"** — make the agent teach you
- **"What could go wrong here?"** — make it think adversarially
- **"Fix only this function, nothing else"** — scope the fix
- **Start a new chat** if the agent contradicts itself
- **Save progress to files** — don't keep decisions only in chat

**Trust the running code, not the explanation.**

-----

## Considerations

---

### The context cliff

![Context cliff](/presentations/images/Gemini_Generated_Image_fzf4y6fzf4y6fzf4.png) <!-- .element style="max-height:380px" -->

---

### How to avoid the cliff

@embed(/presentations/images/context-cliff.svg, width=85%)

---

### Security

![Always has been](/presentations/images/alwayshasbeen.jpg) <!-- .element style="max-height:350px" -->

**Always ask: "Is this secure?"**

---

### Skills can run arbitrary commands

Skills and agents have access to your **terminal**.

They can:
- Install packages you didn't ask for
- Delete files
- Make network requests
- Push to git

**Review what the agent does.**

**Don't just approve blindly.**

-----

## Examples

---

### This bingo app

Built entirely with AI-assisted coding.

Express + vanilla JS · SSE for real-time · Dashboard + wall view + team cards

**~2500 lines. One session.**

---

### The voting app

Live audience voting with animated ceremony reveal.

Admin controls · SSE-powered live screen · Category-by-category reveals

**Spec to working app in ~30 minutes.**

---

### The MCP server

Connects any AI assistant to event infrastructure.

```
> "Mark bingo square 'Use an MCP tool' for our team"
✓ Marked! You now have 2 lines.
```

**Custom tools in ~50 lines of code.**

-----

## Let's go!

---

### Pick your challenge

| Challenge | What you build |
|-----------|---------------|
| 🎮 **Conference Stand Game** | Fun interactive game for EDC booth |
| 🔌 **Useful MCP Server** | Reusable tool for the community |
| 🤖 **Custom Agent** | Shareable agent configuration |
| 💡 **Bring Your Own Idea** | Your passion project — demoable in 3–5 min |

---

### Learning Bingo

| | | |
|:---:|:---:|:---:|
| Use plan mode before building | Create architecture drawing | Use an MCP tool |
| Customize your AI | ⭐ **TRY A NEW TOOL** ⭐ | Deploy to Radix playground |
| Help another team | Use or create a skill | Identify a RISK with AI output |

Get a line = recognition · Fill the card = **legend status** 🏆

---

### Submit your learnings

**Gotchas** — AI pitfalls and lessons learned:
```
/submit-gotcha
```

**Project registration** — so we know what you built:
```
/submit-project
```

These are skills in your repo. Use them!

---

### Show & Tell

At the end of the day, every team presents.

- **2 min** demo
- **2 min** what you learned
- **1 min** Q&A

The learning story matters more than the polish.

---

### Awards — you vote!

| | |
|:---|:---|
| 🥇 **Best Creation** | Most impressive or useful output |
| 🎨 **Most Creative AI Use** | Unexpected or clever usage |
| 🔐 **Best Safety Practice** | Great security awareness |
| 🚨 **Best Risk Catch** | Spotted an AI limitation |
| 😂 **Best Fail Story** | Funniest "AI went wrong" moment |
| 🤝 **People's Choice** | Overall crowd favourite |

---

### Go! 🚀

1. Open your Codespace
2. Write your mini-spec
3. Let the vibes flow

**Spec → Plan → Build → Verify → Secure → Ship**

-----

## Lab 1: Mini-spec + Plan

*9:45 — 10:30*

---

### What to do now

1. **Write your mini-spec** — use the template in your repo
2. **Ask your agent to plan** — "Plan this based on the mini-spec"
3. **Review the plan** — push back, adjust scope, agree
4. **Commit** the spec and plan

---

### You're done when

- ✅ Mini-spec is written and committed
- ✅ Agent has created a plan you've reviewed
- ✅ You know what you're building first

*Coaches are on the floor — ask for help if you're stuck on scope.*

-----

## Lab 2: Build Sprint 1

*10:30 — 11:30*

---

### Build your first working version

- **Commit often** — even if it's rough
- **Small steps** — don't ask for everything at once
- **Ask for help** if you're stuck for more than 10 minutes

*Remember the bingo card — are you hitting any squares?*

-----

## 🍕 Lunch

Commit what you have before you go!

Back at **12:15**

-----

## 🔐 Security Pulse

*12:15 — 12:30*

---

### 5 minutes. One prompt.

<!-- TODO: Consider creating a /security-check skill instead of a raw prompt -->

Run this on your codebase:

```
Review this codebase for:
1. Hardcoded secrets or API keys
2. User input used without sanitisation
3. Packages we can't explain
4. Calls to external services we didn't intend
```

---

### Fix what you find

If you find something interesting — good or bad:

- That's a **bingo square** *(Identify a RISK)*
- That's a **demo story** *(Best Risk Catch, Best Safety Practice)*

**Don't skip this.**

-----

## Lab 3: Build Sprint 2

*12:30 — 13:45*

---

### Polish, fix, prepare

![Endgame](/presentations/images/endgame.jpg) <!-- .element style="max-height:300px" -->

- Scope **down** if needed — a working demo beats a broken feature
- **13:15** — "45 minutes to demo time"
- **13:30** — "Stop features. Prepare what you'll say."

-----

## Prep for Demos

*13:45 — 14:00*

---

### Check your bingo card

Any easy squares left to fill?

Last chance before Show & Tell!

---

### Which award is your best shot?

| | Think about... |
|:---|:---|
| 🥇 **Best Creation** | Is your thing impressive? Show it working. |
| 🎨 **Most Creative AI Use** | Did you use AI in an unexpected way? Highlight it. |
| 🔐 **Best Safety Practice** | Did you catch a security issue? Tell that story. |
| 🚨 **Best Risk Catch** | Did the AI get something wrong? That's gold. |
| 😂 **Best Fail Story** | Did something go hilariously wrong? Own it. |
| 🤝 **People's Choice** | What makes your team memorable? |

You can aim for several — but **focus is often the key to winning**.

Frame your demo around your strongest category:
- **What will you demo?**
- **What surprised you?**
- **What technique worked or didn't?**
- **What would you do differently?**

-----

## 🎤 Show & Tell

*14:00 — 15:30*

---

### 5 min per team

![Honest work](/presentations/images/itaintmuch.jpg) <!-- .element style="max-height:280px" -->

| Time | What |
|------|------|
| **2 min** | Demo — show what you built |
| **2 min** | Learnings — what surprised you, what worked |
| **1 min** | Q&A |

The learning story matters more than the polish.

*If your demo breaks live — that's a Learnathon moment. Tell us what happened.*

-----

## 🗳️ Vote + Awards

*15:30 — 16:00*

---

### Phones out!

Vote for your favourites in **all 6 categories**.

You've got **2 minutes**.

---

### And the winners are...

🥇 🎨 🔐 🚨 😂 🤝

*One by one.*

-----

## Thank you! 🎉

You built something real.

You learned something real.

You shared it.

**That's the whole point.**

Join the **Claude Code retro** — link in chat.
