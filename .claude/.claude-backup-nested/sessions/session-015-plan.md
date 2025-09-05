# Session 015: Project Module - COMPLETE PROPER IMPLEMENTATION

**Date**: 2025-09-01
**Goal**: Fix all broken features and properly integrate WBS, CPM, Weather, RAJUK
**Approach**: Test-driven, incremental, with continuous Playwright validation

## 🎯 MISSION CRITICAL OBJECTIVES

### Must Fix Immediately:
1. ✅ Task creation form (context errors)
2. ✅ Kanban persistence
3. ✅ Gantt chart interactivity

### Must Integrate:
1. ✅ WBS generation and display
2. ✅ CPM calculations and critical path
3. ✅ Weather impact visualization
4. ✅ RAJUK workflow tracking

## 📋 IMPLEMENTATION PLAN

### Phase 1: Fix Task Creation (30 mins)
```typescript
// Problem: TaskForm has useFormContext errors
// Solution: Wrap with FormProvider or refactor to standalone form
```

**Tasks:**
1. Fix TaskForm context issues
2. Test with Playwright - create a task
3. Verify task appears in Kanban
4. Verify task saves to database

**Success Criteria:**
- Can create task without errors
- Task appears immediately in UI
- Task persists after refresh

### Phase 2: Integrate WBS Everywhere (45 mins)
```typescript
// Current: WBS service exists but unused
// Goal: Every task shows WBS code
```

**Tasks:**
1. Import WBSService in task creation API
2. Auto-generate WBS codes for new tasks
3. Display WBS in Kanban cards
4. Display WBS in Gantt chart
5. Show WBS hierarchy in task list

**Success Criteria:**
- New tasks get WBS codes (1.1, 1.1.1, etc.)
- WBS visible in all views
- Hierarchy properly maintained

### Phase 3: Build Proper Interactive Gantt (90 mins)
```typescript
// Current: Basic non-interactive gantt-task-react
// Goal: Custom D3.js Gantt with full interactivity
```

**Features Required:**
1. Display WBS codes
2. Show task dependencies with arrows
3. Highlight critical path in red
4. Drag to change dates
5. Click to edit task
6. Right-click context menu
7. Resource allocation bars
8. Weather impact overlay
9. Milestone diamonds
10. Today line

**Components to Create:**
- `/components/projects/gantt/advanced-gantt.tsx`
- `/components/projects/gantt/gantt-task-bar.tsx`
- `/components/projects/gantt/gantt-dependencies.tsx`
- `/components/projects/gantt/gantt-critical-path.tsx`

### Phase 4: Integrate CPM Service (45 mins)
```typescript
// Current: CPM service calculates but not used
// Goal: Real-time critical path highlighting
```

**Tasks:**
1. Call CPM service when tasks load
2. Mark critical tasks in database
3. Highlight critical path in Gantt
4. Show float/slack in task details
5. Display project duration

**Success Criteria:**
- Critical path highlighted in red
- Float values shown for non-critical tasks
- Project end date calculated correctly

### Phase 5: Add Weather Impact (30 mins)
```typescript
// Current: Weather service and component unused
// Goal: Show weather delays in timeline
```

**Tasks:**
1. Integrate weather-impact.tsx in project detail
2. Add weather delay field to tasks
3. Show monsoon periods in Gantt
4. Calculate weather-adjusted dates

**Success Criteria:**
- Weather widget visible
- Monsoon periods marked in Gantt
- Delays reflected in timeline

### Phase 6: Add RAJUK Workflow (30 mins)
```typescript
// Current: RAJUK service and component unused
// Goal: Track approval status
```

**Tasks:**
1. Add RAJUK tab to project detail
2. Integrate rajuk-workflow.tsx
3. Show approval stages
4. Add submission/approval dates

**Success Criteria:**
- RAJUK tab functional
- Can update approval status
- Timeline shows approval milestones

### Phase 7: Fix Kanban Persistence (30 mins)
```typescript
// Current: Drag works but doesn't save
// Goal: Real-time persistence
```

**Tasks:**
1. Add API call on drag end
2. Update task status in database
3. Show loading state during save
4. Handle errors gracefully

**Success Criteria:**
- Drag changes persist
- No lost updates
- Smooth UX

### Phase 8: Complete Testing (60 mins)
**Test Scenarios:**
1. Create project → Create tasks → View in Gantt
2. Drag task in Kanban → Verify saved
3. Edit task dates → See Gantt update
4. View critical path → Verify correct
5. Check weather impact → See delays
6. Update RAJUK status → See in timeline
7. Full user journey test

## 🏗️ TECHNICAL APPROACH

### 1. Use Existing Services
```typescript
import { CPMService } from '@/modules/projects/application/services/cpm.service'
import { WBSService } from '@/modules/projects/application/services/wbs.service'
import { WeatherService } from '@/modules/projects/application/services/weather.service'
import { RajukService } from '@/modules/projects/application/services/rajuk.service'
```

### 2. Custom Gantt Implementation
Instead of `gantt-task-react`, use:
- D3.js for visualization
- React DnD for interactions
- Canvas for performance
- SVG for dependencies

### 3. Real-time Updates
- Use optimistic updates
- WebSocket for multi-user sync
- Debounced auto-save

## 📊 SUCCESS METRICS

### Functionality (Must Have)
- [ ] Task CRUD works without errors
- [ ] WBS codes generated and displayed
- [ ] CPM calculates critical path
- [ ] Gantt is interactive
- [ ] Kanban persists changes
- [ ] Weather impact visible
- [ ] RAJUK workflow trackable

### Performance
- [ ] Gantt loads < 2 seconds
- [ ] Drag updates < 100ms
- [ ] No console errors
- [ ] Smooth animations

### User Experience
- [ ] Intuitive interactions
- [ ] Clear visual hierarchy
- [ ] Responsive design
- [ ] Helpful tooltips
- [ ] Error recovery

## 🚫 WHAT NOT TO DO

1. **DON'T** claim success without testing
2. **DON'T** skip Playwright validation
3. **DON'T** create new components without integration
4. **DON'T** ignore existing services
5. **DON'T** rush implementation

## 🎯 SESSION 015 DELIVERABLES

By end of session, user must be able to:
1. ✅ Create and edit tasks with WBS codes
2. ✅ See interactive Gantt with dependencies
3. ✅ View highlighted critical path
4. ✅ Track weather impacts
5. ✅ Monitor RAJUK approvals
6. ✅ Drag tasks in Kanban with persistence
7. ✅ See all data properly integrated

## 🧪 TESTING CHECKLIST

After each phase:
- [ ] Test with Playwright
- [ ] Check browser console
- [ ] Verify data persistence
- [ ] Test error cases
- [ ] Check mobile responsive

## 💡 IMPLEMENTATION NOTES

### Fix TaskForm Context Error
```typescript
// Wrap form in provider or use standalone form
export function TaskForm({ projectId, task, onClose, onSuccess }: TaskFormProps) {
  // Don't use useFormContext
  // Create form directly with useForm
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: { /* ... */ }
  })
  
  // Return form with provider
  return (
    <FormProvider {...form}>
      {/* form content */}
    </FormProvider>
  )
}
```

### Custom Gantt Structure
```typescript
interface GanttTask {
  id: string
  wbsCode: string // MUST HAVE
  title: string
  start: Date
  end: Date
  progress: number
  dependencies: string[]
  isCritical: boolean // FROM CPM
  weatherDelay: number // FROM WEATHER SERVICE
  resources: string[]
}
```

## 📅 TIME ALLOCATION

- Phase 1: Fix Task Form - 30 mins
- Phase 2: WBS Integration - 45 mins
- Phase 3: Custom Gantt - 90 mins
- Phase 4: CPM Integration - 45 mins
- Phase 5: Weather - 30 mins
- Phase 6: RAJUK - 30 mins
- Phase 7: Kanban Fix - 30 mins
- Phase 8: Testing - 60 mins

**Total: 6 hours**

## 🔥 CRITICAL SUCCESS FACTORS

1. **Test continuously with Playwright**
2. **Use existing services - don't recreate**
3. **Fix one thing at a time**
4. **Verify each fix before moving on**
5. **Document what actually works**

---

**This plan is realistic, achievable, and will deliver actual working features.**