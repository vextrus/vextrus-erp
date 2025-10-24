# Git Worktree Automation

**Purpose**: 2-5x parallel speedup for complex multi-day features
**Use For**: Complex tasks requiring parallel development across multiple services
**Pattern**: Create → Develop (Parallel) → Merge → Cleanup

---

## When to Use Git Worktree

✅ **Use git worktree when**:
- Multi-day feature (>8 hours total)
- Multiple services involved (backend + frontend + tests)
- Independent parallel work possible
- Wall-clock time matters (deadlines)

❌ **Skip git worktree for**:
- Simple tasks (<4 hours)
- Single service changes
- Sequential dependencies (can't parallelize)
- Learning/exploration (overhead not worth it)

---

## Quick Start

### Automated Scripts (Recommended)

```bash
# 1. Create worktree for backend work
./.claude/github/scripts/create-worktree.sh invoice-backend finance

# 2. Create worktree for frontend work
./.claude/github/scripts/create-worktree.sh invoice-frontend web

# 3. Create worktree for tests
./.claude/github/scripts/create-worktree.sh invoice-tests tests

# 4. Develop in parallel (3 Claude instances)
# Terminal 1: cd ../vextrus-invoice-backend && claude
# Terminal 2: cd ../vextrus-invoice-frontend && claude
# Terminal 3: cd ../vextrus-invoice-tests && claude

# 5. Merge when complete
cd ~/vextrus-erp
git merge feature/invoice-backend
git merge feature/invoice-frontend
git merge feature/invoice-tests

# 6. Cleanup
./.claude/github/scripts/cleanup-worktrees.sh invoice-*
```

---

## Scripts Reference

### 1. create-worktree.sh

**Purpose**: Automated worktree creation with branch setup

**Usage**:
```bash
./claude/github/scripts/create-worktree.sh <feature-name> <service-name>
```

**Example**:
```bash
./.claude/github/scripts/create-worktree.sh payment-reconciliation finance
```

**Creates**:
- Worktree directory: `../vextrus-payment-reconciliation`
- Branch: `feature/finance-payment-reconciliation`
- Copies service-specific CLAUDE.md (if exists)

**Script Location**: `.claude/github/scripts/create-worktree.sh`

---

### 2. sync-checkpoint.sh

**Purpose**: Sync checkpoint to GitHub issue comment

**Usage**:
```bash
./.claude/github/scripts/sync-checkpoint.sh <checkpoint-file> <issue-number>
```

**Example**:
```bash
./.claude/github/scripts/sync-checkpoint.sh checkpoint-day2.md 123
```

**Requires**: GitHub MCP enabled (`/mcp enable github`)

**Script Location**: `.claude/github/scripts/sync-checkpoint.sh`

---

### 3. cleanup-worktrees.sh

**Purpose**: Prune completed worktrees

**Usage**:
```bash
./.claude/github/scripts/cleanup-worktrees.sh <pattern>
```

**Example**:
```bash
./.claude/github/scripts/cleanup-worktrees.sh invoice-*
```

**Removes**: All worktrees matching pattern

**Script Location**: `.claude/github/scripts/cleanup-worktrees.sh`

---

## Workflow Pattern

### Phase 1: Setup (5-10 min)

**1.1 Identify Parallel Work Opportunities**:

**Example breakdown** for "Invoice-Payment Linking":
- **Worktree 1 (Backend)**: Domain + Application layers
- **Worktree 2 (Frontend)**: GraphQL resolvers + Presentation
- **Worktree 3 (Tests)**: Integration + E2E tests

**Key**: Work must be independent (minimal cross-dependencies)

**1.2 Create Worktrees**:
```bash
# Backend work
./.claude/github/scripts/create-worktree.sh invoice-backend finance

# Frontend work
./.claude/github/scripts/create-worktree.sh invoice-frontend web

# Tests
./.claude/github/scripts/create-worktree.sh invoice-tests tests
```

---

### Phase 2: Parallel Development (varies)

**2.1 Launch Multiple Claude Instances**:

```bash
# Terminal 1
cd ../vextrus-invoice-backend
claude
# Work on: Domain layer (aggregates, events, value objects)
#          Application layer (CQRS handlers, services)

# Terminal 2
cd ../vextrus-invoice-frontend
claude
# Work on: GraphQL resolvers (Federation v2)
#          Input validation, DTOs
#          Presentation layer

# Terminal 3
cd ../vextrus-invoice-tests
claude
# Work on: Integration tests (CQRS flows)
#          E2E tests (GraphQL mutations/queries)
```

**2.2 Develop Independently**:
- Each worktree has its own branch
- Each worktree has independent commits
- No context switching overhead
- No branch switching overhead

**2.3 Commit Progress Regularly**:
```bash
# In each worktree, commit every 1-2 hours
git add .
git commit -m "feat: implement Payment aggregate

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Phase 3: Sync & Integration (30-60 min)

**3.1 Return to Main Worktree**:
```bash
cd ~/vextrus-erp
git checkout main
```

**3.2 Merge Branches Sequentially**:
```bash
# Merge in dependency order (backend → frontend → tests)
git merge feature/invoice-backend
# Resolve conflicts if any

git merge feature/invoice-frontend
# May need to update after backend merge

git merge feature/invoice-tests
# Tests validate full integration
```

**3.3 Run Full Test Suite**:
```bash
pnpm build  # Zero TypeScript errors
npm test    # All tests passing
```

**If tests fail**: Fix in main worktree, then continue

---

### Phase 4: Cleanup (2-5 min)

**4.1 Remove Worktrees**:
```bash
./.claude/github/scripts/cleanup-worktrees.sh invoice-*
```

**4.2 Verify Cleanup**:
```bash
git worktree list  # Should show only main worktree
```

**4.3 Delete Remote Branches** (optional):
```bash
git push origin --delete feature/invoice-backend
git push origin --delete feature/invoice-frontend
git push origin --delete feature/invoice-tests
```

---

## Benefits

### Wall-Clock Time Savings

**Sequential Development** (no worktrees):
- Backend: 6 hours
- Frontend: 4 hours
- Tests: 3 hours
- **Total**: 13 hours (sequential)

**Parallel Development** (with worktrees):
- Backend + Frontend + Tests: 6 hours (in parallel)
- Integration: 1 hour
- **Total**: 7 hours (2x speedup)

**Savings**: 6 hours (46% faster)

### Context Benefits

**Without Worktrees**:
- Constant branch switching
- Lost context on each switch
- Mixed work in progress
- Conflict resolution overhead

**With Worktrees**:
- Isolated development environments
- No branch switching
- Clear separation of concerns
- Minimal conflicts (independent work)

---

## Git Aliases (Optional Shortcuts)

Add to `.gitconfig`:

```bash
[alias]
  # Create worktree shortcut
  wt-create = "!f() { git worktree add ../vextrus-$1 -b feature/$1; }; f"

  # List worktrees
  wt-list = worktree list

  # Remove worktree
  wt-remove = worktree remove

  # Prune stale worktrees
  wt-prune = worktree prune

  # Sync all worktrees with remote
  wt-sync = "!f() { git worktree list | grep vextrus | awk '{print $1}' | xargs -I {} bash -c 'cd {} && git pull'; }; f"
```

**Usage**:
```bash
git wt-create invoice-backend
git wt-list
git wt-remove ../vextrus-invoice-backend
```

---

## Best Practices

### Parallel Work Organization

**Independent Work** (ideal for worktrees):
- Domain layer (aggregates) + Presentation layer (resolvers)
- Backend service + Frontend components
- Implementation + Tests

**Dependent Work** (NOT ideal for worktrees):
- Domain layer → Application layer (sequential dependency)
- Schema changes → Resolver implementation (tight coupling)

**Rule**: If worktree B depends on worktree A being complete, don't parallelize

### Merge Strategy

**Dependency Order**:
1. Merge backend first (provides foundation)
2. Merge frontend second (uses backend)
3. Merge tests last (validates integration)

**Conflict Resolution**:
- Most conflicts occur at merge time
- Keep worktree work independent to minimize conflicts
- Merge frequently (daily) to catch conflicts early

### Checkpoint Syncing

**From Each Worktree**:
```bash
# In ../vextrus-invoice-backend
./.claude/github/scripts/sync-checkpoint.sh checkpoint-backend-day2.md 123

# In ../vextrus-invoice-frontend
./.claude/github/scripts/sync-checkpoint.sh checkpoint-frontend-day2.md 123
```

**Benefit**: Team visibility into parallel progress

---

## Examples

### Example 1: Invoice-Payment Linking (3 Worktrees)

```bash
# Setup (10 min)
./.claude/github/scripts/create-worktree.sh invoice-backend finance
./.claude/github/scripts/create-worktree.sh invoice-frontend web
./.claude/github/scripts/create-worktree.sh invoice-tests tests

# Parallel Development (6 hours wall-clock, 16 hours total work)
# Terminal 1: Backend (6 hours)
#   - Payment aggregate
#   - Reconciliation aggregate
#   - CQRS handlers

# Terminal 2: Frontend (4 hours)
#   - GraphQL resolvers
#   - Input validation

# Terminal 3: Tests (3 hours)
#   - Integration tests
#   - E2E tests

# Merge & Integration (1 hour)
cd ~/vextrus-erp
git merge feature/invoice-backend  # 15 min
git merge feature/invoice-frontend # 10 min
git merge feature/invoice-tests    # 5 min
pnpm build && npm test            # 30 min

# Cleanup (5 min)
./.claude/github/scripts/cleanup-worktrees.sh invoice-*

Total wall-clock: 7 hours (vs 17 hours sequential)
Speedup: 2.4x
```

### Example 2: Multi-Service Feature (2 Worktrees)

```bash
# Setup
./.claude/github/scripts/create-worktree.sh payment-service finance
./.claude/github/scripts/create-worktree.sh notification-service notification

# Parallel Development (8 hours wall-clock)
# Terminal 1: Payment service integration (8 hours)
# Terminal 2: Notification service integration (6 hours)

# Merge (30 min)
cd ~/vextrus-erp
git merge feature/payment-service
git merge feature/notification-service
pnpm build && npm test

# Cleanup
./.claude/github/scripts/cleanup-worktrees.sh *-service

Total wall-clock: 8.5 hours (vs 14 hours sequential)
Speedup: 1.6x
```

---

## Troubleshooting

**Worktree creation fails?**
```bash
# Ensure you're in main worktree
cd ~/vextrus-erp

# Ensure branch doesn't already exist
git branch -D feature/invoice-backend

# Try again
./.claude/github/scripts/create-worktree.sh invoice-backend finance
```

**Merge conflicts?**
```bash
# Resolve conflicts in main worktree
git merge feature/invoice-backend
# Fix conflicts manually
git add .
git merge --continue
```

**Cleanup fails?**
```bash
# Manual cleanup
git worktree remove ../vextrus-invoice-backend --force
git branch -D feature/invoice-backend
```

**Lost track of worktrees?**
```bash
git worktree list  # Shows all worktrees
```

---

## Limitations

**Not Suitable For**:
- Learning/exploration (overhead not worth it)
- Small features (<4 hours)
- Tightly coupled work (many cross-dependencies)
- Shared file modifications (high conflict potential)

**Overhead**:
- Setup time: 10-15 min
- Merge time: 30-60 min
- Mental overhead: Managing 2-3 parallel contexts

**Rule**: Only use if speedup >1.5x (at least 30% time savings)

---

**Pattern**: Create → Develop (Parallel) → Merge → Cleanup

**Time Savings**: 2-5x wall-clock speedup (46-80% faster)

**Best For**: Multi-day features with independent parallel work

**Scripts**: 3 automation scripts (create, sync, cleanup)

**See Also**:
- `.claude/github/scripts/create-worktree.sh` - Automated worktree creation
- `.claude/github/scripts/sync-checkpoint.sh` - Checkpoint syncing
- `.claude/github/scripts/cleanup-worktrees.sh` - Worktree cleanup
- `../task-templates/complex-task-template.md` - Complex task workflow
