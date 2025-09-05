# Phase 2: Service Layer Testing

## Objective
Test all service adapters individually and as an integrated system to verify calculations and data processing.

## Service Adapter Tests

### CPMServiceAdapter
- [ ] Calculate critical path for 10-task project
- [ ] Verify forward pass calculations
- [ ] Verify backward pass calculations
- [ ] Test float and slack calculations
- [ ] Handle circular dependencies gracefully
- [ ] Cache works correctly
- [ ] Retry logic on failures

### WBSServiceAdapter
- [ ] Generate WBS codes for hierarchical tasks
- [ ] Calculate rollup hours correctly
- [ ] Identify work packages
- [ ] Validate hierarchy integrity
- [ ] Handle orphaned tasks
- [ ] Detect circular references

### WeatherServiceAdapter
- [ ] Generate forecast for Dhaka location
- [ ] Calculate monsoon periods correctly
- [ ] Assess impact on construction tasks
- [ ] Productivity factors are realistic
- [ ] Seasonal analysis is accurate
- [ ] Cache duration is appropriate

### ResourceLevelingAdapter
- [ ] Detect resource conflicts
- [ ] Apply leveling strategies
- [ ] Calculate utilization metrics
- [ ] Optimize resource allocation
- [ ] Handle overallocation scenarios
- [ ] Cost calculations are correct

### ServiceRegistry
- [ ] All services register correctly
- [ ] Parallel execution works
- [ ] Health monitoring reports status
- [ ] Cache management functions
- [ ] Error handling cascades properly

## Test Data Sets
```typescript
// Minimal test case (5 tasks)
const minimalProject = { /* ... */ }

// Standard test case (25 tasks) 
const standardProject = { /* ... */ }

// Complex test case (100+ tasks)
const complexProject = { /* ... */ }

// Edge cases (circular deps, missing data)
const edgeCases = { /* ... */ }
```

## Performance Benchmarks
| Service | 10 Tasks | 50 Tasks | 100 Tasks | 500 Tasks |
|---------|----------|----------|-----------|-----------|
| CPM | < 50ms | < 200ms | < 500ms | < 2s |
| WBS | < 20ms | < 100ms | < 200ms | < 1s |
| Weather | < 100ms | < 100ms | < 100ms | < 100ms |
| Resource | < 100ms | < 500ms | < 1s | < 5s |

## Integration Tests
- [ ] All services work together via useTaskServices hook
- [ ] Data enrichment produces expected fields
- [ ] Service failures don't crash the app
- [ ] Fallback to cached data works
- [ ] Service registry manages state correctly

## Mock vs Real Data
- [ ] Mock services return expected structure
- [ ] Real services connect to actual APIs
- [ ] Data transformation is consistent
- [ ] Error states are handled identically

## Issues Found
<!-- Document service layer issues -->

## Code Coverage
- CPMServiceAdapter: __%
- WBSServiceAdapter: __%
- WeatherServiceAdapter: __%
- ResourceLevelingAdapter: __%
- ServiceRegistry: __%
- useTaskServices: __%