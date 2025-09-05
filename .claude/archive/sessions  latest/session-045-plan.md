# Session 045: Fix AG-Grid and Complete Task Panel

## Date: TBD
## Branch: session-045-fix-aggrid (NEW)
## Primary Goal: Make the AG-Grid actually display data

## Mission Statement
**FIX FIRST, FEATURES LATER**: Get a working grid displaying tasks before adding any advanced features. Session 044 created the structure but failed at the basic requirement - showing data.

## Critical Problem from Session 044
- **Grid component exists but is invisible**
- **Toolbar shows, grid doesn't**
- **58 tasks in database not displaying**
- **1,000 lines of code that don't produce output**

## Investigation Checklist (MUST DO FIRST)

### Phase 0: Verification (15 mins)
1. **Create Minimal Test**
   ```typescript
   // Create a test file with hardcoded data
   const testData = [
     { id: 1, wbsCode: '1.1', title: 'Test Task 1' },
     { id: 2, wbsCode: '1.2', title: 'Test Task 2' }
   ]
   ```
   - If this doesn't work, it's a setup issue
   - If this works, it's a data issue

2. **Check Browser DevTools**
   - Inspect element where grid should be
   - Check if grid container has height/width
   - Look for display: none or visibility issues
   - Check computed styles

3. **Verify Imports**
   ```typescript
   // Ensure these are correct
   import 'ag-grid-community/styles/ag-grid.css'
   import 'ag-grid-community/styles/ag-theme-quartz.css'
   ```

### Phase 1: Simplest Possible Grid (30 mins)

#### Option A: Strip Down Current Implementation
1. **Remove all complex features**
   - No tree data
   - No custom renderers  
   - No toolbar integration
   - Just show a basic table

2. **Minimal columns**
   ```typescript
   const columnDefs = [
     { field: 'wbsCode', headerName: 'WBS' },
     { field: 'title', headerName: 'Task Name' }
   ]
   ```

3. **Minimal options**
   ```typescript
   // Remove everything except essentials
   const gridOptions = {
     columnDefs,
     rowData: testData
   }
   ```

#### Option B: Start Fresh with Working Example
1. **Copy from AG-Grid documentation**
   - Use their exact example
   - Gradually modify to our needs
   - Don't add features until basic grid works

### Phase 2: Debug Current Implementation (30 mins)

1. **Console Logging at Every Step**
   ```typescript
   console.log('Tasks received:', tasks)
   console.log('Row data:', rowData)
   console.log('Grid API:', gridApi)
   ```

2. **Check Data Flow**
   - Is `useTaskManagement` returning tasks?
   - Is `transformToTreeData` working?
   - Is flattening producing valid array?

3. **Grid Lifecycle**
   - Is `onGridReady` being called?
   - Is `gridApi` being set?
   - Try calling `gridApi.sizeColumnsToFit()` manually

### Phase 3: Alternative Solutions (45 mins)

If AG-Grid won't work after 1 hour:

#### Plan B: Tanstack Table (React Table)
```bash
npm install @tanstack/react-table
```
- Lighter weight
- More React-native
- Better documented for React

#### Plan C: Simple HTML Table
```typescript
// Just get something working
<table>
  {tasks.map(task => (
    <tr key={task.id}>
      <td>{task.wbsCode}</td>
      <td>{task.title}</td>
      <td>{task.status}</td>
    </tr>
  ))}
</table>
```
- Can enhance later
- At least shows data
- Proves the data flow works

### Phase 4: Only After Grid Shows Data (remaining time)

1. **Add Features ONE AT A TIME**
   - Test after each addition
   - Commit working states
   - Don't add next feature until current works

2. **Priority Order**
   - Sorting ✓ Test ✓ Commit
   - Filtering ✓ Test ✓ Commit
   - Row selection ✓ Test ✓ Commit
   - Inline editing ✓ Test ✓ Commit
   - Export ✓ Test ✓ Commit

## Success Criteria

### Minimum Viable Success (MUST HAVE)
- [ ] Grid is VISIBLE on screen
- [ ] At least 3 columns display
- [ ] At least 10 rows of data show
- [ ] Can take screenshot proving it works

### Good Success
- [ ] All task data displays
- [ ] Columns are sortable
- [ ] Grid is responsive

### Excellent Success  
- [ ] Inline editing works
- [ ] Changes persist to database
- [ ] No console errors

## Testing Protocol

After EVERY change:
1. Refresh browser
2. Open Tasks tab
3. Can you SEE the grid?
4. Take screenshot if yes
5. Check console for errors

## Escape Hatches

**After 30 mins**: If AG-Grid still not showing, switch to Plan B (Tanstack Table)
**After 60 mins**: If no library works, use plain HTML table
**After 90 mins**: Document blockers and ask for help

## DO NOT

1. **DO NOT** add features before grid is visible
2. **DO NOT** write custom renderers before basic display works
3. **DO NOT** integrate with Gantt before standalone works
4. **DO NOT** claim success without screenshot proof
5. **DO NOT** commit code that doesn't display data

## Files to Focus On

1. `TaskGrid.tsx` - Simplify dramatically
2. `page-client.tsx` - Verify data passing
3. Browser DevTools - Check rendering issues

## Potential Quick Fixes to Try

1. **Change theme**
   ```typescript
   // Try different theme
   'ag-theme-quartz' → 'ag-theme-alpine'
   ```

2. **Force height**
   ```css
   .ag-theme-alpine {
     height: 600px !important;
   }
   ```

3. **Remove wrapper div**
   ```typescript
   // Instead of <div className="flex flex-col h-full">
   // Try direct render
   ```

4. **Hardcode everything**
   ```typescript
   // Remove all props, use static data
   const rowData = [
     { id: 1, title: 'If this shows, it works' }
   ]
   ```

## Definition of Done

✅ Screenshot showing grid with data
✅ At least 10 tasks visible
✅ Console has no errors
✅ Code is simplified and working
✅ Can click on a task row

## Time Allocation

- Debug current: 30 mins MAX
- Alternative solution: 45 mins
- Feature additions: 45 mins
- Testing/Documentation: 30 mins

## Commit Strategy

```bash
# Multiple small commits
git commit -m "fix(tasks): debug grid display issue"
git commit -m "fix(tasks): simplify grid to basic table"
git commit -m "feat(tasks): grid now displays data"
git commit -m "feat(tasks): add sorting to working grid"
```

---

**Remember**: A simple working table is better than a complex broken grid. The goal is VISIBLE DATA, not perfect architecture.

**Mantra for Session 045**: "Make it work, make it right, make it fast" - and we're still on step 1.