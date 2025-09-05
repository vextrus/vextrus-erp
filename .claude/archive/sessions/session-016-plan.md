# Session 016 - Project Module COMPLETE Fix & Implementation

## 🔴 CRITICAL: FIX BROKEN FEATURES FIRST

## Session Overview
**Primary Goal**: Fix ALL broken features from Sessions 014-015, then implement remaining features
**Approach**: Playwright-driven development with immediate testing
**Success Criteria**: All features working and tested with Playwright

## 🚨 BLOCKING ISSUES TO FIX FIRST

### Issue 1: Task Form Cannot Accept Input
**Problem**: Cannot type in "Task Title" field
**Location**: `/src/components/tasks/task-form.tsx`
**Test First**:
```javascript
1. browser_navigate to project tasks page
2. browser_click "Add Task" button
3. browser_snapshot to see form
4. browser_type in title field
5. Check browser_console_messages for errors
```
**Likely Fixes**:
- Check register() function from react-hook-form
- Verify input element has proper name attribute
- Check for conflicting event handlers
- Test with browser_evaluate to set value directly

### Issue 2: Task Creation Fails
**Problem**: Form won't submit even with valid data
**Test Approach**:
```javascript
1. Fix input issue first
2. browser_fill_form with all required fields
3. browser_click "Create Task"
4. Check browser_network_requests for API call
5. Check browser_console_messages for validation errors
```

### Issue 3: WBS Code Generation
**Problem**: Untested, probably not working
**Test Approach**:
```javascript
1. After fixing task creation
2. Create a task successfully
3. Check if WBS code appears in task card
4. Verify in database with Prisma Studio
```

### Issue 4: Kanban Drag-Drop Not Working
**Problem**: Drag operation fails, persistence untested
**Test Approach**:
```javascript
1. browser_snapshot to see kanban board
2. Try browser_drag from TODO to IN_PROGRESS
3. If fails, use browser_evaluate to trigger drag events
4. Check browser_network_requests for PUT request
5. Refresh and verify persistence
```

## 📋 COMPLETE TASK LIST

### Phase 1: Fix Critical Issues (MUST COMPLETE FIRST)
- [ ] 1. Fix Task Form input issue
- [ ] 2. Fix Task Creation submission
- [ ] 3. Verify WBS generation works
- [ ] 4. Fix Kanban drag-drop and persistence

### Phase 2: Implement Remaining Features (ONLY AFTER PHASE 1)
- [ ] 5. Build Custom Interactive Gantt Chart with D3.js
- [ ] 6. Integrate CPM Service for Critical Path
- [ ] 7. Add Weather Impact Visualization
- [ ] 8. Integrate RAJUK Workflow Component

### Phase 3: Comprehensive Testing
- [ ] 9. Test all features with Playwright MCP
- [ ] 10. Document working features

## 🎭 PLAYWRIGHT TESTING STRATEGY

### Test Every Change Pattern
```javascript
// Before making any code change
1. browser_snapshot - Current state
2. browser_console_messages - Existing errors
3. Make ONE small change
4. browser_snapshot - See effect
5. browser_console_messages - New errors?
6. Test interaction
7. Only proceed if working
```

### Debug Form Issues Pattern
```javascript
// For form input problems
1. browser_snapshot to see form structure
2. browser_evaluate to check input properties:
   () => {
     const input = document.querySelector('input[name="title"]');
     return {
       value: input?.value,
       disabled: input?.disabled,
       readOnly: input?.readOnly,
       events: Object.keys(input || {}).filter(k => k.startsWith('on'))
     }
   }
3. Try browser_type directly
4. If fails, try browser_evaluate to set value
5. Check what's preventing input
```

### API Testing Pattern
```javascript
// For every API integration
1. Make the UI action (click, type, drag)
2. browser_network_requests to see API call
3. Check request URL, method, payload
4. Check response status and data
5. Verify UI updates with browser_snapshot
6. Refresh page and verify persistence
```

## 📁 Key Files to Fix

### Priority 1 - Form Issues
```
/src/components/tasks/task-form.tsx
- Fix input field registration
- Fix form submission
- Test validation
```

### Priority 2 - Kanban Issues
```
/src/components/projects/kanban/kanban-board.tsx
- Debug drag-drop handlers
- Test API integration
- Verify state updates
```

### Priority 3 - API Endpoints
```
/src/app/api/v1/projects/[id]/tasks/route.ts
- Test WBS generation
- Verify response format

/src/app/api/v1/tasks/[id]/route.ts
- Test status updates
- Verify persistence
```

## 🛠️ Implementation Order (AFTER FIXES)

### 5. Custom Gantt Chart with D3.js
**Location**: Create new `/src/components/projects/gantt/d3-gantt-chart.tsx`
**Requirements**:
- Interactive task bars (drag to resize/move)
- Dependencies visualization
- Critical path highlighting
- Zoom and pan
**Test**: Create tasks, drag bars, verify dates update

### 6. CPM Service Integration
**Location**: Use existing `/src/modules/projects/application/services/cpm.service.ts`
**Requirements**:
- Calculate critical path
- Show in Gantt chart
- Update on task changes
**Test**: Create dependencies, verify critical path highlights

### 7. Weather Impact
**Location**: Use existing `/src/components/projects/weather/weather-impact.tsx`
**Requirements**:
- Show weather delays
- Update task dates
- Visual indicators
**Test**: Add weather data, see impact on schedule

### 8. RAJUK Workflow
**Location**: Use existing `/src/components/projects/rajuk/rajuk-workflow.tsx`
**Requirements**:
- Show approval stages
- Update project status
- Track submissions
**Test**: Move through workflow stages

## 🎯 Success Metrics

### Must Have (Session Cannot End Without These)
- ✅ Can create tasks with proper input
- ✅ Tasks show WBS codes
- ✅ Can drag tasks between columns
- ✅ Changes persist after refresh
- ✅ No console errors

### Should Have
- ✅ Gantt chart displays tasks
- ✅ Critical path visible
- ✅ Weather impact shown
- ✅ RAJUK workflow integrated

### Nice to Have
- ✅ All animations smooth
- ✅ Loading states proper
- ✅ Error messages helpful

## 📝 Testing Checklist

Before ANY commit:
- [ ] Run full Playwright test sequence
- [ ] Check browser_console_messages - ZERO errors
- [ ] Check browser_network_requests - All succeed
- [ ] Refresh page - Data persists
- [ ] Test in both light/dark themes

## 🚫 Common Mistakes to Avoid

1. **DON'T** assume a fix works without testing
2. **DON'T** move to next task if current is broken
3. **DON'T** make multiple changes at once
4. **DON'T** ignore console errors
5. **DON'T** skip network request verification

## 💡 Debugging Tips

### For Input Issues
- Check if form is in controlled vs uncontrolled mode
- Verify register() is called with correct name
- Check for preventDefault() in parent handlers
- Use React DevTools to inspect component state

### For Drag-Drop Issues
- Check if drag handlers are attached
- Verify drop zones are configured
- Check for pointer-events CSS issues
- Test with simpler drag library first

### For API Issues
- Log request body before sending
- Check CORS and auth headers
- Verify Prisma schema matches
- Test with Postman/curl first

## 🎬 Session Start Sequence

1. Read this plan completely
2. Start dev server: `npm run dev`
3. Open Prisma Studio: `npx prisma studio`
4. Launch Playwright testing
5. Test current state with browser_navigate
6. Document what's broken
7. Fix issues ONE AT A TIME
8. Test after EVERY change
9. Only move forward when current item works

## 📊 Progress Tracking

Use TodoWrite to track:
1. Current task being fixed
2. Test results for each fix
3. Remaining issues
4. Time spent on each issue

## 🏁 Session Completion Criteria

### Minimum for Success
- All 4 critical issues fixed
- At least 2 new features implemented
- Full Playwright test passes

### Ideal Completion
- All 8 tasks completed
- Zero console errors
- All features tested and working
- Documentation updated

## 💭 Final Notes

**REMEMBER**: 
- The form issues are likely simple - missing proper props or handlers
- WBS generation code exists, just needs to be called correctly
- Kanban drag-drop might need a different approach (click to select, then click destination)
- Don't overthink - test first, fix based on what you see

**CRITICAL**: Do NOT claim success without Playwright verification!

## Session Status: 📋 READY TO EXECUTE