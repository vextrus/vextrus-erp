# Task: Integrate TanStack Table into Production Routes

## Priority
HIGH - Critical for production deployment

## Context
TanStack Table components have been built and tested but are NOT integrated into the actual application. Users still see AG-Grid when logging in and browsing projects. This task will properly replace AG-Grid in production routes.

## Current State
- ✅ 25+ TanStack components created
- ✅ Performance tested (10k+ tasks)  
- ✅ Localization implemented
- ❌ NOT integrated into actual routes
- ❌ Test pages created instead of updating production

## Success Criteria
1. Replace AG-Grid in `/projects/[id]/tasks` route
2. Remove all AG-Grid imports from production code
3. Verify with authenticated user sessions
4. All CRUD operations working
5. Real-time sync functional

## Implementation Strategy

### Phase 1: Discovery with Serena MCP
```bash
# Find all TaskPanel imports
mcp__serena__search_for_pattern "import.*TaskPanel"
mcp__serena__find_symbol "TaskPanel"

# Find project route files
mcp__serena__search_for_pattern "projects/\[id\]"
```

### Phase 2: Replace Imports
```typescript
// FROM:
import { TaskPanel } from '@/components/projects/tasks/TaskPanel'

// TO:
import { TaskPanelTanStack as TaskPanel } from '@/components/projects/tasks/TaskPanelTanStack'
```

### Phase 3: Authenticated Testing
```typescript
// Playwright with login
test('TanStack in production', async ({ page }) => {
  // Login
  await page.goto('/login')
  await page.fill('[name="email"]', process.env.TEST_EMAIL)
  await page.fill('[name="password"]', process.env.TEST_PASSWORD)
  await page.click('button[type="submit"]')
  
  // Navigate to project
  await page.click('text=Projects')
  await page.click('tr:first-child')
  
  // Verify TanStack Table
  await expect(page.locator('.vextrus-table')).toBeVisible()
})
```

## Files to Update

### Primary Targets
- `src/app/projects/[id]/page.tsx`
- `src/app/projects/[id]/tasks/page.tsx`
- `src/components/projects/ProjectDetailView.tsx`
- `src/components/projects/ProjectTasksView.tsx`

### Agent Delegation
- Use `general-purpose` agent for finding all imports
- Use `code-review` agent after replacements
- Use `service-documentation` to update CLAUDE.md

## Testing Checklist
- [ ] Login works
- [ ] Projects list loads
- [ ] Project detail shows TanStack
- [ ] Tasks load from database
- [ ] Create task works
- [ ] Edit inline works
- [ ] Delete task works
- [ ] Export CSV works
- [ ] Bengali toggle works
- [ ] WebSocket sync works

## Branch Requirements
- Branch: `feature/tanstack-production`
- Base: `feature/test-enterprise-grid`

## Definition of Done
- AG-Grid completely removed from production
- All routes use TanStack Table
- Zero console errors
- All tests passing
- Documentation updated

## Work Log

### Session Planning
- **Date**: 2025-09-05
- **Status**: Task created after identifying integration gap
- **Previous**: Built components in isolation
- **Next**: Proper production integration

### Session Setup & Configuration
- **Date**: 2025-09-05
- **Status**: Environment prepared
- **Actions**: 
  - Fixed Unicode encoding issue in session-start.py hook (ensure_ascii=True)
  - Created git branch `feature/integrate-tanstack-production`
  - Activated task in current_task.json with proper branch alignment
  - Saved admin credentials to .env.local
  - Updated memory with workflow learnings (branch before task activation)
- **Ready**: Task environment fully configured for next session

### TanStack Integration Implementation
- **Date**: 2025-09-05
- **Status**: Integration completed with TypeScript issues remaining
- **Actions**:
  - ✅ Replaced TaskPanelEnhanced with TaskPanelTanStack in page-client.tsx
  - ✅ Updated component usage to use TanStack version
  - ✅ Removed AG-Grid dependencies from package.json
  - ✅ Deleted AG-Grid component files and themes
  - ✅ Created Playwright tests for integration verification
  - ⚠️ TypeScript build errors remain in unrelated files (per user request to skip)
- **Result**: TanStack Table successfully integrated into production routes, AG-Grid completely removed

---

*This task corrects the approach from Session 50 where components were built but not integrated.*