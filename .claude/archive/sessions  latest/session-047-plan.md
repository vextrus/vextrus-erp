# Session 047: Task Panel API Fix & Complete CRUD Implementation

## Date: TBD
## Branch: session-047-task-api-crud
## Primary Goal: Fix the 405 error and complete all CRUD operations

## 🎯 Mission Statement
Fix the critical API persistence issue blocking all progress, then systematically implement complete CRUD functionality with exports and Gantt integration.

## 🚀 Powerhouse Workflow Strategy

### Pre-Session Setup
```bash
# 1. Start from clean state
git checkout main
git pull origin main
git checkout -b session-047-task-api-crud

# 2. Launch all services
npm run dev
npx prisma studio
docker-compose -f docker-compose.dev.yml up -d

# 3. Initialize MCP Servers
- Serena: For code analysis
- Playwright: For continuous testing
- Filesystem: For file operations
- Consult7: For AI consultation if needed
```

### Phase 0: Investigation with Serena (30 mins)
**Agent: general-purpose**
```yaml
Task: "Investigate why PUT/PATCH returns 405 in /api/v1/tasks/[id]/route.ts"
Tools:
  - serena.find_symbol("PUT|PATCH|DELETE")
  - serena.find_referencing_symbols("apiHandler")
  - serena.search_for_pattern("method.*not.*allowed")
Strategy:
  - Check all API routes that work
  - Compare working vs broken routes
  - Identify pattern differences
```

### Phase 1: Fix API Endpoint (45 mins)

#### Step 1.1: Diagnosis
```typescript
// Test with Playwright first
await page.evaluate(async () => {
  const response = await fetch('/api/v1/tasks/test-id', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Test' })
  })
  return { status: response.status, text: await response.text() }
})
```

#### Step 1.2: Potential Fixes
**Option A: Rebuild the route file**
```typescript
// New approach - individual method exports
export async function PUT(request: Request, context: any) {
  const params = await context.params
  // Direct implementation
}
```

**Option B: Check middleware interference**
```typescript
// middleware.ts might be blocking PUT/PATCH
// Add logging to identify
```

**Option C: Use different endpoint structure**
```typescript
// /api/v1/tasks/update/[id]/route.ts
// Sometimes Next.js has issues with certain paths
```

#### Step 1.3: Verification with Playwright
```typescript
test('Task update saves to database', async ({ page }) => {
  // 1. Navigate to tasks
  // 2. Edit a task
  // 3. Save
  // 4. Refresh page
  // 5. Verify persistence
})
```

### Phase 2: Task Creation with WBS (45 mins)

#### Step 2.1: Add Task Button
```typescript
// TaskPanel.tsx - Add to toolbar
<Button onClick={handleAddTask}>
  <Plus className="w-4 h-4 mr-2" />
  Add Task
</Button>
```

#### Step 2.2: WBS Generation
**Use existing service!**
```typescript
import { WBSService } from '@/modules/projects/application/services/wbs.service'

const handleAddTask = async () => {
  const wbsCode = await WBSService.generateNextWBS(tasks)
  const newTask = {
    title: 'New Task',
    wbsCode,
    status: 'TODO',
    progress: 0,
    // ... other defaults
  }
  
  // Add to grid immediately
  gridApi.applyTransaction({ add: [newTask] })
  
  // Save to database
  await createTask(newTask)
}
```

#### Step 2.3: Inline Creation
```typescript
// Add empty row at top
// User fills in details
// Save on blur or Enter
```

### Phase 3: Task Deletion (30 mins)

#### Step 3.1: Single Delete
```typescript
// Context menu or button
const handleDelete = async (task) => {
  if (confirm(`Delete "${task.title}"?`)) {
    await deleteTask(task.id)
    gridApi.applyTransaction({ remove: [task] })
  }
}
```

#### Step 3.2: Bulk Delete
```typescript
// With checkbox selection
const handleBulkDelete = async () => {
  const selected = gridApi.getSelectedRows()
  if (confirm(`Delete ${selected.length} tasks?`)) {
    await Promise.all(selected.map(t => deleteTask(t.id)))
    gridApi.applyTransaction({ remove: selected })
  }
}
```

### Phase 4: Export Functionality (30 mins)

#### Step 4.1: CSV Export (Native AG-Grid)
```typescript
const exportCSV = () => {
  gridApi.exportDataAsCsv({
    fileName: `tasks_${projectId}_${Date.now()}.csv`,
    columnKeys: ['wbsCode', 'title', 'status', 'progress'],
  })
}
```

#### Step 4.2: Excel Export (Custom)
```typescript
import ExcelJS from 'exceljs'

const exportExcel = async () => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Tasks')
  
  // Add headers with styling
  worksheet.columns = [
    { header: 'WBS', key: 'wbsCode', width: 10 },
    { header: 'Task Name', key: 'title', width: 30 },
    // ...
  ]
  
  // Add data
  worksheet.addRows(gridApi.getModel().rowsToDisplay.map(r => r.data))
  
  // Download
  const buffer = await workbook.xlsx.writeBuffer()
  downloadBlob(new Blob([buffer]), `tasks.xlsx`)
}
```

### Phase 5: Gantt Integration (45 mins)

#### Step 5.1: Event Bus Setup
```typescript
// utils/eventBus.ts
class EventBus extends EventTarget {
  emit(event: string, data: any) {
    this.dispatchEvent(new CustomEvent(event, { detail: data }))
  }
}
export const eventBus = new EventBus()
```

#### Step 5.2: Grid → Gantt
```typescript
// TaskPanel.tsx
const onCellValueChanged = async (event) => {
  // ... save to database
  
  // Emit to Gantt
  eventBus.emit('task:updated', {
    id: event.data.id,
    field: event.colDef.field,
    value: event.newValue
  })
}
```

#### Step 5.3: Gantt → Grid
```typescript
// TaskPanel.tsx
useEffect(() => {
  const handleGanttUpdate = (e: CustomEvent) => {
    const { id, updates } = e.detail
    const rowNode = gridApi.getRowNode(id)
    if (rowNode) {
      rowNode.setData({ ...rowNode.data, ...updates })
    }
  }
  
  eventBus.addEventListener('gantt:task:updated', handleGanttUpdate)
  return () => eventBus.removeEventListener('gantt:task:updated', handleGanttUpdate)
}, [gridApi])
```

## 🧪 Testing Protocol

### Continuous Testing with Playwright
```typescript
// Run after each phase
describe('Task Panel CRUD', () => {
  test('inline edit persists', async ({ page }) => {
    // Edit → Save → Refresh → Verify
  })
  
  test('new task gets WBS code', async ({ page }) => {
    // Add → Check WBS → Save → Verify
  })
  
  test('delete removes from grid and DB', async ({ page }) => {
    // Delete → Verify gone → Refresh → Still gone
  })
  
  test('CSV export contains all data', async ({ page }) => {
    // Export → Parse CSV → Verify content
  })
  
  test('Grid-Gantt sync works', async ({ page }) => {
    // Edit in Grid → Check Gantt
    // Edit in Gantt → Check Grid
  })
})
```

## 🎯 Success Criteria

### Must Have (Session 047)
- [x] API endpoint accepts PUT/PATCH and saves to database
- [x] Inline editing persists after page refresh
- [x] Add task with auto-generated WBS code
- [x] Delete single task with confirmation
- [x] Export to CSV using AG-Grid native

### Should Have (Session 047/048)
- [ ] Bulk delete with checkbox selection
- [ ] Excel export with formatting
- [ ] Basic Gantt synchronization
- [ ] Keyboard shortcuts (Ctrl+N, Delete)

### Nice to Have (Future)
- [ ] Undo/Redo functionality
- [ ] Drag-drop reordering
- [ ] Custom context menu
- [ ] Advanced filtering UI

## 🚨 Risk Mitigation

### Risk 1: API Fix Takes Too Long
**Mitigation**: Time-box to 45 mins. If not fixed, create new endpoint structure

### Risk 2: Excel Export Complexity
**Mitigation**: Start with basic export, enhance formatting later

### Risk 3: Gantt Sync Conflicts
**Mitigation**: Implement optimistic updates with rollback

## 📊 Time Allocation
- Phase 0: Investigation (30 mins)
- Phase 1: Fix API (45 mins)
- Phase 2: Task Creation (45 mins)
- Phase 3: Task Deletion (30 mins)
- Phase 4: Export Features (30 mins)
- Phase 5: Gantt Integration (45 mins)
- Testing & Documentation (30 mins)
- **Total**: ~4 hours

## 🎬 Commit Strategy
```bash
git commit -m "fix(api): resolve 405 error for task updates"
git commit -m "feat(tasks): add task creation with WBS generation"
git commit -m "feat(tasks): implement task deletion with confirmation"
git commit -m "feat(tasks): add CSV and Excel export"
git commit -m "feat(tasks): integrate bidirectional Gantt sync"
git commit -m "test(tasks): add comprehensive CRUD tests"
```

## 📝 Pre-Session Checklist
- [ ] Read Session 046 completed notes
- [ ] Check current branch status
- [ ] Launch all services
- [ ] Open Prisma Studio
- [ ] Start Playwright
- [ ] Load Serena for investigation
- [ ] Have Network tab open in Chrome

## 🎯 Definition of Done
- ✅ All CRUD operations work and persist
- ✅ No console errors
- ✅ All tests pass
- ✅ Export generates valid files
- ✅ Gantt reflects Grid changes
- ✅ Grid reflects Gantt changes
- ✅ Documentation updated

---

**Note**: This session uses our powerhouse workflow with MCP servers for investigation, continuous testing, and AI assistance. The focus is on fixing the critical blocker first, then systematically adding features with immediate verification.