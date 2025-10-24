# GitHub Workflow Integration (v3.5)

**Version**: 3.5 (GitHub MCP Integration)
**Purpose**: GitHub-integrated task management with MCP servers
**Created**: 2025-10-24

---

## Overview

v3.5 integrates GitHub MCP servers (25 tools) with Vextrus ERP workflows for:
- **Task Management**: Create GitHub issues for each task
- **Progress Tracking**: Update issues with checkpoints and progress
- **Git Worktree Automation**: Scripts for parallel development
- **Context Optimization**: On-demand MCP loading (<50k tokens target)

**GitHub MCP Tools**: 25 tools for repository, issue, PR, and project management

---

## Quick Start

### Enable GitHub MCP (On-Demand)

```bash
# Enable GitHub MCP only when needed
/mcp enable github

# After task completion, disable to save context
/mcp disable github
```

**Context Impact**:
- Disabled: 0 tokens
- Enabled: ~19.6k tokens (9.8% of 200k)
- **Optimization**: v3.5 uses on-demand loading to stay <50k total

---

## Workflows by Task Type

### Simple Task (1-4 hours)

**No GitHub integration needed** - Just implement and commit directly.

**See**: `task-templates/simple-task-template.md`

---

### Medium Task (4-8 hours)

**Optional GitHub integration** - Create issue for tracking progress.

**Pattern**:
1. Create GitHub issue with task description
2. Implement systematically
3. Update issue comments with progress
4. Close issue on PR merge

**See**: `task-templates/medium-task-template.md`

---

### Complex Task (Multi-day)

**ALWAYS use GitHub integration** - Full issue tracking + git worktree automation.

**Pattern**:
1. **Plan Mode**: Create GitHub issue with comprehensive plan
2. **Git Worktree**: Use automated scripts for parallel development
3. **Checkpoints**: Sync checkpoint summaries to GitHub issue comments
4. **PR Creation**: Auto-create PR with comprehensive description
5. **Merge & Cleanup**: Close issue, remove worktrees

**See**: `task-templates/complex-task-template.md`

---

## Folder Structure

```
.claude/github/
├── README.md (this file)
├── task-templates/
│   ├── simple-task-template.md
│   ├── medium-task-template.md
│   └── complex-task-template.md
├── workflows/
│   ├── plan-mode-workflow.md (Plan → Explore → Implement)
│   ├── git-worktree-automation.md (2-5x parallel speedup)
│   └── checkpoint-logs-integration.md (GitHub issue tracking)
├── scripts/
│   ├── create-worktree.sh (Automated worktree creation)
│   ├── sync-checkpoint.sh (Checkpoint → GitHub issue)
│   └── cleanup-worktrees.sh (Prune completed worktrees)
└── mcp-integration/
    ├── github-mcp-tools.md (25 tools reference)
    └── context-optimization.md (On-demand MCP usage)
```

---

## GitHub MCP Tools

**25 Tools Organized by Category**:

### Repository Management (8 tools)
- `create_or_update_file` - Create/update single file
- `push_files` - Push multiple files in one commit
- `get_file_contents` - Read file contents
- `search_repositories` - Search GitHub repos
- `create_repository` - Create new repo
- `get_repository` - Get repo details
- `fork_repository` - Fork repo
- `create_branch` - Create branch

### Issue Management (7 tools)
- `create_issue` - Create GitHub issue
- `update_issue` - Update issue (title, body, labels, state)
- `add_issue_comment` - Add comment to issue
- `get_issue` - Get issue details
- `list_issues` - List/filter issues
- `search_issues` - Search issues across repos

### Pull Request Management (10 tools)
- `create_pull_request` - Create PR
- `get_pull_request` - Get PR details
- `list_pull_requests` - List/filter PRs
- `update_pull_request_branch` - Update PR with base branch changes
- `get_pull_request_files` - Get PR file changes
- `get_pull_request_status` - Get PR status checks
- `get_pull_request_comments` - Get PR review comments
- `get_pull_request_reviews` - Get PR reviews
- `create_pull_request_review` - Create PR review
- `merge_pull_request` - Merge PR

**See**: `mcp-integration/github-mcp-tools.md` for complete documentation

---

## Context Optimization

**Current Context** (with GitHub MCP enabled):
- System: 24.9k (12.5%)
- Tools: 21k (10.5%)
- **GitHub MCP: 19.6k (9.8%)** ← Major overhead
- Agents: 6.2k (3.1%)
- Memory: 5.9k (3%)
- **Total: ~85k (42%)** ← Too high

**v3.5 Target** (with on-demand loading):
- System: 24.9k (12.5%)
- Tools: 21k (10.5%)
- **GitHub MCP: 5k (2.5%)** ← Only when needed
- Agents: 6.2k (3.1%)
- Memory: 3k (1.5%)
- CLAUDE.md: 1k (0.5%)
- VEXTRUS-PATTERNS.md: 3k (1.5%)
- Skills: 0.4k (0.2%)
- **Total: ~46k (23%)** ← Target achieved ✅

**Optimization Strategy**:
1. **Enable on-demand**: `/mcp enable github` only when using GitHub features
2. **Disable after use**: `/mcp disable github` when task complete
3. **Monitor**: Use `/context` command before and after

**See**: `mcp-integration/context-optimization.md` for detailed strategies

---

## Git Worktree Automation

**Use For**: Complex features requiring parallel development

**Scripts Provided**:
- `create-worktree.sh` - Automated worktree setup
- `sync-checkpoint.sh` - Sync checkpoint to GitHub issue
- `cleanup-worktrees.sh` - Prune completed worktrees

**Benefits**:
- **2-5x wall-clock speedup** (true parallel work)
- **Clean isolation** (no branch switching)
- **Automated setup** (scripts handle boilerplate)

**See**: `workflows/git-worktree-automation.md` for complete guide

---

## Best Practices

### When to Use GitHub MCP

✅ **Use GitHub MCP when**:
- Creating tasks for multi-day features
- Tracking progress on complex implementations
- Creating PRs with comprehensive descriptions
- Need to review existing issues/PRs
- Automating task management workflows

❌ **Skip GitHub MCP for**:
- Simple tasks (<4 hours)
- Quick bug fixes
- Internal exploration
- When context is already high (>40%)

### Context Management

**Before Enabling GitHub MCP**:
```bash
/context  # Check current usage
```

**If usage >35%**:
- Consider manual GitHub interaction (web UI)
- Prioritize other optimizations first
- Enable only for critical task tracking

**After Task Complete**:
```bash
/mcp disable github  # Free 14.6k tokens
```

### Task Workflow Integration

**Simple Tasks**: No GitHub integration
**Medium Tasks**: Optional GitHub issue (for tracking only)
**Complex Tasks**: ALWAYS use full integration (issue + worktree + checkpoints)

---

## Examples

### Example 1: Medium Task with GitHub Tracking

```bash
# 1. Enable GitHub MCP
/mcp enable github

# 2. Create GitHub issue
mcp__github__create_issue(
  owner: "your-org",
  repo: "vextrus-erp",
  title: "Implement payment reconciliation feature",
  body: "..."
)

# 3. Implement feature
# ... (normal workflow) ...

# 4. Update issue with progress
mcp__github__add_issue_comment(
  owner: "your-org",
  repo: "vextrus-erp",
  issue_number: 123,
  body: "✅ Phase 1 complete: ReconciliationService implemented"
)

# 5. Create PR
mcp__github__create_pull_request(
  owner: "your-org",
  repo: "vextrus-erp",
  title: "feat: payment reconciliation",
  head: "feature/payment-reconciliation",
  base: "main",
  body: "Closes #123\n\n## Summary\n..."
)

# 6. Disable GitHub MCP
/mcp disable github
```

### Example 2: Complex Task with Git Worktree

```bash
# 1. Enable GitHub MCP
/mcp enable github

# 2. Create issue
# ... (as above) ...

# 3. Create worktrees for parallel development
./claude/github/scripts/create-worktree.sh invoice-backend finance
./.claude/github/scripts/create-worktree.sh invoice-frontend web
./.claude/github/scripts/create-worktree.sh invoice-tests tests

# 4. Develop in parallel (3 Claude instances)
# Terminal 1: cd ../vextrus-invoice-backend && claude
# Terminal 2: cd ../vextrus-invoice-frontend && claude
# Terminal 3: cd ../vextrus-invoice-tests && claude

# 5. Sync checkpoints to GitHub issue
./.claude/github/scripts/sync-checkpoint.sh checkpoint-phase2.md 123

# 6. Merge and cleanup
git merge feature/invoice-backend
git merge feature/invoice-frontend
git merge feature/invoice-tests
./.claude/github/scripts/cleanup-worktrees.sh invoice-*

# 7. Close issue and disable MCP
mcp__github__update_issue(
  owner: "your-org",
  repo: "vextrus-erp",
  issue_number: 123,
  state: "closed"
)
/mcp disable github
```

---

## Migration from v3.0

**v3.0 → v3.5 Enhancements**:
- ✅ GitHub MCP integration (25 tools)
- ✅ Git worktree automation scripts (3 scripts)
- ✅ Task templates with GitHub tracking (3 templates)
- ✅ Context optimization (on-demand MCP loading)
- ✅ Checkpoint-logs integration with GitHub issues

**No Breaking Changes**: v3.0 workflows still work without GitHub integration

**Optional Adoption**: Use GitHub features only when beneficial for complex tasks

---

## Troubleshooting

**GitHub MCP not available?**
```bash
/mcp list  # Check if github MCP is installed
# If not listed, install github MCP server
```

**Context too high after enabling?**
```bash
/mcp disable github  # Disable immediately
# Manually use GitHub web UI instead
```

**Git worktree scripts not executable?**
```bash
chmod +x .claude/github/scripts/*.sh
```

**Checkpoint sync failing?**
```bash
# Ensure GitHub issue exists first
# Check issue number is correct
# Verify GitHub MCP is enabled
```

---

**Version**: 3.5 (GitHub MCP Integration)
**Status**: ✅ PRODUCTION READY
**Context Impact**: +0k (on-demand only)

**See Also**:
- `task-templates/` - GitHub-integrated task templates
- `workflows/` - Detailed workflow guides
- `scripts/` - Automation scripts
- `mcp-integration/` - GitHub MCP tools reference
- `../workflows/` - Core v3.0 workflows (still valid)
- `../agents/` - 33 agents directory
- `../skills/` - 4 skills catalog
