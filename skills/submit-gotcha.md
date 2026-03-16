# Submit a Gotcha

When the user wants to submit a gotcha (an AI pitfall, mistake, or lesson learned during the event), gather the following information through conversation:

1. **Short title** — what went wrong (one line)
2. **Scenario** — what were you trying to do?
3. **What happened** — what did the AI actually do?
4. **How you fixed it** — what got you unstuck?
5. **The lesson** — one sentence takeaway
6. **Tool** — which tool was involved (Claude Code / Copilot / Spark / OpenCode / Other)
7. **Team name** — your team name or participant name (for the "Contributed by" credit)

Once you have all the details:

1. **Check for duplicates** — run `gh issue list --repo equinor/learnathon --label gotcha` and check if a similar gotcha already exists. If so, mention it to the user and ask if they still want to submit.
2. **Show the draft** — display the formatted issue to the user and ask for confirmation before creating it.
3. **Create the issue** using the template below:

```bash
gh issue create \
  --repo equinor/learnathon \
  --label gotcha \
  --title "Gotcha: <short title>" \
  --body "$(cat <<'ISSUE_EOF'
### <short title>

- **Scenario**: <scenario>
- **What happened**: <what happened>
- **How we fixed it**: <how they fixed it>
- **The lesson**: <lesson>
- **Tool**: <tool>
- **Contributed by**: <team name or participant>, Learnathon 2026
ISSUE_EOF
)"
```

## Notes

- The `gh` CLI is pre-authenticated in Codespaces — no extra setup needed.
- If `gh` gives an auth error, tell the user to run `gh auth status` to check.
- If any field is missing, ask the user before submitting.
- Keep the title concise (under 60 characters).
- The issue is created on the main `equinor/learnathon` repo with the `gotcha` label.
- After creating the issue, show the user the issue URL.
