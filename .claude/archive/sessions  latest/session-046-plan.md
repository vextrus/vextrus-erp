# Session 046: Task Panel Enhancement - CRUD Operations & Integration

## Date: TBD
## Branch: session-046-task-panel-enhancement
## Primary Goal: Transform the working AG-Grid into a fully functional task management system

## System Context
After successfully fixing the AG-Grid display issue in Session 045, we now have a solid foundation with `TaskGridSimple.tsx` displaying all 58 tasks. The grid currently has sorting, filtering, and pagination working perfectly. Now we need to add CRUD operations and integrate with the existing systems.

## Architecture Decision: Community vs Enterprise
**Finding**: We have `ag-grid-enterprise@34.1.2` installed but aren't using it due to license requirements.
**Decision**: Stick with AG-Grid Community Edition and implement custom solutions for advanced features.
**Rationale**: Avoid license issues while achieving all required functionality through creative implementation.

## Mission Statement
Transform the read-only task grid into a comprehensive task management system with full CRUD operations, Excel export, and bidirectional Gantt chart synchronization - all using AG-Grid Community Edition features and custom implementations.

## Phase 1: Consolidate and Rename (30 mins)

### 1.1 Component Consolidation
Since `TaskGridSimple` works and `TaskGrid` doesn't, we should:
1. **Rename** `TaskGridSimple.tsx` → `TaskPanel.tsx` (better naming)
2. **Delete** the non-working files:
   - `TaskGrid.tsx` (272 lines of non-working code)
   - `TaskGridAdapter.ts` (311 lines unused)
   - `TaskGridColumns.ts` (253 lines unused)
3. **Keep** `TaskGridToolbar.tsx` and integrate it properly

### 1.2 File Structure
```
src/components/projects/tasks/
├── TaskPanel.tsx          (main component - renamed from TaskGridSimple)
├── TaskPanelToolbar.tsx   (enhanced toolbar)
├── TaskEditDialog.tsx     (new - for create/edit)
├── TaskDeleteDialog.tsx   (new - for delete confirmation)
└── TaskExport.ts         (new - export utilities)
```

## Phase 2: Implement Inline Editing (45 mins)

### 2.1 Cell Editors Setup
Using AG-Grid Community's built-in cell editors:
```typescript
// Text fields - built-in text editor
{ field: 'title', editable: true }

// Dropdown fields - custom cell editor component
{ field: 'status', editable: true, cellEditor: 'agSelectCellEditor',
  cellEditorParams: {
    values: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']
  }
}

// Number fields - built-in number editor
{ field: 'progress', editable: true, cellEditor: 'agNumberCellEditor',
  cellEditorParams: { min: 0, max: 100 }
}

// Date fields - custom date picker
{ field: 'plannedStartDate', editable: true, cellEditor: CustomDateEditor }
```

### 2.2 Save Mechanism
```typescript
const onCellValueChanged = async (event) => {
  const { data, colDef, newValue, oldValue } = event
  
  try {
    await updateTask(data.id, { [colDef.field]: newValue })
    // Show success toast
  } catch (error) {
    // Revert value
    event.node.setDataValue(colDef.field, oldValue)
    // Show error toast
  }
}
```

### 2.3 Validation
- WBS Code: Read-only (auto-generated)
- Title: Required, min 3 characters
- Status: Must be valid enum value
- Progress: 0-100 range
- Dates: End date must be after start date
- Hours: Positive numbers only

## Phase 3: Task CRUD Operations (45 mins)

### 3.1 Create Task
```typescript
// Add button in toolbar
const handleAddTask = () => {
  const newTask = {
    title: 'New Task',
    wbsCode: generateNextWBS(tasks),
    status: 'TODO',
    progress: 0,
    priority: 'MEDIUM',
    plannedStartDate: new Date(),
    plannedEndDate: addDays(new Date(), 7),
    estimatedHours: 40
  }
  
  // Option 1: Add row directly to grid
  gridApi.applyTransaction({ add: [newTask] })
  
  // Option 2: Open dialog for details
  openTaskDialog(newTask)
}
```

### 3.2 Update Task (Inline)
Already covered in Phase 2 - inline editing

### 3.3 Delete Task
```typescript
const handleDeleteSelected = () => {
  const selected = gridApi.getSelectedRows()
  
  if (selected.length === 0) {
    toast.error('Please select tasks to delete')
    return
  }
  
  // Show confirmation dialog
  if (confirm(`Delete ${selected.length} task(s)?`)) {
    selected.forEach(task => deleteTask(task.id))
    gridApi.applyTransaction({ remove: selected })
  }
}
```

### 3.4 Bulk Operations
- Select All: `gridApi.selectAll()`
- Deselect All: `gridApi.deselectAll()`
- Bulk Update: Apply changes to multiple selected rows
- Bulk Delete: Delete multiple selected rows

## Phase 4: Export Functionality (30 mins)

### 4.1 Export to CSV (Native AG-Grid)
```typescript
const exportToCsv = () => {
  gridApi.exportDataAsCsv({
    fileName: `tasks_${projectId}_${new Date().toISOString()}.csv`,
    columnKeys: ['wbsCode', 'title', 'status', 'progress', ...],
  })
}
```

### 4.2 Export to Excel (Custom Implementation)
Since AG-Grid Enterprise is required for Excel export, implement custom:
```typescript
import ExcelJS from 'exceljs'

const exportToExcel = async () => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Tasks')
  
  // Add headers
  worksheet.columns = [
    { header: 'WBS', key: 'wbsCode', width: 10 },
    { header: 'Task Name', key: 'title', width: 30 },
    // ... more columns
  ]
  
  // Add rows
  const rowData = gridApi.getModel().rowsToDisplay.map(row => row.data)
  worksheet.addRows(rowData)
  
  // Style the header row
  worksheet.getRow(1).font = { bold: true }
  
  // Save file
  const buffer = await workbook.xlsx.writeBuffer()
  downloadFile(buffer, `tasks_${projectId}.xlsx`)
}
```

### 4.3 Export to PDF
```typescript
const exportToPdf = () => {
  // Use existing print functionality
  gridApi.setGridOption('domLayout', 'print')
  window.print()
  gridApi.setGridOption('domLayout', 'normal')
}
```

## Phase 5: Gantt Chart Integration (45 mins)

### 5.1 Bidirectional Sync Strategy
```typescript
// TaskPanel → Gantt
const syncToGantt = (updatedTask) => {
  // Emit event or call parent callback
  onTaskUpdate?.(updatedTask)
  
  // Or use event bus
  eventBus.emit('task:updated', updatedTask)
}

// Gantt → TaskPanel
const syncFromGantt = (ganttUpdate) => {
  // Find row in grid
  const rowNode = gridApi.getRowNode(ganttUpdate.id)
  if (rowNode) {
    rowNode.setData({ ...rowNode.data, ...ganttUpdate })
  }
}
```

### 5.2 Real-time Updates
```typescript
useEffect(() => {
  // Listen for Gantt updates
  const handleGanttUpdate = (event) => {
    const updatedTask = event.detail
    updateGridRow(updatedTask)
  }
  
  window.addEventListener('gantt:task:updated', handleGanttUpdate)
  return () => window.removeEventListener('gantt:task:updated', handleGanttUpdate)
}, [])
```

### 5.3 Shared State Management
Consider using Zustand or Context API for shared task state:
```typescript
const useTaskStore = create((set) => ({
  tasks: [],
  updateTask: (id, updates) => set(state => ({
    tasks: state.tasks.map(t => t.id === id ? {...t, ...updates} : t)
  })),
}))
```

## Phase 6: Advanced Features (30 mins)

### 6.1 Row Grouping (Custom Implementation)
Since row grouping is Enterprise feature, implement custom:
```typescript
const groupByStatus = () => {
  const grouped = tasks.reduce((acc, task) => {
    if (!acc[task.status]) acc[task.status] = []
    acc[task.status].push(task)
    return acc
  }, {})
  
  // Transform to flat array with group headers
  const flatData = []
  Object.entries(grouped).forEach(([status, tasks]) => {
    flatData.push({ isGroup: true, title: status, count: tasks.length })
    flatData.push(...tasks)
  })
  
  gridApi.setRowData(flatData)
}
```

### 6.2 Custom Context Menu
```typescript
const getContextMenuItems = (params) => {
  return [
    {
      name: 'Edit Task',
      action: () => openEditDialog(params.node.data),
      icon: '<i class="fa fa-edit"></i>'
    },
    {
      name: 'Duplicate Task',
      action: () => duplicateTask(params.node.data)
    },
    'separator',
    {
      name: 'Delete Task',
      action: () => deleteTask(params.node.data.id),
      cssClasses: ['text-red-500']
    },
    'separator',
    'copy',
    'export'
  ]
}
```

### 6.3 Keyboard Shortcuts
```typescript
const handleKeyDown = (event) => {
  // Ctrl+N: New task
  if (event.ctrlKey && event.key === 'n') {
    event.preventDefault()
    handleAddTask()
  }
  
  // Delete: Delete selected
  if (event.key === 'Delete') {
    handleDeleteSelected()
  }
  
  // Ctrl+S: Save changes
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault()
    saveAllChanges()
  }
}
```

## Testing Protocol

### Unit Tests
1. Cell editing saves correctly
2. Task creation with proper WBS
3. Delete removes from grid and database
4. Export generates valid files

### Integration Tests
1. Grid ↔ Gantt synchronization
2. Grid ↔ Database persistence
3. Multi-user updates (if applicable)

### E2E Tests with Playwright
```typescript
// Test inline editing
await page.click('[col-id="title"][row-index="0"]')
await page.keyboard.type('Updated Task Name')
await page.keyboard.press('Enter')
await expect(page.locator('.toast-success')).toBeVisible()

// Test task creation
await page.click('[data-testid="add-task-btn"]')
await page.fill('[name="title"]', 'New Task')
await page.click('[type="submit"]')
await expect(page.locator('[col-id="title"]')).toContainText('New Task')
```

## Success Criteria

### Must Have ✅
- [ ] Inline editing for all editable fields
- [ ] Create new tasks with auto-generated WBS
- [ ] Delete single/multiple tasks
- [ ] Export to CSV
- [ ] Basic Gantt synchronization

### Should Have 🎯
- [ ] Export to Excel
- [ ] Undo/Redo functionality
- [ ] Keyboard shortcuts
- [ ] Context menu

### Nice to Have ✨
- [ ] Drag-and-drop row reordering
- [ ] Custom grouping
- [ ] Advanced filtering UI
- [ ] Print view

## Risk Mitigation

### Risk 1: License Issues
**Mitigation**: Use only AG-Grid Community features, implement custom solutions for enterprise features

### Risk 2: Performance with Large Datasets
**Mitigation**: Implement virtual scrolling (already enabled), pagination, lazy loading

### Risk 3: Sync Conflicts
**Mitigation**: Implement optimistic updates with rollback, use timestamps for conflict resolution

## Dependencies & Resources

### Existing Resources
- `useTaskManagement` hook - Already has CRUD operations
- `TaskGridToolbar.tsx` - Can be enhanced
- AG-Grid Community docs
- ExcelJS for Excel export

### New Dependencies
None required - using existing packages

## Time Allocation
- Phase 1: Consolidation (30 mins)
- Phase 2: Inline Editing (45 mins)
- Phase 3: CRUD Operations (45 mins)
- Phase 4: Export (30 mins)
- Phase 5: Gantt Integration (45 mins)
- Phase 6: Advanced Features (30 mins)
- Testing & Documentation (30 mins)
- **Total**: ~4 hours

## Commit Strategy
```bash
git commit -m "refactor(tasks): consolidate TaskGridSimple to TaskPanel"
git commit -m "feat(tasks): add inline editing with validation"
git commit -m "feat(tasks): implement task CRUD operations"
git commit -m "feat(tasks): add CSV and Excel export"
git commit -m "feat(tasks): integrate with Gantt chart"
git commit -m "feat(tasks): add keyboard shortcuts and context menu"
```

## Definition of Done
- ✅ All CRUD operations work and persist
- ✅ Inline editing with proper validation
- ✅ Export to CSV/Excel generates valid files
- ✅ Gantt chart reflects task changes
- ✅ No console errors
- ✅ All tests pass
- ✅ Documentation updated

---

**Note**: This plan focuses on practical, achievable enhancements using AG-Grid Community Edition. We avoid enterprise features but implement custom solutions where needed. The emphasis is on creating a production-ready task management system that integrates seamlessly with the existing codebase.