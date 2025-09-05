# Session Management System v2.0

## Overview
A systematic approach to managing development sessions for Vextrus ERP, ensuring continuity, quality, and progress tracking across all work.

## Session Structure

### Directory Organization
```
.claude/
├── agents/                    # Specialized agents
├── sessions/                  # Session documentation
│   ├── session-XXX-context.md # State snapshot
│   ├── session-XXX-plan.md    # Execution plan
│   ├── session-XXX-tasks.json # Micro-tasks
│   ├── session-XXX-tests.md   # Test cases
│   ├── session-XXX-completed.md # Results
│   └── session-XXX-review.md  # Assessment
├── memory/                    # Persistent knowledge
│   ├── architecture.md        # System design
│   ├── patterns.md           # Code patterns
│   ├── decisions.md          # Decision log
│   └── errors.md             # Known issues
└── workflows/                 # Reusable workflows
    ├── feature-development.md
    ├── bug-fix.md
    └── performance-optimization.md
```

## Session Lifecycle

### 1. Session Initialization
```yaml
Steps:
  1. Load previous session context
  2. Review current system state
  3. Check unfinished tasks
  4. Update context snapshot
  5. Set session objectives
```

### 2. Planning Phase
```yaml
Duration: 15-30 minutes
Activities:
  - Define clear objectives
  - Break down into micro-tasks (<100 LOC each)
  - Identify required agents
  - Set success criteria
  - Estimate time requirements
```

### 3. Execution Phase
```yaml
Duration: 2-4 hours
Activities:
  - Execute tasks sequentially
  - Test immediately after each change
  - Document progress in real-time
  - Handle blockers immediately
  - Maintain quality gates
```

### 4. Validation Phase
```yaml
Duration: 30 minutes
Activities:
  - Run comprehensive tests
  - Verify all objectives met
  - Check for regressions
  - Validate performance
  - Ensure documentation updated
```

### 5. Review Phase
```yaml
Duration: 15 minutes
Activities:
  - Document what worked
  - Identify what failed
  - Calculate success metrics
  - Extract lessons learned
  - Plan next session
```

## Session File Templates

### session-XXX-context.md
```markdown
# Session XXX Context

## System State
- **Branch**: feature/module-name
- **Last Commit**: abc123
- **Build Status**: ✅ Passing / ❌ Failing
- **Test Coverage**: XX%
- **Known Issues**: [List]

## Previous Session Summary
- Completed: [What was done]
- Pending: [What remains]
- Blockers: [Any issues]

## Current Focus
- Module: [Name]
- Feature: [What we're building]
- Priority: [Why now]

## Available Resources
- Agents: [Which ones needed]
- MCP Servers: [Which ones active]
- Time Budget: [Hours allocated]
```

### session-XXX-plan.md
```markdown
# Session XXX Plan

## 🎯 Objectives
1. [SMART goal 1]
2. [SMART goal 2]
3. [SMART goal 3]

## 📋 Task Breakdown

### Task 1: [Name]
- **Agent**: [Who handles this]
- **Estimated Time**: [Minutes]
- **Dependencies**: [What's needed]
- **Success Criteria**: [How we know it's done]
- **Test Cases**: [How to verify]

### Task 2: [Name]
[Same structure]

## 🔄 Execution Order
1. Task X (prerequisite)
2. Task Y (depends on X)
3. Task Z (parallel with Y)

## ⚠️ Risk Mitigation
- Risk: [What could go wrong]
  Mitigation: [How to handle]

## 📊 Success Metrics
- [ ] All tests pass
- [ ] No console errors
- [ ] Performance targets met
- [ ] Documentation updated
```

### session-XXX-tasks.json
```json
{
  "sessionId": "XXX",
  "tasks": [
    {
      "id": "task-1",
      "title": "Fix API async params",
      "agent": "backend-specialist",
      "status": "pending",
      "estimatedMinutes": 30,
      "actualMinutes": null,
      "files": [
        "src/app/api/v1/tasks/[id]/route.ts"
      ],
      "tests": [
        "Should return 200 for valid request",
        "Should handle errors gracefully"
      ],
      "blockers": [],
      "output": null
    }
  ],
  "metrics": {
    "totalTasks": 5,
    "completed": 0,
    "failed": 0,
    "blocked": 0,
    "timeSpent": 0,
    "timeEstimated": 180
  }
}
```

### session-XXX-tests.md
```markdown
# Session XXX Test Cases

## Pre-Session Tests
- [ ] Development server starts
- [ ] Database connection works
- [ ] No TypeScript errors
- [ ] Existing tests pass

## Feature Tests

### Test Case 1: [Name]
```javascript
// Playwright test
await page.goto('/feature');
await page.click('[data-testid="action"]');
await expect(page.locator('.result')).toBeVisible();
```

### Test Case 2: [Name]
[Test code]

## Regression Tests
- [ ] Previous features still work
- [ ] Performance not degraded
- [ ] No new console errors
- [ ] API backwards compatible

## Post-Session Tests
- [ ] All new tests pass
- [ ] Coverage increased or maintained
- [ ] Build succeeds
- [ ] Deployment ready
```

## Session Workflow Automation

### session-manager.py
```python
#!/usr/bin/env python3
"""
Session Management Automation for Claude Code
"""

import json
import os
from datetime import datetime
from pathlib import Path

class SessionManager:
    def __init__(self):
        self.base_path = Path(".claude/sessions")
        self.current_session = self.get_current_session()
    
    def get_current_session(self):
        """Find the latest session number"""
        sessions = list(self.base_path.glob("session-*-plan.md"))
        if not sessions:
            return 1
        numbers = [int(s.stem.split('-')[1]) for s in sessions]
        return max(numbers) + 1
    
    def create_session(self, objectives):
        """Initialize a new session"""
        session_num = f"{self.current_session:03d}"
        
        # Create context file
        context = self.gather_context()
        self.write_file(f"session-{session_num}-context.md", context)
        
        # Create plan file
        plan = self.generate_plan(objectives)
        self.write_file(f"session-{session_num}-plan.md", plan)
        
        # Create tasks file
        tasks = self.break_down_tasks(objectives)
        self.write_file(f"session-{session_num}-tasks.json", 
                       json.dumps(tasks, indent=2))
        
        # Create tests file
        tests = self.generate_tests(tasks)
        self.write_file(f"session-{session_num}-tests.md", tests)
        
        print(f"✅ Session {session_num} initialized")
        return session_num
    
    def complete_session(self, session_num):
        """Finalize a session"""
        # Gather results
        results = self.gather_results(session_num)
        
        # Create completion report
        report = self.generate_report(results)
        self.write_file(f"session-{session_num:03d}-completed.md", report)
        
        # Create review
        review = self.generate_review(results)
        self.write_file(f"session-{session_num:03d}-review.md", review)
        
        # Update memory
        self.update_memory(results)
        
        print(f"✅ Session {session_num:03d} completed")
    
    def gather_context(self):
        """Gather current system context"""
        # Check git status
        # Check build status
        # Check test status
        # Get previous session summary
        pass
    
    def generate_plan(self, objectives):
        """Generate session plan from objectives"""
        pass
    
    def break_down_tasks(self, objectives):
        """Break objectives into micro-tasks"""
        pass
    
    def generate_tests(self, tasks):
        """Generate test cases for tasks"""
        pass
    
    def gather_results(self, session_num):
        """Collect session results"""
        pass
    
    def generate_report(self, results):
        """Generate completion report"""
        pass
    
    def generate_review(self, results):
        """Generate session review"""
        pass
    
    def update_memory(self, results):
        """Update persistent memory with learnings"""
        pass
    
    def write_file(self, filename, content):
        """Write file to sessions directory"""
        filepath = self.base_path / filename
        filepath.write_text(content)

if __name__ == "__main__":
    manager = SessionManager()
    
    # Example: Start new session
    session = manager.create_session([
        "Fix Gantt chart rendering",
        "Enable drag-drop persistence",
        "Add critical path visualization"
    ])
    
    # Work happens here...
    
    # Complete session
    manager.complete_session(session)
```

## Session Best Practices

### 1. Always Start Fresh
```bash
# Clear previous context
claude clear

# Load session context
claude "Load session XXX context"

# Set objectives
claude "Today's objectives: ..."
```

### 2. Maintain Focus
- One module at a time
- Complete before moving on
- Test immediately
- Document as you go

### 3. Quality Gates
Before marking any task complete:
- [ ] Code compiles
- [ ] Tests pass
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Documentation updated

### 4. Time Management
```yaml
Recommended Session Duration: 3-4 hours
  - Planning: 30 min
  - Execution: 2-3 hours
  - Testing: 30 min
  - Documentation: 30 min
```

### 5. Context Preservation
```yaml
Between Sessions:
  - Commit all changes
  - Document decisions
  - Update task status
  - Note blockers
  - Plan next steps
```

## Session Metrics

### Success Indicators
- **Completion Rate**: Tasks completed / Tasks planned
- **Quality Score**: Tests passed / Total tests
- **Time Efficiency**: Actual time / Estimated time
- **Bug Rate**: Bugs introduced / Features added
- **Documentation Coverage**: Documented / Total changes

### Performance Tracking
```json
{
  "session": "039",
  "metrics": {
    "tasksPlanned": 10,
    "tasksCompleted": 8,
    "testsWritten": 25,
    "testsPassed": 25,
    "bugsFixed": 5,
    "bugsIntroduced": 0,
    "linesAdded": 500,
    "linesRemoved": 200,
    "timeSpent": 210,
    "timeEstimated": 180
  },
  "score": 85
}
```

## Integration with Agents

### Agent Assignment
Each session task is assigned to the most appropriate agent:
- Complex tasks may involve multiple agents
- Agents collaborate through the session manager
- Results are aggregated and reviewed

### Agent Handoffs
```yaml
Task Flow:
  1. architect designs
  2. specialist implements
  3. test-engineer verifies
  4. code-reviewer approves
  5. documentation-writer documents
```

## Current Session Status

### Session 039: Ultimate Gantt Fix
```yaml
Status: PLANNED
Objectives:
  - Fix all Next.js 15 async param issues
  - Make Gantt chart fully functional
  - Enable drag-drop persistence
  - Add critical path visualization
  
Agents Required:
  - bug-hunter (diagnosis)
  - backend-specialist (API fixes)
  - frontend-specialist (UI fixes)
  - test-engineer (validation)
  
Estimated Duration: 4 hours
Priority: CRITICAL
```