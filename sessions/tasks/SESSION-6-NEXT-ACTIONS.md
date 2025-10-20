# Session 6: Next Actions - Core Skills Upgrade Completion

**Date**: Next session after 2025-10-20
**Duration**: 2.5-3 hours
**Priority**: HIGHEST (Core Skills = 80% of all tasks)

---

## Quick Start

**Resume from**: Phase 3.1 (execute-first upgrade, 30% complete)
**Status file**: `sessions/tasks/SESSION-5-CHECKPOINT.md`

**Immediate action**:
```bash
# 1. Read checkpoint
cat sessions/tasks/SESSION-5-CHECKPOINT.md

# 2. Verify progress
ls -la .claude/skills/execute-first/resources/
# Should show: execution-strategies.md ✅

# 3. Continue with execute-first completion
```

---

## Phase 3.1: Complete execute-first Upgrade (45 min)

### Task 1: Create code-first-patterns.md (15 min)

**File**: `.claude/skills/execute-first/resources/code-first-patterns.md`

**Template**:
```markdown
# Code-First Patterns

**Purpose**: When to code directly vs when to plan

---

## Core Philosophy

**Code > Plans > Docs**
- Default: Write code immediately
- Override: Only when user explicitly asks for planning

---

## Pattern 1: TodoWrite Structure

**When**: Every task
**Format**: 3-10 items, <10 lines total

Good:
- [ ] Read invoice.entity.ts
- [ ] Add discount field
- [ ] Update tests
- [ ] Verify with npm test

Bad:
- [ ] Analyze requirements
- [ ] Create specification
- [ ] Review with team
- [ ] Plan implementation (DON'T plan, just execute!)

---

## Pattern 2: Documentation Decision Tree

When to create markdown files?
├─ User explicitly requested? → YES
└─ Implementation complete? → NO (code is docs)

Examples:
- ❌ Create README.md for every feature
- ✅ Code with clear variable names
- ✅ Comments for complex logic only
- ❌ Status reports unless requested

---

## Pattern 3: TDD Override

When must you use TDD (test-first)?
1. Financial calculations
2. Payment processing
3. Tax calculations
4. User explicitly says "TDD"

Otherwise:
1. Implement
2. Test immediately after
3. Verify

---

## Pattern 4: Agent Usage

When to invoke agents?
├─ Refactoring >500 lines → YES
├─ Security-critical → YES (security-sentinel)
├─ Performance issues → YES (performance-oracle)
└─ Simple tasks <100 lines → NO

Goal: <3 agents per task

---

## Evidence from 40+ Tasks

**Code-First Success**:
- 32/40 tasks (80%) completed with direct execution
- Average time: 45 minutes
- 0 agents invoked
- Success rate: 95%

**Over-Planning Failures**:
- 3 tasks delayed by >2 hours due to unnecessary planning
- Example: 20-line bug fix with 1-hour spec creation

---

## Quick Reference

| Task Type | TodoWrite | Agents | Docs | Time |
|-----------|-----------|--------|------|------|
| Bug fix | 3-5 items | 0 | NO | 15-60m |
| Feature | 5-10 items | 0-1 | NO | 2-8h |
| Complex | 10-20 items | 3-5 | YES | Multi-day |

---

## Integration with Other Skills

- test-first: Modifies workflow (write test FIRST)
- haiku-explorer: Run /explore BEFORE execute
- Other skills: Load automatically, no action needed
```

### Task 2: Create skill-coordination.md (15 min)

**File**: `.claude/skills/execute-first/resources/skill-coordination.md`

**Template**:
```markdown
# Skill Coordination Patterns

**Purpose**: How execute-first orchestrates other skills

---

## Orchestration Philosophy

execute-first is the **conductor** of the skills orchestra:
1. Determines which skills to activate
2. Coordinates execution order
3. Integrates outputs from multiple skills

---

## Pattern 1: Sequential Skill Activation

**Order**: haiku-explorer → execute-first → test-first

Example: "Implement invoice discount feature"
```
1. /explore services/finance (haiku-explorer)
   → Identifies: Invoice.entity.ts, InvoiceAggregate

2. execute-first activates:
   - Reads identified files
   - Implements discount logic

3. test-first activates:
   - Runs existing tests
   - Adds test for discount calculation
```

---

## Pattern 2: Parallel Skill Activation

**When**: Multiple domain concerns

Example: "Implement payment processing with security"
```
Parallel activation:
├─ execute-first (orchestrator)
├─ domain-modeling (Payment aggregate)
├─ event-sourcing (PaymentProcessed event)
├─ security-first (RBAC guard)
├─ multi-tenancy (tenant isolation)
└─ error-handling-observability (correlation IDs)

Integration point: execute-first coordinates all outputs
```

---

## Pattern 3: Conditional Skill Activation

**Decision**: Based on task characteristics

```
Task: "Add field to schema"
execute-first checks:
├─ GraphQL schema? → graphql-schema skill
├─ Database schema? → database-migrations skill
└─ Security field? → security-first skill
```

---

## Pattern 4: Skill Chains

**execute-first → domain-modeling → event-sourcing**

Example: "Create Journal Entry aggregate"
```
1. execute-first: Determines domain logic needed
2. domain-modeling: Provides aggregate pattern
3. event-sourcing: Adds JournalEntryCreated event
4. execute-first: Integrates all into implementation
```

---

## Co-activation Frequency

From 40+ tasks:
| Skills | Frequency | Example Task |
|--------|-----------|--------------|
| execute-first + test-first | 75% | All critical features |
| execute-first + haiku-explorer | 85% | All complex tasks |
| execute-first + graphql-schema | 60% | API development |
| execute-first + security-first | 90% | All production code |
| execute-first + multi-tenancy | 40% | Multi-tenant features |

---

## Skill Loading Optimization

**Progressive Disclosure**:
```
execute-first (Core) → Always loaded (0.5k tokens)
  └─ Triggers other skills as needed
     ├─ Domain Skills (1-2 per task) → 1-1.5k tokens
     ├─ Infrastructure (0-1 per task) → 0.5-1k tokens
     └─ Advanced (1-3 per task) → 2-4k tokens

Total typical: 4-7 skills, 4-6k tokens (2-3% context)
```

---

## Anti-Patterns

❌ **Over-coordination**: Don't invoke all 17 skills for simple tasks
✅ **Smart coordination**: Let execute-first determine which skills needed

❌ **Manual skill selection**: Don't tell Claude which skills to use
✅ **Auto-activation**: Skills activate based on trigger words

❌ **Sequential when parallel works**: Don't chain skills unnecessarily
✅ **Parallel execution**: Multiple domain skills can work simultaneously

---

## Quick Reference

**Simple Task** (20 lines):
- execute-first only
- Time: 15-30 min
- Skills: 1

**Medium Task** (100 lines):
- execute-first + 2-3 domain skills
- Time: 2-4 hours
- Skills: 3-4

**Complex Task** (500+ lines):
- execute-first + 6-10 skills
- Time: Multi-day
- Skills: 7-12 (parallel execution)
```

### Task 3: Upgrade execute-first SKILL.md (30 min)

**File**: `.claude/skills/execute-first/SKILL.md`

**Action**: Replace entire file with 500+ line version

**New frontmatter**:
```yaml
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
```

**Sections to add** (follow health-check-patterns.md structure):
1. When This Skill Activates (50 lines)
2. Core Principles (100 lines, 5 principles)
3. Execution Workflows (100 lines, 3 workflows)
4. Integration with Other Skills (80 lines, 8 integrations)
5. Evidence from Vextrus ERP (50 lines)
6. Best Practices Summary (30 lines, 10 practices)
7. Anti-Patterns to Avoid (30 lines, 10 anti-patterns)
8. Quick Reference (30 lines, tables)
9. Further Reading (10 lines)

**Total**: ~480 lines (excluding frontmatter)

### Task 4: Create execute-first-patterns.md (15 min)

**File**: `sessions/knowledge/vextrus-erp/patterns/execute-first-patterns.md`

**Template**:
```markdown
# Execute-First Patterns

**Auto-loaded by**: execute-first skill

---

## Pattern 1: Quick-Win Execution

**Context**: 80% of tasks, <100 lines, <2 hours

**Implementation**:
1. TodoWrite (3-5 items)
2. Read relevant files (2-4 files)
3. Edit/Write code
4. Run tests
5. Mark done

**Example from Vextrus ERP**:
- Task: "Add VAT field to Invoice"
- Files: `services/finance/src/domain/entities/invoice.entity.ts`
- Time: 25 minutes
- Result: Success

---

## Pattern 2: Feature Execution with Exploration

**Context**: 15% of tasks, 100-500 lines, 2-8 hours

**Implementation**:
1. /explore service
2. TodoWrite (5-10 items)
3. Read key files
4. Implement core logic
5. Add tests
6. Integration testing

**Example from Vextrus ERP**:
- Task: "Implement invoice approval workflow"
- Services: finance
- Files modified: 8
- Time: 4.5 hours
- Tests: 12 added
- Result: Success

---

## Pattern 3: Complex Execution with Compounding

**Context**: 5% of tasks, >500 lines, >8 hours

**Implementation**:
1. Full compounding cycle
2. Parallel agents
3. Subtasks
4. Comprehensive testing
5. Architecture review

**Example from Vextrus ERP**:
- Task: "Multi-tenant EventStore integration"
- Services: finance, audit
- Files modified: 23
- Time: 3 days
- Tests: 45 added
- Agents: 5 (architecture-strategist, security-sentinel, data-integrity-guardian, performance-oracle, kieran-typescript-reviewer)
- Result: Success

---

## Pattern 4: TDD Override

**Context**: Financial calculations, payment processing

**Implementation**:
1. Write failing test FIRST
2. Minimal implementation
3. Refactor
4. Repeat

**Example from Vextrus ERP**:
- Task: "Invoice tax calculation with multiple rates"
- Files: `Invoice.aggregate.ts`, `invoice.aggregate.spec.ts`
- Tests written first: 8
- Implementation: 45 lines
- Result: 100% coverage

---

## Pattern 5: No-Doc Execution

**Context**: All tasks unless explicitly requested

**Implementation**:
- Skip markdown docs
- Code is documentation
- Clear variable names
- Minimal comments

**Example from Vextrus ERP**:
- 40+ tasks completed
- Markdown docs created: 2 (only when user requested)
- Code clarity: High (self-documenting)

---

## Cross-References

- **test-first**: TDD patterns override execute-first workflow
- **haiku-explorer**: Always run /explore before complex execution
- **graphql-schema**: Schema-first for API development
```

---

## Phase 3.2: haiku-explorer Upgrade (20 min)

### Task 1: Update SKILL.md frontmatter (5 min)

**File**: `.claude/skills/haiku-explorer/SKILL.md`

**Add to top**:
```yaml
---
name: Haiku Explorer
version: 1.0.0
triggers:
  - "where"
  - "find"
  - "understand"
  - "how does"
  - "what is"
  - "explore"
---
```

### Task 2: Expand SKILL.md to 500 lines (10 min)

**Add sections**:
1. When This Skill Activates (40 lines)
2. Exploration Strategies by Codebase Type (80 lines)
3. Progressive Exploration Patterns (60 lines)
4. Context Optimization Techniques (60 lines)
5. Evidence from Vextrus ERP (40 lines, exploration success stories)
6. Best Practices (30 lines)
7. Anti-Patterns (30 lines)

### Task 3: Create parallel-exploration.md (5 min)

**File**: `.claude/skills/haiku-explorer/resources/parallel-exploration.md`

**Content**: Multi-agent exploration patterns, when to use 2-3 Explore agents simultaneously

---

## Phase 3.3: test-first Upgrade (45 min)

### Task 1: Create 3 resource files (15 min)

**Files**:
1. `.claude/skills/test-first/resources/tdd-workflow.md`
2. `.claude/skills/test-first/resources/testing-strategies.md`
3. `.claude/skills/test-first/resources/test-patterns.md`

### Task 2: Upgrade SKILL.md (20 min)

**Add**:
- Frontmatter (version, triggers, auto_load_knowledge)
- Expand to 500 lines
- Add 7-10 TDD patterns
- Add evidence from Finance service tests

### Task 3: Create test-first-patterns.md (10 min)

**File**: `sessions/knowledge/vextrus-erp/patterns/test-first-patterns.md`

---

## Phase 4: CLAUDE.md Update (30 min)

**Quick updates**:
1. Search & replace "9 skills" → "17 skills"
2. Add Advanced Skills section
3. Copy skill activation matrix from README.md
4. Update model selection strategy

---

## Phase 5: Validation (15 min)

**Run through checklist** in SESSION-5-CHECKPOINT.md

---

## Anthropic Best Practices (Review Manually)

**Before next session, review these URLs**:
1. https://www.anthropic.com/news/skills
2. https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview
3. https://docs.claude.com/en/docs/agents-and-tools/agent-skills/quickstart
4. https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices

**Key patterns already identified**:
- 500+ lines per skill
- 3 resource files per skill
- Frontmatter: version, triggers, auto_load_knowledge
- Evidence-based examples
- Best practices + anti-patterns
- Quick reference tables

---

## Success Metrics

**After completion**:
- ✅ 17 skills all at 5-star quality
- ✅ 100% Anthropic best practices compliance
- ✅ Context usage: 8-9k tokens (4-4.5%)
- ✅ Core Skills (80% of tasks) fully upgraded
- ✅ Knowledge base integration: 17/17 skills

---

**Total Time**: 2.5-3 hours
**Priority**: HIGHEST
**Impact**: 80% of all development tasks improved

Ready to execute in next session!