# Submit a Project

When the user wants to register their team's project for the Learnathon showcase, gather the following information through conversation:

1. **Project name** — what's it called?
2. **Team** — team name or number
3. **Challenge track** — which track (Conference Game / MCP Server / Custom Agent / BYOI)
4. **Repo URL** — link to the team's GitHub repo
5. **Description** — 2-3 sentences about what it does
6. **How to run** — brief instructions (e.g. "open in Codespace, run `npm start`")

Once you have all the details:

1. **Check for duplicates** — run `gh issue list --repo equinor/learnathon --label project --search '<team name>'` and check if this team already has a project submission. If so, mention it to the user and ask if they want to update or create a new one.
2. **Validate the challenge track** — must be one of: Conference Game, MCP Server, Custom Agent, BYOI. If the user gives a different value, ask them to pick from these.
3. **Show the draft** — display the formatted issue to the user and ask for confirmation before creating it.
4. **Create the issue** using the template below:

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
- If `gh` gives an auth error, tell the user to run `gh auth status` to check.
- If any field is missing, ask the user before submitting.
- The issue is created on the main `equinor/learnathon` repo with the `project` label.
- After creating the issue, show the user the issue URL.
