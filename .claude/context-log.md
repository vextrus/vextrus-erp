# Context Usage Log

**Purpose**: Track context usage across phases to prevent context explosion

**Thresholds**:
- **GREEN** (<100k / 50%): Optimal - Continue
- **YELLOW** (100-120k / 50-60%): Warning - Monitor closely
- **ORANGE** (120-140k / 60-70%): Force checkpoint required
- **RED** (≥140k / 70%+): BLOCKING - New session required

---

## Current Session

**Session Start**: [YYYY-MM-DD HH:MM:SS]
**Task**: [Task name]
**Tier**: [1/2/3]

---

## Context History

| Timestamp | Phase | Tokens | % | Status | Action Taken | Checkpoint |
|-----------|-------|--------|---|--------|--------------|------------|
| 2025-10-31 05:32 | Phase 1 Start | 42k | 21% | GREEN | Continue | - |

---

## Context Breakdown (Latest)

**Total**: [Xk tokens] ([Y%])

### System (Fixed)
- System prompt: ~3k
- System tools: ~28k
- Custom agents: ~5k
- Memory (CLAUDE.md): ~3k
- Message buffer: ~10k
- **Subtotal**: ~49k (24.5%)

### MCP Servers (Variable)
- sequential-thinking: ~1k
- postgres: ~1k
- exa-mcp-server: ~1k
- [Other enabled MCPs]: ~Xk
- **Subtotal**: [Xk] ([Y%])

### Conversation (Variable)
- User messages: ~Xk
- Assistant messages: ~Xk
- Tool results: ~Xk
- File reads: ~Xk
- **Subtotal**: [Xk] ([Y%])

---

## Alerts

### Active Alerts
[List any active context warnings or "None"]

### Alert History
| Timestamp | Alert Type | Tokens | Action |
|-----------|----------|--------|---------|
| - | - | - | - |

---

## Context Optimization Actions Taken

| Timestamp | Action | Tokens Saved | Notes |
|-----------|--------|--------------|-------|
| - | - | - | - |

---

## Session Transitions

| Session # | Start Time | End Time | Reason | Tokens at Transition |
|-----------|-----------|----------|--------|---------------------|
| 1 | [timestamp] | [timestamp or "current"] | [reason or "active"] | [tokens] |

---

## Notes

[Any observations about context usage patterns or optimization opportunities]

---

**Last Updated**: [YYYY-MM-DD HH:MM:SS]
**Auto-updated**: After every phase completion
