# Agent Integration Cards

Quick reference cards for common agents in V5.0 workflow.

---

## Available Cards

### Primary (Use Frequently)
1. **kieran-typescript-reviewer.md** - Code quality review (MANDATORY for medium+ tasks)
2. **security-sentinel.md** - Security audit (auth, RBAC, sensitive data)
3. **performance-oracle.md** - Performance optimization (caching, queries)

### Full Directory
See `.claude/agents/AGENT-DIRECTORY.md` for all 33 agents.

---

## Purpose

These cards provide:
- **Quick invocation** - Copy-paste ready commands
- **When to use** - Clear triggers
- **What to expect** - Output examples
- **Integration** - Where in workflow

---

## How to Use

### During Development
1. Implement feature
2. Check which agents apply (see "When to use")
3. Read relevant card
4. Invoke agent using provided template
5. Document results in checkpoint

### In Checkpoints
All checkpoints have "MANDATORY QUALITY REVIEWS" section:
- kieran-typescript-reviewer (always)
- Others based on changes (use cards to determine)

---

## Adding New Cards

When you find an agent useful, create a card:

```markdown
# [agent-name] Agent Card

**Type**: [Review/Audit/Analysis/etc.]
**Model**: Sonnet 4.5
**When**: [Clear triggers]

## Quick Invocation
[Copy-paste template]

## What It Does
[Bullet points]

## Use Cases
[ALWAYS/Skip When sections]

## Typical Output
[Example]

## Integration with Workflow
[Step-by-step]

## Checklist
[Pre/post agent run checks]
```

---

## Agent Categories

**Code Quality**:
- kieran-typescript-reviewer
- code-simplicity-reviewer
- pattern-recognition-specialist

**Security**:
- security-sentinel

**Performance**:
- performance-oracle

**Architecture**:
- architecture-strategist
- backend-architect
- graphql-architect

**Data**:
- data-integrity-guardian

**Full list**: 33 agents in `.claude/agents/AGENT-DIRECTORY.md`

---

## V5.0 Integration

Cards replace skills (which are broken in CC 2.0.26):
- **V4.0**: Skills auto-triggered (didn't work)
- **V5.0**: Agent cards + explicit invocation (works)

Slash commands + agent cards = functional workflow.

---

**Version**: V5.0
**Status**: Production Ready
**Usage**: Reference during checkpoints and reviews
