# Cost & Performance Analysis

## Model Performance Comparison

| Model | SWE-bench | Speed | Cost |
|-------|-----------|-------|------|
| Haiku 4.5 | 73% | 2x faster | 1/3 cost |
| Sonnet 4.5 | 77% | Baseline | Baseline |

## Cost Comparison

### Manual File Reading (Sonnet 4.5)
```
Read 10 files × 500 lines = 5,000 lines
Input cost: ~$0.05
Time: 3-5 minutes
Context: 5,000 lines loaded
```

### /explore with Haiku 4.5
```
/explore services/finance
Input cost: ~$0.015
Time: 1-2 minutes
Context: 200-500 lines of insights
Result: Comprehensive understanding + file list
```

**Savings**: 60-70% cost reduction, 50% time savings

---

## Haiku vs Sonnet Decision Matrix

| Task Type | Model | Reason |
|-----------|-------|--------|
| Codebase exploration | Haiku | Fast, cheap, 73% sufficient |
| Understanding service | Haiku | Cost-effective |
| Finding files | Haiku | Pattern matching |
| Bug diagnosis | Haiku first | Then Sonnet for fix |
| Simple CRUD | Haiku | Straightforward |
| Complex logic | Sonnet | Need 77% performance |
| Security critical | Sonnet | Higher accuracy |
| Architecture decisions | Sonnet | Deep reasoning |

**Rule**: Start with Haiku, upgrade to Sonnet only when needed.

---

## Success Metrics

Track these to validate effectiveness:

### 1. /explore Usage
- Target: >80% of tasks start with /explore

### 2. Files Read Per Task
- Before: 10-15 files
- After: 3-5 files
- Target: 60% reduction

### 3. Tokens Per Task
- Before: 15,000-25,000 tokens
- After: 5,000-10,000 tokens
- Target: 60% reduction

### 4. Task Start Time
- Before: 5-10 minutes
- After: 2-3 minutes
- Target: 50% faster

### 5. Model Distribution
- Current: 90% Sonnet, 10% Haiku
- Target: 70% Haiku, 30% Sonnet
- Savings: 40% overall cost reduction
