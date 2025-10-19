# Haiku Explorer Examples

## Example 1: Simple Bug Fix

**User**: "Fix the invoice total calculation bug"

### With /explore
```
1. [TodoWrite: 3 items]
2. [Task /explore services/finance - "Find invoice total calculation logic"]
   → Result (30s): invoice.aggregate.ts:calculateTotal()
3. [Read invoice.aggregate.ts] ← Only 1 file
4. [Edit: Fix line 127]
5. [Bash: npm test]
6. [TodoWrite: mark done]
```
**Time**: 8 minutes | **Cost**: $0.02 | **Files**: 1

### Without /explore
```
1. [Read invoice.resolver.ts] - not here
2. [Read invoice.handler.ts] - not here
3. [Read invoice.service.ts] - not here
4. [Read invoice.aggregate.ts] - found it!
5. [Read invoice-item.entity.ts] - context
6. [Read invoice-calculation.service.ts] - related
7. [Edit invoice.aggregate.ts]
8. [Bash: npm test]
```
**Time**: 20 minutes | **Cost**: $0.08 | **Files**: 6

**Savings**: 60% time, 75% cost

---

## Example 2: Feature Implementation

**User**: "Add multi-currency support to invoices"

### With /explore
```
1. [TodoWrite: 5 items]

2. [Task /explore services/finance]
   Prompt: "Understand invoice domain model and pricing logic"
   Result (1 min):
   - invoice.aggregate.ts, invoice-item.entity.ts
   - invoice-calculation.service.ts
   - invoice.resolver.ts

3. [Task /explore services/master-data]
   Prompt: "Find currency and exchange rate management"
   Result (1 min):
   - currency.entity.ts
   - exchange-rate.service.ts
   - master-data.client.ts

4. [Read 5 targeted files] ← 2,000 lines vs 8,000+

5. [Implement multi-currency in 4 files]

6. [Bash: npm test]

7. [TodoWrite: mark completed]
```
**Time**: 45 minutes | **Cost**: $0.15 | **Files**: 5

### Without /explore
```
1. [Read 15+ files in finance] - searching
2. [Read 8+ files in master-data] - searching
3. [Still unclear on architecture]
4. [Read CLAUDE.md files]
5. [Understand after 20 minutes]
6. [Implement feature]
7. [Test]
```
**Time**: 90 minutes | **Cost**: $0.50 | **Files**: 25+

**Savings**: 50% time, 70% cost

---

## Example 3: Multi-Service Task

**User**: "Implement invoice notification when payment received"

### Parallel Exploration
```
# Use 3 /explore agents in parallel
[Task /explore services/finance]      # Find payment events
[Task /explore services/notification] # Find notification system
[Task /explore services/master-data]  # Find user data

# All complete in ~1 min vs 3 min sequential
# Total cost: $0.05 (vs $0.30 manual)
```

---

## Exploration Patterns by Task Type

### Bug Fix Pattern
```
1. /explore services/[service] - "find [buggy feature] logic"
2. Read 1-3 files identified
3. Fix bug
4. Test
```

### Feature Implementation Pattern
```
1. /explore services/[service] - "understand [related feature] architecture"
2. /explore @services/[service]/src/domain - "find relevant aggregates"
3. Read 3-5 key files
4. Implement feature
5. Test
```

### Refactoring Pattern
```
1. /explore services/[service] --thorough
2. Identify all files to refactor
3. Read service CLAUDE.md
4. Refactor systematically
5. Test extensively
```
