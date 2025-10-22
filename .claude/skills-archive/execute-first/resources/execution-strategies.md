# Execution Strategies for Execute-First Skill

**Purpose**: Decision frameworks for choosing the right execution strategy based on task complexity.

---

## 1. Quick-Win Strategy (80% of Tasks)

**When to Use**:
- Task < 100 lines of code
- Clear requirements
- Single service/module
- Known patterns
- <2 hour time estimate

**Workflow**:
```
1. TodoWrite (3-5 items, <10 lines)
2. Read relevant files (2-4 files max)
3. Edit/Write code directly
4. Run tests (npm test)
5. Verify output
6. Mark todos done
```

**Example Tasks**:
- Add validation to existing endpoint
- Fix bug in known function
- Update GraphQL mutation
- Add RBAC guard
- Simple refactoring

**Time**: 15-60 minutes

---

## 2. Feature Strategy (15% of Tasks)

**When to Use**:
- Task 100-500 lines
- Multiple files affected
- New feature addition
- Some unknowns
- 2-8 hour time estimate

**Workflow**:
```
1. /explore service (haiku-explorer)
2. TodoWrite (5-10 items)
3. Read key files (4-8 files)
4. Implement core logic
5. Add tests (test-first)
6. Integration testing
7. Documentation if needed
8. Mark todos done
```

**Example Tasks**:
- Implement new CQRS command
- Add GraphQL mutation with domain logic
- Create new aggregate
- Add external service integration

**Time**: 2-8 hours

---

## 3. Complex Strategy (<5% of Tasks)

**When to Use**:
- Task >500 lines
- Multiple services
- Architecture changes
- High uncertainty
- >8 hour time estimate

**Workflow**:
```
1. Use full compounding cycle (PLAN → DELEGATE → ASSESS → CODIFY)
2. Parallel /explore agents
3. Create SpecKit feature spec
4. Break into subtasks (TodoWrite: 10-20 items)
5. Parallel Haiku execution
6. Comprehensive testing
7. Security audit
8. Architecture review
```

**Example Tasks**:
- New microservice
- Multi-tenant feature across services
- Payment gateway integration
- Event sourcing refactor

**Time**: Multiple days

---

## Decision Tree

```
Task Complexity?
├─ Simple (<100 lines, <2h)
│  └─ Quick-Win Strategy
│     ├─ TodoWrite (3-5 items)
│     ├─ Read (2-4 files)
│     └─ Execute
│
├─ Feature (100-500 lines, 2-8h)
│  └─ Feature Strategy
│     ├─ /explore first
│     ├─ TodoWrite (5-10 items)
│     ├─ Implement + Test
│     └─ Document
│
└─ Complex (>500 lines, >8h)
   └─ Complex Strategy
      ├─ Compounding Cycle
      ├─ Parallel agents
      └─ Comprehensive testing
```

---

## Quick Reference Table

| Strategy | Lines | Time | TodoWrite | Agents | Testing |
|----------|-------|------|-----------|--------|---------|
| Quick-Win | <100 | <2h | 3-5 items | 0 | Basic |
| Feature | 100-500 | 2-8h | 5-10 items | 1-2 | Unit + Integration |
| Complex | >500 | >8h | 10-20 items | 3-5 | Comprehensive |

---

## Anti-Patterns

**❌ Over-planning Simple Tasks**:
```
Bad: Create spec file for 20-line bug fix
Good: Read, fix, test, done (15 minutes)
```

**❌ Under-planning Complex Tasks**:
```
Bad: Start coding new microservice without exploration
Good: PLAN phase with parallel agents, then execute
```

**❌ Skip Testing**:
```
Bad: Implement financial logic, skip tests
Good: test-first for critical features
```

**❌ Too Many Agents**:
```
Bad: Invoke 5 agents for simple CRUD operation
Good: execute-first only for simple tasks
```

---

## Integration with Other Skills

**Quick-Win** (simple tasks):
- execute-first (primary)
- test-first (if critical)
- NO other skills needed

**Feature** (medium tasks):
- haiku-explorer (exploration)
- execute-first (orchestration)
- test-first (TDD)
- 1-2 domain skills (graphql-schema, event-sourcing, security-first)

**Complex** (large tasks):
- ALL skills as needed
- Parallel agent execution
- Compounding cycle

---

## Evidence from Vextrus ERP

**Quick-Win Success** (40+ tasks):
- Average time: 45 minutes
- Success rate: 95%
- Most common: CRUD operations, bug fixes, validation additions

**Feature Success** (20+ tasks):
- Average time: 4 hours
- Success rate: 90%
- Most common: New commands, GraphQL mutations, domain aggregates

**Complex Success** (5+ tasks):
- Average time: 2-3 days
- Success rate: 100%
- Most common: New services, multi-tenant features, payment integration

---

## Metrics

**Quick-Win Strategy**:
- 80% of all tasks
- 95% success rate
- <2 hour completion
- 0-1 agents

**Feature Strategy**:
- 15% of all tasks
- 90% success rate
- 2-8 hour completion
- 1-2 agents

**Complex Strategy**:
- 5% of all tasks
- 100% success rate (more planning)
- Multi-day completion
- 3-5 agents

**Recommendation**: Default to Quick-Win for most tasks. Upgrade to Feature or Complex only when complexity demands it.