# Session 043: Task-Gantt Integration Plan

## Date: 2025-09-04
## Branch: session-043-task-gantt-integration (NEW)

## Mission Statement
**Primary Objective**: Research and implement task management system that aligns with Gantt chart functionality
**Focus**: Get tasks ready for Gantt chart integration with proper data structure and timeline synchronization

## Current State Assessment

### Working Components
- ✅ Task creation and persistence
- ✅ WBS code generation
- ✅ Basic Kanban board view
- ✅ Task model with all necessary fields
- ✅ CPM/WBS services (not integrated)

### Required for Gantt Integration
- ❌ Task hierarchy visualization
- ❌ Dependency relationships display
- ❌ Timeline synchronization
- ❌ Progress tracking on timeline
- ❌ Critical path visualization
- ❌ Resource allocation display
- ❌ Milestone markers

## Research Phase (30 mins)

### 1. Library Evaluation Matrix

#### Option A: dhtmlx-gantt (Currently Installed)
**Pros:**
- Already in package.json (v9.0.14)
- Full-featured Gantt solution
- Good documentation
- Export to MS Project/Primavera

**Cons:**
- Commercial license for production
- Heavy library (500KB+)
- Learning curve

#### Option B: gantt-task-react
**Pros:**
- React-native integration
- Lightweight (~100KB)
- MIT license
- Good TypeScript support

**Cons:**
- Limited features
- Less customization
- No built-in export

#### Option C: Custom D3.js Implementation
**Pros:**
- Full control
- Lightweight
- Perfect integration

**Cons:**
- Time-consuming
- Complex implementation
- Maintenance burden

#### Option D: @bryntum/gantt
**Pros:**
- Most feature-rich
- Excellent performance
- Professional grade

**Cons:**
- Expensive license
- Large bundle size
- Overkill for MVP

### 2. Decision Criteria
- [ ] React/Next.js compatibility
- [ ] TypeScript support
- [ ] Task dependencies
- [ ] Drag-drop rescheduling
- [ ] Critical path calculation
- [ ] Resource management
- [ ] Export capabilities
- [ ] Performance with 100+ tasks
- [ ] Mobile responsiveness

## Implementation Plan

### Phase 1: Data Structure Alignment (1 hour)

1. **Update Task Model Interface**
```typescript
interface GanttTask {
  id: string
  text: string          // task name
  start_date: Date
  end_date: Date
  duration: number
  progress: number
  parent?: string       // parent task ID
  type?: 'task' | 'milestone' | 'project'
  dependencies?: string[]
  resources?: Resource[]
  critical?: boolean
}
```

2. **Create Task Transformer Service**
- Convert EnhancedTask → GanttTask
- Handle date formatting
- Map dependencies
- Calculate durations

3. **Extend Task API**
- Add batch update endpoint
- Add dependency management
- Add resource assignment

### Phase 2: Gantt Component Implementation (2 hours)

1. **Create GanttView Component**
```typescript
// src/components/projects/gantt/GanttView.tsx
- Initialize Gantt library
- Configure timeline settings
- Set up event handlers
- Implement two-way data binding
```

2. **Integrate with Task Store**
- Load tasks from API
- Handle updates
- Sync with Kanban view
- Manage optimistic updates

3. **Configure Gantt Features**
- Timeline scale (day/week/month)
- Task types (task/milestone/summary)
- Progress visualization
- Dependency arrows
- Critical path highlighting

### Phase 3: Interaction Features (1.5 hours)

1. **Drag-Drop Functionality**
- Update task dates on drag
- Validate dependencies
- Recalculate critical path
- Persist to database

2. **Inline Editing**
- Task name editing
- Progress updates
- Duration changes
- Resource assignment

3. **Context Menus**
- Add dependency
- Convert to milestone
- Split task
- Delete task

### Phase 4: Integration Testing (30 mins)

1. **Data Flow Testing**
- Create task → appears in Gantt
- Update in Gantt → reflects in Kanban
- Delete task → updates dependencies
- Batch operations → performance check

2. **UI/UX Testing**
- Responsive design
- Touch interactions
- Keyboard shortcuts
- Accessibility

## Technical Implementation Details

### 1. Gantt Configuration
```javascript
const ganttConfig = {
  columns: [
    { name: "text", label: "Task", tree: true, width: 200 },
    { name: "start_date", label: "Start", align: "center", width: 100 },
    { name: "duration", label: "Duration", align: "center", width: 70 },
    { name: "progress", label: "Progress", align: "center", width: 80 },
  ],
  scales: [
    { unit: "month", step: 1, format: "%F, %Y" },
    { unit: "day", step: 1, format: "%d" }
  ],
  auto_scheduling: true,
  auto_scheduling_strict: true,
  critical_path: true,
  work_time: true,
}
```

### 2. Task Synchronization
```typescript
// Bidirectional sync between Kanban and Gantt
const syncTaskUpdate = async (task: EnhancedTask) => {
  // Update in database
  await updateTask(task);
  
  // Update Gantt view
  gantt.updateTask(task.id);
  
  // Update Kanban view
  refreshKanbanBoard();
  
  // Recalculate critical path
  await calculateCriticalPath(task.projectId);
}
```

### 3. Dependency Management
```typescript
interface TaskDependency {
  source: string  // predecessor task ID
  target: string  // successor task ID
  type: 'FS' | 'SS' | 'FF' | 'SF'  // dependency type
  lag: number     // lag time in days
}
```

## Success Criteria

### Must Have (Session 043)
- [ ] Tasks display on Gantt timeline
- [ ] Basic drag-drop to change dates
- [ ] Dependencies shown as arrows
- [ ] Progress bars on tasks
- [ ] Changes persist to database

### Nice to Have (Future)
- [ ] Critical path highlighting
- [ ] Resource allocation view
- [ ] Export to PDF/Excel
- [ ] Baseline comparison
- [ ] Custom calendars

## Testing Checklist

1. **Functionality Tests**
- [ ] Create task appears in Gantt
- [ ] Drag task updates dates
- [ ] Progress bar reflects percentage
- [ ] Dependencies draw correctly
- [ ] Double-click opens edit dialog

2. **Integration Tests**
- [ ] Gantt ↔ Kanban sync
- [ ] Database persistence
- [ ] API error handling
- [ ] Concurrent user updates

3. **Performance Tests**
- [ ] Load 100+ tasks
- [ ] Smooth scrolling
- [ ] Quick render time
- [ ] Memory usage

## Risk Mitigation

### Potential Issues
1. **Library Compatibility**
   - Solution: Test in isolated component first

2. **Performance with Large Datasets**
   - Solution: Implement virtual scrolling

3. **Date/Timezone Issues**
   - Solution: Use date-fns for all conversions

4. **State Management Complexity**
   - Solution: Use Zustand for centralized state

## Session End Goals

By end of Session 043:
1. ✅ Gantt library selected and integrated
2. ✅ Tasks display on timeline
3. ✅ Basic interactions working
4. ✅ Data persists to database
5. ✅ No console errors
6. ✅ Documentation updated

## Commands for Session Start
```bash
# Create new branch
git checkout -b session-043-task-gantt-integration

# Start dev server
npm run dev

# If choosing new library
npm install [selected-gantt-library]

# Run tests continuously
npm run test:watch
```

## Resources
- [dhtmlx-gantt docs](https://docs.dhtmlx.com/gantt/)
- [gantt-task-react](https://github.com/MaTeMaTuK/gantt-task-react)
- [D3.js Gantt examples](https://observablehq.com/@d3/gantt)
- [MS Project data format](https://docs.microsoft.com/en-us/office-project/)

**Session 043: READY TO START**