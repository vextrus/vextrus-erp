# GitHub Best Practices for Claude Code Development

## 🎯 Overview
This guide establishes GitHub best practices optimized for Claude Code with 17 MCP servers, ensuring efficient collaboration, code quality, and automated workflows.

## 📁 Repository Structure

### Branch Organization
```
main (or master)
├── develop                 # Integration branch
├── feature/*              # New features
├── fix/*                  # Bug fixes
├── hotfix/*               # Emergency production fixes
├── release/*              # Release preparation
├── refactor/*             # Code improvements
├── docs/*                 # Documentation updates
├── test/*                 # Testing improvements
└── chore/*                # Maintenance tasks
```

### Branch Naming Convention
```bash
feature/add-task-bulk-import      # New functionality
fix/issue-123-task-deletion       # Bug fix with issue number
hotfix/critical-auth-bypass       # Emergency fix
refactor/optimize-query-performance # Code improvement
docs/update-api-documentation     # Documentation
test/add-e2e-tests-for-gantt     # Testing
chore/update-dependencies        # Maintenance
```

## 📝 Commit Standards

### Conventional Commits Format
```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Commit Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style (formatting, semicolons, etc)
- **refactor**: Code restructuring without behavior change
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Build system changes
- **ci**: CI configuration changes
- **chore**: Maintenance tasks
- **revert**: Revert previous commit

### Examples
```bash
feat(tasks): add bulk task import via CSV
fix(auth): resolve JWT token expiration issue
docs(readme): update installation instructions
refactor(database): optimize query performance
test(gantt): add E2E tests for drag-and-drop
```

### Commit Message Best Practices
```yaml
DO:
  - Use present tense ("add" not "added")
  - Keep subject line under 50 characters
  - Capitalize first letter of subject
  - No period at end of subject
  - Use body to explain "why" not "what"
  - Reference issues and PRs

DON'T:
  - Use vague messages like "fix bug"
  - Bundle unrelated changes
  - Commit broken code
  - Forget to run tests before committing
```

## 🔄 Pull Request Guidelines

### PR Title Format
```
[TYPE] Brief description (#issue-number)

Examples:
[Feature] Add bulk task import functionality (#45)
[Fix] Resolve task deletion error (#123)
[Refactor] Optimize database queries for performance
```

### PR Description Template
```markdown
## 📋 Description
Brief summary of changes and why they're needed.

## 🎯 Type of Change
- [ ] 🐛 Bug fix (non-breaking change fixing an issue)
- [ ] ✨ New feature (non-breaking change adding functionality)
- [ ] 💥 Breaking change (fix or feature causing existing functionality to change)
- [ ] 📝 Documentation update
- [ ] ♻️ Code refactor
- [ ] 🎨 Style update
- [ ] ⚡ Performance improvement

## 🧪 Testing
- [ ] Tested locally with Playwright
- [ ] Database migrations successful
- [ ] No console errors
- [ ] Cross-browser tested with Browserbase
- [ ] Unit tests pass
- [ ] E2E tests pass

## 📸 Screenshots (if applicable)
[Add screenshots or recordings]

## ✅ Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] PR is linked to issue (if applicable)

## 🔗 Related Issues
Closes #123
Relates to #456

## 📝 Additional Notes
[Any additional context or notes for reviewers]
```

### PR Size Guidelines
```yaml
Small PR (Preferred):
  - < 200 lines changed
  - Single feature or fix
  - Easy to review in 15 minutes

Medium PR (Acceptable):
  - 200-500 lines changed
  - Related changes only
  - Reviewable in 30 minutes

Large PR (Avoid):
  - > 500 lines changed
  - Consider splitting
  - Requires detailed review plan
```

## 🏷️ Issue Management

### Issue Templates

#### Bug Report
```markdown
---
name: Bug Report
about: Report a bug to help us improve
title: '[BUG] '
labels: bug, needs-triage
assignees: ''
---

## 🐛 Bug Description
A clear and concise description of the bug.

## 📋 Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## ✅ Expected Behavior
What you expected to happen.

## ❌ Actual Behavior
What actually happened.

## 📸 Screenshots/Logs
If applicable, add screenshots or error logs.

## 🖥️ Environment
- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 120]
- Node Version: [e.g., 20.10.0]
- Database: [e.g., PostgreSQL 16]

## 📝 Additional Context
Any other relevant information.
```

#### Feature Request
```markdown
---
name: Feature Request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: enhancement, needs-discussion
assignees: ''
---

## 💡 Feature Description
Clear description of the feature.

## 🎯 Problem to Solve
What problem does this feature solve?

## 📐 Proposed Solution
How you envision this working.

## 🔄 Alternatives Considered
Other approaches you've thought about.

## 📊 Priority
- [ ] Critical - Blocks major functionality
- [ ] High - Important for user experience
- [ ] Medium - Nice to have
- [ ] Low - Future consideration

## 📝 Additional Context
Any mockups, examples, or references.
```

### Label System
```yaml
Type Labels:
  - bug: Something isn't working
  - enhancement: New feature or request
  - documentation: Documentation improvements
  - question: Further information requested
  - duplicate: This issue already exists
  - invalid: This doesn't seem right
  - wontfix: This will not be worked on

Priority Labels:
  - priority:critical: Immediate attention needed
  - priority:high: Important issue
  - priority:medium: Standard priority
  - priority:low: Nice to have

Status Labels:
  - status:in-progress: Being worked on
  - status:blocked: Blocked by dependencies
  - status:review-needed: Needs code review
  - status:testing: In testing phase
  - status:ready-to-merge: Approved and ready

Component Labels:
  - component:frontend: UI/UX related
  - component:backend: Server/API related
  - component:database: Database related
  - component:devops: Infrastructure/CI/CD
```

## 🔄 Code Review Process

### Review Checklist
```yaml
Code Quality:
  - [ ] Code follows style guide
  - [ ] No code duplication
  - [ ] Functions are small and focused
  - [ ] Variable names are descriptive
  - [ ] Complex logic is commented

Functionality:
  - [ ] Code does what it claims
  - [ ] Edge cases handled
  - [ ] Error handling appropriate
  - [ ] No obvious bugs

Performance:
  - [ ] No unnecessary database queries
  - [ ] Efficient algorithms used
  - [ ] No memory leaks
  - [ ] Optimized for common use cases

Security:
  - [ ] No hardcoded secrets
  - [ ] Input validation present
  - [ ] SQL injection prevention
  - [ ] XSS prevention

Testing:
  - [ ] Tests cover new code
  - [ ] All tests pass
  - [ ] Edge cases tested
```

### Review Comments
```markdown
# Constructive Feedback Format

## Suggestion
"Consider using `useMemo` here to prevent unnecessary recalculations"

## Question
"Could you explain why this approach was chosen over [alternative]?"

## Nitpick (non-blocking)
"nit: Consider renaming this variable to be more descriptive"

## Blocking Issue
"BLOCKING: This could cause a memory leak. Please fix before merging."

## Praise
"Great job on this implementation! Very clean and efficient 👍"
```

## 🚀 GitHub Actions & CI/CD

### Essential Workflows

#### CI Pipeline (.github/workflows/ci.yml)
```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run type-check

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx prisma migrate dev
      - run: npm test
      - run: npx playwright test

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
```

## 📊 Project Management

### Milestones
```yaml
Sprint Planning:
  - 2-week sprints
  - Clear deliverables
  - Linked issues and PRs

Release Planning:
  - Version milestones (v1.0.0, v1.1.0)
  - Feature freeze dates
  - Testing periods
```

### GitHub Projects Integration
```yaml
Board Columns:
  - Backlog: Unplanned work
  - To Do: Sprint planned
  - In Progress: Being worked on
  - Review: In code review
  - Testing: QA phase
  - Done: Completed

Automation:
  - New issues → Backlog
  - PR created → In Progress
  - PR approved → Testing
  - PR merged → Done
```

## 🔐 Security Best Practices

### Secret Management
```yaml
Never Commit:
  - API keys
  - Database passwords
  - JWT secrets
  - OAuth tokens
  - Private certificates

Use Instead:
  - GitHub Secrets for Actions
  - .env files (gitignored)
  - Environment variables
  - Secret management services
```

### Security Scanning
```yaml
Automated Scans:
  - Dependabot for dependency updates
  - CodeQL for vulnerability scanning
  - Secret scanning enabled
  - Security advisories monitored
```

## 📈 Metrics & Monitoring

### Key Metrics
```yaml
Code Quality:
  - Code coverage > 80%
  - No critical security issues
  - Technical debt ratio < 5%

Development Velocity:
  - PR merge time < 24 hours
  - Issue resolution time < 1 week
  - Build success rate > 95%

Collaboration:
  - PR review time < 4 hours
  - Issue response time < 24 hours
  - Documentation updates with code
```

## 🎯 MCP Integration Best Practices

### Automated MCP Workflows
```python
# Before creating PR
serena.find_symbol("affected_code")
playwright.test_changes()
postgres.verify_data()

# During PR creation
github.create_pull_request(
    title=f"[{type}] {description} (#{issue})",
    body=generated_from_template,
    labels=auto_determined_labels
)

# After PR merge
notion.update_documentation()
memory.store_pattern(successful_solution)
reddit.share_solution(if_novel)
```

### MCP-Driven Issue Resolution
```python
# Issue created
issue = github.get_issue(number)

# Auto-research
solutions = await Promise.all([
    reddit.search(issue.title),
    brave_search.search(f"{issue.title} solution"),
    context7.get_docs(related_library)
])

# Add findings as comment
github.add_issue_comment(
    issue_number,
    formatted_research_results
)
```

## ✅ Success Criteria

### You're following best practices when:
- [ ] Every commit has a clear, conventional message
- [ ] PRs are small and focused
- [ ] Issues are well-documented with templates
- [ ] Code reviews are constructive and timely
- [ ] CI/CD pipeline catches issues before merge
- [ ] Documentation is updated with code
- [ ] Security is considered in every change
- [ ] MCP servers automate repetitive tasks

## 📚 Resources

- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Git Best Practices](https://github.com/github/gitignore)

---

**Version**: 1.0.0
**Last Updated**: Session 050
**Status**: Complete Best Practices Guide
**Integration**: 17 MCP Servers Fully Integrated