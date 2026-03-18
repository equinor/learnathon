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

> **Recommended:** Run in GitHub Codespaces — the environment is tested and should work without issues for everyone.

*This takes a minute — let it run while we continue.*

---

### 3. Set up API key

`github.com/Equinor-Playground/YOUR_REPO/settings/secrets/codespaces` → **New secret**

- **Name:** `CLAUDE_KEY`
- **Value:** *(from the event invite)*

---

### 4. Verify

```bash
claude --version
```

Version number? You're good. ✓

*Having issues? Raise your hand — coaches are on the floor.*

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

-----

## The Learnathon

---

### What we're doing today

Teams of 3 build something real using AI-assisted tools.

At the end of the day: **Show & Tell** — you demo what you built *and* share what you learned.

The learning matters more than the polish.

-----

## How to vibe code

1. What do you want to build? 
2. Press enter
3. Wait

--- 

### The workflow

@embed(/presentations/images/workflow-loop.svg, width=80%)

---

### But this sounds like a lot, right?

There are tools at your disposal that handle this out of the box — **Superpowers**, **Get Shit Done**, and many more.

These days they come as **plugins** for both Claude and Copilot.

-----

## Considerations

---

### The context cliff

![Context cliff](/presentations/images/Gemini_Generated_Image_fzf4y6fzf4y6fzf4.png) <!-- .element style="max-height:380px" -->

---

### How to avoid the cliff

@embed(/presentations/images/context-cliff.svg, width=85%)

---

### Set the context

The quality of AI output = the quality of context you give it.

![Galaxy brain](/presentations/images/galaxybrain.jpg) <!-- .element style="max-height:380px" -->

---

### Where context lives in your repo

| Layer | Examples | Loaded when? |
|-------|----------|-------------|
| **Agent instructions** | `CLAUDE.md` · `copilot-instructions.md` | Always — equivalent per tool |
| **Project docs** | `mini-spec.md` · `AGENTS.md` | Always or on reference |
| **Agent-managed** | `plans/` · `tasks/` · `memory/` | Agent reads/writes as needed |
| **Skills** | `.claude/skills/` · `.github/workflows/` | On invocation — carry own context |
| **Subagents** | Agent definitions & prompts | Scoped context per agent role |

**Write the top layers first. Code second.**

---

### Level up with tools

@embed(/presentations/images/kitchen-vs-recipe.svg, width=90%)

---

### Progressive disclosure in skills

Skills use the same idea — load only what's needed, when it's needed.

@embed(/presentations/images/progressive-disclosure-iceberg.svg, width=60%)

---

### Stay in control

![Captain Phillips](/presentations/images/captainnow.jpg) <!-- .element style="max-height:350px" -->

Your job: **set context, give scoped tasks, review output, steer when it drifts.**

---

### The orchestrator in practice

- Give **small, scoped tasks** — not "build the whole app"
- Use **explicit roles** — architect, builder, QA, reviewer
- All work happens on **branches** — never directly on main
- QA and test agents **gate the merge**

**Same rules you'd give a junior dev.**

---

### Subagents

When your project grows, split work across focused agents.

@embed(/presentations/images/subagent-delegation.svg, width=85%)

---

### Useful MCPs & Plugins

Level up your agent with ready-made tools.

| Tool | What it does | API key? |
|------|-------------|----------|
| **frontend-design** | Generate UI from descriptions & screenshots | No |
| **superpowers** | TDD, debugging, subagent code review | No |
| **code-simplifier** | Review & simplify code for quality | No |
| **playwright** | Browser automation — test & verify your UI | No |
| **security-guidance** | Security review & threat modelling | No |
| **claude-md-management** | Manage CLAUDE.md project instructions | No |
| **skill-creator** | Create reusable Claude Code skills | No |
| **Context7** | Injects real, versioned library docs | Yes |

**Try one new tool = bingo square.**

---

### The open-source-first rule

Before building anything hard:

1. Search for an **open source library**
2. Find a **research paper** describing the approach
3. If neither exists — **don't attempt it**

Saves time, headaches, and tokens.

**"Never manually implement what someone already solved."**

---

### When things go wrong

And they will.

- **Give the agent what you see** — browser dev tools, error logs, screenshots
- **Use tools** — Playwright for UI bugs, `fetch` for API debugging
- **Ask it to search** — "find a solution for this online"
- **Know when to restart** — sometimes a new chat is cheaper than a deeper hole
- **Save learnings to memory** — so the agent doesn't repeat the same mistakes

**Trust the running code, not the explanation.**

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
- Send your `.env` file somewhere nice

**Review what the agent does.**

**Don't just approve blindly.**

-----

## Let's go!

---

### How to vibe code as a team

**Step 1: Scaffold the app together** — write the mini-spec, plan, and set up the repo as a team.

Then pick your style:

| Style | How it works |
|-------|-------------|
| 🧑‍🤝‍🧑 **Mob vibing** | One driver shares screen. Everyone contributes prompts and ideas. Rotate the driver. |
| 🔀 **Distributed vibing** | Each person owns a specific part. Write a `role.md` per person and reference them from `CLAUDE.md`. |
| 🎲 **Free for all** | Everyone vibes simultaneously. See what happens. Merge the chaos at the end. |

*No wrong answer — but know which one you're doing.*

---

### Learning Bingo

| | | |
|:---:|:---:|:---:|
| Spend time writing a spec | Push an architecture drawing to your repo | Use an MCP tool |
| Intentionally customize your AI | ⭐ **TRY A NEW TOOL** ⭐ | Deploy to Radix playground |
| Help another team | Create a skill | Identify a RISK with AI output |

Get a line = recognition · Fill the card = **legend status** 🏆

*Tiebreaker: if two teams tie in an award vote, bingo progress decides.*

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

---

### Pick your challenge

| Challenge | What you build |
|-----------|---------------|
| 🎮 **Conference Stand Game** | Fun interactive game for EDC booth |
| 🔌 **Useful MCP Server** | Reusable tool for the community |
| 🤖 **Custom Agent** | Shareable agent configuration |
| 💡 **Bring Your Own Idea** | Your passion project — demoable in 3–5 min |

-----

## Lab 1: Mini-spec + Plan

*9:45 — 10:30*

---

### What to do now

1. **Check `/plugins`** — pick the tools that fit your project and install them
2. **Write your mini-spec** — use the template in your repo
3. **Ask your agent to plan** — "Plan this based on the mini-spec"
4. **Review the plan** — push back, adjust scope, agree
5. **Commit** the spec and plan

---

### You're done when

- ✅ Mini-spec is written and committed
- ✅ Agent has created a plan you've reviewed
- ✅ You know what you're building first

*Coaches are on the floor — ask for help if you're stuck on scope.*

-----

## Lab 2: Build Sprint 1

*10:30 — 11:50*

---

### Build your first working version

- **Commit often** — even if it's rough
- **Small steps** — don't ask for everything at once
- **Ask for help** if you're stuck for more than 10 minutes

*Remember the bingo card — are you hitting any squares?*

-----

## 🍕 Lunch

Commit what you have before you go!

Back at **12:35**

-----

## 🔐 Security Pulse

*12:35 — 12:50*

---

### 5 minutes. One command.

**Claude Code:**
```
/security-review
```

**GitHub Copilot** — paste this into Copilot Chat:
```
Review this codebase for security issues:
1. Hardcoded secrets or API keys
2. User input used without sanitisation
3. Packages we can't explain
4. Calls to external services we didn't intend
```

Both work. Pick your tool.

---

### Fix what you find

If you find something interesting — good or bad:

- That's a **bingo square** *(Identify a RISK)*
- That's a **demo story** *(Best Risk Catch, Best Safety Practice)*

**Don't skip this.**

-----

## Lab 3: Build Sprint 2

*12:50 — 14:30*

---

### Polish, fix, prepare

- Scope **down** if needed — a working demo beats a broken feature
- **13:45** — "45 minutes left in the sprint — finish features, start preparing your story"
- **14:15** — "Stop features. Prepare what you'll say."

-----

## Prep for Demos

![Endgame](/presentations/images/endgame.jpg) <!-- .element style="max-height:350px" -->

*14:30 — 14:50*

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

## 🎤 Ceremony: Show & Tell + Awards

*14:50 — 16:30*

---

### How it works

Each team presents (~2.5 min) — then everyone **rates** them immediately.

After all teams: winners revealed one by one.

---

### Phones out!

Rate each team on **all 6 categories** (5 stars) right after they present.

*If your demo breaks live — that's a Learnathon moment. Tell us what happened.*

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
