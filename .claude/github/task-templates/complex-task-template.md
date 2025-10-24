# Complex Task Template (Multi-day)

**Use For**: 5% of work, multi-day features requiring comprehensive planning
**GitHub Integration**: ✅ MANDATORY (full issue tracking + PR management)
**Git Worktree**: ✅ RECOMMENDED (2-5x parallel speedup)
**Pattern**: PLAN → EXECUTE → ASSESS → COMMIT (Checkpoint-Driven)

---

## Prerequisites

**Before Starting**:
```bash
# 1. Check context capacity
/context  # Should be <30% before enabling GitHub MCP

# 2. Enable GitHub MCP
/mcp enable github

# 3. Verify git worktree scripts are executable
chmod +x .claude/github/scripts/*.sh
```

---

## Phase 1: PLAN (Day 1, 2-4 hours)

### 1.1 Create GitHub Issue with Comprehensive Plan

```typescript
mcp__github__create_issue({
  owner: "your-org",
  repo: "vextrus-erp",
  title: "Implement invoice-payment linking with reconciliation",
  body: `
## Goal
Implement comprehensive invoice-payment linking feature with automatic reconciliation,
supporting multi-tenant isolation and Bangladesh compliance.

## Scope
- Cross-aggregate coordination (Invoice + Payment aggregates)
- Automatic invoice-payment matching logic
- Reconciliation service with bank statement parsing
- Multi-step approval workflow
- Mushak 6.3 integration
- GraphQL Federation v2 API
- Comprehensive testing (90%+ coverage)

## Estimated Time
3-5 days (15-25 hours)

## Phase Breakdown

### Phase 1: Planning (Day 1, 4 hours)
- architecture-strategist: Design cross-aggregate coordination
- best-practices-researcher: Bank reconciliation patterns
- Create implementation plan (TodoWrite: 10-15 items)
- **Checkpoint**: Plan complete

### Phase 2: Domain Layer (Day 2, 6-8 hours)
- Implement Payment aggregate
- Implement Reconciliation aggregate
- Add domain events
- Unit tests (domain layer)
- **Checkpoint**: Domain layer complete

### Phase 3: Application Layer (Day 3, 6-8 hours)
- CQRS command handlers
- CQRS query handlers
- Projection handlers
- Integration tests
- **Checkpoint**: Application layer complete

### Phase 4: Presentation Layer (Day 4, 4-6 hours)
- GraphQL resolvers (Federation v2)
- Input validation
- E2E tests
- **Checkpoint**: Presentation layer complete

### Phase 5: Review & Polish (Day 5, 2-4 hours)
- kieran-typescript-reviewer (MANDATORY)
- security-sentinel (auth/RBAC verification)
- performance-oracle (caching optimization)
- Fix critical issues
- **Final Checkpoint**: Production-ready

## Agent Plan
- architecture-strategist (design)
- best-practices-researcher (external patterns)
- kieran-typescript-reviewer (quality review)
- security-sentinel (security audit)
- performance-oracle (performance optimization)
- data-integrity-guardian (if migrations needed)

## Success Criteria
- [ ] All tests passing (90%+ coverage)
- [ ] Build passing (zero errors)
- [ ] Multi-tenant isolation verified
- [ ] Bangladesh compliance (VAT, Mushak 6.3)
- [ ] Performance <300ms (95th percentile)
- [ ] Agent reviews approved (3-4 agents)
- [ ] Comprehensive checkpoints (300-600 lines each)
  `,
  labels: ["feature", "finance", "complex", "multi-day"]
})
```

**Save issue number**: e.g., #123

### 1.2 Parallel Agent Research (30-60 min)

**Invoke multiple agents simultaneously**:

```typescript
// Terminal 1 (or sequential in same terminal)
"Design the invoice-payment linking feature with cross-aggregate coordination,
ensuring multi-tenant isolation and Bangladesh Mushak 6.3 compliance"
// → architecture-strategist agent

// Terminal 2 (or after first completes)
"Research bank reconciliation best practices for construction industry ERP systems"
// → best-practices-researcher agent
```

### 1.3 Create Implementation Plan (30-60 min)

**Use TodoWrite** with 10-15 items:

```typescript
TodoWrite: [
  { content: "Design cross-aggregate coordination", status: "completed" },
  { content: "Implement Payment aggregate", status: "pending" },
  { content: "Implement Reconciliation aggregate", status: "pending" },
  { content: "Add CQRS command handlers", status: "pending" },
  { content: "Add CQRS query handlers", status: "pending" },
  { content: "Add GraphQL resolvers (Federation v2)", status: "pending" },
  { content: "Add unit tests (90%+ coverage)", status: "pending" },
  { content: "Add integration tests", status: "pending" },
  { content: "kieran-typescript-reviewer review", status: "pending" },
  { content: "security-sentinel audit", status: "pending" },
  { content: "Create final checkpoint", status: "pending" },
]
```

### 1.4 Create Day 1 Checkpoint (300-600 lines)

```bash
# Create checkpoint file
cat > sessions/tasks/checkpoint-day1-planning.md << 'EOF'
# Phase 1 Day 1: Planning COMPLETE

## Summary
- architecture-strategist: Cross-aggregate design complete
- best-practices-researcher: Bank reconciliation patterns identified
- Implementation plan: 11 tasks defined

## Design Decisions
1. **Cross-Aggregate Coordination**: Event-driven (InvoiceCreated → PaymentMatching)
2. **Bank Reconciliation**: CSV parser + fuzzy matching algorithm
3. **Multi-Tenant**: Schema-based isolation (tenant_* PostgreSQL schemas)
4. **Bangladesh Compliance**: Mushak 6.3 auto-generation on invoice approval

## Agent Outputs
### architecture-strategist
[Paste agent output summary here]

### best-practices-researcher
[Paste agent output summary here]

## Next Session Plan
**Task**: Implement Payment aggregate (domain layer)
**Context Load**: Read this checkpoint + VEXTRUS-PATTERNS.md (Event Sourcing)
**Estimated Time**: 3-4 hours
EOF

# Sync to GitHub issue
./.claude/github/scripts/sync-checkpoint.sh sessions/tasks/checkpoint-day1-planning.md 123
```

---

## Phase 2-4: EXECUTE (Day 2-4, 16-22 hours)

### Option A: Sequential Development (Standard)

**Execute systematically, phase by phase**:

```bash
# Day 2: Domain Layer
1. Read identified files COMPLETELY
2. Implement Payment aggregate
3. Implement Reconciliation aggregate
4. Write unit tests
5. pnpm build && npm test
6. git commit -m "feat: Add Payment and Reconciliation aggregates"
7. Create Day 2 checkpoint
8. Sync to GitHub issue #123

# Day 3: Application Layer
[Repeat pattern above]

# Day 4: Presentation Layer
[Repeat pattern above]
```

**Update GitHub issue every 2-3 hours**:
```typescript
mcp__github__add_issue_comment({
  owner: "your-org",
  repo: "vextrus-erp",
  issue_number: 123,
  body: "✅ Day 2 Phase 1 complete: Payment aggregate implemented with 15 tests"
})
```

### Option B: Git Worktree Parallel Development (2-5x faster)

**Create parallel worktrees** for independent work:

```bash
# 1. Create worktrees for parallel development
./.claude/github/scripts/create-worktree.sh invoice-backend finance
./.claude/github/scripts/create-worktree.sh invoice-frontend web
./.claude/github/scripts/create-worktree.sh invoice-tests tests

# Directory structure created:
# ../vextrus-invoice-backend (branch: feature/invoice-backend)
# ../vextrus-invoice-frontend (branch: feature/invoice-frontend)
# ../vextrus-invoice-tests (branch: feature/invoice-tests)

# 2. Develop in parallel (3 separate Claude instances)
# Terminal 1:
cd ../vextrus-invoice-backend
claude
# Work on: Domain + Application layers

# Terminal 2:
cd ../vextrus-invoice-frontend
claude
# Work on: GraphQL resolvers + Presentation layer

# Terminal 3:
cd ../vextrus-invoice-tests
claude
# Work on: Integration + E2E tests

# 3. Commit progress in each worktree independently
# Each worktree has its own branch and commits

# 4. Sync checkpoints to GitHub issue
./.claude/github/scripts/sync-checkpoint.sh ../vextrus-invoice-backend/checkpoint-day2.md 123
```

**Merge strategy** (after parallel work complete):

```bash
# 1. Return to main worktree
cd ~/vextrus-erp

# 2. Merge branches sequentially
git checkout main
git merge feature/invoice-backend  # Merge domain + application
git merge feature/invoice-frontend  # Merge presentation
git merge feature/invoice-tests     # Merge tests

# 3. Run full test suite
pnpm build && npm test

# 4. Cleanup worktrees
./.claude/github/scripts/cleanup-worktrees.sh invoice-*
```

**See**: `workflows/git-worktree-automation.md` for detailed guide

---

## Phase 5: ASSESS (Day 5, 2-4 hours)

### 5.1 Quality Review with Agents (60-90 min)

**ALWAYS use** (in this order):
1. `kieran-typescript-reviewer` (MANDATORY, strict quality)
2. `security-sentinel` (if auth, RBAC, sensitive data)
3. `performance-oracle` (if caching, optimization)
4. `data-integrity-guardian` (if database migrations)

**Example invocations**:

```typescript
// 1. Code quality review
"Review the complete invoice-payment linking implementation for code quality,
TypeScript patterns, and production readiness"
// → kieran-typescript-reviewer agent

// 2. Security audit
"Audit the invoice-payment linking feature for security vulnerabilities,
RBAC compliance, and multi-tenant isolation"
// → security-sentinel agent

// 3. Performance optimization
"Analyze the invoice-payment linking feature for performance bottlenecks
and recommend caching strategies"
// → performance-oracle agent
```

### 5.2 Fix Critical Issues (60-120 min)

**Address agent feedback**:
- Fix all CRITICAL and HIGH severity issues
- Document MEDIUM severity issues for future work
- Ignore LOW severity if time-constrained

**Quality Gates** (NON-NEGOTIABLE):
```bash
pnpm build  # Zero TypeScript errors
npm test    # All tests passing (90%+ coverage)
```

### 5.3 Create Final Checkpoint (600-800 lines)

```bash
cat > sessions/tasks/checkpoint-final-complete.md << 'EOF'
# Phase 5 Day 5: Final Review COMPLETE

## Summary
- Complete invoice-payment linking feature
- Cross-aggregate coordination (Invoice + Payment + Reconciliation)
- Bangladesh compliance (VAT 15%, Mushak 6.3 auto-generation)
- Multi-tenant isolation verified
- Performance optimized (<300ms 95th percentile)

## Files Created (18)
1. services/finance/src/domain/aggregates/payment.aggregate.ts (250 lines)
2. services/finance/src/domain/aggregates/reconciliation.aggregate.ts (180 lines)
[... complete file list ...]

## Files Modified (12)
1. services/finance/src/application/invoice.module.ts (+35 lines)
[... complete modification list ...]

## Implementation Details

### Cross-Aggregate Coordination
[Code snippets and design decisions...]

### Bangladesh Compliance
[VAT calculation, Mushak 6.3 generation...]

### Multi-Tenant Isolation
[Schema-based isolation verification...]

## Tests Added (45)
- Unit tests: 32 (domain layer, 95% coverage)
- Integration tests: 8 (application layer)
- E2E tests: 5 (presentation layer)

## Quality Gates ✅
- [x] Build passing (zero TypeScript errors)
- [x] Tests passing (45/45, 92% coverage)
- [x] kieran-typescript-reviewer: ✅ APPROVED (9.5/10 quality)
- [x] security-sentinel: ✅ APPROVED (no vulnerabilities)
- [x] performance-oracle: ✅ APPROVED (<300ms 95th percentile)

## Agent Reviews

### kieran-typescript-reviewer (9.5/10)
- Code quality: Excellent
- TypeScript patterns: Idiomatic
- Production readiness: Ready for deployment
- Minor improvements: [List 2-3 minor suggestions]

### security-sentinel
- Multi-tenant isolation: ✅ Verified
- RBAC implementation: ✅ Correct
- Input validation: ✅ Comprehensive
- No critical vulnerabilities found

### performance-oracle
- Query performance: <200ms average
- Caching strategy: Optimal (Redis cache-aside)
- Database indexes: 12 composite indexes added
- 95th percentile: 285ms ✅

## Next Steps
1. Create comprehensive PR with full documentation
2. Request review from team (optional)
3. Merge to main after approval
4. Close GitHub issue #123

## Lessons Learned
[Capture key learnings for future complex tasks...]
EOF

# Sync to GitHub issue
./.claude/github/scripts/sync-checkpoint.sh sessions/tasks/checkpoint-final-complete.md 123
```

---

## Phase 6: COMMIT & CLOSE (Day 5, 30-60 min)

### 6.1 Create Comprehensive Pull Request

```typescript
mcp__github__create_pull_request({
  owner: "your-org",
  repo: "vextrus-erp",
  title: "feat: Complete invoice-payment linking with reconciliation",
  head: "feature/invoice-payment-linking",
  base: "main",
  body: `
Closes #123

## Summary
Implemented comprehensive invoice-payment linking feature with:
- Cross-aggregate coordination (Invoice + Payment + Reconciliation)
- Automatic invoice-payment matching logic
- Bank statement reconciliation with CSV parsing
- Multi-step approval workflow
- Bangladesh compliance (VAT 15%, Mushak 6.3)
- GraphQL Federation v2 API
- 45 tests (92% coverage)

## Implementation Highlights

### Cross-Aggregate Coordination
- Event-driven: InvoiceCreated → PaymentMatching
- Idempotent event handlers
- Multi-tenant isolation verified

### Bangladesh Compliance
- VAT calculation: 15% standard rate for construction materials
- Mushak 6.3 auto-generation on invoice approval
- Fiscal year: July-June (NOT calendar year)

### Performance
- Average response time: <200ms
- 95th percentile: 285ms
- Redis caching: 30+ cache keys
- Database indexes: 12 composite indexes

## Test Plan
- [x] Unit tests: 32/32 passing (domain layer, 95% coverage)
- [x] Integration tests: 8/8 passing (application layer)
- [x] E2E tests: 5/5 passing (presentation layer)
- [x] Build passing (zero TypeScript errors)
- [x] Performance target: <300ms 95th percentile ✅

## Quality Reviews
- [x] kieran-typescript-reviewer: ✅ APPROVED (9.5/10 quality)
- [x] security-sentinel: ✅ APPROVED (no vulnerabilities)
- [x] performance-oracle: ✅ APPROVED (<300ms)

## Checkpoints
- Day 1: Planning complete ([link](sessions/tasks/checkpoint-day1-planning.md))
- Day 2: Domain layer complete ([link](sessions/tasks/checkpoint-day2-domain.md))
- Day 3: Application layer complete ([link](sessions/tasks/checkpoint-day3-application.md))
- Day 4: Presentation layer complete ([link](sessions/tasks/checkpoint-day4-presentation.md))
- Day 5: Final review complete ([link](sessions/tasks/checkpoint-final-complete.md))

## Files Changed
- 18 files created
- 12 files modified
- 2,450 lines added
- 85 lines deleted

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
  `
})
```

### 6.2 Cleanup and Close

```bash
# 1. Cleanup worktrees (if used)
./.claude/github/scripts/cleanup-worktrees.sh invoice-*

# 2. Update GitHub issue to closed
mcp__github__update_issue({
  owner: "your-org",
  repo: "vextrus-erp",
  issue_number: 123,
  state: "closed"
})

# 3. Disable GitHub MCP
/mcp disable github  # Free 14.6k tokens

# 4. Archive checkpoints
mv sessions/tasks/checkpoint-*.md sessions/tasks/done/
```

---

## Success Metrics

**Time Distribution**:
- Planning (Day 1): 4 hours (16%)
- Execution (Day 2-4): 18 hours (72%)
- Review (Day 5): 3 hours (12%)
- **Total**: 25 hours over 5 days

**Agent Usage**:
- Planning: 2 agents (architecture-strategist, best-practices-researcher)
- Review: 3-4 agents (kieran-typescript-reviewer, security-sentinel, performance-oracle)
- **Total**: 5-6 agents

**GitHub Integration**:
- 1 issue created
- 10-15 issue comments (progress tracking)
- 5 checkpoints synced to issue
- 1 comprehensive PR created

**Quality**:
- Code quality: 9.5/10 (kieran-typescript-reviewer)
- Test coverage: 92%
- Performance: <300ms 95th percentile
- Zero rework: <5%

---

## Tips for Multi-Day Success

**Context Management**:
- Monitor `/context` daily
- Disable GitHub MCP overnight (save 14.6k tokens)
- Re-enable next morning when resuming work

**Checkpoint Discipline**:
- Create checkpoint EVERY DAY (300-600 lines)
- Sync to GitHub issue immediately
- Next session: Read checkpoint first (5-10 min context load)

**Git Worktree Strategy**:
- Use for independent parallel work only
- Don't parallelize dependent work
- Merge frequently (daily) to avoid conflicts

**Agent Review**:
- ALWAYS use kieran-typescript-reviewer (non-negotiable)
- Use specialized agents as needed (security, performance)
- Fix critical issues before final checkpoint

**Progress Tracking**:
- Update TodoWrite daily
- Update GitHub issue every 2-3 hours
- Sync checkpoints daily

---

**Estimated Time**: 2-5 days (15-25 hours)
**Success Rate**: 85%+
**Agent Usage**: 5-8 agents
**GitHub Integration**: Mandatory
**Git Worktree**: Recommended (2-5x speedup)

**Proven Quality**: 9.5/10 (finance task), <5% rework, 0 bugs

**See Also**:
- `.claude/workflows/complex-task-workflow.md` - Detailed workflow
- `workflows/checkpoint-driven.md` - Checkpoint best practices
- `workflows/git-worktree-automation.md` - Parallel development guide
- `.claude/agents/DECISION-TREE.md` - Agent selection framework
