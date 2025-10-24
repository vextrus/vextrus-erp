# Vextrus ERP - AI Workflow Guide

**System**: Bangladesh Construction & Real Estate ERP (18 microservices)
**Model**: Sonnet 4.5 (primary), Haiku 4.5 (exploration via Explore agent)
**Context**: 85k baseline (43%), 115k free (57%), Target: <120k (60%)

---

## FOR CLAUDE: Your Instructions

**This is YOUR execution guide**. Follow these patterns for all tasks.

---

## Core Workflow

### Simple Task (<2 hours, 1-3 files)
```
1. Read files
2. Implement
3. pnpm build && npm test
4. Commit
```

### Medium/Complex Task (2+ hours, 4+ files)
```
1. /compounding-engineering:plan "Task"
2. /compounding-engineering:work #<issue>
3. /compounding-engineering:review (12+ agents parallel)
4. /compounding-engineering:triage
5. /git-pr-workflows:pr-enhance (optional)
```

**Git Worktree**: `/work` creates isolated worktree, auto-commits. No manual checkpoints needed.

---

## Task Classification

- **Simple**: Direct implementation, no planning needed
- **Medium**: 4-15 files, `/plan` → `/work` → `/review` → `/triage`
- **Complex**: 15+ files, add specialized plugins + Explore agent research

---

## Specialized Plugins (Use When Needed)

**Enable mid-command with "@"** (e.g., `@docker`, `@github`)

### Common Plugins
- **TDD**: `/tdd-workflows:tdd-cycle` (red-green-refactor)
- **Testing**: `/unit-test-generator:generate-tests`
- **Security**: `/comprehensive-review:security-auditor`
- **Performance**: `/application-performance:performance-engineer`
- **Database**: `/database-migrations:sql-migrations` (zero-downtime)
- **API**: `/api-scaffolding:fastapi-pro` (GraphQL/FastAPI)
- **Debug**: `/error-debugging:error-detective`

**Full list**: `.claude/plugin-command-reference.md` (47+ commands)

---

## Explore Agent (Critical for Research)

**Use Haiku 4.5 Explore agent for codebase research**:
```bash
# Via Bash (preferred)
explore services/finance-service

# Or manual
find services/finance-service -name "*.ts" | head -20
grep -r "InvoiceAggregate" services/
```

**When to use**:
- Before planning complex tasks
- Understanding existing patterns
- Identifying dependencies
- Researching architecture

---

## Quality Gates (Mandatory)

```bash
pnpm build  # MUST: 0 errors
npm test    # MUST: all passing
```

**Never commit** with TypeScript errors or failing tests.

**Review target**: ≥7/10 on kieran-typescript-reviewer (via `/review`)

---

## Bangladesh Compliance

**Reference**: `VEXTRUS-PATTERNS.md` sections 11-13

### VAT
- Standard: 15% (construction/services)
- Reduced: 7.5%
- Zero-rated: 0% (exports)

### TDS/AIT
- With TIN: 5%
- Without TIN: 7.5%
- Professionals: 10%

### Mushak 6.3
- Auto-generate on invoice approval
- Include: TIN/BIN, VAT breakdown, QR code
- Fiscal Year: July-June (NOT calendar year)

---

## Architecture (Use VEXTRUS-PATTERNS.md)

**Stack**: DDD + Event Sourcing + CQRS + GraphQL Federation v2

### Key Patterns
- **Aggregates**: Small, enforce invariants (`services/*/src/domain/aggregates/`)
- **Events**: Past tense, immutable, versioned
- **Commands**: Validation, business logic
- **Queries**: Read models, optimized
- **GraphQL**: `@key` directive, pagination always

**Plugin support**: `/backend-development:architecture-patterns`

---

## Context Management

**Current State** (from `/context`):
- **Baseline**: 85k (43%)
- **Free**: 115k (57%)
- **Target**: <120k (60%)
- **Warning**: >140k (70%)
- **Critical**: >160k (80%)

### Breakdown
- System prompt: 2.9k (1.4%)
- System tools: 27.9k (13.9%)
- Custom agents: 10.6k (5.3%)
- Memory files: 7.3k (3.7%) - this file
- Messages: 7.2k (3.6%)

### Optimization
- **MCP servers**: Disabled by default, enable mid-command with "@" (e.g., `@docker`, `@github`)
- **Read selectively**: Don't read entire files unnecessarily
- **Use Explore agent**: Haiku 4.5 for research (lower cost)
- **Plugin workflows**: Offload to plugins (less main context)

### When High (>140k)
1. Complete current `/work` if active
2. User starts new session
3. Continue from GitHub issue (worktree preserved)

---

## Git Workflow

### With Plugins (Recommended)
```bash
/compounding-engineering:plan "Task"
/compounding-engineering:work #<issue>  # Auto-commits
/compounding-engineering:review
/compounding-engineering:triage
/git-pr-workflows:pr-enhance
```

### Manual (Simple Tasks)
```bash
pnpm build && npm test
git add .
git commit -m "type: description

- Change 1
- Change 2

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
git push
```

**Types**: feat, fix, refactor, test, docs, chore

---

## Common Patterns

### Backend Feature + TDD
```bash
/backend-development:feature-development  # Analysis
/compounding-engineering:plan "Feature"
/tdd-workflows:tdd-cycle
/compounding-engineering:review
```

### Database Migration
```bash
/database-migrations:sql-migrations
/database-design:sql-pro  # Validate
/compounding-engineering:work #<issue>
/compounding-engineering:review
```

### Performance Issue
```bash
/application-performance:performance-engineer
/database-design:sql-pro  # If DB related
/compounding-engineering:plan "Optimizations"
/compounding-engineering:work #<issue>
/performance-testing-review:performance-engineer
```

### Security Audit
```bash
/comprehensive-review:security-auditor
/compounding-engineering:triage
/backend-api-security:backend-security-coder
/authentication-validator:validate-auth
```

---

## Error Handling

### Build/Test Failures
1. Read errors
2. Fix issues
3. Re-run gates
4. Only proceed when passing

### Review <7/10
1. `/compounding-engineering:triage`
2. Fix critical/high issues
3. Re-run `/compounding-engineering:review`
4. Proceed when ≥7/10

### Plugin Errors
1. Check GitHub issue exists (for `/work`)
2. Check git worktree: `git worktree list`
3. Manual cleanup if needed: `git worktree remove <path>`

---

## DO ✅ / DON'T ❌

### DO
- Use `/compounding-engineering:review` after all implementations
- Use Explore agent for codebase research
- Enable MCP servers mid-command with "@" when needed
- Reference `VEXTRUS-PATTERNS.md` for Bangladesh compliance
- Use plugins for orchestration (medium/complex tasks)
- Use manual tools (Read, Grep, Glob) for quick ops
- Run quality gates before every commit

### DON'T
- Skip reviews to "save time"
- Commit with TypeScript errors or failing tests
- Use plugins for simple file reads (use Read tool)
- Create manual checkpoints (git worktrees handle this)
- Use Task tool when plugin command exists
- Load entire files unnecessarily
- Enable all MCP servers (use "@" selectively)

---

## Success Metrics

**Target Quality**:
- kieran-typescript-reviewer: ≥9/10
- Security issues: 0 critical
- Test coverage: ≥90%
- Context usage: <120k (60%)

---

## Quick Reference

| Need | Command |
|------|---------|
| Plan | `/compounding-engineering:plan` |
| Execute | `/compounding-engineering:work` |
| Review | `/compounding-engineering:review` |
| Triage | `/compounding-engineering:triage` |
| TDD | `/tdd-workflows:tdd-cycle` |
| Tests | `/unit-test-generator:generate-tests` |
| PR | `/git-pr-workflows:pr-enhance` |
| Security | `/comprehensive-review:security-auditor` |
| Performance | `/application-performance:performance-engineer` |
| Database | `/database-migrations:sql-migrations` |
| Explore | Haiku 4.5 Explore agent via Bash |
| Build | `pnpm build` |
| Test | `npm test` |

---

## Resources

- **Plugin Reference**: `.claude/plugin-command-reference.md` (47+ commands)
- **Workflow Guide**: `.claude/workflows/v6-plugin-orchestration.md`
- **Architecture**: `VEXTRUS-PATTERNS.md` (Bangladesh compliance, DDD, etc.)
- **Migration**: `.claude/V5.0-TO-V6.0-MIGRATION.md` (if needed)

---

**Philosophy**: Each unit of engineering work makes subsequent units easier—not harder.

**Primary Orchestrator**: Compounding Engineering Plugin

**Enable MCP mid-command**: Use "@" prefix (e.g., `@docker ps`, `@github issue list`)

**Your goal**: 9.5/10 quality, 90%+ coverage, <120k context, fastest delivery.
