# Codify Questions Template

**Source**: Task Completion Protocol
**Purpose**: Systematic learning capture after task completion

---

## Codify Phase Questions

After completing a task, answer these questions to capture learnings:

### 1. What Patterns Worked Well?

**Questions**:
- Which code patterns were particularly effective?
- What architectural decisions paid off?
- Which libraries/tools were helpful?
- What testing strategies worked?

**Where to Codify**:
- Service CLAUDE.md (if service-specific)
- `sessions/knowledge/vextrus-erp/patterns/` (if reusable)
- Skill reference files (if pattern matches skill domain)

### 2. What Could Be Simplified?

**Questions**:
- Was any code overly complex?
- Could abstractions be reduced?
- Were there unnecessary dependencies?
- Could configuration be simpler?

**Actions**:
- Create refactoring task if significant
- Document simpler alternatives
- Update patterns with "Don't do this" examples

### 3. What Should Be Automated?

**Questions**:
- Were there repetitive manual steps?
- Could code generation help?
- Should this be a script/tool?
- Could CI/CD catch this?

**Actions**:
- Create automation scripts
- Add pre-commit hooks
- Update slash commands
- Enhance skills with automation patterns

### 4. What Surprised You?

**Questions**:
- What took longer than expected?
- What was easier than anticipated?
- Were there unexpected gotchas?
- What assumptions were wrong?

**Where to Codify**:
- "Common Mistakes" sections in skills
- "Gotchas" sections in service CLAUDE.md
- Knowledge base checklists

### 5. What Skills Were Effective?

**Questions**:
- Which skills activated appropriately?
- Did skills provide helpful guidance?
- Were any skills missing patterns?
- Should new skills be created?

**Actions**:
- Update skill reference files with new patterns
- Create feedback for skill improvements
- Consider new skill if gap identified

### 6. What Should Future You Know?

**Questions**:
- What would save time next time?
- What documentation was missing?
- What was hard to find?
- What decision rationale should be preserved?

**Where to Codify**:
- README files
- Architecture Decision Records (ADRs)
- Service CLAUDE.md
- Knowledge base guides

---

## Codification Checklist

After answering questions:

- [ ] Updated service CLAUDE.md (if patterns specific to service)
- [ ] Added patterns to knowledge base (if reusable)
- [ ] Updated skill reference files (if relevant)
- [ ] Created automation scripts (if repetitive steps found)
- [ ] Documented gotchas/mistakes (to prevent future issues)
- [ ] Updated checklists (if new quality gates identified)

---

## Example: Invoice Payment Task

### 1. What Worked Well?
- Event sourcing pattern for payment processing
- Multi-step migration strategy for schema changes
- GraphQL Federation resolver composition
- TDD approach caught edge cases early

**Codified To**:
- `services/finance/CLAUDE.md` - Payment processing patterns
- `.claude/skills/event-sourcing/core-patterns.md` - Payment event example

### 2. What Could Be Simplified?
- Payment validation had 3 nested if statements → Refactored to guard clauses
- Database migration used 4 steps → Could be 3 with better planning

**Actions**:
- Documented simpler migration approach
- Added "Prefer guard clauses" to TypeScript patterns

### 3. What Should Be Automated?
- Manual testing of payment flows → Created test data generator script
- Checking EventStore stream consistency → Added health check

**Actions**:
- Created `scripts/generate-test-payments.ts`
- Updated health check endpoint

### 4. What Surprised You?
- Payment idempotency harder than expected (3 hours debugging)
- Multi-tenant migration simpler than anticipated

**Codified To**:
- Added idempotency section to `.claude/skills/event-sourcing/advanced-patterns.md`
- Added "Idempotency is critical" to payment patterns

### 5. What Skills Were Effective?
- event-sourcing skill provided excellent guidance
- test-first enforced TDD discipline
- security-first caught missing RBAC guard

**Actions**:
- No changes needed - skills worked well

### 6. What Should Future You Know?
- Payment processing requires extra idempotency care
- Multi-tenant migrations work smoothly with search_path pattern
- Test data generator saves 30min per test cycle

**Codified To**:
- `services/finance/CLAUDE.md` - Payment idempotency warning
- `sessions/knowledge/vextrus-erp/guides/migration-safety-guide.md` - Multi-tenant pattern

---

## Time Investment

**Codify Phase**: 15-45 minutes
**ROI**: 20-40% faster on similar tasks
**Compounding Effect**: Each task improves future tasks

---

**See Also**:
- `sessions/protocols/task-completion.md` - Complete completion protocol
- `sessions/protocols/compounding-cycle.md` - Full PLAN→DELEGATE→ASSESS→CODIFY cycle
- `sessions/knowledge/vextrus-erp/workflows/compounding-metrics.md` - Proven results
