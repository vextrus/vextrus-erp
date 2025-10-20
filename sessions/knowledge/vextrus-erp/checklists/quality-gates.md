# Quality Gates Checklist

**Purpose**: Pre-PR quality requirements for Vextrus ERP development
**Context**: Ensures production-ready code with automated and manual quality gates
**Last Updated**: 2025-10-16

---

## Quality Gate Levels

| Task Complexity | Required Gates | Optional Gates | Codify Phase |
|----------------|---------------|----------------|--------------|
| **Simple** (<4 hours) | Automated only | - | Optional |
| **Medium** (4-8 hours) | Automated + 2-3 agents | Performance, security | Recommended |
| **Complex** (1-3 days) | Automated + full assess | All compounding | Required |
| **Critical** (Production) | All + manual review | All + peer review | Required |

---

## Level 1: Required Automated Gates (All Tasks)

**Must pass before any PR**. No exceptions.

### 1.1 Code Review

```bash
/review
```

**What it checks**:
- Code quality and readability
- Best practices adherence
- Potential bugs
- Code smells
- Performance issues
- Documentation completeness

**Plugin**: code-review-ai
**Pass criteria**: No critical issues, max 5 warnings

### 1.2 Security Scan

```bash
/security-scan
```

**What it checks**:
- SAST (Static Application Security Testing)
- Dependency vulnerabilities
- Security best practices
- OWASP compliance
- Hardcoded secrets
- SQL injection risks
- XSS vulnerabilities

**Plugin**: security-scanning
**Pass criteria**: No critical or high vulnerabilities

### 1.3 Test Execution

```bash
/test
```

**What it checks**:
- Unit tests pass
- Integration tests pass
- Test coverage maintained
- No flaky tests
- Performance regression tests

**Plugin**: unit-testing
**Pass criteria**: All tests pass, coverage ≥ baseline

### 1.4 Build Success

```bash
npm run build
# OR
pnpm run build
```

**What it checks**:
- TypeScript compilation
- No type errors
- No build warnings
- Dependencies resolve

**Pass criteria**: Clean build with no errors

---

## Level 2: Optional Advanced Reviews (Medium/Complex Tasks)

**Recommended for medium tasks, required for complex tasks**

### 2.1 Architecture Review

```markdown
Use Task tool: compounding-engineering:architecture-strategist
```

**When to use**:
- Architectural changes
- New patterns introduced
- Service boundary modifications
- Integration point changes

**What it reviews**:
- System design alignment
- Architectural pattern compliance
- Component boundaries
- Coupling and cohesion
- Scalability implications

**Pass criteria**: No architectural violations

### 2.2 Code Quality (Language-Specific)

#### TypeScript/JavaScript

```markdown
Use Task tool: compounding-engineering:kieran-typescript-reviewer
```

**What it reviews**:
- Naming conventions
- Type safety
- Code clarity
- Simplicity
- Best practices

**Pass criteria**: Strict quality standards met

#### Python (if applicable)

```markdown
Use Task tool: compounding-engineering:kieran-python-reviewer
```

**What it reviews**:
- Pythonic patterns
- Type hints
- Code clarity
- PEP 8 compliance
- Best practices

**Pass criteria**: Strict quality standards met

### 2.3 Performance Analysis

```markdown
Use Task tool: compounding-engineering:performance-oracle
```

**When to use**:
- Performance-critical features
- Database operations
- API endpoints
- Complex algorithms
- High-volume operations

**What it reviews**:
- Performance bottlenecks
- N+1 query problems
- Caching opportunities
- Memory usage
- Algorithm efficiency

**Pass criteria**: No performance regressions, meets targets

### 2.4 Security Deep Dive

```markdown
Use Task tool: compounding-engineering:security-sentinel
```

**When to use**:
- Authentication/authorization changes
- Data encryption
- Payment processing
- PII handling
- Security-critical features

**What it reviews**:
- Threat modeling
- Attack surface analysis
- Security patterns
- Compliance requirements
- Defensive coding

**Pass criteria**: No security vulnerabilities

### 2.5 Data Integrity

```markdown
Use Task tool: compounding-engineering:data-integrity-guardian
```

**When to use**:
- Database migrations
- Schema changes
- Data model modifications
- Data manipulation
- Data validation logic

**What it reviews**:
- Migration safety
- Referential integrity
- Data validation
- Privacy requirements
- Rollback capability

**Pass criteria**: Data integrity preserved

### 2.6 Simplification Review

```markdown
Use Task tool: compounding-engineering:code-simplicity-reviewer
```

**When to use**:
- After implementation complete
- Before finalizing PR
- Complex features
- Refactoring work

**What it reviews**:
- Unnecessary complexity
- Over-engineering
- YAGNI violations
- Abstraction levels
- Code simplification opportunities

**Pass criteria**: No unnecessary complexity

---

## Level 3: Domain-Specific Validations

**Required for specific domains**

### 3.1 Bangladesh ERP Compliance

**When to use**: Finance, tax, compliance features

**Checklist**:
- [ ] VAT rates correct (15%, 10%, 7.5%, 5%)
- [ ] NBR Mushak-6.3 format compliant
- [ ] TIN/BIN validation implemented
- [ ] Local language support (if applicable)
- [ ] Bangladesh timezone (Asia/Dhaka)
- [ ] Currency (BDT) handling correct

**Validation method**: Manual review + domain expert

### 3.2 GraphQL Federation

**When to use**: GraphQL schema changes

**Checklist**:
- [ ] Federation directives correct (@key, @extends, @external)
- [ ] Schema composition valid
- [ ] No breaking changes
- [ ] Backward compatible
- [ ] Gateway tested
- [ ] Apollo Sandbox verified

**Validation method**:
```bash
# Test in Apollo Sandbox
# Verify from multiple services
```

### 3.3 Event Sourcing

**When to use**: Event-driven features, CQRS

**Checklist**:
- [ ] Event versioning implemented
- [ ] Event schema backward compatible
- [ ] Event handlers idempotent
- [ ] Replay logic tested
- [ ] Projection updates correct
- [ ] EventStore integration verified

**Validation method**: Event replay testing

### 3.4 Database Performance

**When to use**: Database schema changes, queries

**Checklist**:
- [ ] Indexes added for foreign keys
- [ ] Query performance tested
- [ ] No N+1 queries
- [ ] Migration tested (up/down)
- [ ] Rollback plan documented
- [ ] Performance baseline measured

**Validation method**:
```bash
@postgres  # Enable postgres MCP
# Analyze query plans
# Measure query times
```

**Use agent**:
```markdown
Use Task tool: database-cloud-optimization:database-optimizer
```

---

## Level 4: Pre-PR Checklist

**Complete before creating PR**

### Code Quality

- [ ] All required automated gates pass (/review, /security-scan, /test)
- [ ] Build succeeds with no warnings
- [ ] TypeScript strict mode passes
- [ ] No console.log or debug statements
- [ ] No commented-out code
- [ ] No TODOs without issue references

### Testing

- [ ] Unit tests added for new code
- [ ] Integration tests updated
- [ ] E2E tests pass (if applicable)
- [ ] Test coverage maintained or improved
- [ ] Edge cases tested
- [ ] Error cases tested

### Security

- [ ] No secrets in code
- [ ] Environment variables used correctly
- [ ] Input validation implemented
- [ ] Authorization checks in place
- [ ] SQL injection prevented
- [ ] XSS prevention implemented

### Performance

- [ ] API endpoints <500ms (target <300ms)
- [ ] Database queries <250ms (target <100ms)
- [ ] No memory leaks
- [ ] Resource cleanup implemented
- [ ] Caching used where appropriate

### Documentation

- [ ] Service CLAUDE.md updated
- [ ] API documentation updated
- [ ] README updated (if applicable)
- [ ] Architecture decisions documented
- [ ] Migration guides added (if needed)
- [ ] Inline comments for complex logic

### Domain-Specific

- [ ] DDD patterns followed
- [ ] Aggregates properly bounded
- [ ] Domain events published
- [ ] CQRS separation maintained
- [ ] Event sourcing correctly implemented

### Git & PR

- [ ] Branch name follows convention
- [ ] Commits are atomic and clear
- [ ] Commit messages descriptive
- [ ] No merge conflicts
- [ ] PR description complete
- [ ] Screenshots/videos (for UI changes)

---

## Level 5: Compounding Codify Phase

**Required for complex tasks, recommended for medium tasks**

### Purpose

Capture learnings to make future work easier

### Process

```markdown
Use Task tool: compounding-engineering:feedback-codifier
```

### Questions to Answer

1. **Patterns that worked well**:
   - What architectural patterns were effective?
   - What code patterns should be reused?
   - What tools/libraries were helpful?

2. **Simplification opportunities**:
   - What could be simplified?
   - What was over-engineered?
   - What abstractions were unnecessary?

3. **Process improvements**:
   - What should be automated?
   - What steps were repetitive?
   - What caused friction?

4. **Knowledge gaps**:
   - What wasn't documented?
   - What was hard to understand?
   - What needs better documentation?

5. **Future improvements**:
   - What technical debt was introduced?
   - What should be refactored later?
   - What patterns should be extracted?

### Outputs

Update knowledge base:
- [ ] Service CLAUDE.md (patterns, decisions)
- [ ] sessions/knowledge/vextrus-erp/ (new patterns)
- [ ] Shared library documentation
- [ ] Team wiki/documentation

---

## Complete Quality Gate Workflow

### Simple Task (<4 hours)

```markdown
## Implementation
[Write code]

## Required Gates
/review
/security-scan
/test
npm run build

## Pre-PR Checklist
- Code quality ✅
- Testing ✅
- Security ✅
- Documentation ✅

## Create PR
/pr
```

**Time**: 30 minutes for quality gates

### Medium Task (4-8 hours)

```markdown
## Implementation
[Write code]

## Required Gates
/review
/security-scan
/test
npm run build

## Advanced Reviews (2-3 agents)
Use Task tool: compounding-engineering:kieran-typescript-reviewer
Use Task tool: compounding-engineering:performance-oracle

## Domain Validations
[Check domain-specific requirements]

## Pre-PR Checklist
[Complete checklist]

## Codify (Recommended)
Use Task tool: compounding-engineering:feedback-codifier
- Capture key learnings
- Update documentation

## Create PR
/pr
```

**Time**: 1-2 hours for quality gates

### Complex Task (1-3 days)

```markdown
## Implementation
[Write code]

## Required Gates
/review
/security-scan
/test
npm run build

## ASSESS PHASE (Full Compounding)
Use Task tool: compounding-engineering:architecture-strategist
Use Task tool: compounding-engineering:kieran-typescript-reviewer
Use Task tool: compounding-engineering:performance-oracle
Use Task tool: compounding-engineering:security-sentinel
Use Task tool: compounding-engineering:data-integrity-guardian
Use Task tool: compounding-engineering:code-simplicity-reviewer

## Domain Validations
[Check all domain-specific requirements]

## Pre-PR Checklist
[Complete full checklist]

## CODIFY PHASE (Required)
Use Task tool: compounding-engineering:feedback-codifier
- Answer all 5 questions
- Update knowledge base
- Document patterns
- Share learnings

## Create PR
/pr
```

**Time**: 2-4 hours for quality gates

---

## Quality Metrics

### Code Quality Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Test Coverage** | ≥80% | Jest/Vitest |
| **Type Coverage** | 100% | TypeScript strict |
| **Linting** | 0 errors, <5 warnings | ESLint |
| **Security** | 0 critical/high | SAST scan |
| **Performance** | <500ms API, <250ms DB | Monitoring |
| **Documentation** | All public APIs | TSDoc |

### Review Standards

| Review Type | Pass Criteria |
|------------|---------------|
| **Automated** | No blockers |
| **Code Quality** | No critical issues |
| **Security** | No vulnerabilities |
| **Architecture** | Pattern compliant |
| **Performance** | No regressions |
| **Domain** | Business rules validated |

---

## Common Quality Issues

### Issue 1: Skipping Tests

❌ **Symptom**: "Tests take too long, I'll skip them"
✅ **Solution**:
- Run tests in parallel
- Use test-specific databases
- Mock external dependencies
- Tests are non-negotiable

### Issue 2: Incomplete Security Scan

❌ **Symptom**: "Security scan flagged false positives, ignoring"
✅ **Solution**:
- Review each finding
- Document false positives
- Add suppression with justification
- Never skip /security-scan

### Issue 3: No Architecture Review

❌ **Symptom**: "It works, that's good enough"
✅ **Solution**:
- Architecture matters for maintainability
- Use architecture-strategist for complex changes
- Document architectural decisions
- Consider long-term implications

### Issue 4: Skip Codify Phase

❌ **Symptom**: "Task is done, moving on"
✅ **Solution**:
- Learning capture is critical
- 30 minutes now saves hours later
- Use feedback-codifier
- Update knowledge base

### Issue 5: Incomplete Documentation

❌ **Symptom**: "Code is self-documenting"
✅ **Solution**:
- Update service CLAUDE.md
- Document complex logic
- API documentation required
- Architecture decisions recorded

---

## Emergency Bypass Process

**For production hotfixes only**

### Conditions

- Production is down
- Critical security vulnerability
- Data corruption risk
- Legal/compliance requirement

### Process

1. **Minimal Fix**:
   - Smallest change to resolve issue
   - No refactoring
   - No "while I'm here" changes

2. **Required Gates** (still apply):
   - /test (must pass)
   - /security-scan (must pass)
   - Build (must succeed)

3. **Expedited Review**:
   - Skip advanced reviews
   - Skip codify phase
   - Create PR immediately

4. **Post-Incident**:
   - Full quality gates within 24 hours
   - Root cause analysis
   - Proper solution implemented
   - Documentation updated

---

## Quality Gate Automation

### CI/CD Integration

```yaml
# .github/workflows/quality-gates.yml
name: Quality Gates

on: [pull_request]

jobs:
  automated-gates:
    runs-on: ubuntu-latest
    steps:
      - name: Code Review
        run: /review

      - name: Security Scan
        run: /security-scan

      - name: Test Suite
        run: /test

      - name: Build
        run: npm run build
```

### Pre-commit Hooks

```bash
# .husky/pre-commit
#!/bin/bash
npm run lint
npm run type-check
npm run test:changed
```

### Pre-push Hooks

```bash
# .husky/pre-push
#!/bin/bash
npm run test
npm run build
```

---

## Quick Reference

### Simple Task Checklist

```markdown
- [ ] /review
- [ ] /security-scan
- [ ] /test
- [ ] Build passes
- [ ] Documentation updated
- [ ] PR created
```

**Time**: 30 minutes

### Medium Task Checklist

```markdown
- [ ] /review
- [ ] /security-scan
- [ ] /test
- [ ] Build passes
- [ ] 2-3 agent reviews
- [ ] Domain validation
- [ ] Documentation updated
- [ ] Codify learnings (recommended)
- [ ] PR created
```

**Time**: 1-2 hours

### Complex Task Checklist

```markdown
- [ ] /review
- [ ] /security-scan
- [ ] /test
- [ ] Build passes
- [ ] Full ASSESS phase (6+ agents)
- [ ] Domain validation
- [ ] Pre-PR checklist complete
- [ ] CODIFY phase (required)
- [ ] Knowledge base updated
- [ ] PR created
```

**Time**: 2-4 hours

---

## Philosophy

> "Quality is not an act, it is a habit." - Aristotle

**Core Principles**:

1. **Quality gates are non-negotiable** - No shortcuts
2. **Automated first** - Humans for what machines can't do
3. **Prevention over cure** - Catch issues early
4. **Learning capture** - Each task improves future tasks
5. **Compounding quality** - Quality becomes easier over time

**Expected Outcomes**:

- Fewer production bugs
- Faster code reviews
- Easier maintenance
- Knowledge accumulation
- Team confidence

---

**Last Updated**: 2025-10-16
**Status**: Phase 2 - Knowledge Base Expansion
**Philosophy**: Non-negotiable quality, compounding improvement
