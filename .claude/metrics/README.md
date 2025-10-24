# Metrics Collection & Analysis

**Purpose**: Track improvement, measure what matters, optimize continuously

**Automation**: Metrics collected automatically on PR merge (see `.github/workflows/metrics-collector.yml`)

---

## Metrics Tracked

### Velocity Metrics
- **Features per week**: Count of merged PRs with "feature" label
- **Bugs per week**: Count of merged PRs with "bug" label
- **Time to merge**: Average time from PR creation to merge

### Quality Metrics
- **Quality score**: From pr-quality-gates workflow (7-10 scale)
- **Test coverage**: Percentage (target 90%+)
- **TypeScript errors**: Count at PR time (target 0)

### Estimation Accuracy
- **Estimated time**: From issue or PR description
- **Actual time**: Time from PR creation to merge
- **Accuracy**: ±20% target

---

## Viewing Metrics

Metrics are collected in GitHub issues with "metrics" label.

```bash
# View metrics issue
gh issue list --label metrics --state open

# View latest metrics
gh issue view <metrics-issue-number>
```

---

## Monthly Summary

Create monthly summary manually:

```bash
# Find all PRs merged in current month
gh pr list --state merged --search "merged:>=$(date -d '1 month ago' +%Y-%m-%d)"

# Extract metrics and calculate averages
```

**Target Metrics** (v4.0):
- Velocity: 5+ features/week
- Quality: 9.0/10 average
- Estimation: ±20% accuracy
- Coverage: 90%+ maintained
