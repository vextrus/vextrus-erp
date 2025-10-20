# Plugin & Agent Context Optimization Guide

**Date**: 2025-10-20
**Status**: Analysis Complete - Manual Optimization Required

---

## Current Context Usage

```
Total Context: 200k tokens
Used: 80k tokens (40%)

Breakdown:
- System prompt: 4.7k tokens (2.3%)
- System tools: 27.9k tokens (13.9%)
- MCP tools: 1.5k tokens (0.7%) ✅
- Custom agents: 13.0k tokens (6.5%) ⚠️
- Memory files: 3.6k tokens (1.8%)
- Messages: 191 tokens (0.1%)
- Free space: 120k (59.9%)
```

**Problem**: 206 plugin-based agents consuming **13.0k tokens (6.5%)** of context

---

## Installed Marketplaces

All 3 marketplaces successfully restored:

1. **every-marketplace** (EveryInc/every-marketplace) ✅
   - 1 plugin: compounding-engineering
   - 17 agents (architecture-strategist, kieran-typescript-reviewer, etc.)
   - ~5,000 tokens
   - **Status: KEEP - Essential for Vextrus workflow**

2. **claude-code-workflows** (wshobson/agents) ⚠️
   - 67 plugins available
   - ~189 agents
   - ~8,000 tokens
   - **Status: Review installations**

3. **claude-code-plugins-plus** (jeremylongshore/claude-code-plugins) ⚠️
   - 236 plugins available
   - Unknown agents
   - **Status: Review installations**

---

## Analysis & Recommendations

### Current Agent Distribution

From `/agents` output, you have:
- **Plugin agents**: 206 total
- **Built-in agents**: 4 (general-purpose, statusline-setup, output-style-setup, Explore)

### Breakdown by Category

**compounding-engineering (17 agents - ESSENTIAL)**:
- architecture-strategist (258 tokens)
- best-practices-researcher (511 tokens)
- code-simplicity-reviewer (256 tokens)
- data-integrity-guardian (270 tokens)
- feedback-codifier (267 tokens)
- kieran-typescript-reviewer (433 tokens)
- performance-oracle (383 tokens)
- security-sentinel (388 tokens)
- pattern-recognition-specialist (280 tokens)
- repo-research-analyst (434 tokens)
- framework-docs-researcher (431 tokens)
- etc.

**Other workflow plugins (189 agents - REVIEW NEEDED)**:
- backend-development (duplicates)
- code-documentation (duplicates)
- debugging-toolkit (duplicates)
- database-migrations (duplicates)
- etc.

### Redundancy Analysis

Many agents from `claude-code-workflows` are **redundant** with:

1. **Built-in Explore agent** (Haiku 4.5)
   - Replaces: error-detective, repo-research (partially)

2. **Project Skills** (9 auto-activating):
   - execute-first, haiku-explorer, test-first
   - graphql-schema, event-sourcing, security-first
   - database-migrations, multi-tenancy, production-deployment

3. **Native functionality**:
   - /review, /test, /security-scan slash commands
   - Built-in Task tool with subagent types

---

## Optimization Strategy

### Manual Cleanup Required

**You need to use `/plugin` commands to:**

1. **List installed plugins**:
   ```
   /plugin list
   ```

2. **Uninstall redundant plugins** (examples):
   ```
   /plugin uninstall backend-development@claude-code-workflows
   /plugin uninstall code-documentation@claude-code-workflows
   /plugin uninstall debugging-toolkit@claude-code-workflows
   /plugin uninstall unit-testing@claude-code-workflows
   /plugin uninstall error-debugging@claude-code-workflows
   /plugin uninstall comprehensive-review@claude-code-workflows
   /plugin uninstall database-design@claude-code-workflows
   /plugin uninstall database-migrations@claude-code-workflows
   /plugin uninstall api-scaffolding@claude-code-workflows
   /plugin uninstall documentation-generation@claude-code-workflows
   /plugin uninstall python-development@claude-code-workflows
   /plugin uninstall javascript-typescript@claude-code-workflows
   /plugin uninstall full-stack-orchestration@claude-code-workflows
   /plugin uninstall frontend-mobile-development@claude-code-workflows
   /plugin uninstall data-engineering@claude-code-workflows
   /plugin uninstall tdd-workflows@claude-code-workflows
   /plugin uninstall performance-testing-review@claude-code-workflows
   /plugin uninstall code-review-ai@claude-code-workflows
   /plugin uninstall code-refactoring@claude-code-workflows
   /plugin uninstall security-scanning@claude-code-workflows
   /plugin uninstall security-compliance@claude-code-workflows
   /plugin uninstall application-performance@claude-code-workflows
   /plugin uninstall database-cloud-optimization@claude-code-workflows
   /plugin uninstall team-collaboration@claude-code-workflows
   /plugin uninstall git-pr-workflows@claude-code-workflows
   /plugin uninstall llm-application-dev@claude-code-workflows
   /plugin uninstall machine-learning-ops@claude-code-workflows
   /plugin uninstall deployment-strategies@claude-code-workflows
   /plugin uninstall cicd-automation@claude-code-workflows
   /plugin uninstall cloud-infrastructure@claude-code-workflows
   /plugin uninstall observability-monitoring@claude-code-workflows
   ```

3. **Keep only essential**:
   - compounding-engineering@every-marketplace ✅
   - Any specific plugins you actually use

---

## Expected Results After Optimization

**Before**:
- 206 agents = 13.0k tokens (6.5%)

**After** (keeping only compounding-engineering):
- ~21 agents = ~5.0k tokens (2.5%)

**Savings**: **8k tokens (61% reduction)**

**Context freed for actual work**: 8,000 tokens ✅

---

## Why This Matters

### Context Budget Philosophy

From Vextrus workflow:
> "Target context per session: <30k tokens (15% of window)"

Current breakdown should be:
- Task file: 5k tokens
- Service CLAUDE.md: 3k tokens
- Pattern docs: 2k tokens
- sequential-thinking: 1.5k tokens
- Code reads: 5k tokens
- **Agents**: 5k tokens (not 13k!)
- **Total**: ~21.5k tokens ✅

### Skills vs Agents

The 9 project skills handle 80% of work:
- Auto-activate based on trigger words
- Zero overhead (part of skill files)
- Coordinated by execute-first

Agents should be <3 per task for special cases:
- Architecture decisions (architecture-strategist)
- Code quality (kieran-typescript-reviewer)
- Performance (performance-oracle)
- Security (security-sentinel)

---

## Action Items

1. ✅ Marketplaces restored (all 3)
2. ⚠️ **YOU MUST MANUALLY**:
   - Run `/plugin list` to see installed plugins
   - Uninstall redundant workflow plugins
   - Keep only compounding-engineering
   - Restart Claude Code
   - Verify with `/agents` (should show ~21 total)
   - Verify with `/context` (agents should be ~5k)

---

## Documentation

After manual cleanup, update `CLAUDE.md`:

```markdown
## Agent Usage (Optimized)

**Current**: 17 essential agents from compounding-engineering plugin
**Context**: ~5k tokens (2.5%)

**Essential Agents**:
- architecture-strategist - System design decisions
- kieran-typescript-reviewer - Code quality bar
- performance-oracle - Performance optimization
- security-sentinel - Security audits
- data-integrity-guardian - Database safety
- feedback-codifier - Learning capture
- pattern-recognition-specialist - Pattern analysis
- best-practices-researcher - External research
- framework-docs-researcher - Library documentation

**Usage Limit**: <3 agents per task (80% handled by skills)

**Redundancies Removed**: 189 workflow agents (skills + built-in agents handle this)
```

---

**Version**: 1.0
**Status**: Ready for manual execution via `/plugin` commands
**Target**: 8k tokens saved (61% agent context reduction)
