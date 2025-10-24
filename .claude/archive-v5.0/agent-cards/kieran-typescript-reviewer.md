# kieran-typescript-reviewer Agent Card

**Type**: Code Quality Review
**Model**: Sonnet 4.5
**When**: MANDATORY for medium+ tasks, optional for simple tasks

---

## Quick Invocation

```
I'm running kieran-typescript-reviewer agent to review code quality.

Files: [list changed files from git diff]
Target: ≥7/10 for production readiness

[Use Task tool with subagent_type=compounding-engineering:kieran-typescript-reviewer]
```

---

## What It Does

Reviews TypeScript code for:
- Code quality and clarity
- TypeScript best practices
- Pattern consistency
- Naming conventions
- Error handling
- Test coverage
- Performance concerns

Uses **Kieran's strict standards** - high quality bar.

---

## Scoring

- **9-10**: Excellent, production-ready
- **7-8**: Good, minor improvements
- **5-6**: Needs work, address issues
- **<5**: Major issues, refactor required

**Minimum for deployment**: 7/10

---

## Typical Output

```
✅ Code Review Complete

Score: 8.5/10

Files Reviewed:
- services/finance/src/domain/invoice/invoice.aggregate.ts
- services/finance/src/application/commands/create-invoice.command.ts

Critical Issues: None

Warnings:
- invoice.aggregate.ts:45 - Consider extracting validation to value object
- create-invoice.command.ts:12 - Add JSDoc comment for public method

Recommendations:
- Add integration tests for invoice creation workflow
- Consider using Result type for error handling

Deployment Ready: ✅ YES
```

---

## When to Use

### ALWAYS (Medium+ Tasks)
- After implementing features
- Before creating checkpoint
- Before merging PR

### Optional (Simple Tasks)
- Small bug fixes
- Config changes
- Documentation updates

---

## Integration with Workflow

### Medium Task
1. Implement feature
2. **Run kieran-typescript-reviewer** ← HERE
3. Fix critical issues if score <7
4. Create checkpoint
5. Commit

### Complex Task
1. Daily implementation
2. **Run kieran-typescript-reviewer** ← Each day
3. Document score in checkpoint
4. Fix issues before next phase

---

## Checklist

- [ ] Changed files identified (`git diff --name-only`)
- [ ] Agent invoked with file list
- [ ] Score documented (≥7/10 required)
- [ ] Critical issues addressed
- [ ] Ready for checkpoint/commit
