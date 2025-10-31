# Context Optimization Guide

**Purpose**: Strategies to maximize context quality and minimize waste

**Problem**: Research shows Claude performs worse at 70%+ context, even with 200k windows. Quality > quantity.

---

## Core Principles

1. **Context Quality Over Quantity**: Better to use 50% context well than 90% poorly
2. **Clear Between Tasks**: `/clear` after 1-3 messages for unrelated work
3. **Subagents Save Context**: Plan/Explore each get separate 200k windows (0 main cost)
4. **Session Hygiene**: Short, focused sessions > long, wandering ones

---

## Auto-Compact: Disable It

### The Problem

Auto-compact can consume **45k tokens** (22.5% of 200k window) with stale context from previous sessions:
- Old error logs
- Outdated architectural decisions
- Irrelevant command outputs
- Compacted but low-quality historical data

### The Solution

**Disable auto-compact** and use git-tracked TODO + checkpoints instead:

```bash
# Via /config command
/config

# Navigate to Auto-compact option
# Press SPACE to toggle to false
# Apply changes
```

**Why This Works**:
- `.claude/todo/current.md` (git-tracked) = explicit, high-quality memory
- `.claude/checkpoints/` = detailed recovery points
- `CLAUDE.md` = persistent project context
- Each session starts fresh with only relevant, curated context

---

## MCP Server Context Costs

### The Hidden Tax

Each MCP server consumes **4-10k tokens** just existing (explaining tools/schema):

| MCP Servers | Baseline Cost |
|-------------|---------------|
| 1 server | ~5k tokens (2.5%) |
| 2 servers | ~10k tokens (5%) |
| 3 servers | ~15k tokens (7.5%) |
| 4+ servers | ~20-40k tokens (10-20%) |

**Example**: With exa-mcp, sequential-thinking, and postgres active = ~12-30k tokens baseline

### Optimization Strategies

**1. Toggle Off Unused Servers**:
```bash
# Use @ syntax to disable/enable
@mcp-server-name

# Or in .claude/settings.json
{
  "mcpServers": {
    "postgres": { "enabled": false },
    "exa": { "enabled": true }
  }
}
```

**2. Project-Scoped MCPs** (instead of user-scoped):
- Add MCPs to `.claude/settings.json` (project-level)
- Don't add to `~/.claude/settings.json` (user-level)
- Result: MCPs only active for relevant projects

**3. Lazy Loading**:
- Keep MCPs disabled by default
- Enable only when needed for specific tasks
- Disable after task completion

---

## Session Hygiene: The /clear Pattern

### When to Clear Context

**Clear after 1-3 messages** when:
- Completing a feature/ticket (natural break)
- Switching to unrelated task (frontend ↔ backend)
- After exploratory/research phase (find answer, then clear)
- Session has accumulated noise (test failures, dead-ends)

### How to Maintain Continuity

**Problem**: Clearing context means repeating instructions

**Solutions**:
1. **CLAUDE.md**: Project-specific persistent context (read every session)
2. **Slash Commands**: `.claude/commands/` for repetitive workflows
3. **TODO + Checkpoints**: Explicit state persistence in git
4. **Skills**: Domain-specific context auto-activated

**Example Workflow**:
```bash
# 1. Complete feature (context: 100k tokens)
Done with authentication module.

# 2. Clear context
/clear

# 3. Start new task (context: 45k tokens fresh)
Implement dashboard API.
# Claude reads CLAUDE.md, todo, and continues cleanly
```

---

## Subagent Pattern: 0 Main Context Cost

### The Power of Separate Context Windows

**Plan Subagent**:
- Runs in **separate 200k window**
- Does heavy research, file reading, planning
- Returns **concise plan** to main thread
- **Main context cost**: ~2-5k tokens (just the plan, not the research)

**Explore Subagent**:
- Runs in **separate 200k window** (Haiku 4.5)
- Searches entire codebase, reads dozens of files
- Returns **summary** to main thread
- **Main context cost**: ~3-7k tokens (just the summary)

### Example: Context Savings

**Without Subagents**:
```
Main thread:
- Read 20 files (60k tokens)
- Explore patterns (20k tokens)
- Plan implementation (15k tokens)
Total: 95k tokens in main context
```

**With Subagents**:
```
Explore subagent (separate window):
- Read 20 files (60k tokens)
- Explore patterns (20k tokens)
- Return summary (5k tokens to main)

Plan subagent (separate window):
- Use summary (5k tokens)
- Plan implementation (15k tokens)
- Return plan (3k tokens to main)

Main thread:
- Receive summary (5k)
- Receive plan (3k)
- Implement using plan (20k)
Total: 28k tokens in main context
```

**Savings**: 67k tokens (70% reduction)

---

## File Reading Strategies

### Avoid Reading Large Files Directly

**Bad** (wastes context):
```
Read entire service directory:
- services/finance/src/**/*.ts (100+ files, 200k tokens)
```

**Good** (targeted):
```
1. Use Explore subagent to find relevant files
2. Use grep/glob to locate specific patterns
3. Read only the 3-5 files that matter
Result: 10-15k tokens instead of 200k
```

### Use Grep/Glob Before Read

**Pattern**:
```bash
# 1. Find files with pattern
Grep for "InvoiceAggregate" in services/finance/

# 2. Get file list (1k tokens)
Found in: invoice.aggregate.ts, invoice.repository.ts

# 3. Read only relevant files (5k tokens)
Read services/finance/src/domain/invoice.aggregate.ts
```

**Savings**: 195k tokens vs reading entire directory

---

## MCP Server Selection

### Be Selective

**Don't install every MCP server**. Each one:
- Adds baseline context cost (4-10k tokens)
- Adds cognitive load (more tools = more confusion)
- Increases permission surface area

**Guidelines**:
- **Database**: Only if actively querying (not for every task)
- **Web Search**: Only for research-heavy tasks
- **Sequential Thinking**: Only for complex planning tasks
- **Tool-Specific**: Only when using that tool (Puppeteer, Sentry, etc.)

### Project vs User Scope

**Project-scoped** (`.claude/settings.json`):
```json
{
  "mcpServers": {
    "postgres": {
      "command": "node",
      "args": ["path/to/postgres-mcp"]
    }
  }
}
```

**User-scoped** (`~/.claude/settings.json`):
- Only for truly universal tools
- Most MCPs should be project-scoped

---

## Compact vs Clear: When to Use Each

### /compact

**When**: You want to **keep** conversation continuity but reduce tokens

**How**: Compresses history into shorter summary

**Use Cases**:
- Mid-feature when context growing but still related
- Want to preserve decisions/rationale but reduce verbosity

**Result**: 50-70% token reduction, keeps thread continuity

### /clear

**When**: You want to **start fresh** with new task

**How**: Wipes conversation history completely

**Use Cases**:
- Finished feature, starting new unrelated work
- Exploration phase done, ready to implement
- Session has too much noise/dead-ends

**Result**: Back to baseline (~40-50k with CLAUDE.md + MCPs)

---

## Monitoring: /context Command

### Check Frequently

**After EVERY phase** (MANDATORY):
```bash
# User runs (Claude cannot run this)
/context

# Example output
Context: 125k tokens / 200k (62.5%)
Status: YELLOW (Warning)
```

### Thresholds

| Status | Range | Action |
|--------|-------|--------|
| GREEN | <120k (60%) | Continue |
| YELLOW | 120-140k (60-70%) | Warning, consider optimization |
| ORANGE | 140-160k (70-80%) | FORCE checkpoint (MANDATORY) |
| RED | ≥160k (80%+) | BLOCKING - new session required |

**See**: `.claude/AUTO-CONTEXT-MONITORING.md` for detailed monitoring protocol

---

## Plan-First Pattern

**Research Finding**: "Starting with Plan Mode reduces bugs by 30%+"

### Why It Saves Context

**Without Plan-First**:
```
Main thread:
- Explore codebase (exploratory reads: 60k)
- Try approach A (implement: 20k)
- Realize approach A wrong (revert: 5k)
- Try approach B (implement: 25k)
Total: 110k tokens, half wasted
```

**With Plan-First**:
```
Plan subagent (separate window):
- Explore codebase (60k)
- Evaluate approaches (20k)
- Return best approach (3k to main)

Main thread:
- Receive plan (3k)
- Implement correct approach (25k)
Total: 28k tokens in main context, no wasted effort
```

**Savings**: 82k tokens + fewer bugs

---

## Context Budget Per Tier

### Recommended Targets

**TIER 1** (Simple):
- Target: <40k tokens total
- Strategy: Direct implementation, minimal exploration

**TIER 2** (Medium):
- Target: <80k tokens total
- Strategy: Plan + Explore subagents, focused implementation

**TIER 3** (Complex):
- Target: <100k tokens **per session**
- Strategy: Multi-session with checkpoints, heavy subagent use

### If Approaching Limits

**At YELLOW (120-140k)**:
1. Use `/compact` if mid-feature
2. Disable unused MCPs
3. Use Explore subagent for remaining analysis

**At ORANGE (140-160k)**:
1. MANDATORY checkpoint
2. Consider ending feature slice
3. Plan next session

**At RED (≥160k)**:
1. STOP immediately
2. Emergency checkpoint
3. New session required

---

## Quick Reference: Context Optimization Checklist

**Before Starting Session**:
- [ ] Disable auto-compact (`/config`)
- [ ] Enable only needed MCPs
- [ ] Read CLAUDE.md to understand project context

**During Session**:
- [ ] Use Plan/Explore subagents for research (0 main cost)
- [ ] Clear context after 1-3 messages for unrelated tasks
- [ ] Use grep/glob before reading files
- [ ] Monitor context after every phase (`/context`)

**After Session**:
- [ ] Update TODO (`.claude/todo/current.md`)
- [ ] Create checkpoint if needed
- [ ] Disable MCPs not needed for next session

---

## Success Metrics

| Metric | Target | Indicates |
|--------|--------|-----------|
| Avg context/session | <100k (50%) | Efficient workflow |
| Sessions reaching YELLOW | <20% | Good optimization |
| Sessions reaching ORANGE | <5% | Acceptable checkpoints |
| Sessions reaching RED | 0% | Perfect (should never happen) |

---

**Version**: V8.1
**Status**: Production
**Last Updated**: 2025-10-31
