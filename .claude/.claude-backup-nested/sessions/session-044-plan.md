# Session 044: Complete Task Panel Reconstruction Plan

## Date: 2025-09-04
## Branch: session-044-task-panel-reconstruction (NEW)

## Mission Statement
**Primary Objective**: Remove the broken Kanban implementation and rebuild the task panel with an enterprise-grade library that integrates seamlessly with dhtmlx-gantt
**Focus**: Create a fully functional task management system that serves as the foundation for Gantt chart operations

## Critical Analysis of Current State

### What's Broken (TO BE REMOVED)
- ❌ Custom Kanban board - drag-drop doesn't persist
- ❌ Task cards - incomplete data binding
- ❌ State management - no proper sync with database
- ❌ Task forms - context errors and crashes
- ❌ No real-time updates between views

### What Works (TO KEEP)
- ✅ Database schema (EnhancedTask model)
- ✅ Task API endpoints (GET, POST, PUT)
- ✅ WBS code generation
- ✅ CPM service integration
- ✅ dhtmlx-gantt implementation
- ✅ Task dependencies structure

## Research Phase: Enterprise Task Libraries

### Option A: AG-Grid Enterprise
**Pros:**
- Industry-leading data grid
- Built-in editing, filtering, sorting
- Tree data support (hierarchical tasks)
- Excel-like features
- Excellent performance with 10,000+ rows
- Export to Excel/CSV
- Master-detail views

**Cons:**
- Commercial license required
- Learning curve
- Heavy bundle size

**Integration with Gantt:** ⭐⭐⭐⭐⭐

### Option B: Tanstack Table (React Table v8)
**Pros:**
- Headless UI (full control)
- Lightweight core
- TypeScript first
- Virtual scrolling
- Column resizing/reordering
- Free and open source

**Cons:**
- Requires more setup
- No built-in UI components
- Less out-of-box features

**Integration with Gantt:** ⭐⭐⭐⭐

### Option C: DevExtreme DataGrid
**Pros:**
- Complete UI solution
- Built-in editing modes
- Tree list component
- Export capabilities
- Good documentation
- Material design support

**Cons:**
- Commercial license
- DevExpress ecosystem lock-in
- Moderate bundle size

**Integration with Gantt:** ⭐⭐⭐⭐

### Option D: PrimeReact DataTable + TreeTable
**Pros:**
- Rich feature set
- Tree data support
- In-cell editing
- Lazy loading
- Good theming
- Reasonable pricing

**Cons:**
- PrimeReact specific
- Some performance issues with large datasets

**Integration with Gantt:** ⭐⭐⭐⭐

### 🎯 RECOMMENDATION: AG-Grid Enterprise
**Why:** 
- Best performance for large task lists
- Tree structure matches WBS hierarchy
- Excel-like editing familiar to project managers
- Can handle 10,000+ tasks without lag
- Export features align with enterprise needs
- Best integration potential with dhtmlx-gantt

## Implementation Strategy Using MCP Powerhouse Workflow

### Phase 1: Analysis & Cleanup (1 hour)
**Agent: general-purpose**
```
Task: Analyze all task-related components and create removal list
- Find all Kanban components
- Identify reusable code
- List all task-related API calls
- Document current data flow
```

**Serena MCP:**
```
1. find_symbol("TaskKanban")
2. find_symbol("TaskCard") 
3. find_referencing_symbols("KanbanBoard")
4. List all files in src/components/projects/tasks/
```

### Phase 2: Remove Broken Components (30 mins)
**Filesystem MCP:**
```
1. Delete src/components/projects/tasks/TaskKanban.tsx
2. Delete src/components/projects/tasks/TaskCard.tsx
3. Delete related CSS/styles
4. Clean up imports
```

### Phase 3: Install & Configure AG-Grid (45 mins)
**Bash MCP:**
```bash
npm install ag-grid-react ag-grid-enterprise ag-grid-community
npm install @ag-grid-enterprise/all-modules
```

**Create Core Structure:**
```typescript
// src/components/projects/tasks/TaskGrid.tsx
- AG-Grid configuration
- Column definitions
- Tree data setup
- Event handlers

// src/components/projects/tasks/TaskGridAdapter.tsx
- Convert EnhancedTask → AG-Grid format
- Handle hierarchy (parent-child)
- Map dependencies
```

### Phase 4: Implement Task Grid Features (2 hours)

#### 4.1 Column Configuration
```typescript
const columnDefs = [
  { field: 'wbsCode', headerName: 'WBS', width: 100, pinned: 'left' },
  { field: 'title', headerName: 'Task Name', width: 300, editable: true },
  { field: 'status', headerName: 'Status', cellEditor: 'agSelectCellEditor' },
  { field: 'plannedStartDate', headerName: 'Start', cellEditor: 'agDateCellEditor' },
  { field: 'plannedEndDate', headerName: 'End', cellEditor: 'agDateCellEditor' },
  { field: 'duration', headerName: 'Duration', editable: true },
  { field: 'progress', headerName: 'Progress %', cellEditor: 'agNumberCellEditor' },
  { field: 'taskPriority', headerName: 'Priority', cellEditor: 'agSelectCellEditor' },
  { field: 'assignedTo', headerName: 'Assigned', cellRenderer: 'agGroupCellRenderer' },
  { field: 'estimatedCost', headerName: 'Budget', cellEditor: 'agNumberCellEditor' },
  { field: 'actualCost', headerName: 'Actual Cost', cellEditor: 'agNumberCellEditor' },
  { field: 'dependencies', headerName: 'Dependencies', cellRenderer: 'DependencyRenderer' },
]
```

#### 4.2 Tree Data Structure
```typescript
interface TaskNode {
  id: string
  data: EnhancedTask
  children?: TaskNode[]
  level: number
  path: string[]
}
```

#### 4.3 Core Features to Implement
- [x] Hierarchical task display (tree structure)
- [x] Inline editing with validation
- [x] Bulk operations (multi-select)
- [x] Context menus
- [x] Keyboard navigation
- [x] Copy/paste support
- [x] Undo/redo functionality
- [x] Export to Excel/CSV
- [x] Print view

### Phase 5: Database Integration (1.5 hours)

#### 5.1 Real-time Updates
```typescript
// src/hooks/useTaskSync.ts
- WebSocket connection for real-time updates
- Optimistic updates
- Conflict resolution
- Batch operations
```

#### 5.2 API Integration
```typescript
// Update handlers
onCellValueChanged: async (params) => {
  await updateTask(params.data.id, params.colDef.field, params.newValue)
  recalculateCriticalPath()
  syncWithGantt()
}
```

### Phase 6: Gantt Synchronization (1 hour)

#### 6.1 Bidirectional Sync
```typescript
// src/services/TaskSyncService.ts
class TaskSyncService {
  syncToGantt(task: EnhancedTask)
  syncFromGantt(ganttTask: GanttTask)
  batchSync(tasks: EnhancedTask[])
  handleConflict(gridTask, ganttTask)
}
```

#### 6.2 Event Bridge
```typescript
// Grid → Gantt
grid.addEventListener('cellValueChanged', syncToGantt)
grid.addEventListener('rowDragEnd', updateHierarchy)

// Gantt → Grid
gantt.attachEvent('onAfterTaskUpdate', syncToGrid)
gantt.attachEvent('onAfterTaskDrag', updateGridDates)
```

### Phase 7: Advanced Features (1.5 hours)

#### 7.1 Custom Cell Renderers
- Progress bar renderer
- Status badge renderer
- Priority color coding
- Dependency link renderer
- Resource avatar renderer

#### 7.2 Custom Cell Editors
- Date picker with calendar
- Multi-select for resources
- Dependency selector
- Rich text for descriptions

#### 7.3 Toolbar Actions
- Add task/subtask
- Delete selected
- Indent/outdent
- Move up/down
- Expand/collapse all
- Filter by status/priority
- Search tasks
- Export options

### Phase 8: Testing with Playwright MCP (1 hour)

**Test Scenarios:**
```typescript
// tests/task-grid.spec.ts
1. Create task → verify in grid
2. Edit cell → verify persistence
3. Drag task → verify hierarchy update
4. Delete task → verify dependencies update
5. Bulk select → verify operations
6. Export → verify file download
7. Grid ↔ Gantt sync verification
```

## Implementation Checklist

### Core Functionality
- [ ] Remove all Kanban components
- [ ] Install AG-Grid Enterprise
- [ ] Create TaskGrid component
- [ ] Configure columns with editors
- [ ] Implement tree data structure
- [ ] Setup inline editing
- [ ] Add validation rules
- [ ] Implement save handlers

### Data Management
- [ ] Create TaskGridAdapter
- [ ] Implement CRUD operations
- [ ] Add optimistic updates
- [ ] Setup error handling
- [ ] Implement undo/redo
- [ ] Add batch operations

### UI Features
- [ ] Custom cell renderers
- [ ] Context menus
- [ ] Keyboard shortcuts
- [ ] Toolbar with actions
- [ ] Status bar with counts
- [ ] Column chooser
- [ ] Advanced filters
- [ ] Quick search

### Integration
- [ ] Grid ↔ Database sync
- [ ] Grid ↔ Gantt sync
- [ ] Real-time updates
- [ ] Conflict resolution
- [ ] Performance optimization

### Testing
- [ ] Unit tests for adapters
- [ ] Integration tests for sync
- [ ] E2E tests with Playwright
- [ ] Performance benchmarks
- [ ] User acceptance tests

## File Structure

```
src/components/projects/tasks/
├── TaskGrid.tsx              # Main grid component
├── TaskGridAdapter.ts         # Data transformation
├── TaskGridColumns.ts         # Column definitions
├── TaskGridToolbar.tsx        # Toolbar component
├── editors/
│   ├── DateEditor.tsx
│   ├── DependencyEditor.tsx
│   ├── ResourceEditor.tsx
│   └── StatusEditor.tsx
├── renderers/
│   ├── ProgressRenderer.tsx
│   ├── StatusRenderer.tsx
│   ├── PriorityRenderer.tsx
│   └── DependencyRenderer.tsx
└── services/
    ├── TaskSyncService.ts
    ├── TaskValidation.ts
    └── TaskExport.ts
```

## Success Criteria

### Must Have (Session 044-045)
- ✅ All Kanban code removed
- ✅ AG-Grid installed and configured
- ✅ Tasks display in hierarchical grid
- ✅ Inline editing works
- ✅ Changes persist to database
- ✅ Basic Grid ↔ Gantt sync

### Should Have (Session 046)
- ✅ Custom renderers/editors
- ✅ Bulk operations
- ✅ Export functionality
- ✅ Keyboard navigation
- ✅ Real-time updates

### Nice to Have (Future)
- ✅ Baseline comparison
- ✅ Resource leveling
- ✅ Task templates
- ✅ Recurring tasks
- ✅ Task dependencies visualization

## Risk Mitigation

### Potential Issues & Solutions

1. **License Cost**
   - Solution: Start with trial, plan for license purchase
   - Fallback: Use Tanstack Table if budget issue

2. **Learning Curve**
   - Solution: Focus on core features first
   - Use AG-Grid examples and documentation

3. **Performance with Large Datasets**
   - Solution: Implement virtual scrolling
   - Use server-side pagination if needed

4. **Sync Complexity**
   - Solution: Single source of truth (database)
   - Queue updates to prevent conflicts

## Commands for Session Start

```bash
# Create new branch
git checkout -b session-044-task-panel-reconstruction

# Start dev server
npm run dev

# Open Prisma Studio to monitor database
npx prisma studio

# Install AG-Grid
npm install ag-grid-react ag-grid-enterprise ag-grid-community

# Run Playwright for testing
npx playwright test --ui
```

## Resources
- [AG-Grid Documentation](https://www.ag-grid.com/react-data-grid/)
- [AG-Grid Tree Data](https://www.ag-grid.com/react-data-grid/tree-data/)
- [AG-Grid Cell Editors](https://www.ag-grid.com/react-data-grid/cell-editing/)
- [Enterprise Features](https://www.ag-grid.com/react-data-grid/licensing/)

## Session End Goals

By end of Session 044:
1. ❌ All Kanban code removed
2. ✅ AG-Grid installed and configured
3. ✅ Basic task grid displaying
4. ✅ Inline editing functional
5. ✅ Database persistence working
6. ✅ Ready for Gantt integration

## Multi-Session Plan

**Session 044**: Remove Kanban, Install AG-Grid, Basic Grid
**Session 045**: Advanced features, Custom editors/renderers
**Session 046**: Grid-Gantt synchronization
**Session 047**: Testing, optimization, and polish

**Session 044: READY TO START**

---

*Note: This plan uses the MCP Powerhouse Workflow with Serena for code analysis, Playwright for testing, and systematic micro-task implementation. Each phase is designed to be completed and tested before moving to the next.*