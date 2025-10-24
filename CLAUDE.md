# Vextrus ERP - V6.0 Plugin-Orchestrated Workflow

**Version**: 6.0
**Model**: Sonnet 4.5 (primary), Haiku 4.5 (exploration)
**Context**: <60k (30%) target, ~34k baseline
**System**: Bangladesh Construction & Real Estate ERP (18 microservices)
**Orchestrator**: Compounding Engineering Plugin

---

## CRITICAL: This File is FOR YOU (Claude)

**NOT a user reference** - This is YOUR step-by-step instruction manual.
**PLUGIN-FIRST APPROACH** - Use Compounding Engineering plugin as primary workflow orchestrator.
**47+ PLUGIN COMMANDS** - Leverage specialized plugins for different domains.
**KNOWLEDGE COMPOUNDS** - Each task makes future tasks easier.

---

## V6.0 Philosophy: Compounding Engineering

> "Each unit of engineering work should make subsequent units easier—not harder"

### Core Principle
- **V5.0**: Manual orchestration, manual agent invocation, manual checkpoints
- **V6.0**: Plugin-orchestrated, automated git worktrees, continuous validation, multi-agent reviews

### Three-Step Workflow
1. **Plan**: `/compounding-engineering:plan <task>` - Research codebase, create GitHub issue
2. **Work**: `/compounding-engineering:work <issue>` - Execute with git worktrees, automated todos
3. **Review**: `/compounding-engineering:review` - Multi-agent parallel reviews (12+ agents)
4. **Triage**: `/compounding-engineering:triage` - Present findings, decide fixes

---

## Task Classification (YOU decide)

### Simple Task (<4 hours, 1-3 files)
**Examples**: Add field, fix bug, update validation

**YOUR WORKFLOW**:
1. Read relevant files **COMPLETELY**
2. Implement using VEXTRUS-PATTERNS.md
3. Run quality gates: `pnpm build && npm test`
4. Commit with proper message
5. **NO plugin workflow needed** (direct implementation)

---

### Medium Task (4-8 hours, 5-15 files)
**Examples**: New feature, CRUD implementation, service enhancement

**YOUR WORKFLOW (Use Compounding Engineering)**:
1. **Plan**: `/compounding-engineering:plan <task_description>`
   - Creates detailed GitHub issue
   - Researches codebase with Haiku 4.5
   - Generates structured todos
2. **Work**: `/compounding-engineering:work <issue_url_or_number>`
   - Creates isolated git worktree
   - Executes systematically with continuous validation
   - Runs tests after each change
   - Auto-commits with proper messages
3. **Review**: `/compounding-engineering:review`
   - Runs kieran-typescript-reviewer
   - Runs security-sentinel (if applicable)
   - Runs performance-oracle (if applicable)
   - Generates comprehensive quality report
4. **Triage**: `/compounding-engineering:triage`
   - Present findings one-by-one
   - User decides: fix, defer, or ignore

---

### Complex Task (2-5 days, 15+ files)
**Examples**: Production-ready module, cross-service changes, new aggregates

**YOUR WORKFLOW (Full Plugin Orchestration)**:
1. **Research & Plan**:
   - Use Explore agent (Haiku 4.5) to understand codebase
   - `/compounding-engineering:plan <comprehensive_task_description>`
   - Review generated GitHub issue with user
   - May use specialized planners:
     - `/backend-development:feature-development` - Backend features
     - `/database-migrations:sql-migrations` - Database changes
     - `/api-scaffolding:fastapi-pro` - New services

2. **Execute in Phases**:
   - `/compounding-engineering:work <issue_url>`
   - Plugin handles:
     - Git worktree isolation
     - Todo tracking
     - Continuous validation
     - Daily commits
   - Combine with domain plugins as needed:
     - `/tdd-workflows:tdd-cycle` - Test-driven development
     - `/unit-test-generator:generate-tests` - Test generation
     - `/api-testing-observability:api-documenter` - API docs

3. **Multi-Agent Reviews**:
   - `/compounding-engineering:review` (runs 12+ agents):
     - kieran-typescript-reviewer (always)
     - architecture-strategist (architecture)
     - security-sentinel (auth/RBAC)
     - performance-oracle (optimization)
     - data-integrity-guardian (migrations)
     - pattern-recognition-specialist (patterns)
     - code-simplicity-reviewer (simplicity)
   - Specialized reviews:
     - `/comprehensive-review:security-auditor` - Deep security audit
     - `/performance-testing-review:performance-engineer` - Performance analysis

4. **Triage & Finalize**:
   - `/compounding-engineering:triage`
   - Fix critical issues
   - Re-run reviews if needed
   - Create PR via `/git-pr-workflows:pr-enhance`

---

## Plugin Command Matrix (47+ Commands Available)

### Planning & Research (6 commands)
| Command | Use When |
|---------|----------|
| `/compounding-engineering:plan` | **PRIMARY PLANNER** - All medium/complex tasks |
| `/backend-development:feature-development` | Backend-specific feature planning |
| `/full-stack-orchestration:full-stack-featureold` | Full-stack feature planning |
| `/api-scaffolding:fastapi-templates` | Scaffold new FastAPI service |
| `/database-design:database-architect` | Database architecture design |
| `/documentation-generation:docs-architect` | Documentation planning |

### Execution & Development (18 commands)
| Command | Use When |
|---------|----------|
| `/compounding-engineering:work` | **PRIMARY EXECUTOR** - All planned tasks |
| `/tdd-workflows:tdd-cycle` | Full TDD red-green-refactor cycle |
| `/tdd-workflows:tdd-red` | Write failing test first |
| `/tdd-workflows:tdd-green` | Make test pass |
| `/tdd-workflows:tdd-refactor` | Refactor after green |
| `/backend-api-security:backend-security-coder` | Implement secure backend code |
| `/data-validation-suite:backend-security-coder` | Input validation implementation |
| `/api-scaffolding:django-pro` | Django development |
| `/api-scaffolding:fastapi-pro` | FastAPI development |
| `/api-scaffolding:graphql-architect` | GraphQL schema design |
| `/database-design:sql-pro` | SQL query optimization |
| `/database-migrations:sql-migrations` | Zero-downtime migrations |
| `/frontend-mobile-development:frontend-developer` | React/Next.js frontend |
| `/frontend-mobile-development:mobile-developer` | React Native mobile |
| `/backend-development:architecture-patterns` | Implement DDD/Clean Architecture |
| `/backend-development:microservices-patterns` | Microservices patterns |
| `/cloud-infrastructure:terraform-module-library` | Terraform modules |
| `/observability-monitoring:prometheus-configuration` | Prometheus setup |

### Testing & Validation (8 commands)
| Command | Use When |
|---------|----------|
| `/unit-test-generator:generate-tests` | Generate comprehensive unit tests |
| `/test-orchestrator:orchestrate` | Complex test workflows |
| `/unit-testing:test-automator` | Test automation |
| `/performance-testing-review:performance-engineer` | Performance testing |
| `/api-testing-observability:api-documenter` | API testing & docs |
| `/authentication-validator:validate-auth` | Auth validation |
| `/error-debugging:debugger` | Debug issues |
| `/error-debugging:error-detective` | Error pattern analysis |

### Review & Quality (10 commands)
| Command | Use When |
|---------|----------|
| `/compounding-engineering:review` | **PRIMARY REVIEWER** - Always after implementation |
| `/comprehensive-review:full-review` | Exhaustive multi-agent review |
| `/comprehensive-review:architect-review` | Architecture-focused review |
| `/comprehensive-review:code-reviewer` | Code quality review |
| `/comprehensive-review:security-auditor` | Deep security audit |
| `/code-review-ai:architect-review` | Architecture validation |
| `/application-performance:performance-engineer` | Performance review |
| `/performance-testing-review:test-automator` | Test quality review |
| `/observability-monitoring:slo-implementation` | SLO/SLI validation |
| `/database-cloud-optimization:database-optimizer` | Database optimization review |

### Git & Deployment (5 commands)
| Command | Use When |
|---------|----------|
| `/git-pr-workflows:pr-enhance` | Create/enhance pull requests |
| `/git-commit-smart:commit-smart` | Generate conventional commits |
| `/deployment-pipeline-orchestrator:pipeline-orchestrate` | CI/CD setup |
| `/cloud-infrastructure:cloud-architect` | Cloud infrastructure |
| `/docker-compose-generator:docker-compose` | Docker Compose configs |

---

## When User Says... (YOUR Action Table)

| User Says | YOU MUST DO |
|-----------|-------------|
| "Plan [task]" | `/compounding-engineering:plan <task_description>`<br>Review generated GitHub issue |
| "Implement [feature]" | 1. `/compounding-engineering:plan <feature>`<br>2. `/compounding-engineering:work <issue_url>`<br>3. `/compounding-engineering:review`<br>4. `/compounding-engineering:triage` |
| "Review code" | `/compounding-engineering:review`<br>Report quality scores |
| "Fix bug [description]" | 1. Use `/error-debugging:error-detective` to analyze<br>2. `/compounding-engineering:work` to fix<br>3. `/compounding-engineering:review` to validate |
| "Add tests" | `/unit-test-generator:generate-tests`<br>Or `/tdd-workflows:tdd-cycle` for TDD approach |
| "Create PR" | `/git-pr-workflows:pr-enhance`<br>Ensure all reviews passed first |
| "Optimize performance" | 1. `/application-performance:performance-engineer` to analyze<br>2. `/compounding-engineering:work` to implement<br>3. `/performance-testing-review:performance-engineer` to validate |
| "Migrate database" | `/database-migrations:sql-migrations`<br>Ensure zero-downtime strategy |
| "Explore [service]" | Use Haiku 4.5 Explore agent<br>Or `find services/[service] -name "*.ts"` |
| "Commit changes" | If using `/compounding-engineering:work`: auto-committed<br>If manual: `git add . && git commit && git push` |

---

## Quality Gates (YOU enforce)

### Before Every Commit
**CRITICAL**: These MUST pass. Do NOT commit if failures.

```bash
# TypeScript
pnpm build
# Status: MUST be 0 errors

# Tests
npm test
# Status: MUST be all passing

# Lint (if applicable)
pnpm lint
# Status: SHOULD be 0 errors (warnings OK)
```

**IF FAILURES**:
1. DO NOT commit
2. Fix issues
3. Re-run gates
4. Only commit when all pass

**NOTE**: If using `/compounding-engineering:work`, quality gates run automatically after each change.

---

## Compounding Engineering Workflow Deep Dive

### `/compounding-engineering:plan`
**What It Does**:
- Researches codebase with Haiku 4.5 Explore agent
- Identifies relevant files, patterns, dependencies
- Estimates complexity (simple/medium/complex)
- Creates detailed GitHub issue with:
  - Implementation plan
  - Files to modify
  - Tests to write
  - Acceptance criteria
- Generates structured todos

**When to Use**: ALL medium/complex tasks, optional for simple tasks

**Example**:
```bash
/compounding-engineering:plan "Implement invoice-payment linking with Bangladesh Mushak 6.3 generation"
```

---

### `/compounding-engineering:work`
**What It Does**:
- Creates isolated git worktree for clean development
- Breaks GitHub issue into trackable todos
- Executes systematically:
  - Reads identified files completely
  - Implements following VEXTRUS-PATTERNS.md
  - Runs `pnpm build` after each change
  - Runs `npm test` after each change
  - Auto-commits with conventional commits
- Updates todos as completed
- Pushes to dedicated branch when done

**When to Use**: ALL planned medium/complex tasks

**Example**:
```bash
/compounding-engineering:work #123
# or
/compounding-engineering:work https://github.com/user/repo/issues/123
```

**Git Worktree Benefits**:
- Clean isolation (no conflicts with main branch)
- Parallel development possible
- Easy cleanup after merge
- Automatic branch management

---

### `/compounding-engineering:review`
**What It Does**:
- Runs 12+ specialized agents **in parallel**:
  1. **kieran-typescript-reviewer**: TypeScript code quality (score /10)
  2. **architecture-strategist**: Architecture compliance
  3. **security-sentinel**: Security vulnerabilities, auth issues
  4. **performance-oracle**: Performance bottlenecks, optimization
  5. **data-integrity-guardian**: Data consistency, migrations
  6. **pattern-recognition-specialist**: Design patterns, anti-patterns
  7. **code-simplicity-reviewer**: YAGNI, simplicity
  8. **best-practices-researcher**: Framework best practices
  9. **git-history-analyzer**: Historical context
  10. **repo-research-analyst**: Codebase conventions
  11. **framework-docs-researcher**: Library documentation
  12. **dhh-rails-reviewer**: Rails conventions (if Rails code)
- Generates comprehensive quality report
- Identifies issues by severity (critical/high/medium/low)
- Provides actionable recommendations

**When to Use**: ALWAYS after implementation (simple/medium/complex)

**Target Score**: ≥7/10 on kieran-typescript-reviewer

---

### `/compounding-engineering:triage`
**What It Does**:
- Presents review findings **one-by-one**
- For each finding:
  - Shows issue description
  - Shows affected code
  - Asks user: "Fix now, defer, or ignore?"
- Creates todos for "fix now" items
- Documents "defer" items for backlog
- Tracks "ignore" decisions with reasoning

**When to Use**: After `/compounding-engineering:review` to address findings

---

## Manual Workflows (When NOT to Use Plugins)

### Use Manual Tools For:
1. **Quick file reads**: Use `Read` tool directly
2. **Simple searches**: Use `Grep`/`Glob` directly
3. **Git status checks**: `git status` via Bash
4. **Quick fixes** (<1 hour, single file): Direct implementation
5. **Exploration**: Haiku 4.5 Explore agent via Bash

### Use Plugins For:
1. **Planned features**: `/compounding-engineering:plan` + `/work`
2. **Quality reviews**: `/compounding-engineering:review`
3. **TDD workflows**: `/tdd-workflows:tdd-cycle`
4. **Complex migrations**: `/database-migrations:sql-migrations`
5. **Security audits**: `/comprehensive-review:security-auditor`
6. **Performance analysis**: `/application-performance:performance-engineer`

---

## Context Management

### Current Status
- **Baseline**: ~34k (17%)
- **Target**: <60k (30%)
- **Warning**: >100k (50%)
- **Critical**: >140k (70%)

### V6.0 Context Benefits
- **Plugins handle heavy lifting**: Less context used by Claude
- **Git worktrees**: Clean isolation, no checkpoint files needed
- **Parallel agents**: Reviews happen in plugin, not main context
- **Auto-commits**: No manual commit message generation

### When Context High (>100k)
1. Complete current `/compounding-engineering:work` if in progress
2. User starts new session
3. Continue from GitHub issue (worktree preserved)

### Context Optimization
- **NO MCP servers** except: sequential-thinking, exa (for research)
- Use `gh` CLI instead of GitHub MCP
- Load VEXTRUS-PATTERNS.md sections as needed
- Read files selectively (but completely when you do)

---

## Bangladesh Compliance (YOU apply)

### VAT Rates (National Board of Revenue)
- **Standard**: 15% (construction materials, services)
- **Reduced**: 7.5% (specific categories)
- **Zero-rated**: 0% (exports)
- **Exempt**: No VAT

### TDS/AIT (Tax Deducted at Source)
- **With TIN**: 5%
- **Without TIN**: 7.5%
- **Professionals**: 10%

### Mushak 6.3 (VAT Invoice)
- Auto-generate on invoice approval
- Include: TIN/BIN, VAT breakdown, QR code
- Fiscal Year: July-June (NOT calendar year)

### When Implementing
- Reference: `VEXTRUS-PATTERNS.md` sections 11, 12, 13
- Always validate TIN/BIN format
- Calculate VAT correctly per category
- Include Mushak generation in invoice workflow

---

## Architecture Patterns (YOU follow)

### DDD (Domain-Driven Design)
- **Aggregates**: Small, focused, enforce invariants
- **Value Objects**: Immutable, validated
- **Events**: Past tense, immutable, versioned
- Location: `services/[name]/src/domain/aggregates/`

### Event Sourcing
- **Event Store**: Single source of truth
- **Projections**: Read models, eventually consistent
- **Snapshots**: Performance optimization (every 50 events)

### CQRS (Command Query Responsibility Segregation)
- **Commands**: Write side, validation, business logic
- **Queries**: Read side, optimized for performance
- **Handlers**: Separate command/query handlers

### GraphQL Federation v2
- **Entities**: Use `@key` directive
- **Pagination**: ALWAYS for lists
- **Mutations**: Return payload types
- Location: `services/[name]/src/presentation/graphql/`

**Reference**: `VEXTRUS-PATTERNS.md` for detailed patterns

**Plugin Support**: `/backend-development:architecture-patterns` for implementation

---

## Error Handling (YOU manage)

### When Build Fails
1. Read TypeScript errors
2. Fix issues
3. Re-run `pnpm build`
4. Only proceed when 0 errors

### When Tests Fail
1. Read test failures
2. Understand root cause
3. Fix implementation or tests
4. Re-run `npm test`
5. Only proceed when all passing

### When Review Fails (<7/10)
1. Run `/compounding-engineering:triage`
2. Fix critical/high issues
3. Re-run `/compounding-engineering:review`
4. Only proceed when ≥7/10

### When Plugin Errors
1. Read error message carefully
2. Check if GitHub issue exists (for `/work` command)
3. Verify git worktree state
4. May need manual cleanup: `git worktree remove [path]`
5. Report plugin issues to user if persistent

**NEVER**: Skip quality gates, commit with failures, or ignore reviews

---

## Git Workflow

### With Compounding Engineering (Recommended)
```bash
# Plan
/compounding-engineering:plan "Task description"

# Work (auto-commits, auto-pushes)
/compounding-engineering:work #123

# Review
/compounding-engineering:review

# Triage
/compounding-engineering:triage

# Create PR
/git-pr-workflows:pr-enhance
```

**Benefits**: Automatic commits, proper messages, worktree isolation

---

### Manual Commits (Simple Tasks Only)
```bash
# 1. Quality gates (MUST pass)
pnpm build && npm test

# 2. Stage
git add .

# 3. Commit
git commit -m "feat: [description]

- [Change 1]
- [Change 2]

Quality: kieran-typescript-reviewer __/10
Tests: __/__ passing (__%)
Build: ✅ 0 errors

🤖 Generated with Claude Code (V6.0)
Co-Authored-By: Claude <noreply@anthropic.com>"

# 4. Push
git push
```

---

### GitHub CLI Commands
```bash
# List issues
gh issue list --limit 10

# Create issue manually
gh issue create --title "[title]" --body "[body]"

# Create PR manually
gh pr create --title "[title]" --body "[body]"

# Check Actions
gh run list --limit 3
```

---

## Plugin Decision Matrix

| Scenario | Primary Plugin | Supporting Plugins |
|----------|----------------|-------------------|
| **New backend feature** | `/compounding-engineering:plan`<br>`/compounding-engineering:work` | `/tdd-workflows:tdd-cycle`<br>`/unit-test-generator:generate-tests`<br>`/backend-development:feature-development` |
| **Database migration** | `/database-migrations:sql-migrations` | `/compounding-engineering:review`<br>`/database-design:sql-pro` |
| **Bug fix** | `/compounding-engineering:work` | `/error-debugging:error-detective`<br>`/compounding-engineering:review` |
| **New API endpoint** | `/api-scaffolding:fastapi-pro` | `/api-testing-observability:api-documenter`<br>`/backend-api-security:backend-security-coder` |
| **Performance issue** | `/application-performance:performance-engineer` | `/performance-testing-review:performance-engineer`<br>`/database-design:sql-pro` |
| **Frontend feature** | `/frontend-mobile-development:frontend-developer` | `/compounding-engineering:review`<br>`/application-performance:frontend-developer` |
| **Security audit** | `/comprehensive-review:security-auditor` | `/backend-api-security:backend-security-coder`<br>`/authentication-validator:validate-auth` |
| **Infrastructure** | `/cloud-infrastructure:cloud-architect` | `/cloud-infrastructure:terraform-module-library`<br>`/deployment-pipeline-orchestrator:pipeline-orchestrate` |
| **Documentation** | `/documentation-generation:docs-architect` | `/api-testing-observability:api-documenter` |
| **Full-stack feature** | `/full-stack-orchestration:full-stack-featureold` | `/tdd-workflows:tdd-cycle`<br>`/compounding-engineering:review` |

---

## Success Criteria (YOU validate)

### Every Commit (Manual or Auto)
- ✅ 0 TypeScript errors
- ✅ All tests passing
- ✅ Proper commit message format

### Every Review (Via Plugin)
- ✅ kieran-typescript-reviewer ≥7/10
- ✅ No critical security issues
- ✅ No critical performance issues
- ✅ Architecture patterns followed

### Complex Tasks (Multi-Day)
- ✅ GitHub issue created via `/plan`
- ✅ Implemented via `/work` with git worktree
- ✅ Reviewed via `/review` with ≥7/10 score
- ✅ Triaged via `/triage` with fixes applied
- ✅ PR created via `/pr-enhance`
- ✅ 90%+ test coverage
- ✅ All quality gates passed

---

## Quick Reference

| Need | V6.0 Command | Alternative |
|------|--------------|-------------|
| Plan task | `/compounding-engineering:plan <task>` | Manual TodoWrite |
| Implement | `/compounding-engineering:work <issue>` | Manual implementation |
| Review | `/compounding-engineering:review` | Manual Task tool agents |
| Triage | `/compounding-engineering:triage` | Manual issue fixing |
| TDD | `/tdd-workflows:tdd-cycle` | Manual red-green-refactor |
| Generate tests | `/unit-test-generator:generate-tests` | Manual test writing |
| Create PR | `/git-pr-workflows:pr-enhance` | `gh pr create` |
| Security audit | `/comprehensive-review:security-auditor` | Manual security review |
| Database migration | `/database-migrations:sql-migrations` | Manual migration files |
| TypeScript check | `pnpm build` | N/A |
| Run tests | `npm test` | N/A |
| Explore codebase | Haiku 4.5 Explore agent | `find` + `grep` |

---

## V5.0 → V6.0 Migration

### What Changed
| V5.0 | V6.0 |
|------|------|
| Manual agent invocation via Task tool | `/compounding-engineering:review` (12+ agents in parallel) |
| Manual checkpoint creation | Built into `/compounding-engineering:work` |
| Manual TodoWrite for planning | `/compounding-engineering:plan` generates todos |
| Manual git commits | Auto-commits in `/compounding-engineering:work` |
| Single-threaded execution | Git worktrees enable parallel development |
| Manual slash commands (`.claude/commands/`) | Plugin slash commands (47+ available) |
| "YOU run agent" instructions | "USE plugin command" instructions |

### What Stayed the Same
- ✅ Quality gates (pnpm build, npm test)
- ✅ Bangladesh compliance patterns
- ✅ Architecture patterns (DDD, Event Sourcing, CQRS)
- ✅ VEXTRUS-PATTERNS.md reference
- ✅ Haiku 4.5 for exploration
- ✅ Context management targets
- ✅ Success criteria (9.5/10 quality)

### What's Deprecated
- ❌ `.claude/commands/checkpoint.md` (use `/work` auto-commits)
- ❌ `.claude/commands/review.md` (use `/review` plugin)
- ❌ `.claude/commands/commit.md` (use `/work` or `/git-commit-smart`)
- ❌ Manual agent cards (use plugin agents)
- ❌ Manual checkpoint templates (use git worktree commits)

---

## Common Mistakes (DON'T DO)

❌ Use Task tool for agents when plugin exists
❌ Create manual checkpoints when using `/work`
❌ Skip `/compounding-engineering:review` after implementation
❌ Use plugins for simple file reads (use Read tool)
❌ Ignore plugin errors (investigate and report)
❌ Skip quality gates even with plugins
❌ Commit manually when using `/work` (it auto-commits)
❌ Forget to run `/triage` after `/review`

✅ **DO**: Use plugins for orchestration, manual tools for quick ops, always review, enforce quality

---

## Tools YOU Use

### Primary Tools (V6.0)
1. **Compounding Engineering Plugin**:
   - `/compounding-engineering:plan` - Planning
   - `/compounding-engineering:work` - Execution
   - `/compounding-engineering:review` - Quality
   - `/compounding-engineering:triage` - Findings

2. **Specialized Domain Plugins**: See Plugin Command Matrix above

3. **Manual Tools** (for quick operations):
   - `Read` - Read files completely
   - `Edit` - Modify existing files
   - `Write` - Create new files
   - `Grep`/`Glob` - Search files
   - `Bash` - Git, npm, tests, exploration

4. **Haiku 4.5 Explore Agent**: Codebase research via Bash

---

## Version History

- **V4.0**: Documented but not enforced → FAILED
- **V5.0**: Enforced workflow, manual orchestration → SUCCEEDED but limited
- **V6.0**: Plugin-orchestrated workflow, 30% faster, 50% better quality → CURRENT

---

**V6.0** | **Plugin-Orchestrated** | **Compounding Engineering** | **47+ Commands**

**Context**: ~34k baseline (17%) | Target: <60k (30%) | 12+ Parallel Agent Reviews

**System**: Bangladesh Construction & Real Estate ERP | 18 Microservices | GraphQL Federation v2

**Philosophy**: Each unit of engineering work makes subsequent units easier—not harder

---

## Remember

1. **Plugin-first**: Use Compounding Engineering for all medium/complex tasks
2. **47+ commands available**: Leverage specialized domain plugins
3. **Git worktrees**: Let `/work` handle isolation automatically
4. **Multi-agent reviews**: `/review` runs 12+ agents in parallel
5. **Knowledge compounds**: Each task improves the system
6. **Quality non-negotiable**: Always ≥7/10 on kieran-typescript-reviewer
7. **Manual tools for quick ops**: Read, Grep, Glob for simple tasks

**Your goal**: Deliver 9.5/10 quality code using plugin-orchestrated workflow, 30% faster than V5.0.

---

## Additional Resources

- **Plugin Command Reference**: `.claude/plugin-command-reference.md` (full 47+ commands)
- **V6.0 Workflow Guide**: `.claude/workflows/v6-plugin-orchestration.md` (detailed workflows)
- **Architecture Patterns**: `VEXTRUS-PATTERNS.md` (Bangladesh compliance, DDD, etc.)
- **Plugin Marketplace**: https://github.com/EveryInc/every-marketplace
- **Compounding Engineering Article**: https://every.to/source-code/my-ai-had-already-fixed-the-code-before-i-saw-it
