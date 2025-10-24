# GitHub Actions Workflows - V5.0

**Status**: 2 active workflows for V5.0
**Purpose**: Automated checkpoint sync + PR quality gates

---

## Active Workflows

### 1. checkpoint-sync.yml ✅
**Trigger**: Push checkpoint-*.md to feature branches
**Purpose**: Auto-sync checkpoints to GitHub issues

**How It Works**:
1. Detects checkpoint file in push
2. Extracts issue number (from content or branch name)
3. Posts checkpoint as GitHub issue comment
4. Adds "checkpoint" label

**V5.0 Fix Needed**: Update paths to `.claude/checkpoints/*.md`

**Usage**:
```bash
# After creating checkpoint
git add .claude/checkpoints/checkpoint-day1.md
git commit -m "checkpoint: day 1 complete"
git push
# → Workflow automatically syncs to issue
```

---

### 2. pr-quality-gates.yml ✅
**Trigger**: PR creation/update to main/develop
**Purpose**: Automated quality scoring + blocking

**Quality Score Formula**:
- Start: 10.0
- TypeScript errors: -0.5 each (max -3)
- Test failures: -1 each (max -4)
- Coverage <70%: -2

**Merge Blocking**:
- Quality <7.0 → ❌ BLOCKED
- Quality ≥7.0 → ✅ ALLOWED

**Agent Recommendation**:
- PR >500 lines → Recommend kieran-typescript-reviewer

**Usage**: Automatic on PR creation

---

## Deprecated Workflows

### metrics-collector.yml ❌
**Removed in V5.0**: Not used, manual metrics tracking sufficient

---

## V5.0 Changes

### What Changed
- ❌ Removed: metrics-collector.yml (unused)
- ⚠️ Fix needed: checkpoint-sync.yml paths (`.claude/checkpoints/`)
- ✅ Keep: pr-quality-gates.yml (working)

### Why
- **Simplification**: 2 workflows vs 3 (33% reduction)
- **Focus**: Only automation that's actually used
- **Maintenance**: Less to maintain, clearer purpose

---

## Workflow Comparison

| Workflow | V4.0 | V5.0 | Status |
|----------|------|------|--------|
| checkpoint-sync | ✅ Created | ⚠️ Needs path fix | Keep |
| pr-quality-gates | ✅ Created | ✅ Working | Keep |
| metrics-collector | ✅ Created | ❌ Removed | Deprecated |

---

## Future Enhancements

Potential additions (only if proven useful):
- **deploy-automated.yml**: One-click deployment
- **test-coverage.yml**: Coverage enforcement
- **dependency-audit.yml**: Security scanning

**Principle**: Add only when needed, not speculatively

---

## Troubleshooting

### Checkpoint Not Syncing
1. Check file path: Must be `checkpoint-*.md` in repo root OR `checkpoints/**/*.md`
2. Check issue number: Add "Issue: #123" to checkpoint OR include in branch name
3. Check permissions: workflow needs `issues: write`

### PR Quality Gates Failing
1. Check TypeScript: `pnpm build` locally
2. Check tests: `npm test` locally
3. Fix issues, push again → Gates re-run automatically

### Workflows Not Running
1. Check triggers: feature branch for checkpoints, PR for quality gates
2. Check `.github/workflows/` directory exists
3. Check GitHub Actions enabled in repository settings

---

**V5.0** | **Simplified** | **2 Active Workflows** | **Focused Automation**
