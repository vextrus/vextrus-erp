# Vextrus ERP - V5.0 Workflow (For Claude)

**Version**: 5.0
**Model**: Sonnet 4.5 (primary), Haiku 4.5 (exploration)
**Context**: <60k (30%) target, ~34k baseline
**System**: Bangladesh Construction & Real Estate ERP (18 microservices)

---

## CRITICAL: This File is FOR YOU (Claude)

**NOT a user reference** - This is YOUR step-by-step instruction manual.
**FOLLOW THESE STEPS** - Do not just inform user, EXECUTE the workflow.
**ENFORCED WORKFLOW** - Every step is mandatory, not optional.

---

## Task Classification (YOU decide)

When user provides a task, YOU MUST classify it first:

### Simple Task (<4 hours, 1-3 files)
**Pattern**: Read → Implement → Commit
**Characteristics**:
- Single file or 2-3 related files
- Clear requirement, no architecture decisions
- Examples: "Add field to aggregate", "Fix bug in resolver", "Update validation"

**YOUR WORKFLOW**:
1. Read relevant files **COMPLETELY** (no partial reads)
2. Implement using VEXTRUS-PATTERNS.md
3. Run quality gates: `pnpm build && npm test`
4. Commit with proper message
5. **NO checkpoint needed**
6. **NO agent reviews needed** (unless user requests)

---

### Medium Task (4-8 hours, 5-15 files)
**Pattern**: Plan → Implement → Review → Commit
**Characteristics**:
- Multiple files across layers (domain → application → presentation)
- Some architectural decisions
- Examples: "Add new feature to service", "Implement CRUD for entity"

**YOUR WORKFLOW**:
1. **PLAN MODE**: Create implementation plan with TodoWrite (8-12 tasks)
2. Read identified files **COMPLETELY**
3. Implement systematically (domain → application → presentation)
4. **MANDATORY**: Run `kieran-typescript-reviewer` agent on changed files
5. Create **enforced checkpoint** (use template `.claude/templates/checkpoint-template.md`)
6. Run quality gates: `pnpm build && npm test`
7. Commit with comprehensive message
8. **Optional**: Create GitHub issue if user wants tracking

---

### Complex Task (2-5 days, 15+ files)
**Pattern**: RESEARCH → PLAN → EXECUTE → REVIEW → CHECKPOINT
**Characteristics**:
- Multi-day implementation
- Cross-service changes
- New aggregates/services
- Examples: "Production-ready finance module", "Invoice-payment linking"

**YOUR WORKFLOW**:
1. **DAY 0**: Research & Planning
   - Explore codebase (use Haiku 4.5 via Bash: `explore services/[name]`)
   - Read architecture files
   - Create comprehensive plan with TodoWrite (15-25 tasks)
   - Create `checkpoint-day0-plan.md` **using enforced template**

2. **DAY 1-N**: Implementation
   - Execute systematically per plan
   - **DAILY CHECKPOINTS** using enforced template
   - **MANDATORY REVIEWS** at each checkpoint:
     - kieran-typescript-reviewer (always)
     - security-sentinel (if auth/RBAC)
     - performance-oracle (if optimization)
   - Quality gates every day: `pnpm build && npm test`

3. **FINAL DAY**: Wrap-up
   - Create `checkpoint-final-complete.md`
   - Run ALL quality reviews
   - Create comprehensive commit
   - **Optional**: Create PR via `gh` CLI

**CRITICAL**: Complex tasks MUST have GitHub issue. If none exists, ASK USER to create one first.

---

## When User Says... (YOUR Action Table)

| User Says | YOU MUST DO |
|-----------|-------------|
| "Create checkpoint" | 1. Read `.claude/templates/checkpoint-template.md`<br>2. Fill ALL sections (no TODO/TBD)<br>3. RUN mandatory quality reviews<br>4. Save as `checkpoints/checkpoint-[name].md`<br>5. Run: `pnpm build && npm test`<br>6. Guide user through commit steps |
| "Review code" | 1. Ask which files<br>2. Invoke: "I'm running kieran-typescript-reviewer agent on [files]"<br>3. Use Task tool with subagent_type=kieran-typescript-reviewer<br>4. Report results with score |
| "Commit changes" | 1. Verify quality gates passed<br>2. `git add .`<br>3. `git commit -m "[message]"`<br>4. `git push`<br>5. Run: `gh run list --limit 3` to verify Actions |
| "Explore [service]" | 1. `cd services/[service]`<br>2. `find . -type f -name "*.ts" \| head -20`<br>3. Identify key files<br>4. Read **COMPLETELY** (no partial) |
| "Find where..." | 1. Use Grep: `grep -r "[pattern]" services/`<br>2. Report findings<br>3. Offer to read relevant files |

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

---

## Agent Reviews (YOU invoke)

### When to Invoke Agents

**ALWAYS (Medium+ tasks)**:
- `kieran-typescript-reviewer`: Code quality review
  - Invoke: Use Task tool with subagent_type=compounding-engineering:kieran-typescript-reviewer
  - Files: Changed files only
  - Report: Score out of 10, issues found

**IF Applicable**:
- `security-sentinel`: Auth, RBAC, sensitive data changes
- `performance-oracle`: Caching, optimization, query changes
- `data-integrity-guardian`: Database migrations, schema changes

### How to Invoke

```markdown
I'm running [agent-name] agent to review [files/scope].

[Use Task tool with appropriate subagent_type]

[After completion, report results]
```

**DO NOT**:
- Say "you should run agent" (YOU run it)
- Skip reviews because "user didn't ask" (workflow requires it)
- Create checkpoint without reviews

---

## Checkpoint Creation (YOU execute)

### When to Create

- **Complex tasks**: Daily (end of day or major milestone)
- **Medium tasks**: After implementation complete
- **Simple tasks**: Never (just commit)

### How to Create

1. Read template: `.claude/templates/checkpoint-template.md`
2. Fill EVERY section:
   - Executive Summary
   - MANDATORY QUALITY REVIEWS (run agents NOW)
   - Objectives Completed
   - Files Changed (with line counts)
   - Quality Gates Status (run NOW)
   - Implementation Details
   - Tests
   - Next Steps
   - Blockers & Risks
   - Commit Workflow (guide user)

3. **NO TODO/TBD allowed** - Fill with actual data
4. Save as: `.claude/checkpoints/checkpoint-[name].md`
5. Inform user: "Checkpoint created at checkpoints/checkpoint-[name].md"

---

## Commit Workflow (YOU guide user)

After creating checkpoint or completing task:

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

[Checkpoint: checkpoint-[name].md if applicable]

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# 4. Push
git push

# 5. Verify (if GitHub Actions should run)
gh run list --limit 3
```

**YOUR ROLE**: Provide exact commands, then confirm "Ready to commit? I've prepared the commands above."

---

## Tools YOU Use

### File Operations
- **Read**: ALWAYS read files completely (no partial)
- **Edit**: For modifying existing files
- **Write**: For new files only
- **Glob**: Finding files by pattern

### Code Execution
- **Bash**: For git, npm, tests, exploration
  - `pnpm build` - TypeScript check
  - `npm test` - Run tests
  - `git` commands - Version control
  - `gh` commands - GitHub CLI (instead of MCP)
  - `find`, `grep` - File search

### Agents (via Task tool)
- kieran-typescript-reviewer
- security-sentinel
- performance-oracle
- data-integrity-guardian
- (See `.claude/agents/AGENT-DIRECTORY.md` for all 33)

---

## Context Management

### Current Status
- **Baseline**: ~34k (17%)
- **Target**: <60k (30%)
- **Warning**: >100k (50%)
- **Critical**: >140k (70%)

### When Context High (>100k)
1. Create emergency checkpoint NOW
2. Guide user: "Context high, creating checkpoint for session continuity"
3. New session: "Continue from checkpoint-[name].md"

### Context Optimization
- **NO MCP servers** (except sequential-thinking if needed)
- Use `gh` CLI instead of GitHub MCP
- Load VEXTRUS-PATTERNS.md sections as needed (not entire file)
- Read files selectively (but completely when you do read)

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

### When Agent Review Fails (<7/10)
1. Read agent feedback
2. Fix critical issues
3. Re-run agent review
4. Only create checkpoint when ≥7/10

**NEVER**: Skip quality gates, commit with failures, or create incomplete checkpoints

---

## Git Workflow (YOU execute via Bash)

### Commit Messages
**Format**:
```
<type>: <subject>

<body>

Quality: kieran-typescript-reviewer __/10
Tests: __/__ passing
Build: ✅ 0 errors

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types**: feat, fix, refactor, test, docs, chore

### GitHub CLI (instead of MCP)
```bash
# List issues
gh issue list --limit 10

# Create issue
gh issue create --title "[title]" --body "[body]"

# Create PR
gh pr create --title "[title]" --body "[body]"

# Check Actions
gh run list --limit 3
```

---

## Success Criteria (YOU validate)

### Every Commit
- ✅ 0 TypeScript errors
- ✅ All tests passing
- ✅ Proper commit message

### Every Checkpoint (Medium+)
- ✅ kieran-typescript-reviewer ≥7/10
- ✅ All template sections filled
- ✅ No TODO/TBD
- ✅ Quality gates passed

### Complex Tasks
- ✅ Daily checkpoints
- ✅ GitHub issue linked
- ✅ Multiple agent reviews
- ✅ 90%+ test coverage

---

## Quick Reference

| Need | Command | Tool |
|------|---------|------|
| TypeScript check | `pnpm build` | Bash |
| Run tests | `npm test` | Bash |
| Code review | Run kieran-typescript-reviewer agent | Task |
| Find files | `grep -r "[pattern]" services/` | Bash/Grep |
| Create commit | `git add . && git commit && git push` | Bash |
| GitHub issue | `gh issue create` | Bash |
| Explore | `find services/[name] -name "*.ts"` | Bash |

---

## Common Mistakes (DON'T DO)

❌ Create checkpoint without reviews
❌ Skip quality gates ("user didn't ask")
❌ Commit with TypeScript errors
❌ Leave TODO/TBD in checkpoints
❌ Use partial file reads for implementation
❌ Say "you should run agent" instead of running it
❌ Enable GitHub MCP (use `gh` CLI instead)
❌ Create medium/complex tasks without plan

✅ **DO**: Follow workflow, run reviews, enforce quality, execute steps

---

## Version History

- **V4.0**: Documented but not enforced → FAILED
- **V5.0**: Enforced workflow, YOU execute steps → CURRENT

---

**V5.0** | **Enforced Workflow** | **For Claude, Not User** | **Quality First**

**Context**: ~34k baseline (17%) | Target: <60k (30%) | 33 Agents Available

**System**: Bangladesh Construction & Real Estate ERP | 18 Microservices | GraphQL Federation v2

---

## Remember

1. **YOU execute**, don't just inform
2. **Enforce quality gates**, don't skip
3. **Run agents**, don't suggest
4. **Fill checkpoints completely**, no TODO
5. **Classify tasks**, apply right workflow

**Your goal**: Deliver 9.5/10 quality code following this workflow exactly.
