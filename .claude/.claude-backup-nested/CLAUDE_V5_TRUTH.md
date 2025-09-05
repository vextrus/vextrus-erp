# CLAUDE.md V5.0 - The Truth Protocol

> **Session 041 was the turning point. No more lies. Only reality.**

## 🔴 Current Project Status: MOSTLY BROKEN

### What Actually Works (Tested & Verified)
1. ✅ Authentication/Login
2. ✅ View project list
3. ✅ View Gantt chart (read-only)
4. ✅ Theme switching

### What's Completely Broken (The Truth)
1. ❌ Task CREATE - Form might not even exist
2. ❌ Task UPDATE - Changes don't persist
3. ❌ Task DELETE - Might crash
4. ❌ Drag-drop persistence - Doesn't save
5. ❌ Dependencies - UI only, no logic
6. ❌ Critical Path - Wrong calculations
7. ❌ WBS Codes - Fake, not real WBS
8. ❌ Resources - Completely disconnected
9. ❌ Weather Impact - Never integrated
10. ❌ RAJUK Workflow - Never integrated
11. ❌ Export - Buttons do nothing
12. ❌ Real-time updates - WebSocket never connected

## 📊 Honest Metrics

- **Sessions Completed**: 41
- **Features Working**: ~4 out of 150+
- **Dead Code**: ~5000 lines
- **Wasted Time**: 90%
- **Progress**: <5%

## 🎯 The New Mission (Sessions 042-050)

### Fix the Basics FIRST
```yaml
Session 042: Make task CREATE actually work
Session 043: Make task UPDATE actually work  
Session 044: Make task DELETE actually work
Session 045: Make drag-drop SAVE to database
Session 046: Connect existing CPM service
Session 047: Connect existing WBS service
Session 048: Fix all console errors
Session 049: Delete all dead code
Session 050: Document what ACTUALLY works
```

## 🚫 New Development Rules

### 1. The Test-First Mandate
```bash
# BEFORE claiming anything works:
1. Test with Playwright
2. Check the database
3. Refresh and verify
4. Document with screenshots

If ANY fails = IT DOESN'T WORK
```

### 2. The One-Feature Focus
```yaml
Current Task: [ONLY ONE THING]
Status: [BROKEN | FIXING | ACTUALLY WORKS]
Evidence: [REAL SCREENSHOTS]
Database: [ACTUAL QUERY RESULTS]
```

### 3. The Truth Protocol
```javascript
// BANNED:
"Successfully implemented ✅"  // Without testing
"Should work"                  // It doesn't
"Probably works"               // It doesn't

// REQUIRED:
"Tested and verified"
"Database confirms"
"User can actually do this"
```

## 🛠️ What Needs Fixing (Priority Order)

### Level 1: Make CRUD Work
1. Create task button
2. Task form that submits
3. API that saves to database
4. UI that shows new task
5. Refresh that keeps task

### Level 2: Make Gantt Interactive
1. Drag task = update database
2. Change duration = update database
3. Set dependency = update database
4. All changes persist on refresh

### Level 3: Connect Existing Services
```
src/modules/projects/application/services/
├── cpm.service.ts (USE THIS - DON'T REWRITE)
├── wbs.service.ts (USE THIS - DON'T REWRITE)
├── weather.service.ts (USE THIS - DON'T REWRITE)
└── rajuk.service.ts (USE THIS - DON'T REWRITE)
```

## 📈 Real Success Metrics

### What Matters
- Can user create a task? (YES/NO)
- Does it save to database? (YES/NO)
- Does it persist on refresh? (YES/NO)
- Can user update it? (YES/NO)
- Can user delete it? (YES/NO)

### What Doesn't Matter
- Lines of code written
- Number of files created
- Sessions completed
- Features "planned"

## 🧪 The Testing Reality

### Every Change Must Be:
1. **Testable** - Can Playwright verify it?
2. **Verifiable** - Can we query the database?
3. **Persistent** - Does it survive refresh?
4. **Usable** - Can a real user do it?

## 🗑️ Dead Code to Delete

### Services Never Used
- gantt-orchestration.service.ts (400 lines of nothing)
- Most of cpm.service.ts (not connected)
- Most of wbs.service.ts (not connected)

### Components Never Rendered
- weather-impact.tsx
- rajuk-workflow.tsx
- GanttContextMenu.tsx (broken)
- GanttMiniMap.tsx (empty)

### API Endpoints That Don't Work
- /api/v1/projects/[id]/critical-path (returns fake data)
- /api/v1/projects/[id]/wbs (never called)
- /api/v1/projects/[id]/weather (never called)

## 💡 The Lesson Learned

> **"Working software over comprehensive documentation"**
> 
> We built comprehensive documentation for non-working software.
> 
> **Time to reverse it.**

## 🔄 The Comeback Plan

### Phase 1 (Sessions 042-045): Basic CRUD
Make CREATE, UPDATE, DELETE actually work

### Phase 2 (Sessions 046-050): Connect Services  
Use the services we already built

### Phase 3 (Sessions 051-055): Clean House
Delete dead code, fix errors, document reality

### Phase 4 (Sessions 056-060): One Advanced Feature
Pick ONE advanced feature and make it ACTUALLY work

## 📝 Documentation Requirements

### Every Session Must Include:
```markdown
## What We Tried
[Specific task]

## What Actually Happened  
[Real result with evidence]

## What's Still Broken
[Honest list]

## Database Proof
[Actual SQL queries and results]

## Next Priority
[ONE thing to fix next]
```

## 🎮 MCP Server Usage (PROPER)

### Use Serena FIRST
```bash
# Before writing ANYTHING
serena.find_symbol("existing_code")
serena.find_references("what_calls_this")
```

### Use Playwright ALWAYS
```bash
# After EVERY change
playwright.navigate()
playwright.click()
playwright.snapshot()  # PROVE it works
```

### Use Filesystem for CLEANUP
```bash
# Find and delete dead code
grep -r "export" | grep -v "import"  # Unused exports
```

## 🚀 The Real Goal

**By Session 050:**
- User can CRUD tasks ✓ (actually)
- Changes persist ✓ (verified)  
- Gantt updates ✓ (visually confirmed)
- Services connected ✓ (not rewritten)
- Console clean ✓ (no errors)

**NOT by Session 050:**
- AI features
- Real-time collaboration
- Advanced anything
- New architecture
- More complexity

## 🔑 The Success Formula

```
Honest Failure > Fake Success
Working Basics > Broken Advanced  
Connected Code > New Code
Tested Truth > Assumed Function
Simple Solution > Complex Architecture
```

## 📢 The Declaration

From Session 042 forward:

1. **TEST EVERYTHING** - No assumptions
2. **FIX BASICS FIRST** - No advanced features
3. **USE EXISTING CODE** - No rewrites
4. **DOCUMENT REALITY** - No fake success
5. **ONE THING AT A TIME** - No multitasking

---

## Session 041 Summary: The Wake-Up Call

**What we claimed**: "Enterprise-ready Gantt chart"

**The reality**: Basic CRUD doesn't even work

**The lesson**: Stop pretending, start fixing

**The commitment**: Truth-driven development from now on

---

*This is Version 5.0 - The version that admits we need to start over with basics*

**Last Updated**: Session 041 - The Reality Check
**Next Session**: 042 - Make Task CREATE Actually Work
**Time to Working Product**: Unknown (but we'll be honest about it)