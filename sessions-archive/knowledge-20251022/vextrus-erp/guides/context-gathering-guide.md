# Context Gathering Guide

**Purpose**: Efficient context gathering for Vextrus ERP tasks
**Target**: <30k tokens per session (15% of context window)
**Strategy**: Reference over embed

---

## Core Principle

> "Gather just enough context to execute, not everything that exists."

**Reference** external docs rather than **embedding** full content.

---

## When to Gather Context

### At Task Start (Required)
```bash
cat CLAUDE.md                          # Project constitution
cat .claude/state/current_task.json    # Current state
/explore services/[service-name]       # Haiku 4.5 exploration
```

### During Implementation (As Needed)
```bash
cat services/[service-name]/CLAUDE.md  # Service patterns
cat sessions/knowledge/vextrus-erp/patterns/[pattern].md
```

---

## Explore vs Read

### Use `/explore` (Haiku 4.5) For:
- Directory structure understanding
- File discovery
- Architecture overview
- Pattern identification
- Technology stack

**Why**: Fast, cost-effective, broad discovery

### Use `Read` For:
- Specific implementation details
- Service CLAUDE.md
- Domain models
- GraphQL schemas
- Configuration files

**Why**: Precise, targeted, actionable

---

## Decision Matrix

| Scenario | Action | Tool | Time |
|----------|--------|------|------|
| New to service | Explore structure | `/explore` | 2 min |
| Similar feature | Read pattern | `cat` | 5 min |
| New pattern | Research | `/explore` + agents | 30 min |
| Debug code | Read files | `cat` | 10 min |
| Cross-service | Explore both | `/explore` x2 | 5 min |

---

## Reference Pattern (Recommended)

**Task file structure**:
```markdown
## Context

**Service**: services/finance/
**Architecture**: See services/finance/CLAUDE.md
**Patterns**: See sessions/knowledge/vextrus-erp/patterns/event-sourcing.md

## Implementation
[Only specific notes here]
```

**Benefits**:
- Task file: 300-500 lines (vs 2,500)
- Context: ~5k tokens (vs 50k)
- Always up-to-date
- Reusable

---

## Context Optimization Techniques

### 1. Frontmatter References
```yaml
---
task: invoice-payment
service: services/finance
patterns:
  - sessions/knowledge/vextrus-erp/patterns/event-sourcing.md
architecture: services/finance/CLAUDE.md
---
```

### 2. Link to External Specs
```markdown
See: sessions/specs/invoice-payment-processing.md
```

### 3. Section Anchors
```markdown
See: services/finance/CLAUDE.md#database-schema
```

---

## MCP Tool Management

### Default
```json
{
  "mcpServers": {
    "sequential-thinking": { ... }  // Only this
  }
}
```

### On-Demand
Enable only when needed:
- `@postgres` for database work
- `@docker` for containers
- `@github` for PR/issues

**After task**: Disable to reclaim context

---

## Service CLAUDE.md Strategy

### Must Read (Always)
1. Service Overview
2. Architecture Patterns
3. Directory Structure

### Read As Needed
4. Domain Model (when implementing logic)
5. GraphQL Schema (when working on API)
6. Database Schema (when creating migrations)

---

## Knowledge Base Navigation

```
sessions/knowledge/vextrus-erp/
├── patterns/      # Implementation patterns
├── guides/        # How-to guides
├── checklists/    # Quality checklists
└── workflows/     # Proven workflows
```

**Quick Navigation**:
- New pattern? → `patterns/`
- How to do X? → `guides/`
- Quality check? → `checklists/`
- Proven approach? → `workflows/`

---

## Context Budget

### Target (Per Session)
- Task file: 5k tokens
- Service CLAUDE.md: 3k tokens
- Pattern docs: 2k tokens
- sequential-thinking: 1.5k tokens
- Code reads: 5k tokens
- **Total**: ~16.5k tokens (8%) ✅

### Red Flags (Bloat)
- ❌ Task file >1,000 lines
- ❌ Embedding full architecture
- ❌ Multiple MCPs enabled
- ❌ Reading 10+ files
- ❌ Copying error logs >100 lines

---

## Example: Good Context Gathering

**Task**: Implement recurring invoices

```bash
# 1. Quick review (2 min)
cat CLAUDE.md
cat .claude/state/current_task.json

# 2. Explore service (2 min)
/explore services/finance

# 3. Read patterns (5 min)
cat services/finance/CLAUDE.md
cat sessions/knowledge/vextrus-erp/patterns/event-sourcing.md

# 4. Targeted reading (5 min)
cat services/finance/src/domain/aggregates/invoice/invoice.aggregate.ts
```

**Total**: 14 minutes, ~8k tokens ✅

---

## Quick Checklist

- [ ] Read CLAUDE.md overview
- [ ] Check current task state
- [ ] Explore with `/explore`
- [ ] Read service CLAUDE.md (key sections)
- [ ] Reference (not embed) pattern docs
- [ ] Context budget <20k tokens
- [ ] Only sequential-thinking MCP enabled

---

**Version**: 1.0
**Philosophy**: "Just enough context to execute, no more."
