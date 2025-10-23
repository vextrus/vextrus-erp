# Agent Decision Tree

**Version**: 3.0
**Purpose**: Guide for selecting the right agents for your task
**Updated**: 2025-10-24

---

## Quick Decision Framework

```
START: What are you working on?
│
├─ Simple Bug Fix / Small Feature (<4 hours)?
│  └─ Use: 0-1 agents
│     - Implement directly (most cases)
│     - Optional: Explore (if unfamiliar with codebase area)
│
├─ Medium Feature (4-8 hours)?
│  └─ Use: 2-4 agents
│     - Planning: pattern-recognition-specialist
│     - Review: kieran-typescript-reviewer (MANDATORY)
│     - Conditional: security-sentinel (auth changes), performance-oracle (optimization)
│
└─ Complex Feature (Multi-day)?
   └─ Use: 5-8 agents
      - Planning: architecture-strategist + best-practices-researcher + pattern-recognition-specialist
      - Review: kieran-typescript-reviewer + 2-3 specialized (security, performance, data-integrity)
```

---

## Decision Tree by Task Category

### 🐛 Bug Fixes

**Simple Bug** (clear cause, local fix):
```
Agents: 0
Just fix it → Test → Commit
```

**Complex Bug** (unclear cause, multiple files):
```
Agents: 1-2
1. debugger (root cause analysis)
2. kieran-typescript-reviewer (review fix)
```

**Production Bug** (critical, needs audit):
```
Agents: 2-3
1. debugger (root cause)
2. security-sentinel (if security-related)
3. kieran-typescript-reviewer (review fix)
```

---

### 🎨 New Features

**GraphQL API Endpoint**:
```
Agents: 2-3
Planning:
  - graphql-architect (schema design)
Review:
  - kieran-typescript-reviewer (code quality)
  - security-sentinel (if requires auth)
```

**Event Sourcing Aggregate**:
```
Agents: 2-3
Planning:
  - backend-architect (aggregate design)
  - pattern-recognition-specialist (existing patterns)
Review:
  - kieran-typescript-reviewer (code quality)
  - data-integrity-guardian (event schema)
```

**Bangladesh Compliance Feature** (VAT, TDS, Mushak):
```
Agents: 1-2
Note: Use vextrus-domain-expert SKILL first (not agent)
Review:
  - kieran-typescript-reviewer (code quality)
  - security-sentinel (if financial data)
```

**Construction Management Feature**:
```
Agents: 2-3
Planning:
  - best-practices-researcher (industry patterns)
  - architecture-strategist (system design)
Review:
  - kieran-typescript-reviewer (code quality)
```

**Real Estate Management Feature**:
```
Agents: 2-3
Planning:
  - best-practices-researcher (industry patterns)
  - architecture-strategist (system design)
Review:
  - kieran-typescript-reviewer (code quality)
  - data-integrity-guardian (property/lease data)
```

---

### 🏗️ Architecture & Design

**New Microservice**:
```
Agents: 3-4
Planning:
  - backend-architect (service architecture)
  - graphql-architect (federated schema)
  - architecture-strategist (system integration)
Review:
  - kieran-typescript-reviewer (code quality)
```

**Cross-Service Integration**:
```
Agents: 3-4
Planning:
  - architecture-strategist (integration design)
  - pattern-recognition-specialist (existing patterns)
Review:
  - kieran-typescript-reviewer (code quality)
  - performance-oracle (if high traffic)
```

**System Refactoring**:
```
Agents: 4-5
Planning:
  - architecture-strategist (refactoring strategy)
  - pattern-recognition-specialist (current patterns)
  - code-simplicity-reviewer (identify complexity)
Review:
  - kieran-typescript-reviewer (code quality)
  - performance-oracle (performance impact)
```

---

### 🗄️ Database & Data

**Database Migration** (add column, index):
```
Agents: 2
Planning:
  - data-integrity-guardian (migration safety)
Review:
  - kieran-typescript-reviewer (migration code)
```

**Schema Change** (breaking change):
```
Agents: 3
Planning:
  - data-integrity-guardian (migration strategy)
  - architecture-strategist (impact analysis)
Review:
  - kieran-typescript-reviewer (code quality)
```

**Data Migration** (backfill, transform):
```
Agents: 3
Planning:
  - data-integrity-guardian (migration safety)
Review:
  - kieran-typescript-reviewer (migration code)
  - performance-oracle (if large dataset)
```

---

### 🔒 Security & Auth

**Authentication Changes**:
```
Agents: 2-3
Planning:
  - security-sentinel (security design)
Review:
  - kieran-typescript-reviewer (code quality)
  - security-sentinel (security audit)
```

**RBAC Changes**:
```
Agents: 2-3
Planning:
  - security-sentinel (permission design)
Review:
  - kieran-typescript-reviewer (code quality)
  - security-sentinel (security audit)
```

**Sensitive Data Handling**:
```
Agents: 2-3
Planning:
  - security-sentinel (data protection)
  - data-integrity-guardian (data integrity)
Review:
  - kieran-typescript-reviewer (code quality)
  - security-sentinel (security audit)
```

---

### ⚡ Performance & Optimization

**Query Optimization**:
```
Agents: 2-3
Planning:
  - performance-oracle (optimization strategy)
Review:
  - kieran-typescript-reviewer (code quality)
  - data-integrity-guardian (query correctness)
```

**Caching Implementation**:
```
Agents: 2-3
Planning:
  - performance-oracle (caching strategy)
  - pattern-recognition-specialist (existing patterns)
Review:
  - kieran-typescript-reviewer (code quality)
  - performance-oracle (cache effectiveness)
```

**Algorithm Optimization**:
```
Agents: 2
Planning:
  - performance-oracle (algorithm analysis)
Review:
  - kieran-typescript-reviewer (code quality)
```

---

### 🧪 Testing

**Unit Tests** (new tests):
```
Agents: 1
Execution:
  - test-automator (test generation)
or
  - Use test-first SKILL
```

**TDD Implementation** (test-first):
```
Agents: 1-2
Planning:
  - tdd-orchestrator (TDD workflow)
Review:
  - kieran-typescript-reviewer (code + test quality)
```

**Integration Tests**:
```
Agents: 1-2
Planning:
  - test-orchestrator (test workflow)
Review:
  - kieran-typescript-reviewer (test quality)
```

---

### 🚀 Production Deployment

**Pre-Production Checklist**:
```
Agents: 3-4 (MANDATORY)
Review:
  - security-sentinel (security audit)
  - performance-oracle (performance check)
  - data-integrity-guardian (migration safety)
  - kieran-typescript-reviewer (code quality)
```

**Database Migration Deployment**:
```
Agents: 2 (MANDATORY)
Planning:
  - data-integrity-guardian (zero-downtime strategy)
Review:
  - data-integrity-guardian (migration validation)
```

**Emergency Hotfix**:
```
Agents: 2
Execution:
  - debugger (if needed)
Review:
  - kieran-typescript-reviewer (code quality)
```

---

### 📝 Documentation & Research

**External Research** (new patterns, libraries):
```
Agents: 1
Research:
  - best-practices-researcher (external docs)
```

**Framework Documentation**:
```
Agents: 1
Research:
  - framework-docs-researcher (official docs)
```

**Codebase Understanding**:
```
Agents: 1-2
Research:
  - pattern-recognition-specialist (code patterns)
  - git-history-analyzer (code evolution)
```

**Repository Analysis** (new codebase):
```
Agents: 1-2
Research:
  - repo-research-analyst (repo structure)
  - Explore (quick exploration)
```

---

### 🔄 PR & Code Review

**Create PR**:
```
Agents: 2-3
Review:
  - kieran-typescript-reviewer (code quality)
  - security-sentinel (if security changes)
  - performance-oracle (if performance changes)
```

**Address PR Comments**:
```
Agents: 1
Execution:
  - pr-comment-resolver (systematic resolution)
```

**PR Review** (reviewing others' code):
```
Agents: 1-2
Review:
  - code-reviewer (general review)
  - kieran-typescript-reviewer (TypeScript specific)
```

---

## Model Selection by Agent

**Use Sonnet 4.5 (default)**:
- All planning agents
- All review agents
- Architecture decisions
- Complex logic

**Use Haiku 4.5 (fast)**:
- Explore (quick exploration)
- test-automator (test scaffolding)
- Parallel research tasks

**Use Opus (rare)**:
- feedback-codifier (pattern extraction)

---

## Agent Combinations

### Most Common Combinations

**1. Simple Review** (80% of tasks):
```
kieran-typescript-reviewer only
```

**2. Security-Critical** (15% of tasks):
```
kieran-typescript-reviewer + security-sentinel
```

**3. Complex Feature** (5% of tasks):
```
Planning: architecture-strategist + pattern-recognition-specialist
Review: kieran-typescript-reviewer + security-sentinel + performance-oracle
```

### Specialized Combinations

**GraphQL Federation**:
```
graphql-architect + kieran-typescript-reviewer
```

**Event Sourcing**:
```
backend-architect + data-integrity-guardian + kieran-typescript-reviewer
```

**Performance Optimization**:
```
performance-oracle + kieran-typescript-reviewer
```

**Database Migration**:
```
data-integrity-guardian + kieran-typescript-reviewer
```

---

## Anti-Patterns

❌ **Don't**:
- Use 10+ agents (diminishing returns)
- Use agents for tasks already documented in VEXTRUS-PATTERNS.md
- Skip kieran-typescript-reviewer for medium+ tasks
- Use planning agents after implementation (plan first!)
- Use Rails/Python agents for TypeScript code

✅ **Do**:
- Start with 0-1 agents for simple tasks
- Use 2-4 agents for medium tasks
- Use 5-8 agents for complex tasks
- Always invoke agents explicitly (natural language)
- Plan with agents, implement directly, review with agents

---

## Success Metrics

| Task Complexity | Agents Used | Time Saved | Quality Score |
|----------------|-------------|------------|---------------|
| Simple | 0-1 | - | 8.5/10 |
| Simple + Review | 1 | +15 min (quality) | 9/10 |
| Medium | 2-4 | +30% speed | 9/10 |
| Complex | 5-8 | +40% speed | 9.5/10 |

**Finance Task Evidence** (10-day complex task):
- Agents Used: 5 (architecture-strategist, pattern-recognition-specialist, kieran-typescript-reviewer, performance-oracle, data-integrity-guardian)
- Quality Score: 9.5/10
- Rework: <5%
- Pattern Consistency: 100%

---

## Quick Reference

**Simple Bug Fix**:
```
0 agents → Fix → Test → Commit
```

**Medium Feature**:
```
pattern-recognition-specialist (plan)
→ Implement
→ kieran-typescript-reviewer (review)
→ Commit
```

**Complex Feature**:
```
architecture-strategist + best-practices-researcher (plan)
→ Implement with checkpoints
→ kieran-typescript-reviewer + security-sentinel + performance-oracle (review)
→ Commit
```

**Production Deployment**:
```
security-sentinel + performance-oracle + data-integrity-guardian (audit)
→ deployment-pipeline-orchestrator (deploy)
```

---

**Version**: 3.0
**Updated**: 2025-10-24
**Next Review**: After 10 production tasks with v3.0 workflow
