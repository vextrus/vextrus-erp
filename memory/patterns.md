# Workflow Patterns Reference

**Quick reference for proven development workflows**

---

## Complete Guide

**See**: `sessions/knowledge/vextrus-erp/workflow-patterns.md` (~850 lines)

10 complete workflow patterns from 30+ completed tasks

---

## Pattern Quick Reference

### 1. Simple Feature (<4 hours)
```bash
/explore services/[name]    # Context
Implement                   # Sonnet 4.5
/review, /security-scan, /test
git commit && push
```

### 2. Medium Feature (4-8 hours)
```bash
/explore services/[name]
Task tool: backend-architect, database-architect
Implement
Task tool: performance-oracle
/review, /security-scan, /test
git commit && push
```

### 3. Complex Feature (1-3 days)
**Full Compounding Cycle**:

**PLAN**:
- architecture-strategist
- pattern-recognition-specialist
- best-practices-researcher
- backend-architect, database-architect, graphql-architect

**DELEGATE**:
- Sonnet breaks down, Haiku executes in parallel

**ASSESS**:
- kieran-typescript-reviewer
- performance-oracle
- security-sentinel
- data-integrity-guardian (if DB)
- code-simplicity-reviewer
- /review, /security-scan, /test

**CODIFY**:
- feedback-codifier
- Update knowledge base

### 4. Bug Investigation (1-4 hours)
```bash
@postgres or @docker (if needed)
Task tool: debugging-toolkit:debugger
Fix implementation
/test (must pass)
/review, /security-scan
git commit
```

### 5. Database Schema (1-3 hours)
```bash
@postgres
Task tool: database-design:database-architect
Create migration
Test up/down
Task tool: data-integrity-guardian
Update entities/DTOs/resolvers
/test, /review
```

### 6. GraphQL API (2-6 hours)
```bash
/explore services/[name]
Task tool: backend-development:graphql-architect
Implement DTOs, resolvers
Test in Apollo Sandbox
Task tool: api-documenter
/test, /review, /security-scan
```

### 7. Refactoring (1-2 days)
**Compounding Cycle**:

**PLAN**: architecture-strategist, pattern-recognition-specialist
**DELEGATE**: Incremental changes, tests passing
**ASSESS**: kieran-typescript-reviewer, code-simplicity-reviewer, performance-oracle
**CODIFY**: feedback-codifier, document patterns

### 8. Security Implementation (3-8 hours)
```bash
Task tool: security-sentinel (threat modeling)
Task tool: backend-security-coder (implementation)
Implement auth/authz
/security-scan
Task tool: security-auditor (deep audit)
Task tool: security-compliance (if needed)
```

### 9. Performance Optimization (2-6 hours)
```bash
@postgres
Task tool: performance-engineer (profiling)
Task tool: performance-oracle (strategy)
Task tool: database-optimizer (if DB)
Implement optimizations
Measure performance
Task tool: observability-engineer (monitoring)
```

### 10. New Microservice (1-2 weeks)
**Week 1 - Foundation**:
- Day 1: architecture-strategist, backend-architect, database-architect, graphql-architect
- Days 2-3: Core implementation
- Day 4: GraphQL Federation
- Day 5: Testing & documentation

**Week 2 - Integration**:
- Day 1: Service integration
- Day 2: security-sentinel, security-auditor
- Day 3: performance-oracle, observability-engineer
- Day 4: Full ASSESS phase
- Day 5: Deployment & feedback-codifier

---

## Anti-Patterns to Avoid

1. ❌ Skip quality gates → ✅ Always run /review, /security-scan, /test
2. ❌ Embed full context → ✅ Reference service CLAUDE.md, use /explore
3. ❌ No agent usage → ✅ Use specialized agents for complex work
4. ❌ Skip compounding → ✅ Capture learnings with feedback-codifier
5. ❌ Wrong model → ✅ Haiku for exploration, Sonnet for complexity

---

## Decision Matrix

| Complexity | Duration | Agents | Quality Gates | Codify |
|-----------|----------|--------|---------------|---------|
| **Simple** | <4h | 0-1 | /review, /test | Optional |
| **Medium** | 4-8h | 2-4 | All required | Recommended |
| **Complex** | 1-3 days | 5-12 | All + compounding | Required |

---

## When to Use Which Pattern

**Use Simple**: Single service, straightforward logic
**Use Medium**: Multiple services, business logic, architecture decisions
**Use Complex**: Cross-service, new patterns, significant changes
**Use Compounding**: Always for complex, recommended for medium

---

## Tips

1. **Start with /explore** - Fast context gathering
2. **Use architecture agents early** - Prevent rework
3. **Quality gates non-negotiable** - /review, /security-scan, /test
4. **Compounding for complexity** - Learn from complex work
5. **Reference > Embed** - Keep task files <500 lines
6. **Right model for task** - Sonnet complexity, Haiku exploration

---

**Last Updated**: 2025-10-16
**For Details**: See `sessions/knowledge/vextrus-erp/workflow-patterns.md`
**Source**: 30+ completed tasks in Vextrus ERP
