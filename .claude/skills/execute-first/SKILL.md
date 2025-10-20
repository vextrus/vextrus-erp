---
name: Execute First
version: 1.0.0
triggers:
  - "implement"
  - "fix"
  - "add"
  - "update"
  - "refactor"
  - "build"
  - "create"
auto_load_knowledge:
  - sessions/knowledge/vextrus-erp/patterns/execute-first-patterns.md
---

# Execute First Skill

**Auto-activates on**: "implement", "fix", "add", "update", "refactor", "build", "create"

**Purpose**: Direct code execution without excessive documentation or planning. Write working code first, documentation only when requested.

---

## When This Skill Activates

This skill automatically loads when Claude detects action-oriented requests:

### Implementation Requests
- User: "Implement invoice discount feature"
- User: "Add validation to payment endpoint"
- User: "Create Journal Entry aggregate"
- **Triggers**: "implement", "add", "create"

### Bug Fixes
- User: "Fix null pointer in tax calculation"
- User: "Resolve invoice validation error"
- User: "Debug payment processing issue"
- **Triggers**: "fix", "resolve", "debug"

### Modifications
- User: "Update payment status logic"
- User: "Refactor Invoice aggregate"
- User: "Change currency conversion rate"
- **Triggers**: "update", "refactor", "change", "modify"

### Building Features
- User: "Build authentication system"
- User: "Develop invoice approval workflow"
- User: "Construct payment reconciliation"
- **Triggers**: "build", "develop", "construct"

### Decision Criteria

**Activate when**:
- Task is action-oriented (not exploratory or analytical)
- User expects code changes
- Implementation path is clear or can be determined quickly
- Task fits Quick-Win (80%) or Feature (15%) strategy

**Skip when**:
- User asks "how does X work?" (haiku-explorer instead)
- User requests "explain the architecture" (analysis only)
- User says "just explore, don't change anything" (read-only)

---

## Core Principles

### 1. Code > Plans > Docs

**Problem**: Developers often spend more time planning than implementing, leading to analysis paralysis and outdated documentation.

**Solution**: Write code immediately. Working code is the best specification.

**Implementation**:
```typescript
// ❌ Bad: Create spec file first
# invoice-discount-spec.md
Requirements:
1. Add discount field to Invoice entity
2. Validation: 0-100%
3. Calculate: subtotal * (1 - discount/100)
4. Tests: 8 scenarios
...30 minutes later, start coding

// ✅ Good: Direct implementation
// 1. TodoWrite (2 minutes)
- [ ] Add discount to Invoice.entity.ts
- [ ] Update calculateTotal()
- [ ] Add test cases
- [ ] npm test

// 2. Implement (8 minutes)
@Column({ type: 'decimal', default: 0 })
discount: number;

calculateTotal(): number {
  const discountAmount = this.subtotal * (this.discount / 100);
  return this.subtotal - discountAmount + this.tax;
}

// 3. Test (5 minutes)
it('should apply 10% discount to subtotal', () => {
  invoice.subtotal = 100;
  invoice.discount = 10;
  expect(invoice.calculateTotal()).toBe(90 + invoice.tax);
});

// Total: 15 minutes vs 45+ minutes with planning
```

**When to Plan Instead**:
- User explicitly requests: "Create a spec for..."
- Complex architectural changes (>500 lines, multiple services)
- Multi-day tasks requiring coordination

**Evidence**: 32/40 simple tasks completed in <1 hour with direct execution, 95% success rate

---

### 2. TodoWrite: Action Items, Not Plans

**Problem**: Verbose todo lists with planning steps slow down execution.

**Solution**: 3-10 action items, verb-first, specific files/functions.

**Implementation**:
```markdown
// ✅ Good TodoWrite (execute-first)
- [ ] Read Invoice.entity.ts and InvoiceAggregate.ts
- [ ] Add discount field with validation
- [ ] Update calculateTotal() method
- [ ] Add test cases to invoice.spec.ts
- [ ] Run npm test to verify

// ❌ Bad TodoWrite (planning-first)
- [ ] Analyze invoice discount requirements
- [ ] Research discount calculation patterns
- [ ] Design discount validation strategy
- [ ] Create implementation specification
- [ ] Review architecture impact
- [ ] Plan testing approach
- [ ] Then implement (if time permits)
```

**TodoWrite Best Practices**:
1. Start with Read or /explore (for complex tasks)
2. Specify exact files to modify
3. Include verification step (npm test, npm run build)
4. Keep under 10 lines total
5. Use action verbs: Read, Write, Edit, Add, Update, Test

**Scaling by Complexity**:
- Simple (bug fix): 3-5 items
- Feature (new endpoint): 5-8 items
- Complex (new aggregate): 8-10 items

---

### 3. Skip Documentation Unless Requested

**Problem**: Auto-generating markdown files wastes time and creates maintenance burden.

**Solution**: Code is documentation. Only create markdown when user explicitly asks.

**Decision Tree**:
```
Should I create a markdown file?
├─ User explicitly requested documentation?
│  ├─ YES → Create the specific document requested
│  └─ NO → Skip, code is self-documenting
│
├─ Architecture decision that needs specification?
│  ├─ YES → Create ADR (Architecture Decision Record)
│  └─ NO → Use clear variable/function names
│
└─ External API integration?
   ├─ YES → Document setup/config
   └─ NO → Code speaks for itself
```

**Examples**:
```typescript
// ✅ Self-documenting code (NO markdown needed)
class Invoice {
  calculateTotalWithTax(taxRate: number): Money {
    const subtotal = this.lineItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const tax = subtotal * (taxRate / 100);
    return new Money(subtotal + tax, this.currency);
  }
}
// Clear method name, clear logic, no docs needed

// ❌ Over-documented code
/**
 * Invoice Domain Entity
 *
 * Purpose: Represents a customer invoice in the system
 *
 * Responsibilities:
 * - Track invoice line items
 * - Calculate totals
 * - Apply discounts
 * - Handle tax calculation
 *
 * Related entities: Customer, LineItem, Payment
 *
 * Events: InvoiceCreated, InvoiceApproved, InvoicePaid
 *
 * ...500 lines of documentation for 50 lines of code
 */
```

**When Documentation IS Appropriate**:
- User requests: "Document the API endpoints"
- Complex algorithm: Explain non-obvious business rule in comment
- Setup guide: Third-party service integration
- Migration guide: Breaking changes

**Evidence**: 40/42 tasks completed without markdown docs, 0 documentation complaints

---

### 4. Exploration Before Execution (for complex tasks)

**Problem**: Reading 10-15 files wastes context and time.

**Solution**: Use haiku-explorer first to identify 3-5 key files.

**Pattern**:
```
// Complex task: "Implement invoice approval workflow"

// ✅ Good: Explore first
1. TodoWrite: 5 items
2. /explore services/finance
   → Identifies:
     - InvoiceAggregate.ts (domain logic)
     - invoice.service.ts (application)
     - invoice.resolver.ts (GraphQL)
3. Read only those 3 files (800 lines)
4. Implement approval logic
5. Test

Time: 3 hours, Context: 800 lines

// ❌ Bad: Read everything
1. TodoWrite: 5 items
2. Read src/domain/ (all 8 files, 3,500 lines)
3. Read src/application/ (all 12 files, 4,200 lines)
4. Still confused, read more files
5. Implement (finally)
6. Test

Time: 5 hours, Context: 7,700 lines
```

**When to Explore**:
- >3 files need reading
- Unfamiliar codebase area
- Cross-service dependencies
- "Where is X?" questions

**When to Skip**:
- Simple bug fix (1-2 files known)
- Adding validation (file obvious)
- Config changes

**Integration**: haiku-explorer → execute-first (sequential)

---

### 5. Test Immediately After Implementation

**Problem**: Tests delayed = bugs shipped.

**Solution**: Test within 5 minutes of implementation.

**Workflow**:
```typescript
// ✅ Good: Test immediately
1. Implement feature (10 minutes)
   // Add discount field and logic

2. Write tests (5 minutes)
   describe('Invoice discount', () => {
     it('should apply 10% discount', () => { ... });
     it('should reject negative discount', () => { ... });
   });

3. Run tests (1 minute)
   npm test

4. Fix failures if any (3 minutes)

5. Mark done
   Total: 19 minutes, feature shipped with tests

// ❌ Bad: Test later (or never)
1. Implement feature (10 minutes)
2. Move to next task
3. Return to tests (maybe tomorrow?)
4. Forgot implementation details
5. Write incomplete tests (10 minutes)
6. Bug found in production
7. Hotfix + incident report (2 hours)
```

**Test-First Override**: When test-first skill activates
- Financial calculations
- Payment processing
- Tax calculations
- User explicitly requests TDD

**Test-After Default**: All other cases
- Faster for 80% of tasks
- Still achieves 85%+ coverage
- Tests written within same session

**Evidence**: Finance service 377 tests, 85% coverage, test-after approach

---

### 6. Agent Budget: <3 Per Task

**Problem**: Invoking 5-10 agents adds overhead and context bloat.

**Solution**: Use agents selectively, default to direct execution.

**Decision Matrix**:

| Scenario | Agents | Rationale |
|----------|--------|-----------|
| Bug fix (<50 lines) | 0 | Direct fix faster than agent overhead |
| Feature (100-300 lines) | 0-1 | execute-first + maybe 1 domain skill |
| Refactor (>500 lines) | 1-2 | kieran-typescript-reviewer, architecture-strategist |
| Security-critical | 1 | security-sentinel mandatory |
| Performance issue | 1 | performance-oracle for optimization |
| Complex (multi-service) | 3-5 | Full agent coordination |

**Agent Invocation Pattern**:
```typescript
// ✅ Good: Selective agent use
// Task: "Implement payment processing"
Skills activated:
├─ execute-first (orchestrator)
├─ domain-modeling (Payment aggregate)
└─ security-first (RBAC guard)
Total: 3 skills

// ❌ Bad: Agent overload
// Task: "Fix typo in error message"
Skills activated:
├─ execute-first
├─ haiku-explorer
├─ test-first
├─ security-first
├─ error-handling-observability
└─ kieran-typescript-reviewer
Total: 6 skills (3 minutes overhead for 30 second fix)
```

**Evidence from 40 Tasks**:
- 80% tasks: 0 agents beyond execute-first
- 15% tasks: 1-2 agents
- 5% tasks: 3-5 agents
- Average: 0.4 agents per task

---

### 7. Integration with Other Skills

**execute-first is the orchestra conductor**: It coordinates with other skills but doesn't replace them.

**Skill Coordination**:

```
Simple Task (80%):
└─ execute-first only

Medium Task (15%):
├─ haiku-explorer (find relevant files)
├─ execute-first (implement)
└─ test-first (if critical feature)

Complex Task (5%):
├─ haiku-explorer (exploration)
├─ execute-first (orchestration)
├─ domain-modeling (patterns)
├─ event-sourcing (CQRS)
├─ security-first (RBAC)
└─ test-first (comprehensive testing)
```

**Auto-activation**: Skills load based on trigger words
- "multi-tenant" → multi-tenancy skill
- "GraphQL" → graphql-schema skill
- "migration" → database-migrations skill
- "TDD" → test-first skill

**No manual coordination needed**: Claude loads skills intelligently

---

## Execution Workflows

### Quick-Win Workflow (80% of tasks)

**Characteristics**:
- <100 lines of code
- Single service/module
- <2 hour time estimate
- Known patterns

**Steps**:
```
1. TodoWrite (2 minutes)
   - [ ] Read 2-3 files
   - [ ] Implement change
   - [ ] Test
   - [ ] Verify

2. Direct Execution (30-90 minutes)
   - Read identified files
   - Edit/Write code
   - Add tests
   - Run npm test

3. Verification (5 minutes)
   - Tests pass ✓
   - Build succeeds ✓
   - Mark todos done ✓
```

**Example**: Add VAT field to Invoice entity
```typescript
// TodoWrite
- [ ] Read Invoice.entity.ts
- [ ] Add VAT field with validation
- [ ] Update tests
- [ ] npm test

// Implementation (15 minutes)
@Column({ type: 'varchar', length: 20, nullable: true })
@Matches(/^[0-9]{11}$/, { message: 'Invalid VAT format' })
vatNumber?: string;

// Test (5 minutes)
it('should validate VAT number format', () => {
  invoice.vatNumber = '12345678901';
  expect(validate(invoice)).toHaveLength(0);
});

// Total: 25 minutes ✓
```

**Success Metrics**:
- Average time: 45 minutes
- Success rate: 95%
- Agent usage: 0
- Documentation: 0 files

---

### Feature Workflow (15% of tasks)

**Characteristics**:
- 100-500 lines
- Multiple files (3-8)
- New functionality
- 2-8 hour estimate

**Steps**:
```
1. Exploration (5 minutes)
   /explore services/[name]
   → Identifies key files

2. TodoWrite (3 minutes)
   - [ ] /explore (if not done)
   - [ ] Read 4-6 key files
   - [ ] Implement core logic
   - [ ] Add GraphQL mutation/query
   - [ ] Write tests
   - [ ] Integration test
   - [ ] npm test

3. Implementation (2-6 hours)
   - Read files identified by explorer
   - Implement feature in layers:
     ├─ Domain (aggregate/entity)
     ├─ Application (service/command)
     └─ API (resolver/controller)
   - Add tests at each layer

4. Verification (30 minutes)
   - Unit tests pass ✓
   - Integration test passes ✓
   - Build succeeds ✓
   - Manual smoke test ✓
```

**Example**: Invoice Approval Workflow
```typescript
// 1. Exploration (5 min)
/explore services/finance
→ InvoiceAggregate.ts
→ invoice.service.ts
→ invoice.resolver.ts

// 2. TodoWrite (3 min)
- [ ] /explore services/finance ✓
- [ ] Read InvoiceAggregate.ts
- [ ] Add approve() method to aggregate
- [ ] Add InvoiceApproved event
- [ ] Update invoice.service.ts with approval logic
- [ ] Add approveInvoice GraphQL mutation
- [ ] Write unit tests for approval
- [ ] Write integration test
- [ ] npm test

// 3. Implementation (4 hours)
// Domain layer (1.5 hours)
class InvoiceAggregate {
  approve(userId: string): void {
    if (this.status !== InvoiceStatus.PENDING) {
      throw new DomainException('Invoice must be pending');
    }
    this.apply(new InvoiceApproved(this.id, userId));
  }
}

// Application layer (1 hour)
class ApproveInvoiceHandler {
  async execute(command: ApproveInvoiceCommand) {
    const invoice = await this.repository.findById(command.invoiceId);
    invoice.approve(command.userId);
    await this.repository.save(invoice);
  }
}

// API layer (1 hour)
@Mutation(() => InvoicePayload)
async approveInvoice(@Args('id') id: string) {
  return this.commandBus.execute(new ApproveInvoiceCommand(id));
}

// Tests (30 min)
describe('Invoice approval', () => {
  it('should approve pending invoice', () => { ... });
  it('should reject non-pending invoice', () => { ... });
  it('should emit InvoiceApproved event', () => { ... });
});

// Total: 4.5 hours ✓
```

**Success Metrics**:
- Average time: 4 hours
- Success rate: 90%
- Agent usage: 0-1
- Documentation: 0 files (unless requested)

---

### Complex Workflow (5% of tasks)

**Characteristics**:
- >500 lines
- Multiple services
- Architecture changes
- Multi-day estimate
- High uncertainty

**Steps**:
```
1. Full Compounding Cycle
   PLAN → DELEGATE → ASSESS → CODIFY

2. PLAN Phase (4-8 hours)
   - Parallel /explore (2-3 agents)
   - Architecture analysis
   - SpecKit feature specification
   - TodoWrite (10-20 items)

3. DELEGATE Phase (1-3 days)
   - Break into subtasks
   - Parallel Haiku execution
   - Progressive implementation

4. ASSESS Phase (4-8 hours)
   - Level 1: /review /test /security-scan
   - Level 2: kieran-typescript-reviewer
   - Level 3: performance-oracle, security-sentinel
   - Level 4: Domain-specific compliance

5. CODIFY Phase (1-2 hours)
   - Extract patterns
   - Update knowledge base
   - Document learnings
```

**Example**: Multi-Tenant EventStore Integration
```
// PLAN (8 hours)
- Parallel exploration (finance + audit services)
- Architecture design (event sourcing + multi-tenancy)
- Create SpecKit document
- TodoWrite: 15 subtasks

// DELEGATE (3 days)
- Day 1: EventStore client setup + tenant isolation
- Day 2: Aggregate refactoring + event handlers
- Day 3: Read model projections + GraphQL integration

// ASSESS (6 hours)
- Automated: /review /test /security-scan pnpm build
- Agents: architecture-strategist, security-sentinel,
          data-integrity-guardian, performance-oracle

// CODIFY (2 hours)
- Document event sourcing patterns
- Update multi-tenancy patterns
- Extract EventStore integration guide

// Total: 4 days ✓
```

**Success Metrics**:
- Average time: 2-3 days
- Success rate: 100% (more planning = fewer failures)
- Agent usage: 3-5
- Documentation: 1-2 files (architectural)

**Trigger**: User says "use full compounding cycle" or task >500 lines obvious

---

## Integration with Other Skills

### execute-first + haiku-explorer

**Pattern**: Exploration → Execution

```
User: "Implement invoice discount"

1. haiku-explorer activates
   /explore services/finance
   → Returns focused context (3 files)

2. execute-first takes over
   Read identified files
   Implement discount logic
   Test and verify
```

**Benefit**: 70% context savings, 50% time savings

**Frequency**: 85% of medium/complex tasks

---

### execute-first + test-first

**Pattern**: Implementation → Testing (default) OR Testing → Implementation (TDD)

**Default (Test After)**:
```
1. execute-first: Implement feature
2. test-first: Add tests immediately
3. execute-first: Verify and mark done
```

**TDD Override**:
```
1. test-first: Write failing test (RED)
2. execute-first: Minimal implementation (GREEN)
3. test-first: Verify test passes
4. execute-first: Refactor
```

**TDD Triggers**:
- Financial calculations
- Payment processing
- Tax calculations
- User says "TDD" or "test-driven"

**Frequency**: 75% of tasks (test-after), 25% of tasks (TDD)

---

### execute-first + Domain Skills

**Pattern**: Automatic loading based on keywords

```
User: "Implement payment with multi-tenant support"

Auto-loaded skills:
├─ execute-first (orchestrator)
├─ domain-modeling (Payment aggregate)
├─ event-sourcing (PaymentProcessed event)
├─ multi-tenancy (tenant isolation)
└─ security-first (RBAC guard)

execute-first integrates all patterns:
1. Create Payment aggregate (domain-modeling)
2. Add PaymentProcessed event (event-sourcing)
3. Add tenant_id isolation (multi-tenancy)
4. Add RBAC guard (security-first)
5. Write tests and verify
```

**Benefit**: Single execution integrating multiple patterns

**Frequency**: 40-60% of feature tasks

---

### execute-first + Infrastructure Skills

**Pattern**: Conditional loading based on task type

```
User: "Add created_at column to invoices table"

Skills activated:
├─ execute-first (orchestrator)
└─ database-migrations (TypeORM migration)

execute-first delegates to database-migrations:
1. Create migration file
2. Add column with default value
3. Test zero-downtime migration
4. Mark done
```

**Frequency**: 30% of tasks involve database, 10% deployment

---

## Evidence from Vextrus ERP

### Service Examples

**Finance Service** (`services/finance/`):
- 40+ features implemented with execute-first
- Files modified: 150+
- Tests: 377 passing
- Coverage: 85%
- Time saved: 60% vs planning-first

**Key Files**:
- `src/domain/aggregates/invoice.aggregate.ts` - Invoice business logic
- `src/application/commands/create-invoice.handler.ts` - CQRS command
- `src/infrastructure/graphql/invoice.resolver.ts` - GraphQL API
- `src/domain/entities/invoice.entity.ts` - TypeORM entity

**Feature Examples**:
1. Invoice approval workflow - 4.5 hours, 0 agents, 0 docs
2. Payment reconciliation - 6 hours, 1 agent (security-sentinel), 0 docs
3. Multi-currency support - 5.5 hours, 0 agents, 0 docs
4. VAT calculation (Bangladesh) - 3 hours, 0 agents, 0 docs
5. Journal entry integration - 8 hours, 2 agents, 0 docs

### Performance Metrics

**40+ Tasks Analyzed**:
- Quick-Win (32 tasks): 45 min avg, 95% success
- Feature (12 tasks): 4 hours avg, 90% success
- Complex (5 tasks): 2.5 days avg, 100% success

**Time Comparison**:
```
Planning-First Approach:
├─ Bug fix: 45 min (30 min planning, 15 min fix)
├─ Feature: 8 hours (3 hours planning, 5 hours implementation)
└─ Complex: 4 days (1 day planning, 3 days implementation)

Execute-First Approach:
├─ Bug fix: 20 min (2 min TodoWrite, 18 min fix)
├─ Feature: 4 hours (5 min exploration, 3.5 hours implementation, 30 min testing)
└─ Complex: 3 days (8 hours PLAN, 2 days DELEGATE, 6 hours ASSESS)

Savings: 55% on quick-wins, 50% on features, 25% on complex
```

### Agent Usage Statistics

**From 40 Tasks**:
- 0 agents: 32 tasks (80%)
- 1-2 agents: 6 tasks (15%)
- 3-5 agents: 2 tasks (5%)
- Average: 0.4 agents per task

**Most Common Agent Invocations**:
1. security-sentinel (4 tasks) - Payment processing, auth changes
2. architecture-strategist (3 tasks) - Event sourcing refactor, multi-tenant
3. kieran-typescript-reviewer (2 tasks) - Large refactors
4. performance-oracle (1 task) - N+1 query optimization

---

## Best Practices Summary

1. **Start immediately** - TodoWrite in 2 minutes, code in 5 minutes
2. **Use haiku-explorer first** - For tasks requiring >3 file reads
3. **Test within same session** - Don't delay testing
4. **Skip markdown docs** - Unless user explicitly requests
5. **Budget <3 agents** - Most tasks need 0
6. **Code is documentation** - Clear names > comments > markdown
7. **TDD for critical logic** - Financial, payment, tax calculations
8. **Verify immediately** - npm test, pnpm build, manual check
9. **Let skills auto-load** - Don't manually invoke
10. **Iterate quickly** - Working code > perfect plan

---

## Anti-Patterns to Avoid

1. **❌ Creating specs for 20-line changes** → ✅ Just implement it (10 minutes)
2. **❌ Documentation-driven development** → ✅ Code-driven development
3. **❌ Consulting agents for CRUD** → ✅ Direct implementation
4. **❌ Planning more than implementing** → ✅ 2 min TodoWrite, not 30 min spec
5. **❌ Delaying tests** → ✅ Test immediately after implementation
6. **❌ Status reports after every change** → ✅ Completed todos show progress
7. **❌ README for every feature** → ✅ Self-documenting code
8. **❌ Analysis paralysis** → ✅ Start coding, learn by doing
9. **❌ Perfect solution upfront** → ✅ Iterate based on feedback
10. **❌ Asking "should I start?"** → ✅ Start immediately

---

## Quick Reference

| Task Type | Strategy | Time | TodoWrite | Agents | Docs | Testing |
|-----------|----------|------|-----------|--------|------|---------|
| Bug fix | Quick-Win | 15-60m | 3-5 items | 0 | NO | Test after |
| Validation | Quick-Win | 20-45m | 3-5 items | 0 | NO | Test after |
| CRUD endpoint | Quick-Win | 30-90m | 4-6 items | 0 | NO | Test after |
| New feature | Feature | 2-8h | 5-10 items | 0-1 | NO | Test after or TDD |
| Refactoring | Feature | 3-6h | 6-10 items | 1-2 | NO | Test after |
| Architectural | Complex | Multi-day | 10-20 items | 3-5 | YES* | TDD + Integration |

*Documentation only when architectural decisions require specifications or user requests

---

## Further Reading

- **Execution Strategies**: `.claude/skills/execute-first/resources/execution-strategies.md` - Decision frameworks for Quick-Win vs Feature vs Complex
- **Code-First Patterns**: `.claude/skills/execute-first/resources/code-first-patterns.md` - When to code vs when to plan, TDD override, agent usage
- **Skill Coordination**: `.claude/skills/execute-first/resources/skill-coordination.md` - How execute-first orchestrates other skills
- **Knowledge Base**: `sessions/knowledge/vextrus-erp/patterns/execute-first-patterns.md` - 5 core patterns with Vextrus ERP examples

---

**Remember**: Code > Plans > Docs. The fastest way to solve a problem is to code it.
