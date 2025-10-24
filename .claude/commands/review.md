# Code Quality Review

Run kieran-typescript-reviewer agent on specified files or all changed files.

## Instructions for Claude

1. Determine files to review:
   ```bash
   # If no files specified, review all changed files
   git diff --name-only HEAD
   ```

2. Invoke kieran-typescript-reviewer agent:
   ```
   I'm running kieran-typescript-reviewer agent to review code quality.

   Scope: [list files being reviewed]
   Target: ≥7/10 score for production readiness

   [Use Task tool with subagent_type=compounding-engineering:kieran-typescript-reviewer]
   ```

3. After review completes, report results:
   ```
   ✅ Code Review Complete

   Score: __/10

   Critical Issues: [list or "None"]
   Warnings: [list or "None"]
   Recommendations: [list or "None"]

   Deployment Ready: [YES if ≥7/10, NO if <7/10]

   [If score <7/10]
   ⚠️ Fix critical issues before deployment:
   1. [Issue 1]
   2. [Issue 2]
   ```

4. If score <7/10, offer to help fix issues

## Usage Examples

```
/review
# Reviews all changed files

/review services/finance/src/domain/invoice/
# Reviews specific directory

/review services/finance/src/domain/invoice/invoice.aggregate.ts
# Reviews specific file
```

## Agent Configuration

- **Agent**: kieran-typescript-reviewer
- **Model**: Sonnet 4.5
- **Focus**: TypeScript quality, patterns, best practices
- **Standards**: Kieran's strict conventions
- **Minimum Score**: 7/10 for deployment

## Checklist

- [ ] Files identified
- [ ] Agent invoked
- [ ] Results reported
- [ ] Score documented
- [ ] User informed of next steps
