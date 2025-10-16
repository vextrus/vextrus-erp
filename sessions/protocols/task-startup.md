# Task Startup Protocol

**Purpose**: Systematic task initialization for Vextrus ERP development
**Last Updated**: 2025-10-16 (Modernized for CC 2.0.19 + SpecKit)

---

## 0. Load Task Context

### Check Current State

```bash
# View active task
cat .claude/state/current_task.json

# Check git branch
git branch --show-current
```

### Initialize Task State

Update `.claude/state/current_task.json`:

```json
{
  "task": "task-name",
  "branch": "feature/branch-name",
  "services": ["service1", "service2"],
  "updated": "2025-10-16"
}
```

**Important**:
- `task`: Just the task name (NO path, NO .md extension)
- `branch`: Full branch name (e.g., "feature/invoice-payment")
- `services`: Array of affected services/modules
- `updated`: Current date (YYYY-MM-DD)

---

## 1. Load Project Constitution

**Read once per session** (if not already familiar):

```bash
# Core principles and standards
cat memory/constitution.md
```

**Constitution contains**:
- Project principles (plugin-first, compounding quality)
- Technology stack and architecture patterns
- Quality gates and code standards
- Development workflows
- Performance and security standards

---

## 2. Load Feature Specification (If Exists)

**For spec-driven features**:

```bash
# Check if spec exists
cat sessions/specs/[feature-name].md
```

**Spec contains** (SpecKit format):
- Context and research findings
- Requirements and acceptance criteria
- Technical approach and decisions
- Quality gates to apply
- References to constitution and service docs

**If no spec**: Create one for complex features, skip for simple tasks

---

## 3. Gather Service Context

### Quick Context (Recommended)

```bash
# Use Explore agent (Haiku 4.5 - fast, cheap, separate context)
/explore services/[service-name]

# Explore specific path
/explore services/[service-name]/src/domain
```

**Benefits**:
- 2x faster than manual reading
- 1/3 the cost of Sonnet 4.5
- Separate context window (preserves main context)
- Comprehensive analysis with summary

### Service Documentation

```bash
# Read service architecture and patterns
cat services/[service-name]/CLAUDE.md
```

**Contains**:
- Service architecture overview
- Domain model (aggregates, entities, value objects)
- Business rules and patterns
- Integration points
- Recent architectural decisions

---

## 4. Context Optimization

### Reference Pattern (Critical)

**❌ DON'T** embed full context in task file:
```markdown
## Context Manifest
[Copy 800 lines of service architecture]
[Copy 600 lines of domain model]
[Copy 500 lines of business rules]
```
**Result**: 3,000+ line task file, 15,000 tokens wasted

**✅ DO** reference external docs:
```markdown
## Context

**Service**: services/finance/
**Architecture**: See services/finance/CLAUDE.md
**Domain**: Use `/explore services/finance/src/domain`

**Key Files**:
- Aggregates: src/domain/aggregates/invoice/
- Commands: src/application/commands/
- Resolvers: src/graphql/resolvers/

**Integration Points**:
- Master Data: Customer reference
- Notification: Invoice notifications
```
**Result**: <100 line context section, 500 tokens

### Task File Size Limits

- **Target**: <500 lines per task file
- **Maximum**: 1000 lines (if exceeded, split task)
- **Pattern**: Reference > Embed
- **Tool**: Use /explore for on-demand analysis

---

## 5. Enable MCP Servers (On-Demand Only)

**Default** (always enabled):
- `sequential-thinking` (1.5k tokens) - Complex reasoning

**Enable only when actively using**:

```bash
@postgres              # Database queries, schema analysis
@docker                # Container management, debugging
@playwright            # Browser automation, E2E testing
@github                # Repository operations, PR creation
@serena                # Advanced code analysis (heavy - 22k tokens)
```

**Context Savings**:
- Before: 111k tokens (all MCPs pre-enabled) = 55% of context
- After: 1.5k tokens (on-demand) = 0.7% of context
- **Savings**: 98.6% reduction (109.5k tokens reclaimed)

---

## 6. Update Task File Status

Update task file frontmatter:

```yaml
---
task: feature-name
branch: feature/branch-name
status: in-progress                    # Update this
started: 2025-10-16                    # Add this
spec: sessions/specs/feature-name.md   # If exists
---
```

---

## 7. Plan Approach

### Simple Tasks (<1 day)

**Direct implementation**:
1. Explored context ✅
2. Read service docs ✅
3. Understand requirements ✅
4. Start implementation

### Medium Tasks (1-3 days)

**Use 2-3 agents for planning**:
```bash
# Architecture decisions
Task tool: backend-development:backend-architect

# Database schema
Task tool: database-design:database-architect

# GraphQL design (if API changes)
Task tool: backend-development:graphql-architect
```

### Complex Tasks (Multi-day, cross-service)

**Full compounding cycle** - See `sessions/protocols/compounding-cycle.md`

**PLAN phase**:
```bash
Task tool: compounding-engineering:architecture-strategist
Task tool: compounding-engineering:pattern-recognition-specialist
Task tool: compounding-engineering:best-practices-researcher
Task tool: backend-development:backend-architect
Task tool: database-design:database-architect
```

---

## 8. Verify Understanding

**Before starting implementation**:

- ✅ Understand success criteria
- ✅ Reviewed work log (if resuming task)
- ✅ No blockers identified
- ✅ Approach confirmed (if uncertain, ask user)
- ✅ Quality gates identified
- ✅ Context optimized (<500 line task file)

---

## 9. Work Mode

**Development principles**:

1. **Plugin-first** - Use /review, /test, /security-scan liberally
2. **Specialized agents** - Use Task tool for complex decisions
3. **Reference > Embed** - Link to docs, don't copy them
4. **Checkpoint frequently** - Use Esc-Esc to rewind if needed
5. **Update work log** - Brief updates as you progress
6. **TodoWrite tool** - Track progress systematically

---

## Git Workflow (Simplified)

**Need detailed Git guidance?** See: `sessions/docs/git-workflows.md` (optional)

**Standard workflow**:

```bash
# Create/checkout branch (if new task)
git checkout -b feature/task-name

# Work on task...

# Commit when ready
git add .
git commit -m "feat: description"
git push origin feature/task-name
```

**For complex Git scenarios** (super-repo, subtasks, experiments):
- See optional guide: `sessions/docs/git-workflows.md`
- Most tasks don't need complex Git workflows

---

## Example First Message

> "I've loaded the context for implementing invoice payment processing.
>
> Based on the spec in `sessions/specs/invoice-payment.md` and service architecture in `services/finance/CLAUDE.md`, I understand we're:
> - Adding Payment aggregate to finance domain
> - Implementing event sourcing with EventStore
> - Creating GraphQL mutations for payment processing
>
> The last work log entry shows we completed the schema design.
>
> Should I proceed with implementing the Payment aggregate, or would you like to discuss the event sourcing strategy first?"

---

## Quick Checklist

Before starting work:

- [ ] Task state updated (`.claude/state/current_task.json`)
- [ ] Constitution principles reviewed (`memory/constitution.md`)
- [ ] Feature spec loaded (if exists, `sessions/specs/[name].md`)
- [ ] Service context gathered (`/explore` or `cat services/[name]/CLAUDE.md`)
- [ ] MCPs enabled on-demand only (default: sequential-thinking)
- [ ] Task file frontmatter updated (status: in-progress, started: date)
- [ ] Task file is concise (<500 lines, references not embeds)
- [ ] Approach planned (direct, agents, or compounding cycle)
- [ ] Understanding verified (success criteria, no blockers)

---

## Related Protocols

- **Complex tasks**: `sessions/protocols/compounding-cycle.md`
- **Task completion**: `sessions/protocols/task-completion.md`
- **Context maintenance**: `sessions/protocols/context-compaction.md`
- **Git workflows** (optional): `sessions/docs/git-workflows.md`

---

## Philosophy

> "Start with clarity, optimize for context, leverage specialized agents, maintain systematically."

**Key Principles**:
1. **Systematic setup** - Follow protocol, don't skip steps
2. **Context efficiency** - Reference > Embed, MCP on-demand
3. **Spec-driven** - Use specifications for complex features
4. **Agent-assisted** - Use plugins and agents proactively
5. **Quality-first** - Plan quality gates from the start

---

**Last Updated**: 2025-10-16
**Status**: ✅ Modernized for CC 2.0.19 + SpecKit
**Changes**: Removed Git complexity, added SpecKit integration, updated for plugins
