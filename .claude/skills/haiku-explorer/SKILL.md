---
name: Haiku Explorer
description: When you need to understand any part of the codebase, ALWAYS use /explore with Haiku 4.5 first before reading files manually. Use for all codebase exploration, understanding service architecture, finding relevant files, tracing code flow, or answering "where is X" questions. Activates on "where", "find", "understand", "how does", "what is", exploration requests.
---

# Haiku Explorer Skill

## Purpose
**Always use /explore (Haiku 4.5) for codebase exploration** to save tokens and time.

## Why Haiku /explore?
- **73% SWE-bench**: Nearly as good as Sonnet (77%)
- **2x faster**: Processes faster than Sonnet
- **1/3 cost**: Significant token savings
- **Smart**: Designed for large codebases

See [resources/cost-analysis.md](resources/cost-analysis.md) for detailed metrics.

---

## When to Use /explore

### Always Use First
1. ✅ Service exploration: `/explore services/finance`
2. ✅ Feature location: "Where is invoice validation?"
3. ✅ Code flow: "How does authentication work?"
4. ✅ Architecture: "What's the domain model structure?"
5. ✅ Find files: "Which files handle payments?"
6. ✅ Trace dependencies: "What imports Invoice aggregate?"
7. ✅ Pattern search: "Where are decorators used?"
8. ✅ Before any task: Understand context first

### Pattern
```
❌ Bad: Read 10 files searching for logic
✅ Good: /explore → identifies 3 files → read only those
```

---

## Exploration Thoroughness Levels

### Quick (Default)
```
/explore services/finance
```
- Basic structure, main files
- 30 seconds
- Use for: Simple tasks

### Medium
```
/explore @services/finance/src/domain
```
- Specific path, detailed analysis
- 1-2 minutes
- Use for: Feature implementation

### Very Thorough
```
/explore services/finance --thorough
```
- Comprehensive, cross-references
- 2-3 minutes
- Use for: Complex refactoring

---

## Integration with Execute First

```
1. User: "Implement invoice discount feature"

2. [TodoWrite: 4 items]

3. [Task /explore services/finance]
   → Identifies 3 key files

4. [Read those 3 files] ← 1,500 lines vs 5,000+

5. [Edit files with discount logic]

6. [Bash: npm test]

7. [Mark done]
```

**Result**: 60% token savings, 50% faster, same quality.

See [resources/examples.md](resources/examples.md) for complete workflows.

---

## Vextrus ERP Context

### Service Structure
```
services/
├── auth/              ← /explore services/auth
├── finance/           ← /explore services/finance
│   ├── src/domain/      ← /explore @services/finance/src/domain
│   ├── application/
│   └── CLAUDE.md
├── master-data/
├── notification/
└── [15 more services]
```

### Exploration by Task Type

**Bug Fix**: `/explore services/[service]` → "find [feature] logic"

**Feature**: `/explore services/[service]` → "understand [related] architecture"

**Refactor**: `/explore services/[service] --thorough`

---

## Multi-Service Tasks

For tasks spanning services, use parallel exploration:

```bash
# Run in parallel via Task tool
[Task /explore services/finance]
[Task /explore services/master-data]
[Task /explore services/notification]

# Complete in ~1 min vs 3 min sequential
# Cost: $0.05 (vs $0.30 manual)
```

---

## Context Optimization

### Problem
- 18 microservices
- ~50,000 lines per service
- 900,000+ total lines
- 200k token limit

### Solution
```
Traditional: Read 20 files = 10,000 lines ($high, slow)
/explore: 500 lines insights + 3 files = 2,000 lines ($low, fast)
```

**Savings**: 80% context reduction

---

## Override

User must explicitly say:
- "read all files in [directory]"
- "don't use explore"

**Default**: ALWAYS /explore first
