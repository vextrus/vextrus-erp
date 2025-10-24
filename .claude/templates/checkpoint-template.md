# Checkpoint: [Name/Phase]

**Date**: [YYYY-MM-DD]
**Time**: [HH:MM]
**Branch**: `[branch-name]`
**GitHub Issue**: [#number](link) or N/A
**Session**: [number] (if continuing from previous checkpoint)

---

## Executive Summary

[2-3 sentences: What was accomplished, current state, what's next]

---

## MANDATORY QUALITY REVIEWS ✅

**CRITICAL**: All checkpoints MUST include quality reviews. Do not mark tasks complete without reviews.

### Primary Review (ALWAYS REQUIRED)
- [ ] **kieran-typescript-reviewer**
  - **Score**: __/10
  - **Files Reviewed**: [list]
  - **Critical Issues**: [list or "None"]
  - **Recommendations**: [list or "None"]
  - **Status**: ✅ PASSED / ⚠️ NEEDS FIXES / ❌ FAILED

### Additional Reviews (If Applicable)
- [ ] **security-sentinel** (if auth/RBAC/sensitive data)
  - **Score**: __/10
  - **Vulnerabilities**: [list or "None"]
  - **Status**: ✅ PASSED / ⚠️ NEEDS FIXES / ❌ FAILED

- [ ] **performance-oracle** (if caching/optimization/queries)
  - **Metrics**: [response time, query performance, etc.]
  - **Bottlenecks**: [list or "None"]
  - **Status**: ✅ PASSED / ⚠️ NEEDS OPTIMIZATION / ❌ FAILED

- [ ] **data-integrity-guardian** (if migrations/schema changes)
  - **Migration Safety**: ✅ SAFE / ⚠️ REVIEW / ❌ UNSAFE
  - **Data Validation**: [results]
  - **Status**: ✅ PASSED / ⚠️ NEEDS FIXES / ❌ FAILED

### Review Summary
**Overall Quality Score**: __/10 (average of all reviews)
**Deployment Ready**: ✅ YES / ⚠️ NEEDS FIXES / ❌ NO

---

## Objectives Completed

### Original Goals
- [ ] [Goal 1]
- [ ] [Goal 2]
- [ ] [Goal 3]

### Actual Completion
- ✅ [What was completed]
- ⚠️ [What needs more work]
- ❌ [What was blocked/deferred]

---

## Files Changed

**Total**: __ files, __ lines added, __ lines deleted

### Modified Files
1. **`path/to/file1.ts`** (__ lines)
   - [Brief description of changes]

2. **`path/to/file2.ts`** (__ lines)
   - [Brief description of changes]

### New Files
1. **`path/to/new-file.ts`** (__ lines)
   - [Purpose]

### Deleted Files
1. **`path/to/deleted-file.ts`**
   - [Reason for deletion]

---

## Quality Gates Status

### Build & Type Check
```bash
$ pnpm build
```
- **Status**: ✅ PASSED / ❌ FAILED
- **TypeScript Errors**: __ errors
- **Details**: [Error descriptions if any]

### Tests
```bash
$ npm test
```
- **Status**: ✅ PASSED / ❌ FAILED
- **Tests Passing**: __/__ (__%)
- **Coverage**: __%
- **Failed Tests**: [List if any]

### Linting
```bash
$ pnpm lint
```
- **Status**: ✅ PASSED / ⚠️ WARNINGS / ❌ FAILED
- **Issues**: [List if any]

---

## Implementation Details

### Architecture Decisions
- [Key architectural choice 1]
- [Key architectural choice 2]

### Patterns Used
- **DDD**: [Aggregates, Value Objects, etc.]
- **Event Sourcing**: [Events, Event Handlers]
- **CQRS**: [Commands, Queries]
- **GraphQL Federation**: [Entities, Resolvers]
- **Bangladesh Compliance**: [VAT, TDS, Mushak, etc.]

### Technical Highlights
- [Noteworthy implementation detail 1]
- [Noteworthy implementation detail 2]

---

## Tests

### Unit Tests
- **Location**: `path/to/tests/`
- **Count**: __ tests
- **Coverage**: __%
- **Key Tests**: [List 3-5 most important tests]

### Integration Tests
- **Location**: `path/to/integration-tests/`
- **Count**: __ tests
- **Scenarios**: [List scenarios covered]

### E2E Tests
- **Location**: `path/to/e2e-tests/`
- **Count**: __ tests
- **Flows**: [List flows tested]

---

## Next Steps

### Immediate (Next Session)
1. [Specific task with file/function names]
2. [Specific task with file/function names]
3. [Specific task with file/function names]

### Short Term (This Phase)
- [ ] [Task]
- [ ] [Task]
- [ ] [Task]

### Long Term (Future Phases)
- [ ] [Task]
- [ ] [Task]

---

## Blockers & Risks

### Current Blockers
- ❌ **BLOCKER**: [Description]
  - **Impact**: [High/Medium/Low]
  - **Mitigation**: [Plan]

### Risks
- ⚠️ **RISK**: [Description]
  - **Probability**: [High/Medium/Low]
  - **Impact**: [High/Medium/Low]
  - **Mitigation**: [Plan]

### None
- ✅ No blockers or risks

---

## Context & Notes

### Dependencies
- [Service/Module dependency 1]
- [Service/Module dependency 2]

### Technical Debt
- [Tech debt item if created]

### Learnings
- [Key learning 1]
- [Key learning 2]

### References
- [Link to related documentation]
- [Link to related GitHub issue/PR]

---

## Commit Workflow (Complete After Checkpoint)

**CRITICAL**: Run these steps AFTER creating this checkpoint:

```bash
# 1. Verify quality gates
pnpm build          # MUST pass (0 TypeScript errors)
npm test            # MUST pass (all tests green)

# 2. Stage changes
git add .

# 3. Create commit
git commit -m "feat: [description]

- [Change 1]
- [Change 2]
- [Change 3]

Quality Reviews:
- kieran-typescript-reviewer: __/10
- [other reviews if applicable]

Tests: __/__ passing (__% coverage)
Build: ✅ 0 TypeScript errors

Checkpoint: checkpoint-[name].md

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# 4. Push changes
git push

# 5. Verify GitHub Actions (if applicable)
gh run list --limit 3
```

**Status**: ⬜ Not Started / 🔄 In Progress / ✅ Completed

---

## Session Metrics

- **Time Spent**: __ hours
- **Lines Changed**: __ added, __ deleted
- **Files Modified**: __
- **Tests Added**: __
- **Quality Score**: __/10
- **Context Usage**: __k/__k tokens (__%

)

---

**Checkpoint Created**: [YYYY-MM-DD HH:MM]
**Next Checkpoint Due**: [When to create next checkpoint]
**Overall Status**: ✅ ON TRACK / ⚠️ NEEDS ATTENTION / ❌ BLOCKED

---

## Template Usage Notes

**DO NOT**:
- Leave sections as TODO/TBD
- Skip quality reviews
- Create checkpoint without running quality gates
- Commit without filling all required sections

**DO**:
- Fill every section completely
- Run ALL mandatory quality reviews
- Verify quality gates before commit
- Reference specific files, functions, line numbers
- Include actual metrics (not estimates)

**Quality Gates Required**:
- pnpm build (0 errors)
- npm test (all passing)
- kieran-typescript-reviewer (≥7/10)

---

**V5.0 Template Version** | **Enforced Workflow** | **Quality First**
