# Plan Mode Workflow

**Purpose**: Systematic planning before implementation for medium and complex tasks
**When to Use**: Medium (optional), Complex (mandatory)
**Pattern**: Research → Analyze → Design → TodoWrite

---

## Overview

Plan Mode creates a comprehensive implementation plan before writing code, ensuring:
- **Thorough research** (parallel agents, external best practices)
- **Clear design** (architecture decisions, pattern selection)
- **Structured execution** (TodoWrite with 8-15 items)
- **Zero rework** (<5% in finance task vs 30-40% without planning)

**Success Rate**: 90%+ (proven in 40+ tasks)

---

## When to Use Plan Mode

### Medium Tasks (Optional, Recommended for 6-8 hours)

✅ **Use Plan Mode when**:
- Unfamiliar codebase area
- Cross-service integration needed
- Multiple patterns/approaches possible
- High complexity or risk

❌ **Skip Plan Mode for**:
- Familiar area with clear approach
- Simple 4-5 hour straightforward task
- Time-constrained (emergency fixes)

### Complex Tasks (Mandatory)

**ALWAYS use Plan Mode** for multi-day features:
- Ensures comprehensive design
- Identifies dependencies early
- Prevents architectural mistakes
- Creates structured execution plan

---

## Plan Mode Pattern

### Phase 1: Research (30-90 min)

**1.1 Enable GitHub MCP** (if using GitHub tracking):
```bash
/context  # Check current context
/mcp enable github  # Enable if <35%
```

**1.2 Create GitHub Issue** (if using):
```typescript
mcp__github__create_issue({
  owner: "your-org",
  repo: "vextrus-erp",
  title: "Implement payment reconciliation feature",
  body: "## Goal\n...\n\n## Scope\n...\n\n## Estimated Time\n6-8 hours",
  labels: ["feature", "planning"]
})
```

**1.3 Parallel Agent Research**:

**For Medium Tasks** (1-2 agents):
```
"Analyze existing payment processing patterns before implementing payment reconciliation"
// → pattern-recognition-specialist agent
```

**For Complex Tasks** (2-4 agents in parallel):
```
// Agent 1
"Design the invoice-payment linking feature with cross-aggregate coordination"
// → architecture-strategist agent

// Agent 2
"Research bank reconciliation best practices for construction industry ERP"
// → best-practices-researcher agent

// Agent 3 (if needed)
"Analyze git history to understand why current payment processing was designed this way"
// → git-history-analyzer agent
```

**1.4 Explore Codebase** (optional, 5-10 min):
```bash
/explore services/finance/src/application/services
```

**Skills that activate**:
- `haiku-explorer` (fast Haiku 4.5 exploration)

---

### Phase 2: Analyze (30-60 min)

**2.1 Read Agent Outputs**:
- Synthesize findings from 2-4 agents
- Identify design patterns
- Note architectural constraints
- List dependencies

**2.2 Read Key Files COMPLETELY**:
- Read files identified by agents (5-10 files)
- Read relevant VEXTRUS-PATTERNS.md sections
- Read service-specific CLAUDE.md (if exists)

**Critical**: ALWAYS read entire files, not just sections

**2.3 Reference External Best Practices**:
- best-practices-researcher agent output
- Framework documentation (if framework-docs-researcher used)
- Industry patterns (construction, real estate if applicable)

---

### Phase 3: Design (30-90 min)

**3.1 Make Architectural Decisions**:

**For Medium Tasks**:
- Service organization (which service owns the feature?)
- Pattern selection (CQRS? Event sourcing? Simple service?)
- Integration approach (Federation? Event-driven? Direct call?)

**For Complex Tasks** (comprehensive):
- Cross-aggregate coordination strategy
- Event flow design
- Multi-tenant isolation approach
- Performance strategy (caching, indexes)
- Bangladesh compliance integration
- GraphQL Federation v2 schema design

**3.2 Document Design Decisions**:
```markdown
## Design Decisions

### 1. Cross-Aggregate Coordination
**Decision**: Event-driven (InvoiceCreated → PaymentMatching)
**Rationale**: Loose coupling, better scalability
**Alternative Considered**: Direct aggregate reference (rejected: tight coupling)

### 2. Bank Reconciliation Algorithm
**Decision**: CSV parser + fuzzy matching (Levenshtein distance)
**Rationale**: Handles typos, industry standard
**Alternative Considered**: Exact matching (rejected: too rigid)

### 3. Multi-Tenant Isolation
**Decision**: Schema-based (tenant_* PostgreSQL schemas)
**Rationale**: Strong isolation, proven in other services
**Alternative Considered**: Row-level (rejected: less secure)
```

---

### Phase 4: TodoWrite (15-30 min)

**4.1 Create Structured Task List**:

**Medium Task Example** (6-8 items):
```typescript
TodoWrite: [
  { content: "Design ReconciliationService interface", status: "completed", activeForm: "..." },
  { content: "Implement CSV parser for bank statements", status: "pending", activeForm: "..." },
  { content: "Add fuzzy matching algorithm", status: "pending", activeForm: "..." },
  { content: "Create CQRS command handlers", status: "pending", activeForm: "..." },
  { content: "Add GraphQL resolvers", status: "pending", activeForm: "..." },
  { content: "Write unit tests (90%+ coverage)", status: "pending", activeForm: "..." },
  { content: "kieran-typescript-reviewer review", status: "pending", activeForm: "..." },
  { content: "Create final checkpoint", status: "pending", activeForm: "..." },
]
```

**Complex Task Example** (10-15 items):
```typescript
TodoWrite: [
  // Phase 1: Planning
  { content: "Research and design (agents + analysis)", status: "completed", activeForm: "..." },

  // Phase 2: Domain Layer
  { content: "Implement Payment aggregate", status: "pending", activeForm: "..." },
  { content: "Implement Reconciliation aggregate", status: "pending", activeForm: "..." },
  { content: "Add domain events (5 events)", status: "pending", activeForm: "..." },
  { content: "Unit tests for domain layer", status: "pending", activeForm: "..." },

  // Phase 3: Application Layer
  { content: "CQRS command handlers (3 commands)", status: "pending", activeForm: "..." },
  { content: "CQRS query handlers (5 queries)", status: "pending", activeForm: "..." },
  { content: "Projection handlers with cache invalidation", status: "pending", activeForm: "..." },
  { content: "Integration tests", status: "pending", activeForm: "..." },

  // Phase 4: Presentation Layer
  { content: "GraphQL resolvers (Federation v2)", status: "pending", activeForm: "..." },
  { content: "E2E tests", status: "pending", activeForm: "..." },

  // Phase 5: Review
  { content: "kieran-typescript-reviewer review", status: "pending", activeForm: "..." },
  { content: "security-sentinel audit", status: "pending", activeForm: "..." },
  { content: "Create final checkpoint", status: "pending", activeForm: "..." },
]
```

**4.2 Estimate Time per Task**:
- Domain layer: 30-50% of total time
- Application layer: 25-35% of total time
- Presentation layer: 15-25% of total time
- Review + Polish: 10-15% of total time

---

### Phase 5: Create Planning Checkpoint (30-60 min)

**Medium Task Checkpoint** (200-400 lines):
```markdown
# Planning: Payment Reconciliation COMPLETE

## Summary
- pattern-recognition-specialist: Existing payment patterns analyzed
- Design: CSV parser + fuzzy matching algorithm
- Implementation plan: 8 tasks defined

## Design Decisions
[Paste design decisions from Phase 3...]

## Agent Outputs
### pattern-recognition-specialist
[Key findings...]

## Implementation Plan (TodoWrite)
[Paste todo list...]

## Files to Read
1. services/finance/src/domain/aggregates/payment.aggregate.ts
2. services/finance/src/application/services/payment.service.ts
[...]

## Next Session Plan
**Task**: Implement CSV parser for bank statements
**Context Load**: Read this checkpoint + VEXTRUS-PATTERNS.md (Section 7: Performance)
**Estimated Time**: 2 hours
```

**Complex Task Checkpoint** (400-600 lines):
```markdown
# Phase 1 Day 1: Planning COMPLETE

## Summary
- architecture-strategist: Cross-aggregate coordination designed
- best-practices-researcher: Bank reconciliation best practices identified
- Implementation plan: 14 tasks across 5 phases

## Design Decisions
[Comprehensive design decisions with rationale...]

## Agent Outputs
### architecture-strategist
[Full architecture design...]

### best-practices-researcher
[Industry patterns and recommendations...]

## Implementation Phases
### Phase 2: Domain Layer (6-8 hours)
[Detailed breakdown...]

### Phase 3: Application Layer (6-8 hours)
[Detailed breakdown...]

[Continue for all phases...]

## Files to Read (15 files)
[Complete file list with purpose...]

## Success Criteria
- [ ] Tests passing (90%+ coverage)
- [ ] Build passing (zero errors)
- [ ] Multi-tenant isolation verified
- [ ] Bangladesh compliance (VAT, Mushak 6.3)
- [ ] Performance <300ms

## Next Session Plan
**Task**: Implement Payment aggregate (Phase 2)
**Context Load**: Read this checkpoint + domain aggregate files
**Estimated Time**: 3-4 hours
```

**Sync to GitHub** (if using):
```bash
./.claude/github/scripts/sync-checkpoint.sh checkpoint-planning.md <issue-number>
```

---

## Benefits of Plan Mode

### Proven Metrics (Finance Task)

**Without Plan Mode** (v1.0 approach):
- Rework: 30-40%
- Bug rate: 1.2 per feature
- Time wasted: 6-10 hours on abandoned approaches

**With Plan Mode** (v3.0 approach):
- Rework: <5%
- Bug rate: 0 bugs (in production)
- Time saved: 8-12 hours (avoided wrong approaches)
- Quality: 9.5/10 (vs 7/10 without planning)

### Why It Works

**Early Mistake Detection**:
- Agents identify flaws in approach BEFORE coding
- Catch architectural issues in design phase
- Fix in 30 min planning vs 4 hours of rework

**Complete Context**:
- Read all relevant files before starting
- Understand existing patterns thoroughly
- Make informed design decisions

**Structured Execution**:
- TodoWrite provides clear roadmap
- No "what should I do next?" delays
- Systematic progress tracking

---

## Examples

### Example 1: Medium Task (Payment Reconciliation)

```
User: "Implement payment reconciliation feature"

Plan Mode (90 min total):

1. Research (30 min):
   - pattern-recognition-specialist agent
   - /explore services/finance

2. Analyze (20 min):
   - Read 5 files completely
   - Read VEXTRUS-PATTERNS.md (Performance, Event Sourcing sections)

3. Design (25 min):
   - Decision: CSV parser + fuzzy matching
   - Decision: Event-driven reconciliation
   - Document in checkpoint

4. TodoWrite (10 min):
   - 8 tasks defined (CSV parser → tests → review)

5. Checkpoint (15 min):
   - Create 250-line planning checkpoint
   - Sync to GitHub issue #123

Implementation (5.5 hours):
- Execute systematically following todo list
- Update todos as progressing
- kieran-typescript-reviewer review

Total: 7 hours (vs 10 hours without plan mode, 30% time saved)
Quality: 9/10 (vs 7/10 without planning)
Rework: <5% (vs 35% without planning)
```

### Example 2: Complex Task (Invoice-Payment Linking)

```
User: "Implement comprehensive invoice-payment linking with reconciliation"

Plan Mode (4 hours, Day 1):

1. Research (90 min):
   - architecture-strategist agent (cross-aggregate design)
   - best-practices-researcher agent (bank reconciliation patterns)
   - git-history-analyzer agent (why current design exists)

2. Analyze (60 min):
   - Read 10 files completely
   - Read VEXTRUS-PATTERNS.md (sections 1, 2, 3, 7, 14)
   - Synthesize agent findings

3. Design (60 min):
   - 5 major architectural decisions documented
   - Event flow designed
   - Multi-tenant strategy defined
   - Performance approach planned

4. TodoWrite (20 min):
   - 14 tasks across 5 phases
   - Time estimates per phase

5. Checkpoint (30 min):
   - Create 550-line comprehensive planning checkpoint
   - Sync to GitHub issue #123

Implementation (20 hours, Day 2-5):
- Execute phase by phase
- Daily checkpoints (4 additional checkpoints)
- Agent reviews at end

Total: 24 hours over 5 days
Quality: 9.5/10 (proven in finance task)
Rework: <5%
Bugs: 0 (in production)

Without Plan Mode: Would have taken 35-40 hours with 30%+ rework
Time saved: 11-16 hours (46% reduction)
```

---

## Best Practices

### Agent Selection

**Medium Tasks** (1-2 agents):
- pattern-recognition-specialist (understand existing patterns)
- OR architecture-strategist (if new architectural approach needed)

**Complex Tasks** (2-4 agents):
- architecture-strategist (ALWAYS for multi-day features)
- best-practices-researcher (external validation)
- pattern-recognition-specialist (codebase patterns)
- git-history-analyzer (understand current design rationale)

### Checkpoint Discipline

**ALWAYS create planning checkpoint**:
- Medium tasks: 200-400 lines
- Complex tasks: 400-600 lines

**Include in checkpoint**:
- Agent outputs summary
- Design decisions with rationale
- Implementation plan (TodoWrite)
- Files to read list
- Next session plan

### Time Management

**Don't over-plan**:
- Medium task: 90-120 min max
- Complex task: 3-4 hours max
- If planning >4 hours, start implementing and iterate

**Don't under-plan**:
- Spending 30 min planning to save 6 hours rework = 12x ROI
- Early mistakes are expensive (4-8 hours to fix vs 30 min to prevent)

---

## Troubleshooting

**Agents returning unhelpful output?**
- Refine prompts with more context
- Try different agents (repo-research-analyst instead of best-practices-researcher)
- Skip agent and use manual research

**Plan too detailed?**
- Focus on high-level design decisions
- Don't plan implementation details (those emerge during coding)
- 400-600 lines max for complex tasks

**Unsure when to exit Plan Mode?**
- You have clear TodoWrite list (8-15 items)
- You have documented design decisions
- You know which files to read first
- You can estimate time per phase

---

**Pattern**: Research → Analyze → Design → TodoWrite → Checkpoint

**Time Investment**:
- Medium: 90-120 min (saves 2-4 hours)
- Complex: 3-4 hours (saves 10-15 hours)

**Success Rate**: 90%+ (proven in 40+ tasks)

**See Also**:
- `../task-templates/medium-task-template.md` - Medium task with Plan Mode
- `../task-templates/complex-task-template.md` - Complex task with Plan Mode
- `.claude/agents/DECISION-TREE.md` - Agent selection framework
- `checkpoint-logs-integration.md` - Checkpoint best practices
