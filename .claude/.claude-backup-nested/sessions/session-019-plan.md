# Session 019: Advanced Gantt & Project Module Enhancement with Agent-Based Development

## 🎯 Primary Objectives
Transform the Project module into a production-ready system with advanced Gantt visualization, proper CPM implementation, WBS workflow, and enhanced Resource/Milestone/RAJUK integration using systematic agent-based development.

## 🤖 Agent-Based Development Approach

### Agent Structure
```
.claude/agents/
├── gantt-agent/           # Gantt chart enhancements
├── cpm-agent/             # Critical Path Method implementation
├── wbs-agent/             # Work Breakdown Structure
├── resource-agent/        # Resource management
├── kanban-agent/          # Kanban board improvements
├── data-agent/            # Database seeding and management
└── test-agent/            # Playwright testing automation
```

### Agent Workflow
1. Each agent handles specific micro-tasks (<100 LOC)
2. Agents communicate through standardized interfaces
3. Continuous validation with Playwright MCP
4. Systematic progress tracking with TodoWrite

## 📋 Pre-Session Setup

### 1. Create Agent Directory Structure
```bash
mkdir -p .claude/agents/{gantt-agent,cpm-agent,wbs-agent,resource-agent,kanban-agent,data-agent,test-agent}
```

### 2. Initialize Agent Prompts
Each agent will have:
- `prompt.md` - Specific instructions and context
- `tasks.md` - Micro-task breakdown
- `validation.md` - Success criteria and tests

### 3. Verify Environment
- [ ] PostgreSQL and Redis running
- [ ] Dev server: `npm run dev`
- [ ] Playwright MCP ready
- [ ] Login as admin@vextrus.com

## 🔧 Critical Enhancements Required

### 1. Advanced Gantt Visualization (gantt-agent)

#### Research Phase (30 mins)
```markdown
Agent Task: Research and evaluate Gantt libraries
Options to evaluate:
1. DHTMLX Gantt - https://dhtmlx.com/docs/products/dhtmlxGantt/
2. Frappe Gantt - https://frappe.io/gantt
3. Bryntum Gantt - https://bryntum.com/products/gantt/
4. SyncFusion Gantt - https://www.syncfusion.com/react-ui-components/react-gantt-chart
5. Continue with D3.js custom implementation

Criteria:
- React/Next.js compatibility
- CPM support
- Resource management
- Export capabilities
- Performance with 100+ tasks
- Licensing and cost
```

#### Implementation Tasks
```typescript
// Priority 1: Core Functionality
1. Implement WBS hierarchy visualization
   - Collapsible/expandable groups
   - Parent-child relationships
   - Summary tasks

2. Add interactive features
   - Click task → detailed modal
   - Drag to reschedule
   - Right-click context menu
   - Keyboard navigation

3. Enhance dependency visualization
   - Show lag/lead times
   - Different arrow styles (FS, SS, SF, FF)
   - Constraint indicators

// Priority 2: Advanced Features
4. Resource allocation overlay
   - Resource histogram
   - Over-allocation highlighting
   - Resource leveling

5. Baseline comparison
   - Planned vs actual bars
   - Variance indicators
   - Delay analysis
```

### 2. CPM Implementation (cpm-agent)

#### Algorithm Enhancement
```typescript
// File: src/modules/projects/services/cpm-advanced.service.ts

interface CPMTask {
  id: string
  duration: number
  dependencies: string[]
  earlyStart: number
  earlyFinish: number
  lateStart: number
  lateFinish: number
  totalFloat: number
  freeFloat: number
  isCritical: boolean
}

class AdvancedCPMService {
  // Forward pass calculation
  calculateForwardPass(tasks: CPMTask[]): void
  
  // Backward pass calculation
  calculateBackwardPass(tasks: CPMTask[]): void
  
  // Float calculation
  calculateFloats(tasks: CPMTask[]): void
  
  // Critical path identification
  identifyCriticalPath(tasks: CPMTask[]): string[]
  
  // Schedule compression
  performScheduleCompression(tasks: CPMTask[], targetDuration: number): CPMTask[]
  
  // Resource leveling
  performResourceLeveling(tasks: CPMTask[], resources: Resource[]): CPMTask[]
}
```

#### Visualization
```typescript
// Display CPM metrics on Gantt
- Show ES, EF, LS, LF for each task
- Highlight total float
- Color code based on criticality
- Display schedule variance
```

### 3. WBS Workflow (wbs-agent)

#### Hierarchy Management
```typescript
interface WBSNode {
  code: string          // "1.2.3"
  level: number         // 3
  title: string
  children: WBSNode[]
  rollupProgress: number
  rollupCost: number
  rollupDuration: number
}

// Features to implement:
1. Auto-generate WBS codes
2. Drag-drop to reorganize
3. Bulk operations (collapse all, expand to level)
4. Export to MS Project format
5. Import from Excel
```

### 4. Kanban Board Enhancement (kanban-agent)

#### Smooth Drag-Drop
```typescript
// Use @dnd-kit/sortable for smooth DnD
1. Install: npm install @dnd-kit/core @dnd-kit/sortable
2. Implement smooth animations
3. Add drop zones indicators
4. Show ghost cards while dragging
5. Persist changes immediately
```

#### Advanced Features
```typescript
1. WIP limits per column
2. Swimlanes by priority/resource
3. Card aging indicators
4. Quick filters
5. Bulk operations
6. Time tracking integration
```

### 5. Resource Management (resource-agent)

#### Resource Allocation Matrix
```typescript
interface ResourceAllocation {
  resourceId: string
  taskId: string
  allocation: number    // percentage
  period: DateRange
  cost: number
  isOverAllocated: boolean
}

// Visualizations:
1. Resource histogram
2. Allocation heatmap
3. Utilization charts
4. Cost tracking
5. Skill matrix
```

### 6. Milestone Enhancement

#### Advanced Milestone Features
```typescript
1. Milestone dependencies
2. Payment milestones with invoicing
3. Milestone dashboard
4. Critical milestone alerts
5. Milestone achievement tracking
```

### 7. RAJUK Integration

#### Workflow Implementation
```typescript
interface RAJUKSubmission {
  id: string
  projectId: string
  submissionType: 'INITIAL' | 'DESIGN' | 'MODIFICATION'
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  documents: Document[]
  timeline: RAJUKTimeline
  fees: RAJUKFees
}

// Features:
1. Document checklist
2. Submission tracking
3. Approval timeline
4. Fee calculation
5. Compliance scoring
```

### 8. Weather Impact Visualization

```typescript
// Weather overlay on Gantt
1. Show weather-sensitive tasks
2. Display historical weather data
3. Forecast impact on schedule
4. Monsoon season highlighting
5. Delay probability calculation
```

## 📊 Data Seeding Requirements (data-agent)

### Enhanced Seed Data
```typescript
// File: prisma/seed-enhanced.ts

1. Add 5 more projects with varying complexity
2. Create 200+ tasks with realistic dependencies
3. Add 50+ resources with skills and availability
4. Create milestone payment schedules
5. Add RAJUK submission history
6. Include weather impact data for past year
7. Add actual progress data for some tasks
```

## 🎭 Playwright Testing Sequences (test-agent)

### Test Scenarios
```javascript
// Gantt Interaction Tests
test('Complete Gantt workflow', async () => {
  // Navigate to Gantt
  await playwright.navigate('/projects/[id]?tab=gantt')
  
  // Test WBS expansion
  await playwright.click('[data-wbs="1.0"]')
  await playwright.wait(500)
  
  // Test task editing
  await playwright.click('[data-task-id="123"]')
  await playwright.fillForm({
    duration: '10',
    progress: '50'
  })
  
  // Test drag-drop rescheduling
  await playwright.drag('[data-task-id="123"]', { x: 100, y: 0 })
  
  // Verify CPM recalculation
  await playwright.snapshot()
  await playwright.verifyText('Critical Path: 45 days')
})

// Kanban Persistence Test
test('Kanban changes persist', async () => {
  await playwright.navigate('/projects/[id]?tab=tasks')
  
  // Drag task between columns
  await playwright.drag('[data-task="task-1"]', '[data-column="IN_PROGRESS"]')
  
  // Refresh and verify
  await playwright.refresh()
  await playwright.verifyElement('[data-column="IN_PROGRESS"] [data-task="task-1"]')
})
```

## 📈 Success Metrics

### Must Achieve (Session Cannot End Without)
- [ ] Advanced Gantt with CPM visualization working
- [ ] WBS hierarchy with expand/collapse
- [ ] Smooth Kanban drag-drop that persists
- [ ] Resource allocation visible on Gantt
- [ ] Click task opens detailed modal
- [ ] At least 10 Playwright tests passing

### Should Achieve
- [ ] Milestone markers on Gantt
- [ ] RAJUK workflow integrated
- [ ] Weather impact visualization
- [ ] Baseline comparison view
- [ ] Export to Excel/PDF working

### Nice to Have
- [ ] Import from MS Project
- [ ] Resource leveling algorithm
- [ ] Monte Carlo simulation
- [ ] Multi-project view
- [ ] Mobile responsive Gantt

## 🏗️ Implementation Order

### Phase 1: Foundation (2 hours)
1. Set up agent structure
2. Research and decide on Gantt approach
3. Enhance seed data
4. Create base test suite

### Phase 2: Core Enhancements (3 hours)
1. Implement advanced Gantt features
2. Integrate CPM properly
3. Add WBS hierarchy
4. Fix Kanban persistence

### Phase 3: Integration (2 hours)
1. Connect Resources to Gantt
2. Add Milestone visualization
3. Integrate RAJUK workflow
4. Add Weather overlay

### Phase 4: Polish & Testing (1 hour)
1. Performance optimization
2. Complete Playwright tests
3. Fix any bugs
4. Documentation update

## 🚫 Out of Scope
- Multi-currency support
- Advanced reporting engine
- Mobile app development
- Real-time collaboration
- AI-powered predictions (save for later session)

## 📁 Files to Create/Modify

### Create
1. `.claude/agents/*/prompt.md` - Agent instructions
2. `src/components/projects/gantt/gantt-advanced.tsx` - New Gantt component
3. `src/components/projects/gantt/task-detail-modal.tsx`
4. `src/components/projects/wbs/wbs-tree.tsx`
5. `src/modules/projects/services/cpm-advanced.service.ts`
6. `prisma/seed-enhanced.ts`
7. `tests/e2e/gantt.test.ts`

### Modify
1. `src/app/(dashboard)/projects/[id]/page.tsx`
2. `src/components/projects/kanban/kanban-board.tsx`
3. `src/components/projects/resources/resource-matrix.tsx`
4. `src/modules/projects/application/services/cpm.service.ts`

## 🎯 Definition of Done
- [ ] Gantt chart is truly interactive
- [ ] CPM calculations visible and accurate
- [ ] WBS hierarchy fully functional
- [ ] Kanban smooth and persistent
- [ ] Resources properly allocated
- [ ] All tests passing
- [ ] Performance <100ms for 100 tasks
- [ ] No console errors
- [ ] Code properly organized with agents

## 💡 System Prompt for Session 019

```
You are an AI assistant specialized in systematic software development using agent-based architecture. For Session 019, you will:

1. CREATE specialized agents in .claude/agents/ for each major task area
2. BREAK DOWN all work into micro-tasks (<100 LOC each)
3. USE Playwright MCP for continuous testing after each change
4. IMPLEMENT advanced Gantt visualization with proper CPM, WBS, and resource management
5. ENHANCE the Kanban board with smooth drag-drop and persistence
6. INTEGRATE RAJUK workflow and weather impact visualization
7. MAINTAIN systematic progress tracking with TodoWrite
8. TEST every feature immediately after implementation
9. FOCUS on production-ready quality, not quick fixes
10. DOCUMENT all decisions and agent interactions

Priority Order:
1. Fix critical issues (Gantt interactivity, Kanban persistence)
2. Enhance with advanced features (CPM, WBS, Resources)
3. Integrate additional modules (RAJUK, Weather)
4. Optimize performance and polish

Remember: Quality over quantity. It's better to have fewer features working perfectly than many features partially broken.
```

## 🔄 Contingency Plans

### If Gantt becomes too complex:
- Switch to DHTMLX or Frappe Gantt
- Use their built-in CPM features
- Focus on integration rather than building from scratch

### If agents become overwhelming:
- Start with just 3 agents (gantt, test, data)
- Gradually add more as needed
- Keep agent communication simple

### If time runs out:
- Prioritize Gantt and Kanban fixes
- Leave RAJUK/Weather for Session 020
- Ensure what's built works perfectly

---
*Session Plan Created: 2025-01-02*
*Estimated Duration: 8 hours*
*Priority: CRITICAL - Core functionality must work*
*Approach: Systematic agent-based development with continuous testing*