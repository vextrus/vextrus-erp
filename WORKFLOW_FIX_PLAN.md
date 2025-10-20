# Workflow Optimization Plan
## Fixing Documentation Overhead & Token Waste

**Date**: 2025-10-16
**Issues**:
1. Claude Code generates excessive markdown instead of executing tasks
2. 107 agents and 41 plugins burning tokens without proper use
3. Protocol files (2000+ lines) create documentation-first mindset
4. Task files bloated (3168 lines vs 500 target)
5. Hooks auto-load protocols, reinforcing documentation patterns

---

## ROOT CAUSE SUMMARY

### Issue 1: Documentation-First Architecture
- **Protocols**: 2000+ lines across 5 files
- **Knowledge Base**: 4000+ lines across 6 files
- **Task Files**: 400-3168 lines (target: <500)
- **SpecKit Integration**: Adds 500+ lines before coding

**Result**: AI spends more time reading/creating markdown than writing code.

### Issue 2: Token-Burning Agents
- **107 agents available**: Most never needed for simple tasks
- **41 plugins installed**: Unclear which to use when
- **Compounding cycle**: Invokes 5-12 agents per complex task
- **No agent prioritization**: Sonnet used when Haiku would suffice

**Result**: Expensive agents invoked unnecessarily, burning tokens.

---

## IMMEDIATE FIXES (Apply Today)

### Fix 1: Disable Protocol Auto-Loading

**File**: `.claude/hooks/user-messages.py`

**Change**: Lines 188-207

```python
# BEFORE (Lines 188-207):
# Protocol detection that auto-suggests reading protocol files
protocol_suggestions = {
    'complete the task': 'task-completion.md',
    'create a task': 'task-creation.md',
    # ... more triggers
}

# AFTER: Comment out or remove protocol detection
# Let user explicitly request protocols if needed
```

**Impact**: Stops automatic protocol suggestions that trigger documentation mode.

---

### Fix 2: Reduce Session Start Context

**File**: `.claude/hooks/session-start.py`

**Change**: Lines 166-182

```python
# BEFORE:
# Include full task content (potentially 3000+ lines)
context += f"{task_content}\n\n"

# AFTER:
# Include only task metadata and current status
context += f"""
## Current Task: {task_data.get('task')}
Branch: {task_data.get('branch')}
Services: {', '.join(task_data.get('services', []))}
Status: {frontmatter.get('status', 'unknown')}

Read full task: `cat sessions/tasks/{task_file}`
"""
```

**Impact**: Reduces initial context by 2000-3000 lines, focuses on execution.

---

### Fix 3: Simplify CLAUDE.md

**File**: `CLAUDE.md`

**Change**: Reduce from 428 lines to <150 lines

```markdown
# Vextrus ERP - Development Quick Start

**Models**: Sonnet 4.5 (complex), Haiku 4.5 (exploration)
**Philosophy**: Execute first, document later

## Quick Commands

# Explore codebase
/explore services/finance

# Quality checks
/review                  # Code review
/test                    # Run tests
/security-scan          # Security

# Work on task
cat .claude/state/current_task.json
[write code]
git commit

## Architecture

18 NestJS microservices | GraphQL Federation | PostgreSQL | EventStore
Each service: `services/<name>/CLAUDE.md`

## Core Principles

1. **Execute First**: Write code before documentation
2. **Use Haiku**: Fast exploration (/explore)
3. **Minimal Agents**: Only use for complex/security tasks
4. **Simple Tasks**: <500 line task files, direct implementation

## Service Architecture

Production (11): auth, master-data, notification, configuration, scheduler,
                document-generator, import-export, file-storage, audit,
                workflow, rules-engine, organization

In Progress (7): finance, crm, hr, project-management, scm, inventory, reporting

Read before modifying: `cat services/<name>/CLAUDE.md`

## When to Use Protocols

- **Simple tasks (<1 day)**: Skip protocols, use /explore + direct coding
- **Complex tasks (multi-day)**: Use protocols selectively
- **Only if needed**: sessions/protocols/[name].md

## Agent Usage

**Use sparingly**: Only for security, performance, architecture
**Default**: Haiku 4.5 via /explore for codebase understanding
**Avoid**: Consulting 5+ agents before writing code
```

**Impact**: Reduces initial context load, emphasizes execution over documentation.

---

### Fix 4: Create Execution-First Skill ✅

**File**: `.claude/skills/execute-first/SKILL.md` (CREATED)

**Status**: ✅ Complete

**Impact**: Auto-activates on action words ("implement", "fix", "add"), enforces code-first approach.

---

### Fix 5: Agent Prioritization Rules

**File**: `.claude/settings.json`

**Add**:

```json
{
  "agentUsage": {
    "default": "haiku-4.5",
    "complexThreshold": 500,
    "rules": {
      "exploration": "haiku-4.5",
      "simpleTasks": "haiku-4.5",
      "complexLogic": "sonnet-4.5",
      "security": "sonnet-4.5",
      "architecture": "sonnet-4.5"
    },
    "maxAgentsPerTask": 3,
    "skipAgentsFor": [
      "crud operations",
      "simple bug fixes",
      "test writing",
      "config changes"
    ]
  }
}
```

**Impact**: Limits agent invocations, uses cheaper Haiku by default.

---

### Fix 6: Task File Size Enforcement

**File**: `.claude/hooks/sessions-enforce.py`

**Add**: Lines 50-60

```python
# Enforce task file size limits
def check_task_file_size(task_file_path):
    with open(task_file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        line_count = len(lines)

    if line_count > 1000:
        return f"❌ Task file too large: {line_count} lines (max: 1000)"
    elif line_count > 500:
        return f"⚠️ Task file large: {line_count} lines (target: <500)"
    else:
        return f"✅ Task file size OK: {line_count} lines"
```

**Impact**: Prevents task file bloat that triggers documentation mode.

---

## PROTOCOL SIMPLIFICATION (Next Week)

### Reduce Protocol Files

**Target**: 2000 lines → 500 lines

#### task-startup.md (336 → 100 lines)
```markdown
# Task Startup

## 1. Git Setup (2 min)
git checkout -b feature/[task-name]

## 2. Load Context (1 min)
cat .claude/state/current_task.json
cat services/[service]/CLAUDE.md

## 3. Explore (2 min)
/explore services/[service]

## 4. Execute
[write code]

Done. Skip protocols unless multi-service task.
```

#### task-completion.md (505 → 100 lines)
```markdown
# Task Completion

## Quality Gates
- [ ] /security-scan - 0 critical
- [ ] /review - approved
- [ ] /test - passing
- [ ] Performance OK

## Commit & PR
git add . && git commit
gh pr create

Done. Archive task if needed.
```

#### compounding-cycle.md (600+ → 150 lines)
```markdown
# Compounding Cycle

## Use Only For:
- Multi-service features (3+ services)
- Architecture changes
- Security-critical work

## Quick Pattern:
1. Plan (10 min): Key steps in TodoWrite
2. Execute (80% of time): Write code
3. Assess (5 min): /review, /test, /security-scan
4. Codify (5 min): Update relevant service CLAUDE.md only

Skip for simple tasks. Direct execution is better.
```

**Impact**: 75% reduction in protocol overhead.

---

## KNOWLEDGE BASE OPTIMIZATION

### Consolidate Knowledge Files

**Target**: 4000 lines → 1000 lines

Merge into single reference:
```
sessions/knowledge/vextrus-erp/QUICK_REFERENCE.md (1000 lines)
├── Plugin Quick Ref (200 lines) - most common 20 plugins
├── Agent Quick Ref (200 lines) - most common 20 agents
├── Workflow Patterns (300 lines) - 5 proven patterns
├── Quality Gates (150 lines) - essential checks
└── Context Tips (150 lines) - key optimizations
```

Archive detailed guides:
- Move to `sessions/knowledge/archive/`
- Reference when needed: "See archive/[file] for details"

**Impact**: 75% reduction in knowledge base context.

---

## AGENT & PLUGIN OPTIMIZATION

### Tier System

#### Tier 1: Always Available (Free/Cheap)
- `/explore` - Haiku 4.5 exploration
- `/review` - Code review
- `/test` - Test runner
- `/security-scan` - Security check

#### Tier 2: Use Selectively (Moderate Cost)
- `architecture-strategist` - Architecture decisions
- `performance-oracle` - Performance optimization
- `database-optimizer` - DB query optimization
- `code-simplicity-reviewer` - Simplification

#### Tier 3: Rare Use Only (Expensive)
- `kieran-*-reviewer` - Extreme quality bar
- `best-practices-researcher` - Deep research
- Full compounding cycle agents

### Plugin Selection Guide

**Daily Use** (Install & Enable):
- code-review-ai
- unit-testing
- security-scanning
- debugging-toolkit

**As Needed** (Install, Disable by Default):
- database-migrations
- performance-testing-review
- documentation-generation
- deployment-strategies

**Archive** (Don't Install):
- blockchain-web3
- game-development
- quantitative-trading
- hr-legal-compliance
- (Unless specifically needed)

**Impact**: 80% reduction in unnecessary agent invocations.

---

## TASK FILE TEMPLATE (New)

**File**: `sessions/tasks/TEMPLATE-SIMPLE.md`

```markdown
---
id: [auto-generated]
created: [date]
status: in-progress
services: [list]
spec: [optional - only for complex features]
---

# Task: [Name]

## Context
[1-3 sentences: What and why]

See: services/[name]/CLAUDE.md for architecture

## Acceptance Criteria
- [ ] Criteria 1
- [ ] Criteria 2
- [ ] Criteria 3

## Implementation Notes
[Optional: Key technical decisions, <100 words]

## Quality Gates
- [ ] /security-scan - 0 critical
- [ ] /review - approved
- [ ] /test - passing

---

## Work Log
[Date] [Time] - Started implementation
[Date] [Time] - [Brief note]
```

**Target**: <200 lines per task file

**Impact**: Prevents documentation bloat, focuses on essentials.

---

## HOOK MODIFICATIONS SUMMARY

### session-start.py
- ❌ Remove: Full task content loading (lines 166-182)
- ✅ Add: Task metadata only + reference to full file
- **Savings**: 2000-3000 lines of initial context

### user-messages.py
- ❌ Remove: Protocol detection and auto-suggestions (lines 188-207)
- ✅ Add: Execute-first mindset reminders
- **Savings**: Prevents protocol document loading

### sessions-enforce.py
- ✅ Add: Task file size validation
- ✅ Add: Warning when file >500 lines
- ✅ Add: Error when file >1000 lines
- **Impact**: Enforces lean task files

### post-tool-use.py
- ❌ Remove: Suggestions to update knowledge base during tasks
- ✅ Keep: Progress tracking for todos
- **Savings**: Reduces mid-task documentation pressure

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Immediate (Today)
- [x] Create Execute First skill
- [ ] Modify user-messages.py (disable protocol detection)
- [ ] Modify session-start.py (metadata only)
- [ ] Create simplified CLAUDE.md
- [ ] Add agent usage rules to settings.json

### Phase 2: This Week
- [ ] Simplify protocol files (2000 → 500 lines)
- [ ] Consolidate knowledge base (4000 → 1000 lines)
- [ ] Create TEMPLATE-SIMPLE.md
- [ ] Add task file size enforcement
- [ ] Archive 74 completed tasks

### Phase 3: Ongoing
- [ ] Use Execute First skill by default
- [ ] Measure: avg time to first code write (<5 min target)
- [ ] Measure: avg agents per task (target: <3)
- [ ] Measure: avg task file size (target: <500 lines)
- [ ] Iterate based on metrics

---

## EXPECTED IMPROVEMENTS

### Before Fix:
- ⏱️ Time to first code: 15-30 minutes (reading protocols, creating plans)
- 📄 Markdown generated: 3-5 files per task (500-2000 lines)
- 🤖 Agents invoked: 5-12 per complex task
- 💰 Token usage: High (Sonnet for everything, extensive context)
- ❌ Result: Documentation overhead, slow execution

### After Fix:
- ⏱️ Time to first code: <5 minutes (direct execution)
- 📄 Markdown generated: 0-1 files per task (only if requested)
- 🤖 Agents invoked: 1-3 per task (Haiku for exploration)
- 💰 Token usage: 60-80% reduction (Haiku default, minimal context)
- ✅ Result: Fast execution, code-first development

---

## VALIDATION METRICS

Track these to measure success:

```bash
# 1. Average time to first code write
# Target: <5 minutes

# 2. Average agents invoked per task
# Target: <3 agents

# 3. Average task file size
# Target: <500 lines

# 4. Markdown files created per task
# Target: 0-1 files

# 5. Token usage per task
# Target: 60-80% reduction from baseline

# 6. Task completion time
# Target: 30-50% faster for simple tasks
```

---

## ROLLBACK PLAN

If changes cause issues:

1. **Revert hooks**: `git checkout HEAD -- .claude/hooks/`
2. **Disable Execute First skill**: Remove `.claude/skills/execute-first/`
3. **Restore CLAUDE.md**: `git checkout HEAD -- CLAUDE.md`
4. **Document issues**: sessions/knowledge/rollback-notes.md

Hooks are read-only observers, so rollback is safe.

---

## NEXT STEPS

1. **Review this plan** with team
2. **Apply Phase 1 fixes** (1 hour)
3. **Test with simple task** (validate improvements)
4. **Iterate based on results**
5. **Apply Phase 2** when Phase 1 validated

---

**Philosophy**: Execute first, document later. Write code, not markdown.
