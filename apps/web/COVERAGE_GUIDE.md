# Code Coverage Guide

This guide explains how to use code coverage in the Vextrus ERP web application and understand coverage reports.

## Overview

Code coverage measures how much of your application code is executed during testing. The project is configured with:

- **Provider**: v8 (Vitest's default coverage provider)
- **Target Thresholds**: 80% for lines, functions, branches, and statements
- **Reports**: text, json, html, lcov formats

## Running Coverage

### Generate Coverage Report

```bash
# Run tests with coverage
pnpm test:coverage

# View the HTML report (opens in browser)
open coverage/index.html  # macOS
start coverage/index.html  # Windows
xdg-open coverage/index.html  # Linux
```

### Coverage Reports Location

Coverage reports are generated in `apps/web/coverage/`:

```
coverage/
├── index.html          # Interactive HTML report
├── coverage-final.json # Machine-readable JSON
├── lcov.info          # LCOV format for CI/CD tools
└── clover.xml         # Clover format (if enabled)
```

## Current Configuration

### vitest.config.ts Coverage Settings

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  exclude: [
    'node_modules/',
    'src/test/',
    '**/*.stories.tsx',
    '**/*.config.ts',
    '**/types.ts',
    '**/*.d.ts',
  ],
  all: true,
  lines: 80,
  functions: 80,
  branches: 80,
  statements: 80,
}
```

### What's Excluded from Coverage

- **node_modules/**: Third-party dependencies
- **src/test/**: Test utilities and setup files
- **\*.stories.tsx**: Storybook stories (tested separately)
- **\*.config.ts**: Configuration files
- **types.ts, \*.d.ts**: TypeScript definition files

## Coverage Metrics Explained

### Lines Coverage

**What it measures**: Percentage of executable lines that were run during tests.

**Example**:
```typescript
function add(a: number, b: number) {  // Covered
  return a + b                         // Covered
}
```
Lines coverage: 100% (2/2 lines)

### Functions Coverage

**What it measures**: Percentage of functions that were called during tests.

**Example**:
```typescript
function used() { }      // Covered
function notUsed() { }   // Not covered
```
Functions coverage: 50% (1/2 functions)

### Branches Coverage

**What it measures**: Percentage of conditional branches (if/else, ternary, switch) that were executed.

**Example**:
```typescript
function check(val: boolean) {
  if (val) {
    return 'yes'  // Branch 1 covered
  } else {
    return 'no'   // Branch 2 not covered
  }
}

// Only called with true
check(true)
```
Branches coverage: 50% (1/2 branches)

### Statements Coverage

**What it measures**: Percentage of statements that were executed.

**Example**:
```typescript
const a = 1         // Covered
const b = 2         // Covered
const c = a + b     // Not covered
```
Statements coverage: 67% (2/3 statements)

## Quality Gates

### Thresholds

The project enforces these minimum coverage thresholds:

| Metric       | Threshold | Status |
|--------------|-----------|--------|
| Lines        | 80%       | ⚠️ TBD  |
| Functions    | 80%       | ⚠️ TBD  |
| Branches     | 80%       | ⚠️ TBD  |
| Statements   | 80%       | ⚠️ TBD  |

**Note**: Current coverage will be established after running first full coverage report.

### When Tests Fail

Tests will fail in CI if coverage drops below thresholds:

```bash
ERROR: Coverage for lines (75.5%) does not meet global threshold (80%)
```

**Actions to take**:
1. Review uncovered code in the HTML report
2. Add tests for uncovered lines
3. Re-run coverage to verify improvement

## Understanding the HTML Report

### Navigating the Report

1. **Overview Page**: Shows overall coverage metrics and file list
2. **File View**: Click any file to see line-by-line coverage
3. **Color Coding**:
   - 🟢 **Green**: Covered code
   - 🔴 **Red**: Uncovered code
   - 🟡 **Yellow**: Partially covered branches

### Example HTML Report

```
Overall Coverage
────────────────────────────
Lines:      85.2% (1234/1448)
Functions:  82.4% (234/284)
Branches:   79.8% (456/572)
Statements: 84.9% (1198/1414)

Files
────────────────────────────
src/components/ui/button.tsx    95.2%  🟢
src/components/ui/input.tsx     88.1%  🟢
src/components/ui/select.tsx    72.3%  🔴
```

## Improving Coverage

### Strategy 1: Test Uncovered Lines

1. Run coverage: `pnpm test:coverage`
2. Open HTML report: `open coverage/index.html`
3. Sort files by coverage (click "Coverage" column)
4. Focus on files with < 80% coverage
5. Add tests for red (uncovered) lines

### Strategy 2: Test Edge Cases

Missing coverage often indicates untested edge cases:

```typescript
// Example: Uncovered error handling
function divide(a: number, b: number) {
  if (b === 0) {
    throw new Error('Division by zero')  // ← Often uncovered
  }
  return a / b
}

// Add test for error case
test('should throw on division by zero', () => {
  expect(() => divide(10, 0)).toThrow('Division by zero')
})
```

### Strategy 3: Test All Branches

Ensure all conditional paths are tested:

```typescript
function getStatus(score: number) {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 70) return 'average'
  return 'needs improvement'
}

// Test all branches
test.each([
  [95, 'excellent'],
  [85, 'good'],
  [75, 'average'],
  [60, 'needs improvement'],
])('getStatus(%i) returns %s', (score, expected) => {
  expect(getStatus(score)).toBe(expected)
})
```

## CI/CD Integration

### GitHub Actions

Coverage is automatically run in CI:

```yaml
- name: Run tests with coverage
  run: |
    cd apps/web
    pnpm test:coverage

- name: Upload coverage reports
  uses: actions/upload-artifact@v4
  with:
    name: coverage-report
    path: apps/web/coverage/
```

### Pull Request Comments

Coverage reports are automatically commented on PRs:

```markdown
## Coverage Report

| Category   | Coverage | Change  |
|------------|----------|---------|
| Lines      | 85.2%    | +1.2%   |
| Functions  | 82.4%    | -0.3%   |
| Branches   | 79.8%    | +0.5%   |
| Statements | 84.9%    | +1.1%   |

✅ Coverage thresholds met
```

## Coverage Best Practices

### DO ✅

1. **Write meaningful tests** - Focus on behavior, not just coverage numbers
2. **Test critical paths first** - Prioritize business logic over UI code
3. **Use coverage to find gaps** - Let reports guide your testing strategy
4. **Test error handling** - Exception paths are often missed
5. **Review coverage in PRs** - Ensure new code is tested

### DON'T ❌

1. **Write tests just for coverage** - Quality > quantity
2. **Test implementation details** - Test behavior, not internals
3. **Ignore low coverage files** - Every file should meet thresholds
4. **Skip integration tests** - Unit coverage != system coverage
5. **Commit to untested code** - Always run tests before pushing

## Troubleshooting

### Issue: Coverage Report Not Generated

**Solution**: Ensure v8 coverage is installed:
```bash
pnpm add -D @vitest/coverage-v8
```

### Issue: Thresholds Too Strict

**Temporary solution** (not recommended for long term):
```typescript
// vitest.config.ts
coverage: {
  lines: 70,      // Reduce temporarily
  functions: 70,
  branches: 70,
  statements: 70,
}
```

**Better solution**: Add more tests to reach 80%

### Issue: Coverage Includes Test Files

**Solution**: Update exclusions in vitest.config.ts:
```typescript
coverage: {
  exclude: [
    // ... existing excludes
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
  ],
}
```

## Commands Reference

```bash
# Generate coverage report
pnpm test:coverage

# View HTML report (after generation)
# macOS
open coverage/index.html

# Windows
start coverage/index.html

# Linux
xdg-open coverage/index.html

# Run specific file with coverage
pnpm vitest run --coverage src/components/ui/button.test.tsx

# Watch mode with coverage updates
pnpm vitest --coverage --watch
```

## Next Steps

1. **Establish Baseline**: Run full coverage report to see current state
2. **Set Realistic Thresholds**: Adjust if 80% is too aggressive initially
3. **Create Coverage Badge**: Add badge to README.md
4. **Monitor Trends**: Track coverage over time
5. **Integrate with CI**: Enforce thresholds in pull requests

## Resources

- [Vitest Coverage Docs](https://vitest.dev/guide/coverage.html)
- [V8 Coverage Provider](https://vitest.dev/guide/coverage.html#coverage-providers)
- [Istanbul Coverage](https://istanbul.js.org/)
- [LCOV Format](http://ltp.sourceforge.net/coverage/lcov.php)

---

**Last Updated**: 2025-01-10
**Coverage Tool**: Vitest with V8 Provider
**Target**: 80% across all metrics
