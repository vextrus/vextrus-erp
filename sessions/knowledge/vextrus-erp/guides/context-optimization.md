# Context Optimization Tips for Vextrus ERP

**Purpose**: Strategies for managing 200k token context limit in complex microservices project
**Context**: 18 microservices, 107 agents, 16 MCP servers, large codebase
**Last Updated**: 2025-10-16

---

## The Challenge

**Context Limit**: 200,000 tokens
**Typical Usage Without Optimization**:
- All MCP servers enabled: 111,000 tokens (55% of context!)
- Large task files: 3,000+ lines (15,000 tokens)
- Embedded documentation: 10,000+ tokens
- **Result**: 140k+ tokens before any actual work

**With Optimization**:
- On-demand MCP: 1,500 tokens (0.7% of context)
- Concise task files: <500 lines (2,500 tokens)
- Referenced documentation: 0 tokens (references only)
- **Result**: <5k baseline tokens = 97.5% context available for work

---

## Strategy 1: MCP On-Demand Enabling

**Problem**: Pre-enabling all 16 MCP servers consumes 111k tokens (55% of context)

**Solution**: Enable only when needed with `@servername`

### MCP Context Costs

| MCP Server | Context Cost | When to Enable |
|-----------|--------------|----------------|
| sequential-thinking | 1,500 tokens | Always (auto-enabled) |
| postgres | 8,500 tokens | @postgres (database queries) |
| docker | 12,000 tokens | @docker (container management) |
| playwright | 15,000 tokens | @playwright (E2E testing) |
| github | 9,000 tokens | @github (repository operations) |
| serena | 22,000 tokens | @serena (advanced code analysis) |
| context7 | 18,000 tokens | @context7 (library docs) |
| consult7 | 14,000 tokens | @consult7 (technical consultations) |

**Best Practice**:

```markdown
❌ Don't: Pre-enable all MCPs
✅ Do: Enable on-demand

## Bad Example
# User pre-enables all 16 MCPs at session start
# Result: 111k tokens consumed, 89k remaining (44% available)

## Good Example
# Only sequential-thinking enabled (1.5k tokens)
# When needed: @postgres (enables postgres MCP)
# After use: Disable if not needed
# Result: 198.5k tokens available (99% available)
```

### When to Enable Each MCP

**postgres** (`@postgres`):
- Designing database schema
- Analyzing query performance
- Debugging database issues
- Creating migrations
- Complex SQL queries

**docker** (`@docker`):
- Container configuration
- Docker Compose issues
- Service orchestration
- Network debugging
- Volume management

**playwright** (`@playwright`):
- E2E test creation
- Browser automation
- Integration testing
- UI testing scenarios

**github** (`@github`):
- PR creation/management
- Issue tracking
- Repository analysis
- Workflow troubleshooting

**serena** (`@serena`):
- Advanced codebase analysis
- Complex symbol navigation
- Dependency graph analysis
- Pattern detection

**context7** (`@context7`):
- Library documentation lookup
- Framework reference
- API documentation

**consult7** (`@consult7`):
- Technical consultations
- Architecture decisions
- Best practice research

### Context Savings

**Before optimization**:
```
Base context: 200,000 tokens
MCP overhead: -111,000 tokens (55%)
Available: 89,000 tokens (45%)
```

**After optimization**:
```
Base context: 200,000 tokens
MCP overhead: -1,500 tokens (0.7%)
Available: 198,500 tokens (99%)
Savings: 109,500 tokens (98.6% reduction!)
```

---

## Strategy 2: Task File Size Management

**Problem**: Task files growing to 3,168 lines (embedding full context)

**Solution**: Keep task files <500 lines using references

### Task File Size Targets

| Size | Status | Action |
|------|--------|--------|
| <500 lines | ✅ Excellent | Continue |
| 500-1000 lines | ⚠️ Warning | Review for bloat |
| >1000 lines | ❌ Too large | Split or reference |

### Anti-Pattern: Context Embedding

```markdown
❌ DON'T DO THIS (3,168 lines!)

# Task: Implement Invoice Management

## Context Manifest

### Full Service Architecture
[Paste entire services/finance/CLAUDE.md - 800 lines]

### Complete Domain Model
[Paste all entity definitions - 600 lines]

### All Business Rules
[Copy every business rule - 500 lines]

### GraphQL Schema
[Full schema definitions - 400 lines]

### Event Sourcing Patterns
[Complete event sourcing guide - 500 lines]

### Integration Points
[All service integrations - 400 lines]

**Result**: 3,168 line task file consuming 15,000+ tokens
```

### Best Practice: Reference Pattern

```markdown
✅ DO THIS (<100 lines)

# Task: Implement Invoice Management

## Context

**Service**: `services/finance/`
**Architecture**: See `services/finance/CLAUDE.md`
**Domain Model**: `/explore services/finance/src/domain`

**Key Files**:
- Domain: `src/domain/aggregates/invoice/`
- Commands: `src/application/commands/`
- Resolvers: `src/graphql/resolvers/invoice.resolver.ts`
- Events: `src/domain/events/invoice-*.event.ts`

**Integration Points**:
- Master Data: Customer reference
- Notification: Invoice notifications
- Audit: Change tracking

**For details**: Run `/explore services/finance`

**Result**: 50 line task file consuming 250 tokens
**Savings**: 14,750 tokens (98.3% reduction)
```

### Task File Structure

```markdown
---
task: h-task-name
branch: feature/branch-name
status: in-progress
---

# Task Title

## Problem/Goal (1-2 paragraphs)

## Context (references only, <100 lines)
- Service references
- Key file paths
- Integration points
- Use /explore command

## Implementation Plan (concise, <200 lines)
1. Step 1
2. Step 2
3. Step 3

## Progress Tracking (updates as you go)
- [x] Completed item
- [ ] Pending item

## Decisions Made (<100 lines)
Key decisions with rationale

## Work Log (<100 lines)
Brief updates per session

**Target Total**: <500 lines
```

---

## Strategy 3: Reference > Embed

**Principle**: Reference external documentation instead of copying it

### Examples

#### ❌ Bad: Embedding

```markdown
## Domain Model

### Invoice Entity
\`\`\`typescript
export class Invoice {
  id: string;
  customerId: string;
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  // ... 50 more lines
}
\`\`\`

### InvoiceLineItem Entity
\`\`\`typescript
export class InvoiceLineItem {
  // ... 30 lines
}
\`\`\`

### Payment Entity
\`\`\`typescript
export class Payment {
  // ... 40 lines
}
\`\`\`

[Repeat for 10+ entities = 1,000+ lines embedded]
```

**Cost**: 5,000 tokens

#### ✅ Good: Referencing

```markdown
## Domain Model

See: `services/finance/src/domain/entities/`

Key entities:
- Invoice (`invoice.entity.ts`)
- InvoiceLineItem (`invoice-line-item.entity.ts`)
- Payment (`payment.entity.ts`)

For exploration: `/explore services/finance/src/domain/entities`
```

**Cost**: 100 tokens
**Savings**: 4,900 tokens (98% reduction)

### When to Reference vs Embed

**Always Reference**:
- Complete entity definitions
- Full schema files
- Entire service architectures
- Large configuration files
- Historical documentation

**Small Embeds OK** (if <20 lines):
- Specific code snippets being modified
- Error messages being debugged
- Critical configuration sections
- Key decision rationale

---

## Strategy 4: Explore Agent Usage

**Problem**: Manual file reading consumes main context window

**Solution**: Use `/explore` (Haiku 4.5 - separate context window)

### Explore vs Manual Reading

#### ❌ Manual Reading (Consumes Main Context)

```markdown
Read: services/finance/CLAUDE.md           # 800 lines = 4,000 tokens
Read: services/finance/src/domain/...      # 1,200 lines = 6,000 tokens
Read: services/finance/src/application/... # 800 lines = 4,000 tokens
Read: services/finance/src/graphql/...     # 600 lines = 3,000 tokens

Total: 3,400 lines read = 17,000 tokens from main context
```

#### ✅ Explore Agent (Separate Context)

```markdown
/explore services/finance

# Haiku 4.5 analyzes entire service
# Returns comprehensive summary
# Uses separate 200k context window

Result: Summary in main context = ~500 tokens
Savings: 16,500 tokens from main context (97% reduction)

Benefits:
- 2x faster than manual reading
- 1/3 the cost
- Comprehensive analysis
- Preserves main context
```

### Explore Usage Patterns

**Entire Service**:
```bash
/explore services/finance
```

**Specific Directory**:
```bash
/explore services/finance/src/domain
```

**Multiple Services**:
```bash
/explore services/finance
/explore services/master-data
/explore shared/domain-primitives
```

**Pattern Matching**:
```bash
/explore services/finance/**/*.resolver.ts
```

### When to Use Explore

✅ **Use /explore for**:
- Initial context gathering
- Understanding service structure
- Finding patterns across files
- Dependency analysis
- Quick codebase overview

❌ **Manual reading for**:
- Specific 20-line code section
- Single error message
- Targeted debugging
- Small config file

---

## Strategy 5: Plugin Subagent Context Optimization

**Problem**: Running agents in main context consumes tokens

**Solution**: Use Task tool (separate context windows)

### How Plugin Agents Work

**Each plugin agent runs in separate context window**:
- Agent gets 200k token context
- Returns summary to main context
- Main context only receives final output

### Context Comparison

#### ❌ Manual Architecture Review (Main Context)

```markdown
Read: services/finance/CLAUDE.md           # 4,000 tokens
Read: All domain entities                   # 6,000 tokens
Read: All application layer                 # 4,000 tokens
Analyze architecture                        # 3,000 tokens
Write review                                # 2,000 tokens

Total: 19,000 tokens from main context
```

#### ✅ backend-architect Agent (Separate Context)

```markdown
Use Task tool: backend-development:backend-architect

Agent in separate context:
- Reads all necessary files (0 tokens from main)
- Analyzes architecture (0 tokens from main)
- Returns summary

Main context receives: 800 token summary

Savings: 18,200 tokens from main context (96% reduction)
```

### Parallel Agent Execution

**Even better**: Run multiple agents in parallel (all separate contexts)

```markdown
Use Task tool: backend-development:backend-architect
Use Task tool: database-design:database-architect
Use Task tool: backend-development:graphql-architect

# All 3 agents run simultaneously
# Each in separate 200k context window
# Main context gets 3 summaries = ~2,000 tokens total

vs Manual equivalent: 40,000+ tokens
Savings: 38,000 tokens (95% reduction)
```

---

## Strategy 6: Model Selection for Context Efficiency

**Principle**: Use faster, cheaper Haiku 4.5 when possible

### Model Context Efficiency

| Model | Speed | Cost | Context Usage | Best For |
|-------|-------|------|---------------|----------|
| Haiku 4.5 | 2x faster | 1/3 cost | Efficient | Exploration, subtasks, parallel work |
| Sonnet 4.5 | Baseline | Baseline | Standard | Complex logic, integration, review |

### When to Use Each

**Haiku 4.5** (`/explore` or parallel subtasks):
- Codebase exploration
- File reading and analysis
- Pattern detection
- Dependency analysis
- Parallel subtask execution
- Quick prototyping
- Documentation review

**Sonnet 4.5** (main agent):
- Complex business logic
- Architecture decisions
- Multi-step planning
- Security-critical code
- Integration design
- Performance optimization
- Final integration

### Workflow Example

```markdown
## Bad: Everything with Sonnet 4.5
Sonnet reads service architecture      # 10,000 tokens
Sonnet explores domain model           # 8,000 tokens
Sonnet analyzes dependencies           # 6,000 tokens
Sonnet designs solution                # 8,000 tokens
Sonnet implements                      # 12,000 tokens
Total: 44,000 tokens

## Good: Haiku for exploration, Sonnet for complexity
Haiku explores service (/explore)      # 500 tokens (summary)
Haiku analyzes domain (/explore)       # 400 tokens (summary)
Haiku checks dependencies (/explore)   # 300 tokens (summary)
Sonnet designs solution                # 8,000 tokens
Sonnet implements complex logic        # 12,000 tokens
Total: 21,200 tokens

Savings: 22,800 tokens (52% reduction)
```

---

## Strategy 7: Service CLAUDE.md Files

**Principle**: Each service has CLAUDE.md with architecture/decisions

### CLAUDE.md Pattern

```markdown
# services/finance/CLAUDE.md

# Finance Service

**Domain**: Financial management, invoicing, payments
**Status**: In Progress
**Version**: 1.0

## Architecture
[Concise architecture overview]

## Domain Model
[Key aggregates, entities, value objects - names only]

## Business Rules
[Critical rules only]

## Integration Points
[Service dependencies]

## Patterns
[DDD/CQRS/Event Sourcing patterns used]

## Recent Decisions
[ADRs - last 5 major decisions]

**Length**: 400-600 lines (referenced, not embedded)
```

### Usage in Task Files

```markdown
❌ Don't: Copy entire CLAUDE.md into task file

✅ Do: Reference it
See: `services/finance/CLAUDE.md` for architecture
Run: `/explore services/finance` for details
```

---

## Strategy 8: Incremental Context Loading

**Principle**: Load context only when needed, not all upfront

### Anti-Pattern: Front-Load Everything

```markdown
❌ Bad: Load all context at start

Session start:
- Read all service CLAUDE.md files      # 20,000 tokens
- Read all domain models                # 15,000 tokens
- Read all GraphQL schemas              # 10,000 tokens
- Read all integration docs             # 8,000 tokens

Total: 53,000 tokens before starting work
```

### Best Practice: Load Incrementally

```markdown
✅ Good: Load as needed

Session start (minimal):
- Read task file                        # 500 tokens
- Check git status                      # 200 tokens

Phase 1 - Planning:
- /explore relevant service             # 600 tokens

Phase 2 - Design:
- Use architecture agent (separate)     # 800 tokens summary

Phase 3 - Implementation:
- Read specific files as needed         # 2,000 tokens

Total: 4,100 tokens (92% less than front-loading)
```

---

## Strategy 9: Git Diff Instead of Full Files

**Principle**: When reviewing changes, use diffs not full files

### Example

```markdown
❌ Don't: Read entire files
Read: src/domain/invoice.entity.ts       # 500 lines = 2,500 tokens
Read: src/resolvers/invoice.resolver.ts  # 400 lines = 2,000 tokens
Read: src/commands/create-invoice.ts     # 300 lines = 1,500 tokens
Total: 6,000 tokens

✅ Do: Use git diff
git diff HEAD~1 src/domain/invoice.entity.ts
git diff HEAD~1 src/resolvers/invoice.resolver.ts
git diff HEAD~1 src/commands/create-invoice.ts

# Only changed lines shown = 50 lines = 250 tokens
Savings: 5,750 tokens (96% reduction)
```

---

## Strategy 10: Todo List for Progress Tracking

**Principle**: Use TodoWrite tool instead of long work logs

### Anti-Pattern: Verbose Work Logs

```markdown
❌ Bad: Detailed work logs in task file

## Work Log

**Session 1 - 2025-10-15 10:00-12:00**
Started by exploring the finance service architecture. Read through the CLAUDE.md file which describes the overall structure. Then analyzed the domain model, specifically the Invoice aggregate which handles invoice lifecycle. Looked at the value objects including Money, InvoiceNumber, and TaxAmount. Reviewed the event sourcing implementation...
[500+ lines of detailed notes]

**Session 2 - 2025-10-15 14:00-16:00**
Continued implementation of the invoice aggregate. Started with the createInvoice command handler...
[400+ lines more]

Total: 900+ lines = 4,500 tokens
```

### Best Practice: Concise Updates + Todo List

```markdown
✅ Good: Brief log + TodoWrite tool

## Work Log

**Session 1 - 2025-10-15**
- Explored finance service
- Designed Invoice aggregate
- Implemented commands

**Session 2 - 2025-10-15**
- Implemented resolvers
- Added tests
- Quality gates passed

## Progress
TodoWrite tool maintains:
- [x] Design Invoice aggregate
- [x] Implement commands
- [x] Implement resolvers
- [ ] Integration testing

Total: 50 lines = 250 tokens
Savings: 4,250 tokens (95% reduction)
```

---

## Real-World Examples

### Example 1: Finance Backend Task

**Before Optimization** (Session that hit context limit):
```markdown
Context usage: 185k/200k (92.5%)

Breakdown:
- All MCPs enabled:             111,000 tokens
- Task file (3,168 lines):       15,000 tokens
- Embedded architecture:         20,000 tokens
- Manual file reading:           25,000 tokens
- Work log (verbose):            10,000 tokens
- Actual work:                    4,000 tokens

Problem: Only 15k tokens left for actual coding!
```

**After Optimization**:
```markdown
Context usage: 35k/200k (17.5%)

Breakdown:
- Sequential-thinking MCP only:   1,500 tokens
- Task file (450 lines):          2,200 tokens
- References (not embedded):        800 tokens
- /explore summaries:             1,200 tokens
- TodoWrite tracking:               300 tokens
- Actual work:                   29,000 tokens

Result: 165k tokens available! (82.5% available)
```

**Savings**: 150,000 tokens (81% more context available)

### Example 2: Cross-Service Integration

**Before Optimization**:
```markdown
Manual approach:
- Read 3 service CLAUDE.md files:       12,000 tokens
- Read domain models (3 services):      18,000 tokens
- Read integration docs:                 8,000 tokens
- Manual dependency analysis:           10,000 tokens
Total: 48,000 tokens

Result: 152k tokens remaining
```

**After Optimization**:
```markdown
Optimized approach:
- /explore services/finance:               600 tokens
- /explore services/master-data:           500 tokens
- /explore shared/domain-primitives:       400 tokens
- Use backend-architect (separate):        800 tokens
- Use pattern-recognition (separate):      600 tokens
Total: 2,900 tokens

Result: 197k tokens remaining

Savings: 45,100 tokens (94% reduction)
```

---

## Context Budget Guidelines

### Session Context Budget

**Baseline** (unavoidable):
- sequential-thinking MCP: 1,500 tokens
- Task file (<500 lines): 2,500 tokens
- Git status/branch info: 200 tokens
- **Total baseline**: 4,200 tokens

**Context Available**: 195,800 tokens (97.9%)

### Recommended Allocation

| Phase | Budget | Strategy |
|-------|--------|----------|
| **Exploration** | 5k tokens | Use /explore, not manual reading |
| **Planning** | 10k tokens | Use agents (separate contexts) |
| **Implementation** | 140k tokens | Main work, incremental loading |
| **Review** | 20k tokens | Diffs, not full files |
| **Documentation** | 10k tokens | Updates, not rewrites |
| **Buffer** | 10k tokens | Unexpected needs |

**Total**: 195k tokens

### Warning Signs

🚨 **Context Danger Zone** (>60% usage):
- Stop and review what's consuming context
- Clear unnecessary loaded files
- Use /explore instead of manual reads
- Enable MCPs only when actively using

🛑 **Context Critical** (>80% usage):
- Checkpoint current work (Esc-Esc)
- Start new session
- Apply all optimization strategies

---

## Optimization Checklist

Before starting any task:

- [ ] Only sequential-thinking MCP enabled (1.5k tokens)
- [ ] Task file <500 lines (2.5k tokens)
- [ ] Using references, not embedding (0 tokens)
- [ ] Plan to use /explore, not manual reading
- [ ] Plan to use agents (separate contexts)
- [ ] TodoWrite for progress tracking

During task:

- [ ] Enable MCPs only when actively using them
- [ ] Use /explore for codebase analysis
- [ ] Use git diff, not full file reads
- [ ] Keep work log concise
- [ ] Monitor context usage (/context command)

After task:

- [ ] Task file still <500 lines
- [ ] Disable any enabled MCPs if not needed
- [ ] Clear embedded content from task file

---

## Quick Reference

**Context Savings Summary**:

| Optimization | Before | After | Savings |
|-------------|--------|-------|---------|
| MCP on-demand | 111k | 1.5k | 98.6% |
| Task file size | 15k | 2.5k | 83.3% |
| Reference vs Embed | 20k | 0.8k | 96% |
| /explore vs Manual | 17k | 0.5k | 97% |
| Agent separate context | 19k | 0.8k | 96% |

**Total Context Reclaimed**: 169,400 tokens (84.7% of limit!)

---

**Last Updated**: 2025-10-16
**Status**: Phase 2 - Knowledge Base Expansion
**Achievement**: 98.6% context reduction via MCP optimization
