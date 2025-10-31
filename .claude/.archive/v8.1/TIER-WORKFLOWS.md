# Tier-Based Workflow Details

**Purpose**: Detailed phase-by-phase workflows for each tier (1: Simple, 2: Medium, 3: Complex)

**Quick Reference**:
- **TIER 1**: 1-3 files, <2h, single service → 4 phases
- **TIER 2**: 4-15 files, 2-8h, single service OR moderate complexity → 6 phases (Plan + Explore MANDATORY)
- **TIER 3**: 15+ files, 2-5d, cross-service OR high complexity → Multi-day (Plan + Explore MANDATORY)

---

## TIER 1: Simple Task (1-3 files, <2h)

**When**: Bug fixes, config changes, small enhancements

### Phase 1: READ
- **Actions**:
  - Read affected files (Read tool)
  - Understand current implementation
  - Identify change scope
- **Context check**: MANDATORY (ask user to run /context)
- **TODO update**: MANDATORY (update + commit .claude/todo/current.md)

### Phase 2: IMPLEMENT
- **Actions**:
  - Write code
  - Follow existing patterns
  - Keep changes minimal and focused
- **Context check**: MANDATORY (ask user to run /context)
- **TODO update**: MANDATORY (update + commit .claude/todo/current.md)

### Phase 3: VALIDATE
- **Actions**:
  - Run `pnpm build` (MUST show 0 errors)
  - Run `npm test` (MUST show all passing)
  - Fix any failures before proceeding
- **BLOCKING**: Cannot proceed if failures exist
- **Context check**: MANDATORY (ask user to run /context)
- **TODO update**: MANDATORY (update + commit .claude/todo/current.md)

### Phase 4: COMMIT
- **Prerequisites**:
  - Quality gates passed (build + tests green)
  - Changes reviewed
- **Actions**:
  - `git add .`
  - `git commit -m "..." --include-coauthors`
  - `git push`
- **Context check**: MANDATORY (ask user to run /context)
- **TODO update**: MANDATORY (update + commit .claude/todo/current.md)

**Total**: <2h, <20k context

---

## TIER 2: Medium Task (4-15 files, 2-8h)

**When**: New features, API endpoints, service enhancements

### Phase 1: PLAN (MANDATORY - BLOCKING)
- **MUST**: Launch Plan subagent
  ```
  Task tool with subagent_type="Plan"
  ```
- **MUST**: Receive structured plan
- **VERIFICATION**:
  ```
  Q: "Did you launch Plan subagent? [YES/NO]"
  IF NO → BLOCKING: "Must launch Plan subagent. Cannot proceed."
  ```
- **Context check**: MANDATORY (ask user to run /context)
- **TODO update**: MANDATORY (update + commit .claude/todo/current.md)

### Phase 2: EXPLORE (MANDATORY - BLOCKING)
- **MUST**: Launch Explore subagent
  ```
  Task tool with subagent_type="Explore"
  ```
- **MUST**: Receive context summary
- **BENEFIT**: 0 main context cost (separate 200k window)
- **VERIFICATION**:
  ```
  Q: "Did you launch Explore subagent? [YES/NO]"
  IF NO → BLOCKING: "Must launch Explore subagent. Cannot proceed."
  ```
- **Context check**: MANDATORY (ask user to run /context)
- **TODO update**: MANDATORY (update + commit .claude/todo/current.md)

### Phase 3: DESIGN (RECOMMENDED plugins)
- **RECOMMENDED**: Select ≥1 plugin:
  - `/backend-development:feature-development`
  - `/database-migrations:sql-migrations`
  - `/api-scaffolding:graphql-architect`
  - `/tdd-workflows:tdd-cycle`
- **If no plugin**: MUST justify why
- **Context check**: MANDATORY (ask user to run /context)
- **TODO update**: MANDATORY (update + commit .claude/todo/current.md)

### Phase 4: IMPLEMENT
- **Strategy**: Domain → Application → Presentation layers
- **MUST**: Write tests (unit + integration)
- **MUST**: Micro-commit after each sub-phase
- **Quality gates after EACH sub-phase** (MANDATORY):
  - `pnpm build` (0 errors)
  - `npm test` (all passing)
- **Context check**: MANDATORY (ask user to run /context)
- **TODO update**: MANDATORY (update + commit .claude/todo/current.md)

### Phase 5: REVIEW (MANDATORY - BLOCKING)
- **MUST**: `/comprehensive-review:full-review`
- **MUST**: Score ≥8/10
- **MUST**: `/backend-api-security:backend-security-coder`
- **MUST**: 0 critical, 0 high vulnerabilities
- **VERIFICATION**:
  ```
  Q: "Review score ≥8/10? [YES/NO]"
  IF NO → BLOCKING: "Fix issues and re-review"
  ```
- **Context check**: MANDATORY (ask user to run /context)
- **TODO update**: MANDATORY (update + commit .claude/todo/current.md)

### Phase 6: FINALIZE
- **Prerequisites**: Final quality gates pass
- **Actions**:
  - `git commit && git push`
  - OPTIONAL: `/git-pr-workflows:pr-enhance`
- **Context check**: MANDATORY (ask user to run /context)
- **TODO update**: MANDATORY (update + commit .claude/todo/current.md)

**Total**: 4-8h, <80k context

---

## TIER 3: Complex Task (15+ files, 2-5 days)

**When**: Cross-service features, new microservices, distributed systems

### DAY 0: RESEARCH (4 hours)

#### Phase 1.1: EXPLORATION (MANDATORY - BLOCKING)
- **MUST**: Launch Explore subagent (all related services)
- **MUST**: Map dependencies
- **Context check**: MANDATORY
- **TODO update**: MANDATORY

#### Phase 1.2: PLANNING (MANDATORY - BLOCKING)
- **MUST**: Launch Plan subagent (comprehensive plan)
- **MUST**: Break into daily phases
- **Context check**: MANDATORY
- **TODO update**: MANDATORY

#### Phase 1.3: DESIGN (MANDATORY plugins)
- **MUST**: Select ≥1 specialized plugin
- **Context check**: MANDATORY
- **TODO update**: MANDATORY

#### Phase 1.4: REVIEW PLAN
- **MUST**: Review with stakeholders if needed
- **Context check**: MANDATORY
- **TODO update**: MANDATORY
- **CHECKPOINT**: End of Day 0

### DAY 1-N: IMPLEMENTATION (Iterative)

#### Morning Session
- **MUST**: Review previous day checkpoint
- **MUST**: Implement feature slice
- **MUST**: Quality gates after each slice
- **Context check after EACH slice**: MANDATORY
- **TODO update after EACH slice**: MANDATORY

#### Afternoon Session
- **MUST**: Continue implementation
- **MUST**: End-of-day checkpoint
- **Context check**: MANDATORY
- **TODO update**: MANDATORY

### FINAL DAY: QUALITY (4 hours)
- **MUST**: `/comprehensive-review:full-review` (score ≥8/10)
- **MUST**: `/backend-api-security:backend-security-coder` (0 critical)
- **MUST**: `/application-performance:performance-engineer`
- **MUST**: Documentation updated
- **MUST**: `git commit && git push`
- **MUST**: `/git-pr-workflows:pr-enhance`
- **Context check**: MANDATORY
- **TODO update**: MANDATORY

**Total**: 2-5 days, <100k context per session

---

## Verification Checklist Templates

### After EVERY Phase (All Tiers)
```
[ ] Asked user to run /context command?
[ ] Received user's context report?
[ ] Context status: GREEN/YELLOW/ORANGE/RED?
[ ] If ORANGE: Created checkpoint?
[ ] If RED: Created emergency checkpoint and stopped?
[ ] Updated .claude/todo/current.md?
[ ] Committed TODO update to git?
```

### Before EVERY Commit (All Tiers)
```
[ ] pnpm build passed (0 errors)?
[ ] npm test passed (all passing)?
[ ] No TypeScript errors?
[ ] No failing tests?
```

### Tier 2/3 Only
```
[ ] Launched Plan subagent?
[ ] Launched Explore subagent?
[ ] Used ≥1 specialized plugin (or justified)?
[ ] Review score ≥8/10?
[ ] Security scan: 0 critical, 0 high?
```

---

## Phase Gate Examples

### Tier 2 - Phase 1 (Plan) Gate
```
PHASE 1 VERIFICATION

Q1: Did you launch Plan subagent? [YES / NO]
→ Answer: [YES / NO]

IF NO:
  BLOCKING: Cannot proceed to Phase 2.
  Required action:
  1. Launch Task tool with subagent_type="Plan"
  2. Provide task requirements
  3. Receive and review plan
  4. THEN return to this gate

IF YES:
  Q2: Did you receive a structured plan? [YES / NO]

  IF NO:
    BLOCKING: Plan subagent must return structured plan.

  IF YES:
    ✓ Phase 1 Gate PASSED
    Proceeding to Phase 2...
```

### Tier 2 - Phase 2 (Explore) Gate
```
PHASE 2 VERIFICATION

Q1: Did you launch Explore subagent? [YES / NO]
→ Answer: [YES / NO]

IF NO:
  BLOCKING: Cannot proceed to Phase 3.
  Benefits reminder:
  - 0 main context cost (separate 200k window)
  - 2x faster (Haiku 4.5)
  - Comprehensive codebase analysis

  Required action:
  1. Launch Task tool with subagent_type="Explore"
  2. Specify what to explore
  3. Receive context summary
  4. THEN return to this gate

IF YES:
  Q2: Did you receive context summary? [YES / NO]

  IF NO:
    BLOCKING: Explore subagent must return context summary.

  IF YES:
    ✓ Phase 2 Gate PASSED
    Proceeding to Phase 3...
```

---

## Context Management During Workflows

### Monitor at These Points
1. After EVERY phase completion (MANDATORY)
2. Before launching subagents (Plan/Explore)
3. After receiving large tool results (>10k tokens)
4. End of each work session

### Take Action Based on Status

**GREEN (<120k / 60%)**:
- Continue normal workflow
- Standard logging to context-log.md

**YELLOW (120-140k / 60-70%)**:
- Log warning to context-log.md
- Consider optimization:
  - Disable unused MCP servers
  - Avoid large file reads
  - Use Explore subagent for analysis

**ORANGE (140-160k / 70-80%)**:
- **MANDATORY**: Create checkpoint immediately
- Update .claude/todo/current.md
- Commit all changes
- Log to context-log.md
- **Can continue** after checkpoint

**RED (≥160k / 80%+)**:
- **BLOCKING**: Stop all work immediately
- Create emergency checkpoint
- Update .claude/todo/current.md
- Commit all changes
- **DO NOT continue** - session MUST end
- User must start new session

---

## Recovery Procedures

### If TODO Lost from Context
1. Read `.claude/todo/current.md` from git
2. Resume from last completed phase
3. Check `.claude/checkpoints/` for details

### If Context Reaches RED
1. **Immediate**: Emergency checkpoint + commit
2. **End session**: User starts new session
3. **Resume**:
   ```bash
   # In new session
   Read .claude/todo/current.md
   Read .claude/checkpoints/[latest-emergency].md
   Resume from [last-completed-phase]
   ```
4. **Investigate**: Why did context explode?
   - Review context-log.md
   - Identify spike source
   - Adjust workflow to prevent recurrence

---

**Version**: V8.1
**Status**: Production
**Last Updated**: 2025-10-31
