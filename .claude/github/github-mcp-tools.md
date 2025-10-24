# GitHub MCP Tools Reference

**Purpose**: Comprehensive reference for 25 GitHub MCP tools
**Context Overhead**: 19.6k tokens (9.8%) when enabled, 5k (2.5%) on-demand
**Strategy**: Enable only when needed (`/mcp enable github`)

---

## Quick Reference

| Category | Tools | Use Cases |
|----------|-------|-----------|
| **Repository** | 3 | Create, fork, search repos |
| **Files** | 3 | Read, write, push files |
| **Issues** | 6 | Create, track, update issues |
| **Pull Requests** | 10 | Create, review, merge PRs |
| **Branches** | 1 | Create feature branches |
| **Commits** | 1 | List commit history |
| **Search** | 3 | Search code, issues, users |

**Total**: 25 tools (2 missing: get_repository, create_release)

---

## Repository Operations (3 tools)

### 1. search_repositories

**Purpose**: Find repositories by search criteria

**Use Cases**:
- Find example implementations of patterns
- Research similar projects
- Discover libraries/frameworks

**Parameters**:
```typescript
{
  query: string,        // Search query (GitHub search syntax)
  page?: number,        // Page number (default: 1)
  perPage?: number      // Results per page (default: 30, max: 100)
}
```

**Example**:
```typescript
// Find TypeScript GraphQL Federation repositories
mcp__github__search_repositories({
  query: "graphql federation language:typescript stars:>100",
  perPage: 10
})
```

**Search Syntax**:
- `graphql federation` - Keywords
- `language:typescript` - Language filter
- `stars:>100` - Minimum stars
- `pushed:>2024-01-01` - Recent activity
- `topic:microservices` - Topic tag

---

### 2. create_repository

**Purpose**: Create new GitHub repository

**Use Cases**:
- Initialize new service repository
- Create documentation repository
- Set up demo/example repository

**Parameters**:
```typescript
{
  name: string,          // Repository name (required)
  description?: string,  // Repository description
  private?: boolean,     // Private repository (default: false)
  autoInit?: boolean     // Initialize with README (default: false)
}
```

**Example**:
```typescript
// Create new finance service repository
mcp__github__create_repository({
  name: "vextrus-finance-service",
  description: "Finance microservice for Vextrus ERP (Event Sourcing + CQRS + GraphQL)",
  private: true,
  autoInit: true
})
```

**Note**: Creates in your personal account. For organization repos, use GitHub CLI or web interface.

---

### 3. fork_repository

**Purpose**: Fork repository to your account

**Use Cases**:
- Contribute to open source projects
- Create experimental branches
- Maintain customized versions

**Parameters**:
```typescript
{
  owner: string,         // Repository owner (required)
  repo: string,          // Repository name (required)
  organization?: string  // Fork to organization (optional)
}
```

**Example**:
```typescript
// Fork nestjs/nest for experimentation
mcp__github__fork_repository({
  owner: "nestjs",
  repo: "nest"
})
```

---

## File Operations (3 tools)

### 4. get_file_contents

**Purpose**: Read file or directory contents from repository

**Use Cases**:
- Read configuration files
- Review implementation examples
- Analyze project structure

**Parameters**:
```typescript
{
  owner: string,    // Repository owner (required)
  repo: string,     // Repository name (required)
  path: string,     // File/directory path (required)
  branch?: string   // Branch name (default: default branch)
}
```

**Example**:
```typescript
// Read package.json from main branch
mcp__github__get_file_contents({
  owner: "your-org",
  repo: "vextrus-erp",
  path: "package.json",
  branch: "main"
})
```

**Returns**:
- File: Base64-encoded content + metadata
- Directory: Array of files/directories

---

### 5. create_or_update_file

**Purpose**: Create new file or update existing file

**Use Cases**:
- Update configuration files
- Fix documentation
- Apply hotfixes

**Parameters**:
```typescript
{
  owner: string,    // Repository owner (required)
  repo: string,     // Repository name (required)
  path: string,     // File path (required)
  content: string,  // File content (required)
  message: string,  // Commit message (required)
  branch: string,   // Branch name (required)
  sha?: string      // File SHA (required for updates)
}
```

**Example**:
```typescript
// Update README.md
mcp__github__create_or_update_file({
  owner: "your-org",
  repo: "vextrus-erp",
  path: "README.md",
  content: "# Vextrus ERP\n\nUpdated documentation...",
  message: "docs: Update README with v3.0 information",
  branch: "main",
  sha: "abc123..."  // Get from get_file_contents
})
```

**Note**: Must provide `sha` when updating existing files.

---

### 6. push_files

**Purpose**: Push multiple files in single commit

**Use Cases**:
- Bulk file updates
- Initial repository setup
- Multi-file refactoring

**Parameters**:
```typescript
{
  owner: string,        // Repository owner (required)
  repo: string,         // Repository name (required)
  branch: string,       // Branch name (required)
  files: Array<{        // Files to push (required)
    path: string,
    content: string
  }>,
  message: string       // Commit message (required)
}
```

**Example**:
```typescript
// Push initial project structure
mcp__github__push_files({
  owner: "your-org",
  repo: "vextrus-finance-service",
  branch: "main",
  files: [
    { path: "src/main.ts", content: "..." },
    { path: "src/app.module.ts", content: "..." },
    { path: "package.json", content: "..." },
    { path: "tsconfig.json", content: "..." }
  ],
  message: "feat: Initialize finance service structure"
})
```

---

## Issue Operations (6 tools)

### 7. create_issue

**Purpose**: Create new GitHub issue

**Use Cases**:
- Track feature requests
- Report bugs
- Document tasks

**Parameters**:
```typescript
{
  owner: string,          // Repository owner (required)
  repo: string,           // Repository name (required)
  title: string,          // Issue title (required)
  body?: string,          // Issue description
  labels?: string[],      // Labels (e.g., ["bug", "critical"])
  assignees?: string[],   // Assignees (e.g., ["username"])
  milestone?: number      // Milestone number
}
```

**Example**:
```typescript
// Create feature issue
mcp__github__create_issue({
  owner: "your-org",
  repo: "vextrus-erp",
  title: "feat: Implement payment reconciliation",
  body: `
## Goal
Implement automatic payment reconciliation

## Scope
- Bank statement parsing
- Payment-invoice matching
- Discrepancy detection

## Estimated Time
6-8 hours
  `,
  labels: ["feature", "finance", "medium"]
})
```

---

### 8. list_issues

**Purpose**: List and filter repository issues

**Use Cases**:
- View open issues
- Filter by label/assignee
- Track project progress

**Parameters**:
```typescript
{
  owner: string,         // Repository owner (required)
  repo: string,          // Repository name (required)
  state?: "open" | "closed" | "all",  // Issue state (default: "open")
  labels?: string[],     // Filter by labels
  sort?: "created" | "updated" | "comments",  // Sort by
  direction?: "asc" | "desc",  // Sort direction
  since?: string,        // Only issues updated after date (ISO 8601)
  page?: number,         // Page number
  per_page?: number      // Results per page (max 100)
}
```

**Example**:
```typescript
// List open finance features
mcp__github__list_issues({
  owner: "your-org",
  repo: "vextrus-erp",
  state: "open",
  labels: ["feature", "finance"],
  sort: "created",
  direction: "desc"
})
```

---

### 9. get_issue

**Purpose**: Get detailed issue information

**Use Cases**:
- Read issue description
- Check issue status
- Review issue comments

**Parameters**:
```typescript
{
  owner: string,        // Repository owner (required)
  repo: string,         // Repository name (required)
  issue_number: number  // Issue number (required)
}
```

**Example**:
```typescript
// Get issue #123 details
mcp__github__get_issue({
  owner: "your-org",
  repo: "vextrus-erp",
  issue_number: 123
})
```

---

### 10. update_issue

**Purpose**: Update existing issue

**Use Cases**:
- Close completed issues
- Update issue description
- Change labels/assignees

**Parameters**:
```typescript
{
  owner: string,          // Repository owner (required)
  repo: string,           // Repository name (required)
  issue_number: number,   // Issue number (required)
  title?: string,         // New title
  body?: string,          // New description
  state?: "open" | "closed",  // Issue state
  labels?: string[],      // Labels
  assignees?: string[],   // Assignees
  milestone?: number      // Milestone number
}
```

**Example**:
```typescript
// Close issue after feature completion
mcp__github__update_issue({
  owner: "your-org",
  repo: "vextrus-erp",
  issue_number: 123,
  state: "closed",
  body: `
[Original body]

---

## Completed
Feature implemented successfully in 4.5 days (10% under estimate)

**Quality**: 9.5/10
**Tests**: 45 passing (92% coverage)
**PR**: #456
  `
})
```

---

### 11. add_issue_comment

**Purpose**: Add comment to existing issue

**Use Cases**:
- Sync checkpoints
- Provide updates
- Ask questions

**Parameters**:
```typescript
{
  owner: string,        // Repository owner (required)
  repo: string,         // Repository name (required)
  issue_number: number, // Issue number (required)
  body: string          // Comment body (required)
}
```

**Example**:
```typescript
// Sync checkpoint to issue
mcp__github__add_issue_comment({
  owner: "your-org",
  repo: "vextrus-erp",
  issue_number: 123,
  body: `
## Day 2 End Checkpoint

**Accomplishments**:
- [x] Domain layer complete
- [x] 15 tests passing (92% coverage)
- [x] Quality review: 9.5/10

**Tomorrow**:
- [ ] Application layer (CQRS handlers)
- [ ] GraphQL resolvers
  `
})
```

---

### 12. search_issues

**Purpose**: Search issues across repositories

**Use Cases**:
- Find related issues
- Research similar problems
- Track patterns across projects

**Parameters**:
```typescript
{
  q: string,          // Search query (required)
  sort?: "comments" | "reactions" | "created" | "updated",
  order?: "asc" | "desc",
  page?: number,
  per_page?: number   // Max 100
}
```

**Example**:
```typescript
// Find GraphQL Federation issues
mcp__github__search_issues({
  q: "repo:your-org/vextrus-erp is:issue label:graphql state:open",
  sort: "created",
  order: "desc"
})
```

**Search Syntax**:
- `repo:owner/repo` - Specific repository
- `is:issue` or `is:pr` - Type filter
- `label:bug` - Label filter
- `state:open` - State filter
- `author:username` - Author filter

---

## Pull Request Operations (10 tools)

### 13. create_pull_request

**Purpose**: Create new pull request

**Use Cases**:
- Submit feature for review
- Propose changes
- Merge branches

**Parameters**:
```typescript
{
  owner: string,        // Repository owner (required)
  repo: string,         // Repository name (required)
  title: string,        // PR title (required)
  head: string,         // Source branch (required)
  base: string,         // Target branch (required)
  body?: string,        // PR description
  draft?: boolean,      // Draft PR (default: false)
  maintainer_can_modify?: boolean  // Allow maintainer edits
}
```

**Example**:
```typescript
// Create PR for payment feature
mcp__github__create_pull_request({
  owner: "your-org",
  repo: "vextrus-erp",
  title: "feat: Complete invoice-payment linking with reconciliation",
  head: "feature/invoice-payment-linking",
  base: "main",
  body: `
Closes #123

## Summary
- Cross-aggregate coordination (Invoice + Payment + Reconciliation)
- 45 tests (92% coverage)
- Quality: 9.5/10 (kieran-typescript-reviewer)

## Quality Reviews
- [x] kieran-typescript-reviewer: 9.5/10
- [x] security-sentinel: ✅ APPROVED
- [x] performance-oracle: ✅ APPROVED

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
  `,
  draft: false
})
```

---

### 14. list_pull_requests

**Purpose**: List and filter pull requests

**Use Cases**:
- View open PRs
- Find PRs by state
- Track review progress

**Parameters**:
```typescript
{
  owner: string,         // Repository owner (required)
  repo: string,          // Repository name (required)
  state?: "open" | "closed" | "all",  // PR state (default: "open")
  head?: string,         // Filter by head branch
  base?: string,         // Filter by base branch
  sort?: "created" | "updated" | "popularity" | "long-running",
  direction?: "asc" | "desc",
  page?: number,
  per_page?: number      // Max 100
}
```

**Example**:
```typescript
// List open finance PRs
mcp__github__list_pull_requests({
  owner: "your-org",
  repo: "vextrus-erp",
  state: "open",
  base: "main",
  sort: "updated",
  direction: "desc"
})
```

---

### 15. get_pull_request

**Purpose**: Get detailed PR information

**Use Cases**:
- Check PR status
- Read PR description
- View PR metadata

**Parameters**:
```typescript
{
  owner: string,        // Repository owner (required)
  repo: string,         // Repository name (required)
  pull_number: number   // PR number (required)
}
```

**Example**:
```typescript
// Get PR #456 details
mcp__github__get_pull_request({
  owner: "your-org",
  repo: "vextrus-erp",
  pull_number: 456
})
```

---

### 16. get_pull_request_files

**Purpose**: Get list of files changed in PR

**Use Cases**:
- Review changed files
- Identify scope of changes
- Plan code review

**Parameters**:
```typescript
{
  owner: string,        // Repository owner (required)
  repo: string,         // Repository name (required)
  pull_number: number   // PR number (required)
}
```

**Example**:
```typescript
// Get changed files in PR #456
mcp__github__get_pull_request_files({
  owner: "your-org",
  repo: "vextrus-erp",
  pull_number: 456
})
```

**Returns**: Array of files with additions, deletions, changes, patch

---

### 17. get_pull_request_status

**Purpose**: Get CI/CD status checks for PR

**Use Cases**:
- Check build status
- Verify tests passed
- Review quality gates

**Parameters**:
```typescript
{
  owner: string,        // Repository owner (required)
  repo: string,         // Repository name (required)
  pull_number: number   // PR number (required)
}
```

**Example**:
```typescript
// Check PR #456 status
mcp__github__get_pull_request_status({
  owner: "your-org",
  repo: "vextrus-erp",
  pull_number: 456
})
```

**Returns**: Combined status of all checks (pending, success, failure)

---

### 18. get_pull_request_comments

**Purpose**: Get review comments on PR

**Use Cases**:
- Read feedback
- Address review comments
- Track discussion

**Parameters**:
```typescript
{
  owner: string,        // Repository owner (required)
  repo: string,         // Repository name (required)
  pull_number: number   // PR number (required)
}
```

**Example**:
```typescript
// Get comments on PR #456
mcp__github__get_pull_request_comments({
  owner: "your-org",
  repo: "vextrus-erp",
  pull_number: 456
})
```

---

### 19. get_pull_request_reviews

**Purpose**: Get formal reviews on PR

**Use Cases**:
- Check approval status
- Read review summaries
- Track review progress

**Parameters**:
```typescript
{
  owner: string,        // Repository owner (required)
  repo: string,         // Repository name (required)
  pull_number: number   // PR number (required)
}
```

**Example**:
```typescript
// Get reviews for PR #456
mcp__github__get_pull_request_reviews({
  owner: "your-org",
  repo: "vextrus-erp",
  pull_number: 456
})
```

---

### 20. create_pull_request_review

**Purpose**: Submit formal review on PR

**Use Cases**:
- Approve PR
- Request changes
- Leave review comments

**Parameters**:
```typescript
{
  owner: string,        // Repository owner (required)
  repo: string,         // Repository name (required)
  pull_number: number,  // PR number (required)
  body: string,         // Review body (required)
  event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT",  // Review action (required)
  commit_id?: string,   // Specific commit to review
  comments?: Array<{    // Line comments
    path: string,       // File path
    position?: number,  // Diff position (or use line)
    line?: number,      // Line number
    body: string        // Comment text
  }>
}
```

**Example**:
```typescript
// Approve PR with comments
mcp__github__create_pull_request_review({
  owner: "your-org",
  repo: "vextrus-erp",
  pull_number: 456,
  body: "Excellent work! Domain layer is well-structured.",
  event: "APPROVE",
  comments: [
    {
      path: "services/finance/src/domain/payment/payment.aggregate.ts",
      line: 45,
      body: "Consider adding JSDoc comment for this method"
    }
  ]
})
```

---

### 21. merge_pull_request

**Purpose**: Merge approved PR

**Use Cases**:
- Merge feature to main
- Complete code review
- Deploy changes

**Parameters**:
```typescript
{
  owner: string,        // Repository owner (required)
  repo: string,         // Repository name (required)
  pull_number: number,  // PR number (required)
  merge_method?: "merge" | "squash" | "rebase",  // Merge strategy (default: merge)
  commit_title?: string,     // Custom commit title
  commit_message?: string    // Custom commit message
}
```

**Example**:
```typescript
// Squash and merge PR
mcp__github__merge_pull_request({
  owner: "your-org",
  repo: "vextrus-erp",
  pull_number: 456,
  merge_method: "squash",
  commit_title: "feat: Complete invoice-payment linking (#456)",
  commit_message: "Closes #123\n\n45 tests, 92% coverage, 9.5/10 quality"
})
```

---

### 22. update_pull_request_branch

**Purpose**: Update PR branch with latest base branch

**Use Cases**:
- Resolve merge conflicts
- Update with latest main
- Sync long-running PRs

**Parameters**:
```typescript
{
  owner: string,        // Repository owner (required)
  repo: string,         // Repository name (required)
  pull_number: number,  // PR number (required)
  expected_head_sha?: string  // Expected HEAD SHA (safety check)
}
```

**Example**:
```typescript
// Update PR #456 with latest main
mcp__github__update_pull_request_branch({
  owner: "your-org",
  repo: "vextrus-erp",
  pull_number: 456
})
```

---

## Branch Operations (1 tool)

### 23. create_branch

**Purpose**: Create new branch from existing branch

**Use Cases**:
- Start new feature
- Create hotfix branch
- Set up parallel work

**Parameters**:
```typescript
{
  owner: string,        // Repository owner (required)
  repo: string,         // Repository name (required)
  branch: string,       // New branch name (required)
  from_branch?: string  // Source branch (default: default branch)
}
```

**Example**:
```typescript
// Create feature branch from main
mcp__github__create_branch({
  owner: "your-org",
  repo: "vextrus-erp",
  branch: "feature/payment-reconciliation",
  from_branch: "main"
})
```

---

## Commit Operations (1 tool)

### 24. list_commits

**Purpose**: Get commit history for branch

**Use Cases**:
- Review recent changes
- Track commit history
- Find specific commits

**Parameters**:
```typescript
{
  owner: string,    // Repository owner (required)
  repo: string,     // Repository name (required)
  sha?: string,     // Branch/commit SHA (default: default branch)
  page?: number,    // Page number
  perPage?: number  // Results per page
}
```

**Example**:
```typescript
// Get recent commits on main
mcp__github__list_commits({
  owner: "your-org",
  repo: "vextrus-erp",
  sha: "main",
  perPage: 10
})
```

---

## Search Operations (3 tools)

### 25. search_code

**Purpose**: Search code across GitHub repositories

**Use Cases**:
- Find implementation examples
- Research patterns
- Discover libraries

**Parameters**:
```typescript
{
  q: string,          // Search query (required)
  sort?: "indexed",   // Sort by indexed date
  order?: "asc" | "desc",
  page?: number,
  per_page?: number   // Max 100
}
```

**Example**:
```typescript
// Find GraphQL Federation @key examples
mcp__github__search_code({
  q: "@key directive language:typescript",
  per_page: 10
})
```

**Search Syntax**:
- `@key directive` - Code keywords
- `language:typescript` - Language filter
- `repo:owner/repo` - Specific repository
- `path:src/` - Path filter
- `extension:ts` - File extension

---

### 26. search_users

**Purpose**: Search GitHub users

**Use Cases**:
- Find collaborators
- Discover contributors
- Research expertise

**Parameters**:
```typescript
{
  q: string,          // Search query (required)
  sort?: "followers" | "repositories" | "joined",
  order?: "asc" | "desc",
  page?: number,
  per_page?: number   // Max 100
}
```

**Example**:
```typescript
// Find TypeScript experts in Bangladesh
mcp__github__search_users({
  q: "location:Bangladesh language:TypeScript followers:>100",
  sort: "followers",
  order: "desc"
})
```

---

## Context Optimization Strategies

**GitHub MCP adds 19.6k tokens (9.8%)** when enabled. Use these strategies to minimize overhead:

### Strategy 1: On-Demand Enablement

```bash
# BEFORE using GitHub tools
/mcp enable github

# Use GitHub MCP tools...

# AFTER completing GitHub tasks
/mcp disable github
```

**Savings**: 19.6k → 5k tokens (14.6k saved, 7.3% reduction)

### Strategy 2: Task-Specific Usage

**Simple Tasks** (<4 hours):
- ❌ Don't enable GitHub MCP
- Use git CLI for commits
- GitHub integration overhead not worth it

**Medium Tasks** (4-8 hours):
- ✅ Enable for issue creation only
- Quick enable → create issue → disable
- Total enabled time: <5 minutes

**Complex Tasks** (multi-day):
- ✅ Enable for checkpoints + PRs
- Enable 2-3 times per day (checkpoint sync)
- Enable once at end (PR creation)
- Total enabled time: 30-60 minutes

### Strategy 3: Batch Operations

**Instead of**:
```bash
/mcp enable github
# Create issue
/mcp disable github

/mcp enable github
# Add comment
/mcp disable github

/mcp enable github
# Create PR
/mcp disable github
```

**Do this**:
```bash
/mcp enable github
# Create issue
# Add comment
# Create PR
/mcp disable github
```

**Savings**: 3 enable/disable cycles → 1 cycle

---

## Missing GitHub MCP Tools

**Not Available** (use GitHub CLI instead):
1. `get_repository` - Get repository details
2. `create_release` - Create GitHub release

**Workaround with GitHub CLI**:
```bash
# Get repository details
gh repo view your-org/vextrus-erp

# Create release
gh release create v1.0.0 --title "v1.0.0" --notes "Release notes..."
```

---

## Best Practices

### Issue Tracking
- Use labels consistently (`feature`, `bug`, `finance`, `complex`)
- Link issues to PRs (`Closes #123`)
- Sync checkpoints to issue comments (complex tasks only)

### Pull Request Workflow
1. Create issue first (complex tasks)
2. Create branch
3. Implement feature
4. Create PR with comprehensive description
5. Link PR to issue (`Closes #123`)
6. Submit for review
7. Merge after approval

### Context Management
- Monitor with `/context` command
- Enable GitHub MCP only when needed
- Disable after batch operations
- Target <50k total context (25% usage)

---

## See Also

- `.claude/github/README.md` - GitHub workflow overview
- `.claude/github/task-templates/` - Task-specific templates
- `.claude/github/workflows/checkpoint-logs-integration.md` - Checkpoint sync patterns
- `.claude/github/context-optimization.md` - Advanced optimization strategies

---

**Tool Count**: 25 GitHub MCP tools
**Context Overhead**: 19.6k (enabled) → 5k (on-demand) ✅
**Strategy**: Enable only when needed, batch operations, disable after use
