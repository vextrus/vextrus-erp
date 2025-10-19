---
name: Execute First
description: When the user asks to implement a feature, fix a bug, or make code changes, activate this skill to focus on direct code execution rather than creating documentation. Use when user says "implement", "fix", "add", "update", "refactor", "build", or similar action-oriented requests. Prevents excessive markdown generation and focuses on writing actual code.
---

# Execute First Skill

## Purpose
Enforce **code-first, documentation-later** development. Write working code immediately, skip unnecessary planning docs.

## Activation Triggers
User says: "implement", "fix", "add", "update", "refactor", "build", "create"

## Workflow

### 1. Quick Planning (2 minutes)
```
[TodoWrite: 3-5 action items]
```
Keep it under 10 lines. No spec files.

### 2. Direct Execution
```
1. Write/Edit code immediately
2. Run tests
3. Verify output
4. Mark todos done
```

### 3. Code Before Docs
- ✅ Write implementation code FIRST
- ✅ Create docs ONLY if user explicitly requests
- ❌ Never generate markdown as primary output
- ❌ No status reports unless requested

## Example

**User**: "Add validation to the invoice creation endpoint"

✅ **Execute First Approach**:
```
1. [TodoWrite: 3 items]
2. [Read invoice files]
3. [Edit validation logic]
4. [Bash: npm test]
5. [Mark done]
```
Time: 10 minutes

❌ **Over-planning**:
```
1. [Create implementation-plan.md]
2. [Read protocol files]
3. [Consult 3 agents]
4. [Create spec files]
5. [30 minutes later: start coding]
```

## Agent Guidelines

**Use agents only for:**
- Refactoring >500 lines
- Security-critical changes
- Performance optimization
- Complex architecture decisions

**Skip agents for:**
- Simple features (<100 lines)
- Bug fixes
- CRUD operations
- Tests
- Config changes

## Tool Usage
- ✅ Read, Write, Edit code directly
- ✅ Bash for tests, builds, git
- ✅ Grep/Glob for searches
- ❌ No protocol-loading commands
- ❌ No specs/ directory files

## Success Criteria
- Code written in <5 minutes
- <3 agents total
- 0-1 markdown files
- Simple tasks done in <30 minutes

## Override
User must explicitly say:
- "use full compounding cycle"
- "create a spec first"

Default: **EXECUTE FIRST**
