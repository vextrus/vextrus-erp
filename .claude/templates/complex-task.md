# Complex Task Template

**Use for**: Production modules, cross-service integration, distributed transactions, new microservices
**Duration**: 2-5 days
**Files**: 15+ files, multiple services
**Phases**: 12+
**Plugins**: 8-12
**Checkpoints**: 15-25
**Context Target**: <100k per session (new session each day)

---

## DAY 0: RESEARCH & ARCHITECTURE (4 hours)

### Phase 1.1: EXPLORATION (Explore Subagent - 30 min)

#### Actions
- [ ] Launch Explore subagent (Haiku 4.5)
- [ ] Explore ALL related services
- [ ] Map dependencies and integration points
- [ ] Analyze existing patterns across services
- [ ] Document cross-service communication needs

#### How to Launch
```typescript
Task tool with subagent_type="Explore"
Prompt: "Explore [all related services] to understand cross-service architecture and integration points for [feature]"
```

#### Checkpoint
✓ Context complete

#### Output
- Comprehensive context document
- Service dependencies mapped
- Integration points identified
- Existing patterns documented

---

### Phase 1.2: ARCHITECTURE PLANNING (Plan Subagent - 45 min)

#### Actions
- [ ] Launch Plan subagent (Sonnet 4.5)
- [ ] Input: Explore findings + requirements
- [ ] Create comprehensive implementation plan
- [ ] Break into daily phases
- [ ] Identify risks, dependencies, unknowns
- [ ] Estimate effort for each phase

#### How to Launch
```typescript
Task tool with subagent_type="Plan"
Prompt: "Create comprehensive multi-day implementation plan for [feature] based on exploration findings. Include daily phases, risks, and dependencies."
```

#### Checkpoint
✓ Plan created

#### Output
- Multi-day execution plan
- Daily phase breakdown
- Risk assessment
- Dependency graph
- Effort estimates

---

### Phase 1.3: SPECIALIZED DESIGN (Plugins - 2 hours)

#### Use Plugins As Needed

**Backend Architecture**:
- [ ] `/backend-development:feature-development` (overall design)

**Database Design**:
- [ ] `/database-migrations:sql-migrations` (schema design)
- [ ] `/database-design:database-architect` (distributed data strategy)

**API Design**:
- [ ] `/api-scaffolding:graphql-architect` (GraphQL Federation v2 schema)

**Full-Stack**:
- [ ] `/full-stack-orchestration:full-stack-feature` (if full-stack)

**Infrastructure**:
- [ ] `/cloud-infrastructure:cloud-architect` (if infrastructure changes)

#### Checkpoint
✓ Architecture decisions documented

#### Output
- Architecture decisions document
- Database schema design
- API schema design
- Service integration patterns
- Infrastructure requirements

---

### Phase 1.4: PLAN REVIEW (30 min)

#### Actions
- [ ] Review plan with stakeholders (if needed)
- [ ] Adjust based on feedback
- [ ] Finalize execution strategy
- [ ] Create GitHub issues for tracking
- [ ] Set up project board (if needed)

#### Checkpoint
✓ Approved plan ready

#### Output
- Approved execution plan
- GitHub issues created
- Team aligned on approach

---

## DAY 1-N: IMPLEMENTATION (Iterative)

### Daily Pattern

#### Morning Session (3-4 hours)

**Review & Plan (30 min)**:
- [ ] Review previous day's work
- [ ] Check test coverage
- [ ] Review code quality
- [ ] Plan today's phase (which feature slice)

**Implementation Cycle (2.5-3.5 hours)**:
- [ ] Implement feature slice
  - Domain layer
  - Application layer
  - Presentation layer
- [ ] Write tests (unit + integration)
- [ ] Validate: `pnpm build && npm test`

**Checkpoint**: Micro-commit (working feature slice)

#### Afternoon Session (3-4 hours)

**Continue Implementation**:
- [ ] Continue feature slices
- [ ] Address morning issues
- [ ] Cross-service integration (if needed)
- [ ] Additional tests

**End of Day**:
- [ ] Final validation: `pnpm build && npm test`
- [ ] Commit with clear message
- [ ] Update project board
- [ ] Document progress
- [ ] Plan tomorrow's phase

**Checkpoint**: End-of-day commit (all tests passing)

---

### Tools & Plugins for Daily Implementation

**TDD Approach**:
- [ ] `/tdd-workflows:tdd-cycle` (red-green-refactor)

**Test Generation**:
- [ ] `/unit-test-generator:generate-tests` (test scaffolding)

**Code Implementation**:
- Sonnet 4.5 for complex business logic
- Haiku 4.5 for simple implementations

**Daily Review** (end of day):
- [ ] `/comprehensive-review:full-review` (quick quality check)

---

### Micro-Commit Strategy

Commit after EACH major component:
```bash
# Feature slice 1
git commit -m "feat(invoice): implement invoice aggregate with approval logic"

# Feature slice 2
git commit -m "feat(invoice): add approval command handler and tests"

# Feature slice 3
git commit -m "feat(invoice): add GraphQL resolvers with guards"

# Integration
git commit -m "feat(invoice): integrate with payment service for approval flow"
```

---

### Session Management

**Context Monitoring**:
- Check context every 2 hours: `/context`
- If >140k (70%): Create checkpoint, start new session

**Checkpoint Strategy**:
- Checkpoint at end of each day
- Document progress in checkpoint
- Next day: Resume from checkpoint

---

## FINAL DAY: QUALITY & RELEASE (4 hours)

### Phase Final.1: COMPREHENSIVE REVIEW (1 hour)

#### Actions
- [ ] `/comprehensive-review:full-review` (all 12+ review agents)
- Review focus areas:
  - Code quality
  - Architecture compliance
  - Test coverage
  - Documentation
  - Performance
- [ ] Fix critical/high issues
- [ ] Re-run review if score <8/10

#### Checkpoint
✓ Quality score >8/10 achieved

#### Output
- Code quality score >8/10
- All critical issues fixed
- High issues addressed

---

### Phase Final.2: SECURITY AUDIT (30 min)

#### Actions
- [ ] `/backend-api-security:backend-security-coder` (deep scan)
- [ ] `/authentication-validator:validate-auth` (if auth changes)
- Focus areas:
  - Input validation
  - Authentication/authorization
  - Data exposure
  - SQL injection
  - XSS vulnerabilities
- [ ] Fix ALL critical and high vulnerabilities
- [ ] Re-audit if needed

#### Checkpoint
✓ Security validated (0 critical, 0 high)

#### Output
- 0 critical vulnerabilities
- 0 high vulnerabilities
- Security report

---

### Phase Final.3: PERFORMANCE VALIDATION (30 min)

#### Actions
- [ ] `/application-performance:performance-engineer` (performance analysis)
- [ ] `/database-design:sql-pro` (if DB-heavy)
- Focus areas:
  - Response times (target <500ms p95)
  - Database query optimization
  - N+1 queries
  - Memory usage
  - Connection pooling
- [ ] Load testing for critical endpoints (if needed)
- [ ] Fix performance issues

#### Checkpoint
✓ Performance acceptable (<500ms p95)

#### Output
- Performance benchmarks
- Load test results (if applicable)
- Optimizations applied

---

### Phase Final.4: DOCUMENTATION (1 hour)

#### Actions
- [ ] Update service README.md
- [ ] `/documentation-generation:api-documenter` (API docs)
- [ ] Create migration guide (if breaking changes)
- [ ] Update VEXTRUS-PATTERNS.md (if new patterns)
- [ ] Document configuration changes
- [ ] Create deployment notes
- [ ] Update team wiki (if applicable)

#### Documentation Checklist
- [ ] Service overview
- [ ] API documentation
- [ ] Database schema changes
- [ ] Configuration requirements
- [ ] Deployment instructions
- [ ] Testing instructions
- [ ] Rollback procedure

#### Checkpoint
✓ Documentation complete

#### Output
- Comprehensive documentation
- API documentation
- Deployment guide
- Updated patterns

---

### Phase Final.5: PULL REQUEST (30 min)

#### Actions
- [ ] Final `pnpm build` (must pass)
- [ ] Final `npm test` (must pass)
- [ ] Check test coverage (>90% target)
- [ ] Stage all changes: `git add .`
- [ ] Create comprehensive commit
- [ ] Push: `git push`
- [ ] `/git-pr-workflows:pr-enhance` (comprehensive PR)

#### PR Checklist
- [ ] Title describes feature
- [ ] Summary of changes
- [ ] Test plan included
- [ ] Screenshots/videos (if UI changes)
- [ ] Breaking changes noted
- [ ] Migration guide linked
- [ ] Reviewers assigned

#### Checkpoint
✓ PR created, ready for review

#### Output
- PR created with comprehensive description
- All reviewers assigned
- CI/CD pipeline triggered

---

## Example Tasks

- New microservice (e.g., Procurement Service)
- Distributed transaction (e.g., Order → Inventory → Payment)
- Cross-service integration (e.g., Invoice → Payment → Notification)
- Production module (e.g., Multi-currency support)
- Complex feature (e.g., Approval workflows with multi-level hierarchy)
- Data migration (e.g., Moving from monolith to microservices)
- System refactoring (e.g., Event sourcing migration)

---

## Success Criteria

✅ Task completed in 2-5 days
✅ Comprehensive planning (Day 0)
✅ Daily iterative implementation
✅ Code quality >8/10
✅ Security: 0 critical, 0 high
✅ Performance: <500ms p95
✅ Test coverage >90%
✅ Comprehensive documentation
✅ All checkpoints passed (15-25)
✅ Context managed (<100k per session)
✅ PR created with full description

---

## Common Pitfalls to Avoid

❌ Skipping Day 0 research phase
❌ Not breaking into daily phases
❌ Trying to implement everything at once
❌ Not managing context (>140k)
❌ Skipping daily reviews
❌ Not committing frequently
❌ Forgetting cross-service integration tests
❌ Poor documentation
❌ Not load testing critical paths
❌ Skipping security audit
❌ Inadequate test coverage (<85%)

---

## Plugin Usage Matrix for Complex Tasks

### Day 0 (Research & Architecture)
| Need | Plugin |
|------|--------|
| Exploration | Explore subagent (Haiku 4.5) |
| Planning | Plan subagent (Sonnet 4.5) |
| Backend Design | `/backend-development:feature-development` |
| Database | `/database-design:database-architect` |
| GraphQL | `/api-scaffolding:graphql-architect` |
| Full-Stack | `/full-stack-orchestration:full-stack-feature` |
| Infrastructure | `/cloud-infrastructure:cloud-architect` |

### Day 1-N (Implementation)
| Need | Plugin |
|------|--------|
| TDD | `/tdd-workflows:tdd-cycle` |
| Tests | `/unit-test-generator:generate-tests` |
| Daily Review | `/comprehensive-review:full-review` |

### Final Day (Quality & Release)
| Need | Plugin |
|------|--------|
| Comprehensive Review | `/comprehensive-review:full-review` |
| Security | `/backend-api-security:backend-security-coder` |
| Auth Testing | `/authentication-validator:validate-auth` |
| Performance | `/application-performance:performance-engineer` |
| Database Optimization | `/database-design:sql-pro` |
| Documentation | `/documentation-generation:api-documenter` |
| PR | `/git-pr-workflows:pr-enhance` |

---

## Workflow Visualization

```
DAY 0: RESEARCH & ARCHITECTURE (4h)
├─ Explore (30 min)
├─ Plan (45 min)
├─ Design (2h)
└─ Review Plan (30 min)

DAY 1-N: IMPLEMENTATION (8h/day)
├─ Morning (4h)
│  ├─ Review (30 min)
│  └─ Implement (3.5h)
│     └─ Checkpoint: Micro-commit
├─ Afternoon (4h)
│  ├─ Implement (3.5h)
│  └─ Review & Plan (30 min)
│     └─ Checkpoint: End-of-day commit

FINAL DAY: QUALITY & RELEASE (4h)
├─ Review (1h)
│  └─ Checkpoint: Quality >8/10
├─ Security (30 min)
│  └─ Checkpoint: 0 critical
├─ Performance (30 min)
│  └─ Checkpoint: <500ms
├─ Documentation (1h)
│  └─ Checkpoint: Docs complete
└─ PR (30 min)
   └─ Checkpoint: PR created
```

---

## Session Management Tips

**Start of Each Day**:
1. Check previous day's checkpoint
2. Review code from yesterday
3. Plan today's feature slices
4. Check context baseline

**End of Each Day**:
1. Run full test suite
2. Commit all working code
3. Document progress
4. Update project board
5. Plan tomorrow

**Context High (>140k)**:
1. Complete current feature slice
2. Create comprehensive checkpoint
3. Start new session
4. Resume from checkpoint

---

**Remember**: Complex tasks require patience and structure. Day 0 planning is crucial. Daily checkpoints ensure progress. Final day quality gates ensure excellence.
