# Compounding Cycle Protocol

**Purpose**: Complex feature development using Plan → Delegate → Assess → Codify
**Last Updated**: 2025-10-16 (Created for CC 2.0.19 + SpecKit)

---

## Philosophy

**Compounding Engineering**: Each task improves future tasks through systematic learning capture and quality compounding.

> "The key insight: AI agents don't just execute - they enable a **compounding quality cycle** where each iteration teaches the system, making subsequent work easier, faster, and better."
>
> — Sam Schillace, "I Have Seen the Compounding Teams"

---

## When to Use

**Apply compounding cycle for**:
- Complex features (multi-service, multi-day)
- New patterns being introduced
- Significant architectural changes
- Features requiring cross-team coordination
- Work that will teach reusable patterns

**Skip for**:
- Simple features (<4 hours)
- Bug fixes
- Straightforward refactoring
- Well-established patterns

**Decision Matrix**:
- **Complexity + Novelty → Compounding**
- **Simple + Familiar → Direct implementation**

---

## The Four Phases

### 1. PLAN (Research & Architecture)

**Goal**: Deep understanding before code, capture decisions in SpecKit spec

**Sonnet 4.5 orchestrates specialized agents**:

```bash
# Architecture & patterns
Task tool: compounding-engineering:architecture-strategist
Task tool: compounding-engineering:pattern-recognition-specialist

# External best practices
Task tool: compounding-engineering:best-practices-researcher

# Domain-specific planning
Task tool: backend-development:backend-architect
Task tool: database-design:database-architect
Task tool: backend-development:graphql-architect
```

**Haiku 4.5 for exploration**:
```bash
/explore services/[name]
/explore shared/
```

**Output**: Feature specification in `sessions/specs/[feature-name].md`

**SpecKit Spec Sections**:
1. **Context & Research**
   - What we learned from exploration
   - Relevant patterns from pattern-recognition-specialist
   - Best practices from researcher

2. **Requirements & Acceptance Criteria**
   - Functional requirements
   - Non-functional requirements (performance, security)
   - Success criteria (testable)

3. **Technical Approach & Decisions**
   - Architecture decisions (from architecture-strategist)
   - Database schema (from database-architect)
   - GraphQL schema (from graphql-architect)
   - Integration points
   - Event design (if applicable)

4. **Quality Gates to Apply**
   - Required: /review, /security-scan, /test
   - Recommended: performance-oracle, security-sentinel
   - Domain-specific validations

5. **References**
   - Constitution principles applied
   - Service CLAUDE.md files consulted
   - Patterns from workflow-patterns.md

**Time**: 1-3 hours for planning, saves 3-10 hours in implementation

---

### 2. DELEGATE (Parallel Execution)

**Goal**: Break down and execute in parallel using specialized agents

**Sonnet 4.5**: Breaks down spec into subtasks

**Haiku 4.5** (multiple instances): Executes subtasks in parallel

**Pattern**:
```
Sonnet analyzes spec → Creates subtasks → Delegates to Haiku instances

Haiku 1: Implement domain entities
Haiku 2: Create database migration
Haiku 3: Build GraphQL resolvers
Haiku 4: Write application commands
Haiku 5: Create integration tests

Sonnet: Reviews, integrates, ensures coherence
```

**Specialized Agents** (via Task tool):
```bash
# For specific technical tasks
Task tool: python-development:fastapi-pro           # FastAPI services
Task tool: javascript-typescript:typescript-pro     # TypeScript code
Task tool: database-design:sql-pro                  # Query optimization
Task tool: backend-development:graphql-architect    # GraphQL schemas
```

**TodoWrite Tool**: Track parallel subtask progress

**Time**: Implementation phase, potentially 2-5x faster with parallelization

---

### 3. ASSESS (Quality Compounding)

**Goal**: Multi-level quality review, capture improvement opportunities

**Level 1: Automated Quality Gates** (Required):
```bash
/review                   # code-review-ai plugin
/security-scan           # security-scanning plugin
/test                    # unit-testing plugin
pnpm build               # TypeScript compilation
```

**Level 2: Language-Specific Reviews** (Recommended):
```bash
Task tool: compounding-engineering:kieran-typescript-reviewer
# OR for Python services:
Task tool: compounding-engineering:kieran-python-reviewer
```

**Level 3: Specialized Reviews** (As needed):
```bash
# Architecture
Task tool: compounding-engineering:architecture-strategist

# Performance
Task tool: compounding-engineering:performance-oracle

# Security
Task tool: compounding-engineering:security-sentinel

# Database integrity (if DB changes)
Task tool: compounding-engineering:data-integrity-guardian

# Simplification (final pass)
Task tool: compounding-engineering:code-simplicity-reviewer
```

**Level 4: Domain-Specific Validation**:
- Bangladesh ERP compliance (VAT rates, Mushak-6.3, TIN/BIN)
- GraphQL Federation (schema composition, no breaking changes)
- Event sourcing (versioning, idempotency, replay logic)
- Database performance (indexes, query optimization, N+1 prevention)

**Output**: List of improvements, technical debt notes, pattern learnings

**Time**: 30 min - 2 hours depending on complexity

---

### 4. CODIFY (Learning Capture)

**Goal**: Systematically capture learnings to make future work easier

**Use feedback-codifier agent**:
```bash
Task tool: compounding-engineering:feedback-codifier
```

**Answer these questions**:

1. **What patterns worked well?**
   - Architectural decisions that paid off
   - Code patterns that improved clarity
   - Tools/libraries that accelerated work
   - Agent usage patterns that were effective

2. **What could be simplified?**
   - Over-engineering identified
   - Unnecessary abstractions
   - Cleaner approaches discovered
   - Dead-end explorations avoided

3. **What should be automated?**
   - Repetitive manual tasks
   - Testing workflows
   - Deployment steps
   - Quality checks

4. **What was hard to understand?**
   - Documentation gaps
   - Complex code without explanation
   - Integration points not documented
   - Domain concepts unclear

5. **What would help future similar tasks?**
   - Patterns to extract
   - Templates to create
   - Documentation to improve
   - Knowledge to codify

**Update knowledge base**:

```bash
# Service-specific learnings
vi services/[name]/CLAUDE.md

# Project-wide patterns
vi memory/patterns.md

# Project principles (if new standards)
vi memory/constitution.md

# Workflow patterns (if new workflow discovered)
vi sessions/knowledge/vextrus-erp/workflow-patterns.md

# Feature spec (implementation notes)
vi sessions/specs/[feature-name].md
```

**Output**: Updated documentation, patterns captured, future work easier

**Time**: 15-45 minutes, compounds value for all future work

---

## Complete Example: Invoice Payment Processing

### PLAN Phase (2 hours)

```bash
# Exploration
/explore services/finance
/explore services/finance/src/domain/aggregates

# Architecture planning
Task tool: compounding-engineering:architecture-strategist
# → Recommends event sourcing for payment processing

Task tool: compounding-engineering:pattern-recognition-specialist
# → Identifies similar patterns in Order aggregate

Task tool: backend-development:backend-architect
# → Designs Payment aggregate structure

Task tool: database-design:database-architect
# → Designs payment_events table, projections

# Create spec
vi sessions/specs/invoice-payment-processing.md
# → 200 lines: context, requirements, technical approach, quality gates
```

**Spec Output**:
- Event sourcing pattern (with EventStore)
- Payment aggregate with ProcessPaymentCommand
- GraphQL mutations: processPayment, recordPayment
- Integration: Notification service, Master Data (customer validation)
- Quality gates: All automated + performance-oracle + security-sentinel

### DELEGATE Phase (4 hours)

**Sonnet breaks down**:
1. Payment aggregate (domain entities)
2. Event definitions (domain events)
3. Command handlers (application layer)
4. GraphQL resolvers (API layer)
5. Event projections (read models)
6. Integration tests

**Haiku instances execute in parallel** (2 hours wall-clock time):
- Haiku 1-6: Each implements a subtask
- Sonnet: Reviews, ensures consistency, integrates

### ASSESS Phase (1 hour)

```bash
# Level 1: Automated
/review          # ✅ No critical issues
/security-scan   # ✅ No vulnerabilities
/test            # ✅ 100% passing
pnpm build       # ✅ Clean build

# Level 2: Language-specific
Task tool: compounding-engineering:kieran-typescript-reviewer
# → Suggests naming improvements (2 minor changes)

# Level 3: Specialized
Task tool: compounding-engineering:performance-oracle
# → Recommends caching customer validation (implemented)

Task tool: compounding-engineering:security-sentinel
# → Validates payment authorization checks (approved)

Task tool: compounding-engineering:data-integrity-guardian
# → Confirms event versioning correct (approved)

# Level 4: Domain-specific
# → Event replay tested ✅
# → Idempotency verified ✅
# → Projections updated correctly ✅
```

### CODIFY Phase (30 minutes)

```bash
Task tool: compounding-engineering:feedback-codifier
```

**Learnings captured**:

1. **Pattern worked well**: Event sourcing with EventStore
   - Updated: `services/finance/CLAUDE.md` (added payment event sourcing example)

2. **Simplification identified**: Customer validation caching reduces API calls 80%
   - Updated: `memory/patterns.md` (added caching pattern)

3. **Automation opportunity**: Payment event replay testing
   - Created: `services/finance/scripts/test-payment-replay.sh`

4. **Documentation gap**: Event versioning strategy unclear
   - Updated: `memory/constitution.md` (added event versioning guidelines)

5. **Future template**: Payment processing is reusable for subscriptions
   - Created: `sessions/templates/event-sourced-payment.md`

**Result**: Next payment-related feature takes 50% less time with captured patterns

---

## Integration with Protocols

**Task Creation** (`task-creation.md`):
- For complex features, create SpecKit spec first
- Reference spec in task frontmatter

**Task Startup** (`task-startup.md`):
- Load feature spec
- Review constitution
- Use /explore for context

**Task Completion** (`task-completion.md`):
- Run all quality gates (automated + specialized agents)
- Use feedback-codifier
- Update knowledge base

---

## Quick Reference

**PLAN** (1-3 hours):
- architecture-strategist, pattern-recognition-specialist, best-practices-researcher
- backend-architect, database-architect, graphql-architect
- Create SpecKit spec in `sessions/specs/`

**DELEGATE** (implementation):
- Sonnet breaks down → Haiku executes in parallel
- Use specialized agents via Task tool
- TodoWrite for progress tracking

**ASSESS** (30 min - 2 hours):
- Level 1: /review, /security-scan, /test, build
- Level 2: kieran-typescript-reviewer or kieran-python-reviewer
- Level 3: performance-oracle, security-sentinel, data-integrity-guardian
- Level 4: Domain-specific validations

**CODIFY** (15-45 minutes):
- feedback-codifier agent
- Update service CLAUDE.md
- Update memory/patterns.md
- Update memory/constitution.md (if new standards)
- Update workflow patterns (if new workflow)

---

## Metrics

**Quality Compounding**:
- First feature: 10 hours
- Second feature (with learnings): 6 hours (40% faster)
- Third feature (with templates): 4 hours (60% faster)
- Fourth feature (fully automated): 2 hours (80% faster)

**Knowledge Growth**:
- After 10 complex features: 50+ patterns captured
- After 20 complex features: Most work becomes "simple" due to established patterns

---

## Tips

1. **Don't skip PLAN** - 1 hour planning saves 5 hours implementation
2. **Parallelize DELEGATE** - Use Haiku instances for 2-5x speedup
3. **Never skip ASSESS** - Quality compounds, technical debt multiplies
4. **Always do CODIFY** - This is what makes future work easier
5. **Update specs** - Capture what actually happened vs what was planned

---

## Related Protocols

- **Task creation**: `sessions/protocols/task-creation.md`
- **Task startup**: `sessions/protocols/task-startup.md`
- **Task completion**: `sessions/protocols/task-completion.md`
- **Context maintenance**: `sessions/protocols/context-compaction.md`

---

## Philosophy

> "The compounding effect: Each complex feature captured in SpecKit specs, validated through multi-level quality gates, and codified into reusable patterns makes all future work easier, faster, and better."

**Key Principles**:
1. **Plan before code** - Deep understanding prevents rework
2. **Parallel execution** - Leverage multiple agents simultaneously
3. **Quality compounds** - Each quality gate improves the system
4. **Learning capture** - Systematic codification enables compounding
5. **Pattern reuse** - Each feature creates templates for future features

---

**Last Updated**: 2025-10-16
**Status**: ✅ Created for CC 2.0.19 + SpecKit + Compounding Philosophy
**Source**: Sam Schillace's "I Have Seen the Compounding Teams"
