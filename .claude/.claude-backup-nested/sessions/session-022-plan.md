# Session 022 - Gantt Chart Deep Fix & Theme Integration

## Session Overview
**Objective**: Complete systematic fix of Gantt chart with full functionality and theme support
**Approach**: Test-driven development with Playwright MCP
**Duration**: 4-5 hours
**Priority**: 🔴 CRITICAL - Must achieve functional Gantt chart

## Starting Context
- Gantt chart UI improved but non-functional
- No theme support (dark/light)
- Task bars not visible properly
- No interactions working
- Timeline showing wrong dates
- 68 tasks loaded but not rendered correctly

## Phase 1: Comprehensive Testing & Analysis (45 mins)

### 1.1 Visual Testing with Playwright
```javascript
// Test sequence with screenshots
1. Navigate to Gantt chart
2. Take screenshot in light mode
3. Toggle dark mode
4. Take screenshot in dark mode
5. Check console for errors
6. Analyze DOM structure
7. Test each toolbar button
8. Capture network requests
9. Test mouse interactions
10. Document all issues found
```

### 1.2 Component Analysis
- [ ] Inspect canvas rendering output
- [ ] Check task data structure
- [ ] Verify date calculations
- [ ] Analyze theme variables usage
- [ ] Review event handlers
- [ ] Check state management

### 1.3 Issue Documentation
Create comprehensive list of:
- Visual bugs (with screenshots)
- Functional failures
- Theme issues
- Performance problems
- Console errors/warnings

## Phase 2: Theme Integration (30 mins)

### 2.1 Theme Context Integration
```typescript
// Add theme awareness to Gantt components
- Use useTheme() hook
- Replace hardcoded colors with CSS variables
- Support dark/light mode switching
- Ensure canvas respects theme
```

### 2.2 Color System Update
```typescript
// Define theme-aware colors
const COLORS = {
  light: {
    background: 'var(--background)',
    foreground: 'var(--foreground)',
    task: 'var(--primary)',
    grid: 'var(--border)',
    // ... etc
  },
  dark: {
    background: 'var(--background)',
    foreground: 'var(--foreground)',
    task: 'var(--primary)',
    grid: 'var(--border)',
    // ... etc
  }
}
```

### 2.3 Canvas Theme Rendering
- [ ] Pass theme to GanttRenderer
- [ ] Update all color references
- [ ] Test theme switching
- [ ] Screenshot both themes

## Phase 3: Core Functionality Fixes (90 mins)

### 3.1 Fix Task Bar Rendering
```typescript
// Priority fixes:
1. Calculate correct task positions
2. Use project actual dates (Sep 2025 - Sep 2026)
3. Make bars visible and correctly sized
4. Show progress accurately
5. Display task names on bars
```

### 3.2 Fix Timeline
```typescript
// Timeline must show:
1. Correct date range from project
2. Proper month/week/day labels
3. Highlighted weekends
4. Today marker
5. Scrollable timeline
```

### 3.3 Enable Interactions
```typescript
// Implement working:
1. Click to select task
2. Drag to reschedule
3. Zoom in/out
4. Pan timeline
5. Hover tooltips
6. Context menus
```

### 3.4 Add Dependencies
```typescript
// Show task relationships:
1. Draw dependency arrows
2. Support FS, SS, FF, SF types
3. Auto-route to avoid overlaps
4. Highlight on hover
```

## Phase 4: Critical Path & Advanced Features (60 mins)

### 4.1 Critical Path Integration
```typescript
// Use existing CPM service:
1. Import CPMService
2. Calculate critical path
3. Highlight critical tasks in red
4. Show float time
5. Update on changes
```

### 4.2 Resource Display
```typescript
// Show resource allocation:
1. Display assigned resources on tasks
2. Show resource conflicts
3. Resource histogram below chart
4. Over-allocation warnings
```

### 4.3 WBS Integration
```typescript
// Use WBS service:
1. Show WBS codes
2. Maintain hierarchy
3. Expand/collapse groups
4. Summary tasks
```

## Phase 5: Export & Polish (45 mins)

### 5.1 Export Functionality
```typescript
// Implement exports:
1. PNG export (canvas.toBlob)
2. PDF export (jsPDF)
3. CSV export
4. MS Project XML (if time)
```

### 5.2 Performance Optimization
- [ ] Virtual scrolling for 500+ tasks
- [ ] Layer caching
- [ ] Dirty rectangle tracking
- [ ] RequestAnimationFrame optimization

### 5.3 Final Testing
- [ ] Complete user flow test
- [ ] Performance metrics
- [ ] Theme switching test
- [ ] Export verification
- [ ] Cross-browser check

## Testing Checkpoints

### After Each Phase:
1. Take screenshots (light & dark)
2. Test interactions
3. Check console
4. Verify performance
5. Document issues

### Playwright Test Sequences:

```javascript
// Test 1: Theme Support
await page.click('[data-testid="theme-toggle"]')
await page.screenshot({ path: 'gantt-dark.png' })
await page.click('[data-testid="theme-toggle"]')
await page.screenshot({ path: 'gantt-light.png' })

// Test 2: Task Interaction
await page.click('canvas')
await page.mouse.down()
await page.mouse.move(100, 0)
await page.mouse.up()
await page.screenshot({ path: 'task-dragged.png' })

// Test 3: Zoom Controls
await page.click('[data-testid="zoom-in"]')
await page.screenshot({ path: 'zoomed-in.png' })

// Test 4: View Modes
await page.selectOption('[data-testid="view-mode"]', 'month')
await page.screenshot({ path: 'month-view.png' })
```

## Success Criteria

### Must Have:
- ✅ Theme support (dark/light) working
- ✅ Task bars visible and correctly positioned
- ✅ Timeline showing project dates (Sep 2025-2026)
- ✅ Click to select tasks
- ✅ Drag to reschedule
- ✅ Zoom/pan controls working
- ✅ No console errors
- ✅ 60fps performance

### Should Have:
- ✅ Dependency arrows
- ✅ Critical path highlighting
- ✅ Resource display
- ✅ Export to PNG/PDF
- ✅ Hover tooltips
- ✅ Context menus

### Nice to Have:
- ✅ MS Project export
- ✅ Baseline comparison
- ✅ Resource leveling
- ✅ Undo/redo working

## File Focus List

### Primary Files to Modify:
1. `GanttRenderer.ts` - Core rendering logic
2. `GanttContainer.tsx` - Theme integration
3. `ganttTypes.ts` - Type definitions
4. `GanttToolbar.tsx` - Control functionality
5. `GanttTaskList.tsx` - Task display

### New Files to Create:
1. `GanttTheme.ts` - Theme configuration
2. `GanttExport.ts` - Export functionality
3. `GanttInteractions.ts` - Interaction handlers

## Risk Mitigation

### Potential Issues:
1. **Canvas performance**: Use virtual scrolling
2. **Theme switching lag**: Cache theme colors
3. **Large datasets**: Implement pagination
4. **Complex dependencies**: Simplify routing algorithm
5. **Export quality**: Use high DPI for exports

## Documentation Requirements

### During Development:
- Screenshot after each major fix
- Document theme color mappings
- Create interaction flow diagrams
- List all keyboard shortcuts
- Note performance metrics

### End of Session:
- Complete test report
- Visual comparison (before/after)
- Performance benchmarks
- Known limitations
- Next steps

## Definition of Done

The Gantt chart is considered complete when:
1. Works in both light and dark themes
2. All tasks visible with correct dates
3. Drag-to-reschedule functional
4. Dependencies shown
5. Critical path highlighted
6. Zoom/pan working
7. Export produces usable output
8. No console errors
9. Performance > 30fps with 100 tasks
10. Playwright tests all passing

## Time Allocation

- Phase 1 (Testing): 45 mins
- Phase 2 (Theme): 30 mins
- Phase 3 (Core): 90 mins
- Phase 4 (Advanced): 60 mins
- Phase 5 (Polish): 45 mins
- **Total**: 4.5 hours

## Starting Commands

```bash
# Terminal 1
npm run dev

# Terminal 2
npx prisma studio

# In Claude
1. Load this plan
2. Start Playwright MCP
3. Navigate to project Gantt
4. Begin Phase 1 testing
```

## Notes for Session 022

**CRITICAL**: 
- Test EVERYTHING with Playwright before claiming it works
- Fix theme support FIRST - it affects everything else
- One fix at a time, test immediately
- Take screenshots continuously
- If something doesn't work after 30 mins, try different approach
- Use existing services (CPM, WBS) - don't reinvent

**Remember**: The goal is a WORKING Gantt chart, not perfect code. Functionality > Elegance for this session.