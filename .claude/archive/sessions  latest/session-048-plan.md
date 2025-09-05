# Session 048 - Enhanced Workflow with MCP-First Development

## Date: 2025-01-04

## Objective
Complete remaining Session 047 tasks using an enhanced MCP-first workflow based on Reddit best practices. Focus on systematic debugging with Serena, continuous testing with Playwright, and sequential thinking for complex problems.

## Enhanced Workflow (Based on Reddit Best Practices)

### 1. MCP-First Development Pattern
```
1. BEFORE writing any code → Use Serena to find existing implementations
2. BEFORE debugging → Use Serena to analyze error patterns
3. DURING development → Use Playwright for continuous validation
4. FOR complex problems → Use Sequential Thinking MCP
5. FOR documentation → Use Memory MCP for persistent context
```

### 2. Testing-Driven Verification
```
Every change must pass:
✓ Playwright browser test
✓ Database verification (Prisma Studio)
✓ Console error check
✓ Page refresh persistence test
```

## Phase 1: Fix Task Creation (Using Serena First)

### Step 1.1: Analyze with Serena
```bash
# Find validation schemas
serena.search_for_pattern("createTaskSchema")
serena.find_symbol("taskValidation")
serena.find_referencing_symbols("POST.*tasks")

# Compare frontend vs backend expectations
serena.find_symbol("onTaskCreate")
serena.find_symbol("createTask")
```

### Step 1.2: Fix Validation Mismatch
- [ ] Map frontend fields to backend schema
- [ ] Add missing required fields
- [ ] Test with Playwright immediately
- [ ] Verify in Prisma Studio

### Expected Fix:
```typescript
// Frontend probably missing:
- organizationId (from session)
- taskType (enum validation)
- Proper date formatting
```

## Phase 2: Fix CSV Export (Simple Module Fix)

### Step 2.1: Register AG-Grid Module
```typescript
import { ModuleRegistry } from '@ag-grid-community/core';
import { CsvExportModule } from '@ag-grid-community/csv-export';

ModuleRegistry.registerModules([CsvExportModule]);
```

### Step 2.2: Test Export
- [ ] Click Export CSV button
- [ ] Verify file downloads
- [ ] Check CSV contents
- [ ] Test with filtered data

## Phase 3: Complete Delete Operation

### Step 3.1: Implement Actual Deletion
- [ ] After confirmation, call DELETE endpoint
- [ ] Handle response
- [ ] Refresh grid data
- [ ] Show success toast

### Step 3.2: Add Bulk Delete
- [ ] Delete multiple selected rows
- [ ] Show progress indicator
- [ ] Handle partial failures

## Phase 4: Gantt Bidirectional Sync (Using Event Bus)

### Step 4.1: Set Up Event Bus
```typescript
// Use existing event bus from modules/shared/
import { eventBus } from '@/modules/shared/infrastructure/event-bus';

// Emit on task update
eventBus.emit('task:updated', { taskId, changes });

// Listen in Gantt
eventBus.on('task:updated', (data) => {
  gantt.updateTask(data.taskId, data.changes);
});
```

### Step 4.2: Implement Sync Handlers
- [ ] Grid → Gantt: On cell edit complete
- [ ] Gantt → Grid: On task drag/resize
- [ ] Test with concurrent edits
- [ ] Verify no infinite loops

## Phase 5: Error Handling & Polish

### Step 5.1: Comprehensive Error Handling
- [ ] Add try-catch to all handlers
- [ ] Show user-friendly error messages
- [ ] Log errors for debugging
- [ ] Add retry logic for network failures

### Step 5.2: Loading States
- [ ] Show spinner during API calls
- [ ] Disable buttons during operations
- [ ] Add optimistic updates
- [ ] Handle race conditions

## Phase 6: Automated Testing

### Step 6.1: Create Playwright Test Suite
```typescript
// tests/task-panel.spec.ts
test.describe('Task Panel CRUD', () => {
  test('should create task with WBS code', async ({ page }) => {
    // Implementation
  });
  
  test('should update task inline', async ({ page }) => {
    // Implementation
  });
  
  test('should delete selected tasks', async ({ page }) => {
    // Implementation
  });
  
  test('should export to CSV', async ({ page }) => {
    // Implementation
  });
});
```

## Success Metrics
- [ ] All CRUD operations work without errors
- [ ] No console errors in any scenario
- [ ] All changes persist after refresh
- [ ] Gantt and Grid stay in sync
- [ ] CSV export produces valid file
- [ ] All Playwright tests pass

## MCP Tool Usage Plan

### Serena (Code Analysis)
- Find validation schemas
- Analyze error patterns
- Locate existing implementations
- Check for duplicated code

### Playwright (Testing)
- Test every feature immediately
- Verify database changes
- Check for console errors
- Test edge cases

### Sequential Thinking (Complex Problems)
- Break down Gantt sync logic
- Plan error handling strategy
- Design test scenarios

### Memory (Context Management)
- Store validation fixes
- Document API patterns
- Save working configurations

## Time Allocation
- Phase 1 (Fix Creation): 30 min
- Phase 2 (CSV Export): 15 min
- Phase 3 (Delete): 20 min
- Phase 4 (Gantt Sync): 45 min
- Phase 5 (Error Handling): 30 min
- Phase 6 (Testing): 30 min
- **Total**: ~3 hours

## Definition of Done
✅ Task creation works with automatic WBS generation
✅ CSV export downloads valid file
✅ Delete removes tasks from database
✅ Gantt reflects Grid changes immediately
✅ Grid reflects Gantt changes immediately
✅ No console errors in any operation
✅ All changes survive page refresh
✅ Playwright test suite passes
✅ Documentation updated with patterns

## Risk Mitigation
- If validation fix is complex → Use minimal required fields first
- If Gantt sync causes loops → Add debouncing and flags
- If time runs short → Focus on Creation + Export (most critical)
- If MCP tools fail → Fall back to manual debugging

## Notes
- Use MCP tools FIRST, not as last resort
- Test IMMEDIATELY after each change
- Document patterns for future sessions
- Focus on working features over complex implementations