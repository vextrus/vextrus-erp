# GitHub Integration Guide for Claude Code

## 🚀 Complete GitHub MCP Server Setup

### Prerequisites
1. GitHub account with repository access
2. Personal Access Token (PAT) with proper permissions
3. Claude Code with MCP support

## 📋 Step 1: Create GitHub Personal Access Token

### Navigate to GitHub Settings
1. Go to GitHub.com → Settings → Developer settings
2. Choose "Personal access tokens" → "Fine-grained tokens"
3. Click "Generate new token"

### Required Permissions
```yaml
Repository permissions:
  - Actions: Read
  - Contents: Write
  - Issues: Write
  - Metadata: Read
  - Pull requests: Write
  - Commit statuses: Read
  
Account permissions:
  - Email: Read (optional)
  - Profile: Read (optional)
```

### Token Settings
- **Expiration**: 90 days (recommended for security)
- **Repository access**: Selected repositories → Choose "vextrus-app"
- **Description**: "Claude Code MCP Integration"

## 📝 Step 2: Configure GitHub Token

### Option A: Direct in .mcp.json (Quick but less secure)
Add your token directly to the GITHUB_TOKEN field in .mcp.json

### Option B: Environment Variable (Recommended)
1. Create/edit `.env.github` file
2. Add: `GITHUB_TOKEN=your_token_here`
3. Reference in .mcp.json

### Option C: System Environment Variable (Most secure)
```bash
# Windows (PowerShell as Admin)
[System.Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "your_token_here", "User")

# Then restart Claude Code
```

## 🔧 Step 3: GitHub MCP Commands

### Repository Management
```python
# Search repositories
github.search_repositories(query="vextrus")

# Get repository info
github.get_file_contents(owner="yourusername", repo="vextrus-app", path="README.md")

# Create new repository
github.create_repository(name="new-project", private=True)
```

### Pull Request Workflow
```python
# Create a new branch
github.create_branch(owner="yourusername", repo="vextrus-app", branch="feature/new-feature")

# Make changes and push files
github.push_files(
    owner="yourusername",
    repo="vextrus-app", 
    branch="feature/new-feature",
    files=[{path: "src/file.ts", content: "..."}],
    message="Add new feature"
)

# Create pull request
github.create_pull_request(
    owner="yourusername",
    repo="vextrus-app",
    title="Add new feature",
    head="feature/new-feature",
    base="main",
    body="## Description\nThis PR adds..."
)
```

### Issue Management
```python
# List issues
github.list_issues(owner="yourusername", repo="vextrus-app", state="open")

# Create new issue
github.create_issue(
    owner="yourusername",
    repo="vextrus-app",
    title="Bug: Task creation fails",
    body="## Description\n...",
    labels=["bug", "high-priority"]
)

# Update issue
github.update_issue(
    owner="yourusername",
    repo="vextrus-app",
    issue_number=42,
    state="closed"
)
```

### Code Review
```python
# Get PR details
github.get_pull_request(owner="yourusername", repo="vextrus-app", pull_number=10)

# Get PR files
github.get_pull_request_files(owner="yourusername", repo="vextrus-app", pull_number=10)

# Create review
github.create_pull_request_review(
    owner="yourusername",
    repo="vextrus-app",
    pull_number=10,
    body="LGTM! Great work.",
    event="APPROVE"
)

# Merge PR
github.merge_pull_request(
    owner="yourusername",
    repo="vextrus-app",
    pull_number=10,
    merge_method="squash"
)
```

## 🔄 Integrated Workflows with Other MCP Servers

### Feature Development Flow
```yaml
1. Research Phase:
   brave_search.web_search("best practices for feature X")
   reddit.search("how to implement X in Next.js")
   context7.get_library_docs("next.js", topic="feature-x")

2. Implementation Phase:
   serena.find_symbol("relatedCode")
   filesystem.write_file("src/feature.ts", code)
   prisma.migrate_dev(name="add-feature-x")

3. Testing Phase:
   playwright.browser_navigate("/feature")
   playwright.browser_test()
   postgres.query("SELECT * FROM feature_table")

4. Documentation Phase:
   notion.create_page("Feature X Documentation", content)
   memory.create_entities([{name: "FeatureX", observations}])

5. GitHub Phase:
   github.create_branch(branch="feature/x")
   github.push_files(files, message="Implement feature X")
   github.create_pull_request(title="Add Feature X")
```

### Bug Fix Workflow
```yaml
1. Issue Discovery:
   github.get_issue(issue_number=123)
   reddit.search(error_message)
   brave_search.web_search(error_solution)

2. Investigation:
   serena.find_symbol(buggy_function)
   playwright.browser_console_messages()
   postgres.query("SELECT * FROM affected_table")

3. Fix Implementation:
   github.create_branch(branch="fix/issue-123")
   serena.replace_symbol_body(fixed_code)
   playwright.browser_test()

4. Submission:
   github.push_files(files, message="Fix #123: Description")
   github.create_pull_request(title="Fix #123", body="Closes #123")
   github.update_issue(issue_number=123, state="closed")
```

## 📊 Best Practices

### Branch Naming Convention
```
feature/description    # New features
fix/issue-number      # Bug fixes
refactor/description  # Code refactoring
docs/description      # Documentation
test/description      # Testing
chore/description     # Maintenance
```

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]

Examples:
feat(tasks): add bulk task creation
fix(auth): resolve JWT validation error
docs(readme): update installation guide
```

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally with Playwright
- [ ] Database migrations successful
- [ ] No console errors

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated

## Screenshots (if applicable)
[Add screenshots]

## Related Issues
Closes #123
```

## 🚨 Troubleshooting

### Token Not Working
```bash
# Test token validity
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user

# Check token permissions
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/rate_limit
```

### MCP Server Not Connecting
1. Ensure token is set in .mcp.json
2. Restart Claude Code
3. Check `/mcp` status
4. Verify npm package installed: `npm list @modelcontextprotocol/server-github`

### Rate Limiting
- GitHub API has rate limits: 5000 requests/hour for authenticated requests
- Use caching with Memory MCP for frequently accessed data
- Batch operations when possible

## 🎯 Advanced Usage

### Automated PR Creation from Issues
```python
# Get issue details
issue = github.get_issue(owner, repo, issue_number)

# Create branch from issue
branch_name = f"fix/issue-{issue_number}-{issue.title.lower().replace(' ', '-')}"
github.create_branch(owner, repo, branch_name)

# After fixing the issue
github.create_pull_request(
    owner, repo,
    title=f"Fix #{issue_number}: {issue.title}",
    head=branch_name,
    base="main",
    body=f"## Fixes #{issue_number}\n\n{issue.body}\n\n## Solution\n..."
)
```

### GitHub Actions Integration
```yaml
# .github/workflows/claude-code-ci.yml
name: Claude Code CI

on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run type-check
      - run: npm run lint
      - run: npx playwright test
```

### Sync with GitHub Projects
```python
# Create project card for issue
# Update project board status
# Link PR to project milestone
```

## 📈 Performance Tips

1. **Cache Repository Data**: Use Memory MCP to store frequently accessed repo info
2. **Batch Operations**: Combine multiple file updates in single push
3. **Use Webhooks**: For real-time updates (requires server setup)
4. **Parallel Requests**: Run independent GitHub operations simultaneously
5. **Smart Polling**: Check for updates periodically, not continuously

## 🔐 Security Best Practices

1. **Never commit tokens**: Add `.env.github` to `.gitignore`
2. **Use fine-grained PATs**: Limit permissions to minimum required
3. **Rotate tokens regularly**: Every 90 days maximum
4. **Monitor token usage**: Check GitHub security log regularly
5. **Use environment variables**: Don't hardcode tokens

## 🎉 Success Indicators

### You're properly integrated when you can:
- [ ] Create branches directly from Claude Code
- [ ] Push code changes without leaving the editor
- [ ] Create and manage PRs entirely through MCP
- [ ] Close issues automatically with PR merges
- [ ] View PR status and CI results
- [ ] Collaborate on code reviews

## 📚 Additional Resources

- [GitHub API Documentation](https://docs.github.com/en/rest)
- [MCP GitHub Server Docs](https://github.com/modelcontextprotocol/server-github)
- [GitHub Best Practices](https://github.com/github/best-practices)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Version**: 1.0.0
**Last Updated**: Session 050
**Status**: Complete GitHub Integration Ready