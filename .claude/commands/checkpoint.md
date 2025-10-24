# Create Enforced Checkpoint

Create a comprehensive checkpoint using the enforced template.

## Instructions for Claude

1. Read the checkpoint template at `.claude/templates/checkpoint-template.md`

2. Fill ALL sections completely:
   - Executive Summary (2-3 sentences)
   - MANDATORY QUALITY REVIEWS:
     - kieran-typescript-reviewer (ALWAYS run, score out of 10)
     - security-sentinel (if auth/RBAC/sensitive data)
     - performance-oracle (if caching/optimization)
     - data-integrity-guardian (if migrations)
   - Objectives Completed (checkboxes)
   - Files Changed (with line counts from git diff)
   - Quality Gates Status (run `pnpm build` and `npm test` NOW)
   - Implementation Details
   - Tests (count, coverage)
   - Next Steps (specific, actionable)
   - Blockers & Risks
   - Commit Workflow (provide exact commands)

3. **DO NOT leave any section as TODO or TBD**

4. **MANDATORY**: Run quality reviews:
   ```
   Run kieran-typescript-reviewer agent on changed files.
   [List changed files from git diff]
   Target: ≥7/10 score for deployment readiness
   ```

5. Save checkpoint as: `.claude/checkpoints/checkpoint-[descriptive-name].md`

6. After saving, inform user:
   ```
   ✅ Checkpoint created: checkpoints/checkpoint-[name].md

   Quality Score: __/10
   Files Changed: __ files
   Tests: __/__ passing (__%)
   Build: ✅ 0 errors

   Ready to commit? Follow these steps:
   [Provide exact git commands from checkpoint]
   ```

## Quality Gates Required

- `pnpm build` - MUST pass (0 TypeScript errors)
- `npm test` - MUST pass (all tests green)
- kieran-typescript-reviewer - MUST score ≥7/10

## Checklist

- [ ] Template read
- [ ] All sections filled (no TODO/TBD)
- [ ] Quality reviews run
- [ ] Quality gates passed
- [ ] Checkpoint saved
- [ ] User informed with next steps
