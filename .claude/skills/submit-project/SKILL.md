# Submit a Project

When the user wants to register their team's project for the Learnathon showcase, gather the following information through conversation:

1. **Project name** — what's it called?
2. **Team** — team name or number
3. **Challenge track** — which track (Conference Game / MCP Server / Custom Agent / BYOI)
4. **Repo URL** — link to the team's GitHub repo
5. **Description** — 2-3 sentences about what it does
6. **How to run** — brief instructions (e.g. "open in Codespace, run `npm start`")

Once you have all the details, format them as a GitHub issue and create it:

```bash
gh issue create \
  --repo equinor/learnathon \
  --label project \
  --title "Project: <project name> (<team>)" \
  --body "$(cat <<'ISSUE_EOF'
## <project name>

**Team:** <team>
**Challenge track:** <track>
**Repo:** <repo URL>

### What it does

<description>

### How to run

<how to run>
ISSUE_EOF
)"
```

## Notes

- The `gh` CLI is pre-authenticated in Codespaces — no extra setup needed.
- If any field is missing, ask the user before submitting.
- The issue is created on the main `equinor/learnathon` repo with the `project` label.
- After creating the issue, show the user the issue URL.
