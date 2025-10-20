# Code-First Patterns

**Purpose**: When to code directly vs when to plan

---

## Core Philosophy

**Code > Plans > Docs**

- **Default**: Write code immediately upon understanding requirements
- **Override**: Only when user explicitly requests planning or specifications
- **Rationale**: Working code is the best documentation and fastest path to value

The execute-first philosophy prioritizes action over analysis paralysis. For 80% of development tasks, the fastest path to a solution is direct implementation followed by immediate testing.

---

## Pattern 1: TodoWrite Structure

**When**: Every task, no exceptions

**Format**: 3-10 items, <10 lines total, action-oriented

### Good Examples

```markdown
- [ ] Read Invoice.entity.ts and InvoiceAggregate.ts
- [ ] Add discount field to Invoice entity
- [ ] Update calculateTotal() to apply discount
- [ ] Add discount test cases to invoice.aggregate.spec.ts
- [ ] Run npm test to verify
```

```markdown
- [ ] /explore services/finance (haiku-explorer)
- [ ] Read payment processing files
- [ ] Implement PaymentProcessed event
- [ ] Add RBAC guard to payment mutation
- [ ] Write integration test
```

### Bad Examples

```markdown
❌ - [ ] Analyze business requirements thoroughly
   - [ ] Create detailed specification document
   - [ ] Review architecture with team
   - [ ] Plan implementation approach
   - [ ] Design database schema changes
   (These are planning steps, not execution steps!)
```

```markdown
❌ - [ ] Do the implementation
   (Too vague - what specifically needs to be done?)
```

### TodoWrite Best Practices

1. **Start with exploration**: If complex, begin with `/explore` or `Read` steps
2. **Be specific**: Name exact files, functions, or features to modify
3. **Include verification**: Always have a test/verification step
4. **Keep it short**: 3-5 items for simple tasks, 5-10 for features
5. **Action verbs**: Read, Write, Edit, Add, Update, Test, Verify

---

## Pattern 2: Documentation Decision Tree

**Question**: Should I create a markdown file?

```
User explicitly requested documentation?
├─ YES → Create the specific document requested
└─ NO → Skip documentation, code is the documentation

Examples:
├─ ✅ User: "Create a README for the payment module"
│  └─ Action: Create README.md with module documentation
├─ ❌ Feature complete, no doc request
│  └─ Action: NO markdown files, code speaks for itself
└─ ❌ User: "Fix the invoice tax bug"
   └─ Action: Fix bug, write test, NO status report
```

### Documentation Anti-Patterns

**❌ Status Reports**:
```markdown
# Implementation Status Report
- Invoice validation: Complete
- Payment processing: In Progress
- Testing: Pending
(User can see progress via completed todos)
```

**❌ Preemptive READMEs**:
```markdown
# Invoice Module

This module handles invoice creation and management...
(Code should be self-documenting with clear names)
```

**❌ Specification Files**:
```markdown
# Invoice Discount Specification

## Requirements
1. Add discount field...
(Just implement it! Spec time > implementation time)
```

### When Documentation IS Appropriate

✅ **User explicitly asks**: "Document the API endpoints"
✅ **Complex algorithm**: Explain non-obvious business logic in comments
✅ **External integration**: Document third-party API setup
✅ **Migration guide**: Breaking changes requiring user action

---

## Pattern 3: TDD Override

**Question**: When must I write tests FIRST (test-first skill override)?

### TDD Mandatory Scenarios

1. **Financial Calculations**
   - Invoice totals, subtotals, tax calculations
   - Currency conversions with rounding
   - Payment amount validation
   - Example: VAT calculation with multiple rates

2. **Payment Processing**
   - Payment status transitions
   - Refund calculations
   - Payment reconciliation logic
   - Example: Partial payment application

3. **Tax Calculations**
   - Bangladesh NBR tax rules
   - Mushak-6.3 compliance
   - TIN validation
   - Example: Supplementary duty calculation

4. **User Explicitly Requests**
   - User says: "TDD", "test-driven", "write tests first"
   - User asks: "Can we do this with TDD?"

### Execute-First Default (Tests After Implementation)

For all other scenarios:
1. Implement feature
2. Write tests immediately after
3. Verify all pass
4. Refactor if needed

**Rationale**: 95% of tasks complete faster with tests-after. TDD adds value for critical business logic where test-first thinking prevents bugs.

---

## Pattern 4: Agent Usage

**Question**: When should I invoke specialized agents?

### Use Agents When:

**Refactoring >500 lines**
- Tool: Task with subagent_type=kieran-typescript-reviewer
- Why: Large refactors need architectural oversight
- Example: Restructuring entire service module

**Security-Critical Changes**
- Tool: Task with subagent_type=security-sentinel
- Why: Expert security audit required
- Example: RBAC implementation, authentication logic

**Performance Issues**
- Tool: Task with subagent_type=performance-oracle
- Why: Specialized optimization analysis
- Example: N+1 query detection, caching strategy

**Complex Architecture Decisions**
- Tool: Task with subagent_type=architecture-strategist
- Why: System design impact assessment
- Example: Switching from REST to GraphQL

**Database Migrations**
- Tool: Task with subagent_type=data-integrity-guardian
- Why: Zero-downtime migration validation
- Example: Adding tenant_id to multi-tenant tables

### Skip Agents When:

**Simple Features (<100 lines)**
- execute-first handles alone
- Example: Add validation to existing endpoint

**Bug Fixes**
- Direct fix + test
- Example: Null pointer exception fix

**CRUD Operations**
- Standard NestJS patterns
- Example: Add new entity endpoint

**Tests**
- test-first skill handles
- Example: Unit test for service method

**Config Changes**
- Direct edit
- Example: Update environment variables

### Agent Budget

**Goal**: <3 agents per task

**Reality from 40+ Vextrus ERP tasks**:
- 80% of tasks: 0 agents (execute-first + test-first only)
- 15% of tasks: 1-2 agents (feature work)
- 5% of tasks: 3-5 agents (complex/architectural)

**Over-using agents = Slower execution + Context bloat**

---

## Evidence from 40+ Tasks

### Code-First Success Metrics

**Quick-Win Tasks** (32 tasks, <100 lines each):
- Average time: 45 minutes
- Success rate: 95%
- Agents used: 0
- TodoWrite items: 3-5
- Markdown docs created: 0

**Examples**:
- Add VAT field to Invoice entity: 25 minutes
- Fix invoice validation bug: 18 minutes
- Add RBAC guard to payment mutation: 35 minutes

**Feature Tasks** (12 tasks, 100-500 lines):
- Average time: 4 hours
- Success rate: 90%
- Agents used: 0-1
- TodoWrite items: 5-10
- Markdown docs created: 0

**Examples**:
- Invoice approval workflow: 4.5 hours
- Payment reconciliation feature: 6 hours
- Multi-currency support: 5.5 hours

### Over-Planning Failures

**Task**: Fix null check in discount calculation (20 lines)
- ❌ Time spent planning: 1 hour (spec creation, agent consultation)
- ❌ Time spent implementing: 10 minutes
- **Lesson**: 6x overhead from unnecessary planning

**Task**: Add validation to invoice items (45 lines)
- ❌ Created specification document: 30 minutes
- ❌ Consulted 2 agents: 20 minutes
- ❌ Actual implementation: 15 minutes
- **Lesson**: 3x overhead from over-engineering simple task

### Success Stories

**Task**: Implement complete invoice payment feature (380 lines)
- ✅ TodoWrite: 8 items (2 minutes)
- ✅ /explore services/finance: 1 minute (haiku-explorer)
- ✅ Implementation: 3 hours
- ✅ Testing: 45 minutes
- ✅ Total: 4 hours
- ✅ Agents used: 0
- ✅ Markdown docs: 0

**Task**: Multi-tenant EventStore integration (complex)
- ✅ Full compounding cycle (user requested)
- ✅ Parallel agents: 5
- ✅ SpecKit document: Yes (architectural)
- ✅ Implementation: 3 days
- ✅ Success: 100%
- **Lesson**: Complex tasks justify planning overhead

---

## Quick Reference

| Task Type | TodoWrite | Time | Agents | Docs | Approach |
|-----------|-----------|------|--------|------|----------|
| Bug fix | 3-5 items | 15-60m | 0 | NO | Direct fix + test |
| Validation | 3-5 items | 20-45m | 0 | NO | Add rule + test |
| CRUD endpoint | 4-6 items | 30-90m | 0 | NO | NestJS pattern |
| Feature | 5-10 items | 2-8h | 0-1 | NO | Explore + implement |
| Refactor | 6-10 items | 3-6h | 1-2 | NO | Architecture review |
| Complex | 10-20 items | Multi-day | 3-5 | YES* | Full compounding |

*Docs only when user requests or architectural decisions require specification

---

## Integration with Other Skills

### execute-first + test-first

**Normal Flow** (80% of tasks):
```
1. execute-first: Implement feature
2. test-first: Add tests immediately after
3. execute-first: Verify and mark done
```

**TDD Flow** (20% of tasks - financial/critical):
```
1. test-first: Write failing test
2. execute-first: Minimal implementation
3. test-first: Verify test passes
4. execute-first: Refactor
```

### execute-first + haiku-explorer

**Pattern**: Exploration before execution
```
1. haiku-explorer: /explore services/[name] (1 minute)
2. haiku-explorer: Identifies 3-5 key files
3. execute-first: Read only those files (saves 70% context)
4. execute-first: Implement based on understanding
```

**Without exploration** (anti-pattern):
```
❌ 1. execute-first: Read 15 files searching for logic
   2. execute-first: Still confused, read 10 more
   3. execute-first: Finally implement (wasted 30 minutes)
```

### execute-first + domain skills

**Automatic activation** - skills load based on keywords:
```
User: "Implement payment processing with security"

Skills activated:
├─ execute-first (orchestrator)
├─ domain-modeling (Payment aggregate pattern)
├─ event-sourcing (PaymentProcessed event)
├─ security-first (RBAC guard)
├─ multi-tenancy (tenant isolation)
└─ error-handling-observability (correlation IDs)

Flow:
1. execute-first: Determines what to build
2. Domain skills: Provide patterns automatically
3. execute-first: Integrates patterns into implementation
```

### execute-first + advanced skills

**Selective usage** - only when needed:
- performance-caching: When N+1 queries detected
- service-integration: When calling external APIs
- database-migrations: When schema changes required
- integration-testing: When E2E tests needed

---

## Anti-Patterns to Avoid

1. **❌ Creating specs for simple tasks** → ✅ Just implement it
2. **❌ Documentation-driven development** → ✅ Code-driven development
3. **❌ Over-planning 20-line changes** → ✅ 5-minute implementation
4. **❌ Invoking agents for CRUD** → ✅ NestJS patterns sufficient
5. **❌ Status reports after every change** → ✅ Completed todos show progress
6. **❌ README for every file** → ✅ Self-documenting code
7. **❌ TDD for everything** → ✅ TDD for critical logic only
8. **❌ Sequential agent consultation** → ✅ Parallel or none
9. **❌ Asking "should I start?"** → ✅ Start immediately
10. **❌ Waiting for perfect plan** → ✅ Iterate based on feedback

---

## Summary

**Core Principle**: The fastest way to solve a problem is to code it, test it, and verify it works.

**When it works**: 80% of development tasks (quick wins, features, bug fixes)

**When to plan instead**: 5% of tasks (architectural changes, multi-service features)

**Evidence**: 40+ Vextrus ERP tasks completed with 95% success rate, 60% time savings vs planning-first approach

**Remember**: Code > Plans > Docs
