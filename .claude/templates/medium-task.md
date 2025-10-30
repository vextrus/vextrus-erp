# Medium Task Template

**Use for**: New features, service enhancements, API endpoints, moderate refactoring
**Duration**: 2-8 hours
**Files**: 4-15
**Phases**: 6
**Plugins**: 3-5
**Checkpoints**: 6-8
**Context Target**: <80k tokens

---

## Phase 1: PLAN (Plan Subagent - 15 min)

### Actions
- [ ] Launch Plan subagent (Sonnet 4.5)
- [ ] Provide task description and requirements
- [ ] Review generated plan
- [ ] Identify files, phases, and risks
- [ ] Adjust plan if needed

### How to Launch
```typescript
Task tool with subagent_type="Plan"
Prompt: "Plan implementation for [feature description]"
```

### Checkpoint
✓ Plan reviewed and approved

### Output
- Structured implementation plan
- List of files to modify/create
- Identified dependencies
- Risk assessment

---

## Phase 2: EXPLORE (Explore Subagent - 10 min)

### Actions
- [ ] Launch Explore subagent (Haiku 4.5)
- [ ] Analyze relevant services/modules
- [ ] Gather existing architectural patterns
- [ ] Identify dependencies
- [ ] Document findings

### How to Launch
```typescript
Task tool with subagent_type="Explore"
Prompt: "Explore [service/module] to understand [what to find]"
```

### Benefits
- 0 main context cost (separate 200k window)
- 2x faster than Sonnet
- 1/3 cost of Sonnet
- Comprehensive codebase analysis

### Checkpoint
✓ Context gathered

### Output
- Concise context summary
- Existing patterns identified
- Dependencies mapped

---

## Phase 3: DESIGN (Specialized Plugins - 30 min)

### Use Plugins As Needed

**Backend Features**:
- [ ] `/backend-development:feature-development` (backend design)

**Database Changes**:
- [ ] `/database-migrations:sql-migrations` (zero-downtime migrations)
- [ ] `/database-design:database-architect` (schema design)

**GraphQL APIs**:
- [ ] `/api-scaffolding:graphql-architect` (GraphQL Federation v2)

**TDD Approach**:
- [ ] `/tdd-workflows:tdd-cycle` (red-green-refactor)

### Checkpoint
✓ Design decisions documented

### Output
- Architecture decisions
- Database schema (if applicable)
- API design (if applicable)
- Design patterns to follow

---

## Phase 4: IMPLEMENT (Sonnet 4.5 - 3-5 hours)

### Sub-Phases (Commit After Each)

#### Phase 4.1: Domain Layer (1-1.5 hours)
- [ ] Aggregates
- [ ] Entities
- [ ] Value Objects
- [ ] Domain Events
- [ ] Domain Exceptions

**Checkpoint**: `pnpm build && npm test` (must pass)

#### Phase 4.2: Application Layer (1-1.5 hours)
- [ ] Commands & Command Handlers
- [ ] Queries & Query Handlers
- [ ] Application Services
- [ ] DTOs
- [ ] Mappers

**Checkpoint**: `pnpm build && npm test` (must pass)

#### Phase 4.3: Presentation Layer (1-1.5 hours)
- [ ] GraphQL Resolvers
- [ ] DTOs
- [ ] Guards (JwtAuthGuard + RbacGuard)
- [ ] Validation Pipes

**Checkpoint**: `pnpm build && npm test` (must pass)

#### Phase 4.4: Tests (30-60 min)
- [ ] Unit tests (90%+ coverage target)
- [ ] Integration tests
- [ ] E2E tests (if needed)
- [ ] Test edge cases

**Checkpoint**: `pnpm build && npm test` (all passing)

### Micro-Commit Strategy
Commit after each sub-phase completion:
```bash
git add .
git commit -m "phase(4.1): implement domain layer"
```

### Output
- All layers implemented
- Tests written (90%+ coverage)
- All quality gates passing

---

## Phase 5: REVIEW (Review Plugins - 20 min)

### Required Reviews

#### Code Quality Review
- [ ] `/comprehensive-review:full-review` (12+ agents)
- **Target**: Score >8/10
- Fix critical/high issues if any

#### Security Audit
- [ ] `/backend-api-security:backend-security-coder`
- **Target**: 0 critical vulnerabilities
- Fix security issues immediately

### Checkpoint
✓ Quality score >8/10 achieved
✓ Security issues resolved

### Output
- Code quality score >8/10
- 0 critical security vulnerabilities
- Any issues fixed

---

## Phase 6: FINALIZE (10 min)

### Actions
- [ ] Final `pnpm build` (must pass)
- [ ] Final `npm test` (must pass)
- [ ] Stage all changes: `git add .`
- [ ] Commit with comprehensive message
- [ ] Push to remote: `git push`
- [ ] Optional: Create PR with `/git-pr-workflows:pr-enhance`

### Commit Message
```bash
git commit -m "feat(invoice): add invoice approval workflow

- Implemented InvoiceAggregate with approval logic
- Added ApproveInvoiceCommand and handler
- Created GraphQL resolvers with guards
- Added unit and integration tests (92% coverage)
- Updated read model for approved invoices

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Checkpoint
✓ Feature complete

### Output
- Changes committed and pushed
- PR created (if applicable)
- Feature ready for review

---

## Example Tasks

- New CRUD feature for entity
- GraphQL API endpoint with resolvers
- Service enhancement with business logic
- Database migration with zero-downtime
- Authentication/authorization feature
- Payment processing workflow
- Notification system integration
- Report generation feature

---

## Success Criteria

✅ Task completed in 4-8 hours
✅ Plan → Explore → Design → Implement → Review → Finalize
✅ Build passes (0 TypeScript errors)
✅ Tests pass (90%+ coverage)
✅ Code quality >8/10
✅ Security: 0 critical vulnerabilities
✅ All checkpoints passed
✅ Context usage <80k tokens

---

## Common Pitfalls to Avoid

❌ Skipping planning phase
❌ Not using Explore subagent (wastes main context)
❌ Implementing all layers at once (use phases)
❌ Not committing after each phase
❌ Skipping review plugins
❌ Committing with errors or failing tests
❌ Forgetting guards on resolvers
❌ Not using pagination for lists
❌ Poor test coverage (<85%)

---

## Plugin Usage Matrix

| Need | Plugin |
|------|--------|
| Backend Design | `/backend-development:feature-development` |
| Database | `/database-migrations:sql-migrations` |
| GraphQL | `/api-scaffolding:graphql-architect` |
| TDD | `/tdd-workflows:tdd-cycle` |
| Tests | `/unit-test-generator:generate-tests` |
| Review | `/comprehensive-review:full-review` |
| Security | `/backend-api-security:backend-security-coder` |
| PR | `/git-pr-workflows:pr-enhance` |

---

## Workflow Visualization

```
Plan (15 min)
  ↓
Explore (10 min)
  ↓
Design (30 min)
  ↓
Implement (3-5 hours)
  ├─ Domain (checkpoint)
  ├─ Application (checkpoint)
  ├─ Presentation (checkpoint)
  └─ Tests (checkpoint)
  ↓
Review (20 min)
  ├─ Code Quality
  └─ Security
  ↓
Finalize (10 min)
  └─ Commit & PR
```

---

**Remember**: Medium tasks benefit from structure. Plan → Explore → Design → Implement → Review → Finalize.
