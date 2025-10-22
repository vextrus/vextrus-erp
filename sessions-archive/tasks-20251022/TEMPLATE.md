---
task: [prefix]-[descriptive-name]
branch: feature/[name]|fix/[name]|experiment/[name]|none
status: pending|in-progress|completed|blocked
created: YYYY-MM-DD
modules: [list of services/modules involved]
spec: sessions/specs/[feature-name].md  # Optional - for complex features
priority: high|medium|low
estimated_days: 1-5
complexity: 10-100  # Estimated complexity score
dependencies: []  # List of task dependencies
---

# [Human-Readable Title]

## Problem/Goal

[Clear description of what we're solving/building]

**References**:
- Constitution: `memory/constitution.md` (review before starting)
- Feature Spec: `sessions/specs/[feature-name].md` (if complex feature)
- Service Docs: `services/[name]/CLAUDE.md` (affected services)

---

## Success Criteria

- [ ] Specific, measurable outcome
- [ ] Another concrete goal
- [ ] Quality gates passed (/review, /security-scan, /test)
- [ ] Documentation updated (if needed)
- [ ] Learnings captured (if complex)

---

## Context

**Services Affected**: [List services]

**Context Gathering**:
```bash
# Use /explore for fast context (Haiku 4.5)
/explore services/[service-name]

# OR read service docs directly
cat services/[service-name]/CLAUDE.md
```

**Key Files** (reference, don't embed):
- Domain: `services/[name]/src/domain/`
- Application: `services/[name]/src/application/`
- GraphQL: `services/[name]/src/graphql/`

**Integration Points**:
- [Service 1]: [Purpose]
- [Service 2]: [Purpose]

---

## Approach

**For Simple Features** (<4 hours):
1. Explore context → Implement → Quality gates → Commit

**For Medium Features** (4-8 hours):
1. Explore context → Plan with agents → Implement → Quality gates → Commit

**For Complex Features** (1-3 days):
1. Create feature spec (`sessions/specs/[name].md`)
2. Follow compounding cycle (`sessions/protocols/compounding-cycle.md`)
3. PLAN → DELEGATE → ASSESS → CODIFY

---

## Progress

<!-- TodoWrite tool maintains this automatically -->
- [ ] Task created and context gathered
- [ ] Implementation started
- [ ] Tests written and passing
- [ ] Quality gates passed
- [ ] Documentation updated
- [ ] PR created/merged

---

## Quality Gates

**Required** (before PR):
- [ ] `/review` - Code quality check
- [ ] `/security-scan` - Security analysis
- [ ] `/test` - All tests passing
- [ ] `pnpm build` - Clean build

**Recommended** (for complex features):
- [ ] Architecture review (architecture-strategist)
- [ ] Performance check (performance-oracle)
- [ ] Security audit (security-sentinel)

**Domain-Specific** (if applicable):
- [ ] Bangladesh ERP compliance (VAT, Mushak-6.3)
- [ ] GraphQL Federation (schema composition)
- [ ] Event sourcing (versioning, idempotency)
- [ ] Database performance (indexes, queries)

---

## Decisions Made

<!-- Document architectural/technical decisions -->

**YYYY-MM-DD**: [Decision title]
- **Rationale**: Why this approach?
- **Alternatives**: What else was considered?
- **Reference**: Constitution principle or pattern used

---

## Work Log

<!-- Brief session updates as work progresses -->

**YYYY-MM-DD**: [Brief summary of what was accomplished]
- Key point 1
- Key point 2
- Next: What's next?

---

## Compounding (Complex Features Only)

**If using compounding cycle**, capture learnings:

1. **Patterns that worked**: [List]
2. **Simplifications identified**: [List]
3. **Automation opportunities**: [List]
4. **Documentation gaps**: [List]
5. **Future improvements**: [List]

**Knowledge base updated**:
- [ ] Service CLAUDE.md (if new patterns)
- [ ] memory/patterns.md (if reusable pattern)
- [ ] memory/constitution.md (if new principle)
- [ ] Feature spec (implementation notes)

---

## Related Protocols

- **Task creation**: `sessions/protocols/task-creation.md`
- **Task startup**: `sessions/protocols/task-startup.md`
- **Task completion**: `sessions/protocols/task-completion.md`
- **Compounding cycle**: `sessions/protocols/compounding-cycle.md`
- **Context maintenance**: `sessions/protocols/context-compaction.md`