# Medium Task Template (4-8 hours)

**Use For**: 15% of work, features requiring planning and multiple agents
**GitHub Integration**: ✅ OPTIONAL (recommended for tracking progress)
**Pattern**: Explore → Read → Execute → Review (Agents) → Commit

---

## Decision: Use GitHub Integration?

✅ **Use GitHub integration when**:
- Feature spans 6-8 hours (close to complex)
- Multiple team members need visibility
- Want structured progress tracking
- Context allows (check `/context` first)

❌ **Skip GitHub integration when**:
- Context already >35%
- Solo work with no collaboration
- Straightforward 4-5 hour task
- Prefer manual tracking

---

## Workflow (With GitHub Integration)

### Phase 1: Plan & Create GitHub Issue (15-30 min)

**1.1 Enable GitHub MCP**:
```bash
/context  # Check current context usage
/mcp enable github  # Enable if <35%
```

**1.2 Create GitHub Issue**:
```typescript
mcp__github__create_issue({
  owner: "your-org",
  repo: "vextrus-erp",
  title: "Implement payment reconciliation feature",
  body: `
## Goal
Implement payment reconciliation with automatic invoice matching

## Scope
- ReconciliationService with bank statement parsing
- Automatic payment-invoice matching logic
- Discrepancy detection and handling
- Integration tests

## Estimated Time
6-8 hours

## Agent Plan
1. pattern-recognition-specialist (analyze existing payment patterns)
2. kieran-typescript-reviewer (final quality review)
  `,
  labels: ["feature", "finance", "medium"]
})
```

**Save issue number** for progress tracking.

---

### Phase 2: Exploration (5-10 min)

**Optional**: Use `/explore` if unfamiliar with codebase area.

```bash
/explore services/finance/src/application/services
```

**Skills that may activate**:
- `haiku-explorer` (fast Haiku 4.5 exploration)

---

### Phase 3: Agent Assistance (15-30 min)

**Invoke planning agents**:

```typescript
// Analyze existing patterns before implementation
"Before implementing payment reconciliation, analyze existing payment processing patterns in the finance service"
// → pattern-recognition-specialist agent activates
```

**Expected output**:
- Existing payment patterns
- Files to read
- Recommended approach

---

### Phase 4: Read Files (20-40 min)

**Read ALL identified files COMPLETELY**:
- services/finance/src/domain/aggregates/payment.aggregate.ts
- services/finance/src/application/services/payment.service.ts
- services/finance/src/application/handlers/create-payment.handler.ts
- VEXTRUS-PATTERNS.md (Event Sourcing, GraphQL Federation sections)

---

### Phase 5: Execute (3-6 hours)

**Implement systematically**:
1. Create domain aggregate (ReconciliationAggregate)
2. Create application services (ReconciliationService)
3. Add CQRS handlers (CreateReconciliationCommand, GetReconciliationQuery)
4. Add GraphQL resolvers
5. Write tests (unit + integration)

**Update GitHub issue periodically**:
```typescript
mcp__github__add_issue_comment({
  owner: "your-org",
  repo: "vextrus-erp",
  issue_number: 123,
  body: "✅ Phase 1 complete: ReconciliationService implemented with bank statement parsing"
})
```

**Skills that may activate**:
- `vextrus-domain-expert` (Bangladesh, construction patterns)
- `graphql-event-sourcing` (GraphQL Federation v2, CQRS)

---

### Phase 6: Quality Review with Agents (15-30 min)

**ALWAYS use kieran-typescript-reviewer**:
```typescript
"Review the payment reconciliation implementation for code quality, TypeScript patterns, and production readiness"
// → kieran-typescript-reviewer agent activates
```

**Conditionally use**:
- `security-sentinel` (if auth, RBAC, sensitive data)
- `performance-oracle` (if caching, optimization)

**Quality Gates (NON-NEGOTIABLE)**:
```bash
pnpm build  # Zero TypeScript errors
npm test    # All tests passing
```

---

### Phase 7: Create PR & Close Issue (10-15 min)

**7.1 Create Pull Request**:
```typescript
mcp__github__create_pull_request({
  owner: "your-org",
  repo: "vextrus-erp",
  title: "feat: payment reconciliation with bank statements",
  head: "feature/payment-reconciliation",
  base: "main",
  body: `
Closes #123

## Summary
- Implemented ReconciliationService with bank statement parsing
- Added automatic payment-invoice matching logic
- Implemented discrepancy detection and handling
- Added 12 unit tests + 3 integration tests

## Test Plan
- [x] Unit tests passing (12/12)
- [x] Integration tests passing (3/3)
- [x] Build passing (zero errors)
- [x] Reviewed by kieran-typescript-reviewer (✅ approved)

## Quality
- Test coverage: 95% (domain layer)
- Performance: <200ms average
- Multi-tenant isolation: Verified

🤖 Generated with Claude Code
  `
})
```

**7.2 Disable GitHub MCP**:
```bash
/mcp disable github  # Free 14.6k tokens
```

---

## Workflow (Without GitHub Integration)

**Simpler version**:

1. **Exploration** (5-10 min): `/explore services/finance`
2. **Agent assistance** (15-30 min): pattern-recognition-specialist
3. **Read files** (20-40 min): ALL identified files COMPLETELY
4. **Execute** (3-6 hours): Implement systematically
5. **Quality review** (15-30 min): kieran-typescript-reviewer
6. **Commit** (30 sec): Comprehensive commit message

**Commit Format**:
```bash
git commit -m "feat: payment reconciliation with bank statements

- Add ReconciliationService with bank statement parsing
- Implement automatic payment-invoice matching
- Add discrepancy detection and handling
- Add 12 unit tests + 3 integration tests
- Reviewed by kieran-typescript-reviewer (✅ approved)

Test coverage: 95% (domain layer)
Performance: <200ms average

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Agent Selection

**Planning Phase** (1-2 agents):
- `pattern-recognition-specialist` (analyze existing patterns)
- `architecture-strategist` (if cross-service design needed)

**Review Phase** (1-3 agents):
- `kieran-typescript-reviewer` (MANDATORY for medium+ tasks)
- `security-sentinel` (if auth, RBAC, sensitive data)
- `performance-oracle` (if caching, optimization)

**See**: `.claude/agents/DECISION-TREE.md` for detailed agent selection

---

## Examples

### Example 1: Payment Reconciliation (With GitHub)

```
User: "Implement payment reconciliation feature"

Phase 1: Create GitHub issue #123 (10 min)
Phase 2: /explore services/finance (5 min)
Phase 3: pattern-recognition-specialist agent (20 min)
Phase 4: Read 5 files completely (30 min)
Phase 5: Implement ReconciliationService (4 hours)
  - Update issue comment: "✅ Phase 1 complete" (1 min)
  - Update issue comment: "✅ Tests added" (1 min)
Phase 6: kieran-typescript-reviewer agent (20 min)
Phase 7: Create PR, close issue #123 (10 min)

Total: 6 hours
Agents: 2 (pattern-recognition-specialist, kieran-typescript-reviewer)
GitHub: Issue #123 → PR #45 → Merged
```

### Example 2: Invoice Approval Workflow (Without GitHub)

```
User: "Add multi-step approval workflow for invoices"

1. /explore services/finance (5 min)
2. architecture-strategist agent (25 min)
3. Read 4 files completely (25 min)
4. Implement ApprovalWorkflowService (3.5 hours)
5. kieran-typescript-reviewer agent (15 min)
6. git commit with comprehensive message (30 sec)

Total: 4.5 hours
Agents: 2 (architecture-strategist, kieran-typescript-reviewer)
GitHub: Manual tracking only
```

---

## Tips for Success

**Context Management**:
- Check `/context` before enabling GitHub MCP
- If >35%, skip GitHub integration
- Disable MCP immediately after task complete

**Agent Usage**:
- ALWAYS use kieran-typescript-reviewer for final review
- Use planning agents if unfamiliar with area
- Don't over-agent (2-3 agents max)

**Progress Tracking**:
- Update GitHub issue every 1-2 hours (if using)
- Include what's complete, what's next
- Helps resume if interrupted

**Quality First**:
- pnpm build && npm test are NON-NEGOTIABLE
- Agent review catches 90% of issues
- Spend 15-30 min on review, save hours of rework

---

**Estimated Time**: 4-8 hours
**Success Rate**: 90%+
**Agent Usage**: 2-3 agents
**GitHub Integration**: Optional (recommended for 6-8 hour tasks)

**See Also**:
- `.claude/workflows/medium-task-workflow.md` - Detailed workflow guide
- `.claude/agents/DECISION-TREE.md` - Agent selection framework
- `github/mcp-integration/github-mcp-tools.md` - GitHub MCP reference
