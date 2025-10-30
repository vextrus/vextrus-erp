# Verification Gate System

**Purpose**: Enforce workflow compliance through blocking questions

**Problem Solved**: V7.0 had 0% plugin/agent usage because nothing enforced usage

**Solution**: Mandatory verification questions with blocking gates

---

## Architecture

### Gate Types

1. **Classification Gates**: Prevent tier self-selection
2. **Phase Gates**: Verify mandatory actions completed
3. **Quality Gates**: Ensure standards met before proceeding
4. **Context Gates**: Enforce context monitoring

---

## Classification Gates (Tier Selection)

### Problem
V7.0 allowed Claude to self-select tier:
- "This is a simple task" → Chose Tier 1 → Skipped all agents

### Solution
User provides task → Claude MUST answer classification questions → Blocking

### Gate Flow

```
USER_REQUEST_RECEIVED
  ↓
BLOCKING QUESTION 1: "How many files will be modified?"
  ├─ 1-3 files → Continue to Q2
  ├─ 4-15 files → Continue to Q2
  └─ 15+ files → Continue to Q2
  ↓
BLOCKING QUESTION 2: "Is this cross-service integration?"
  ├─ YES → TIER 3 (Complex)
  └─ NO → Continue to Q3
  ↓
BLOCKING QUESTION 3: "Estimated implementation time?"
  ├─ <2 hours → TIER 1 (Simple)
  ├─ 2-8 hours → TIER 2 (Medium)
  └─ 2-5 days → TIER 3 (Complex)
  ↓
TIER_ASSIGNED (cannot be changed)
  ↓
Execute tier-specific workflow
```

### Implementation

After user provides task:

```markdown
CLASSIFICATION REQUIRED

I need to classify this task to determine the correct workflow.

QUESTION 1: How many files will be modified? [1-3 / 4-15 / 15+]
(Auto-detect from task description if obvious)

QUESTION 2: Is this cross-service integration? [YES / NO]
(Auto-detect if "multiple services" mentioned)

QUESTION 3: Estimated implementation time? [<2h / 2-8h / 2-5d]
(Based on complexity assessment)

CLASSIFICATION RESULT:
- Files: [answer]
- Cross-service: [answer]
- Time: [answer]
→ TIER: [1: Simple / 2: Medium / 3: Complex]

This tier is LOCKED and cannot be changed.
Proceeding with Tier [X] workflow...
```

---

## Phase Gates (Mandatory Actions)

### Problem
V7.0 suggested "use Plan subagent" but didn't enforce it
Result: 0% agent usage

### Solution
After each phase, MUST answer verification questions

---

### Tier 2/3: Phase 1 (Plan) Gate

**After claiming to complete Plan phase:**

```markdown
PHASE 1 VERIFICATION

QUESTION 1: Did you launch Plan subagent? [YES / NO]
(Check your tool usage - did you call Task with subagent_type="Plan"?)

→ Answer: [YES / NO]

IF NO:
  BLOCKING: Cannot proceed to Phase 2.
  You MUST launch Plan subagent for Tier 2/3 tasks.

  Required action:
  1. Launch Task tool with subagent_type="Plan"
  2. Provide task requirements
  3. Receive and review plan
  4. THEN return to this gate

IF YES:
  QUESTION 2: Did you receive a structured plan? [YES / NO]

  IF NO:
    BLOCKING: Plan subagent must return structured plan.

  IF YES:
    ✓ Phase 1 Gate PASSED
    Proceeding to Phase 2...
```

---

### Tier 2/3: Phase 2 (Explore) Gate

**After claiming to complete Explore phase:**

```markdown
PHASE 2 VERIFICATION

QUESTION 1: Did you launch Explore subagent? [YES / NO]
(Check your tool usage - did you call Task with subagent_type="Explore"?)

→ Answer: [YES / NO]

IF NO:
  BLOCKING: Cannot proceed to Phase 3.
  You MUST launch Explore subagent for Tier 2/3 tasks.

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
  QUESTION 2: Did you receive context summary? [YES / NO]

  IF NO:
    BLOCKING: Explore subagent must return context summary.

  IF YES:
    ✓ Phase 2 Gate PASSED
    Proceeding to Phase 3...
```

---

### Tier 2/3: Phase 3 (Design) Gate

**After claiming to complete Design phase:**

```markdown
PHASE 3 VERIFICATION

QUESTION 1: Did you use at least one specialized plugin? [YES / NO]

Tier 2 RECOMMENDED plugins (select ≥1):
- /backend-development:feature-development
- /database-migrations:sql-migrations
- /api-scaffolding:graphql-architect
- /tdd-workflows:tdd-cycle

→ Answer: [YES / NO]

IF NO:
  WARNING: Tier 2 tasks typically require specialized plugins.

  QUESTION: Are you certain this can be done without plugins? [YES / NO]

  IF NO:
    BLOCKING: Select and use appropriate plugin.

  IF YES:
    Justify why plugins not needed: [explanation]

    IF VALID:
      ⚠️  Phase 3 Gate PASSED (with warning)
      Proceeding to Phase 4...

    IF INVALID:
      BLOCKING: Justification insufficient. Use plugin.

IF YES:
  QUESTION 2: Which plugin(s) did you use? [list]

  QUESTION 3: Did you receive design output? [YES / NO]

  IF NO:
    BLOCKING: Plugin must provide design output.

  IF YES:
    ✓ Phase 3 Gate PASSED
    Proceeding to Phase 4...
```

---

### All Tiers: Implementation Gate

**After claiming implementation complete:**

```markdown
IMPLEMENTATION VERIFICATION

QUESTION 1: Did you write tests? [YES / NO]

→ Answer: [YES / NO]

IF NO:
  BLOCKING: Tests are MANDATORY.

  Required:
  - Tier 1: Basic tests
  - Tier 2: Unit + Integration (90%+ coverage target)
  - Tier 3: Unit + Integration + E2E (90%+ coverage)

IF YES:
  QUESTION 2: Did you run quality gates? [YES / NO]

  Required gates:
  - pnpm build (0 TypeScript errors)
  - npm test (all tests passing)

  IF NO:
    BLOCKING: Run quality gates now.

    Action:
    1. Run: pnpm build
    2. Run: npm test
    3. Both MUST pass
    4. THEN return to this gate

  IF YES:
    QUESTION 3: Did both gates pass? [YES / NO]

    IF NO:
      BLOCKING: Fix errors/failures first.

      You MUST fix:
      - All TypeScript errors (pnpm build)
      - All test failures (npm test)

      NEVER commit with errors or failures.

    IF YES:
      ✓ Implementation Gate PASSED
      Proceeding to Review phase...
```

---

### All Tiers: Review Gate

**After review phase:**

```markdown
REVIEW VERIFICATION

QUESTION 1: Did you run comprehensive review? [YES / NO]

Required for:
- Tier 2: /comprehensive-review:full-review
- Tier 3: /comprehensive-review:full-review

→ Answer: [YES / NO]

IF NO:
  BLOCKING: Comprehensive review MANDATORY for Tier 2/3.

  Action:
  1. Run: /comprehensive-review:full-review
  2. Receive review score
  3. THEN return to this gate

IF YES:
  QUESTION 2: What was the review score? [X/10]

  → Score: [X]/10

  IF <8.0:
    BLOCKING: Review score must be ≥8/10.

    Action:
    1. Read review feedback
    2. Fix critical/high issues
    3. Re-run review
    4. THEN return to this gate

  IF ≥8.0:
    QUESTION 3: Did you run security scan? [YES / NO]

    Required: /backend-api-security:backend-security-coder

    IF NO:
      BLOCKING: Security scan MANDATORY.

    IF YES:
      QUESTION 4: Critical/high vulnerabilities? [count]

      IF >0:
        BLOCKING: Fix critical/high vulnerabilities.

      IF 0:
        ✓ Review Gate PASSED
        Proceeding to Finalize phase...
```

---

## Quality Gates (Standards Enforcement)

### Build Gate (Before Every Commit)

```markdown
BUILD GATE

Before committing:

QUESTION: Did pnpm build pass with 0 errors? [YES / NO]

IF NO:
  BLOCKING: Cannot commit with TypeScript errors.

  Action:
  1. Run: pnpm build
  2. Read error messages
  3. Fix all errors
  4. Re-run: pnpm build
  5. Verify: 0 errors
  6. THEN return to gate

IF YES:
  ✓ Build Gate PASSED
  Proceeding to Test Gate...
```

---

### Test Gate (Before Every Commit)

```markdown
TEST GATE

Before committing:

QUESTION: Did npm test pass with all tests passing? [YES / NO]

IF NO:
  BLOCKING: Cannot commit with failing tests.

  Action:
  1. Run: npm test
  2. Read failure messages
  3. Fix all failures
  4. Re-run: npm test
  5. Verify: all passing
  6. THEN return to gate

IF YES:
  ✓ Test Gate PASSED
  Proceeding to Commit...
```

---

## Context Gates (Monitoring Enforcement)

### After Every Phase

```markdown
CONTEXT GATE

After completing phase:

QUESTION 1: Did you run /context command? [YES / NO]

IF NO:
  BLOCKING: Context monitoring MANDATORY after every phase.

  Action:
  1. Run: /context
  2. Note token count
  3. THEN return to gate

IF YES:
  QUESTION 2: Current context tokens? [number]

  → Tokens: [X]k ([Y]%)

  Evaluate:
  - <100k (50%): GREEN → Continue
  - 100-120k (50-60%): YELLOW → Warning logged?
  - 120-140k (60-70%): ORANGE → Checkpoint created?
  - ≥140k (70%+): RED → BLOCKING

  IF RED:
    BLOCKING: New session required.

    Action:
    1. Create emergency checkpoint
    2. Commit all work
    3. STOP - cannot continue

  IF ORANGE:
    QUESTION 3: Did you create checkpoint? [YES / NO]

    IF NO:
      BLOCKING: Checkpoint MANDATORY at ORANGE.

    IF YES:
      ✓ Context Gate PASSED
      Proceeding...

  IF GREEN/YELLOW:
    ✓ Context Gate PASSED
    Proceeding...
```

---

## Gate Bypass (Emergency Only)

**NEVER bypass gates** except in these scenarios:

1. **User Override**: User explicitly says "skip [gate]"
   - Log warning
   - Document bypass reason
   - Proceed with caution

2. **Technical Impossibility**: Gate cannot be satisfied due to external factors
   - Example: Plugin unavailable
   - Document issue
   - Use fallback approach

**All other scenarios**: Gates are BLOCKING

---

## Implementation in Code

Gates are implemented as:

1. **Verification Questions**: Explicit questions Claude must answer
2. **Conditional Logic**: IF/THEN logic based on answers
3. **BLOCKING statements**: Stop progression if requirements not met
4. **Required Actions**: Specific steps to satisfy gate

---

## Testing Gates

To validate verification gates:

1. **Tier Selection Test**:
   - Provide medium task
   - Verify classification questions asked
   - Verify tier locked

2. **Phase Gate Test** (Tier 2):
   - Attempt to skip Plan subagent
   - Verify BLOCKING works
   - Verify gate requires launch

3. **Quality Gate Test**:
   - Attempt commit with errors
   - Verify BLOCKING works
   - Verify must fix before commit

4. **Context Gate Test**:
   - Complete phase without /context
   - Verify BLOCKING works
   - Verify must run /context

---

## Success Metrics

| Gate Type | Compliance Target |
|-----------|------------------|
| Classification | 100% (no self-selection) |
| Phase Gates | 100% (no skipping agents) |
| Quality Gates | 100% (no errors committed) |
| Context Gates | 100% (monitoring after every phase) |

---

**Version**: V8.0
**Status**: Production
**Last Updated**: 2025-10-31
