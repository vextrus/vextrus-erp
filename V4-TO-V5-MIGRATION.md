# V4.0 → V5.0 Migration Guide

**Quick Start**: Restart Claude Code → Context drops from 53k → 34k → Start using V5.0

---

## What Changed (Summary)

| Component | V4.0 | V5.0 | Action |
|-----------|------|------|--------|
| **CLAUDE.md** | User reference | Claude instructions | Read CLAUDE.md for workflow |
| **Skills** | 4 skills (broken) | 0 skills + Slash commands | Use `/checkpoint`, `/review`, `/commit` |
| **GitHub** | MCP (19.6k tokens) | `gh` CLI (0 tokens) | Restart session for savings |
| **Agents** | Documented | Enforced | Use agent cards, run reviews |
| **Context** | 53.6k (27%) | 34k (17%) | Monitor with statusline |

---

## Step-by-Step Migration

### 1. Immediate (Before Next Task)

**Restart Claude Code Session**:
- Closes current session
- Loads V5.0 configuration
- GitHub MCP disabled (19.6k saved)
- New statusline calculations active

**Verify Changes**:
```bash
# Check context
/context
# Should show: MCP 0k (was 19.6k)

# Check statusline
# Should show: V5.0 workflow, accurate baseline
```

---

### 2. Learn New Slash Commands

Replace broken skills with working commands:

**V4.0 (Broken)**:
- Skills: "checkpoint", "Bangladesh", "GraphQL" → Never triggered

**V5.0 (Working)**:
- `/checkpoint` → Create enforced checkpoint
- `/review` → Run kieran-typescript-reviewer
- `/commit` → Guided commit workflow

**Try Now**:
```
/checkpoint
# Claude will read template and create checkpoint

/review
# Claude will run quality review on changed files

/commit
# Claude will guide you through proper commit
```

---

### 3. Update Workflow Understanding

**Read CLAUDE.md** (V5.0 version):
- Step-by-step instructions FOR CLAUDE
- Task classification (simple/medium/complex)
- When to use agents
- Quality gates requirements

**Key Differences**:
| Aspect | V4.0 | V5.0 |
|--------|------|------|
| Checkpoints | Optional | Mandatory for medium+ |
| Reviews | Suggested | Mandatory (≥7/10) |
| Quality Gates | Mentioned | Enforced (must pass) |
| Git Workflow | Manual | Guided via /commit |

---

### 4. Use Agent Cards

**V4.0**: Had to search `.claude/agents/AGENT-DIRECTORY.md` (long file)

**V5.0**: Quick reference cards in `.claude/agent-cards/`:
- `kieran-typescript-reviewer.md` - Code quality (MANDATORY)
- `security-sentinel.md` - Security audit
- `performance-oracle.md` - Performance

**Usage**:
```bash
# Quick reference before invoking agent
cat .claude/agent-cards/kieran-typescript-reviewer.md

# Then invoke as described in card
```

---

### 5. Checkpoint Creation (New Process)

**V4.0 Way** (Incomplete):
```
Create checkpoint.
[Claude would create incomplete checkpoint with TODO sections]
```

**V5.0 Way** (Enforced):
```
/checkpoint

[Claude will]:
1. Read .claude/templates/checkpoint-template.md
2. Run quality gates (pnpm build && npm test)
3. Run kieran-typescript-reviewer agent
4. Fill ALL sections completely
5. Save to .claude/checkpoints/checkpoint-[name].md
6. Provide commit commands
```

**Result**: Complete checkpoint, no TODO sections, reviews done

---

### 6. Git Workflow (New Process)

**V4.0 Way** (Manual):
```
git add .
git commit -m "update stuff"
git push
# No quality gates, poor messages
```

**V5.0 Way** (Guided):
```
/commit

[Claude will]:
1. Run quality gates FIRST
2. If failures → STOP, fix issues
3. If pass → Provide exact commit commands
4. Proper message format
5. Post-commit verification
```

**Result**: Quality gates enforced, proper messages, GitHub Actions triggered

---

### 7. GitHub Operations (New Approach)

**V4.0** (MCP - 19.6k overhead):
```
/mcp enable github
[26 tools loaded, massive context]
```

**V5.0** (`gh` CLI - 0 overhead):
```bash
# List issues
gh issue list --limit 10

# Create issue
gh issue create --title "..." --body "..."

# Create PR
gh pr create --title "..." --body "..."

# Check Actions
gh run list --limit 3
```

**Result**: Same functionality, 19.6k tokens saved

---

## Breaking Changes

### What No Longer Works

1. **Skills Auto-Trigger**: Skills archived (broken in CC 2.0.26)
   - **Use**: Slash commands instead

2. **GitHub MCP**: Disabled to save tokens
   - **Use**: `gh` CLI via Bash

3. **Incomplete Checkpoints**: No longer allowed
   - **Use**: Enforced template, all sections required

4. **Skipping Reviews**: Not allowed for medium+ tasks
   - **Use**: Mandatory reviews in checkpoints

---

## New Requirements

### For Medium Tasks (4-8 hours)
**NOW MANDATORY**:
- ✅ TodoWrite plan (8-12 tasks)
- ✅ kieran-typescript-reviewer review (≥7/10)
- ✅ Enforced checkpoint (all sections filled)
- ✅ Quality gates pass before commit

### For Complex Tasks (2-5 days)
**NOW MANDATORY**:
- ✅ GitHub issue created/linked
- ✅ Daily checkpoints with reviews
- ✅ Multiple agent reviews per checkpoint
- ✅ Final comprehensive checkpoint

### For All Commits
**NOW MANDATORY**:
- ✅ `pnpm build` passes (0 errors)
- ✅ `npm test` passes (all green)
- ✅ Proper commit message format

---

## Example: Continuing Finance Task

**Current State**: Finance task in progress, V4.0 checkpoints exist

**V5.0 Migration**:

1. **Restart Session**:
   ```
   # Close current session
   # Reopen Claude Code
   # Context drops to 34k
   ```

2. **Continue Task**:
   ```
   Continue finance module production-ready task from latest checkpoint.

   Reference:
   - Latest: .claude/checkpoints/checkpoint-phase2a-critical-fixes-complete.md
   - Issue: #2

   Next phase: [describe what's next]

   Use V5.0 workflow:
   - /checkpoint for new checkpoints
   - /review before each checkpoint
   - /commit when ready
   ```

3. **Create V5.0 Checkpoint**:
   ```
   /checkpoint

   [Claude creates enforced checkpoint with]:
   - All sections filled
   - Quality reviews run
   - No TODO sections
   - Commit commands provided
   ```

4. **Commit with V5.0**:
   ```
   /commit

   [Claude verifies quality gates first]
   [Then provides exact commands]
   ```

---

## File Locations (Changed)

| File Type | V4.0 Location | V5.0 Location |
|-----------|---------------|---------------|
| **Checkpoints** | Root or checkpoints/ | `.claude/checkpoints/` |
| **Templates** | N/A | `.claude/templates/` |
| **Commands** | N/A | `.claude/commands/` |
| **Agent Cards** | N/A | `.claude/agent-cards/` |
| **Skills** | `.claude/skills/` | `.claude/skills-archive-v4/` |
| **Workflow Guide** | `.claude/V4.0-WORKFLOW-GUIDE.md` | `CLAUDE.md` |

---

## What to Keep

**Still Valid from V4.0**:
- ✅ 33 agents (still available)
- ✅ VEXTRUS-PATTERNS.md (17 sections)
- ✅ Agent directory structure
- ✅ GitHub Actions (checkpoint-sync, pr-quality-gates)
- ✅ Quality targets (9.5/10, 90% coverage)

**Just use differently**: Enforced workflow, slash commands, agent cards

---

## Quick Reference Card

**Print This** (or save as reference):

### V5.0 Workflow Commands
```bash
# Checkpoints
/checkpoint          # Create enforced checkpoint

# Reviews
/review             # Run code quality review

# Commits
/commit             # Guided commit workflow

# GitHub
gh issue list       # List issues
gh pr create        # Create PR
gh run list         # Check Actions

# Quality Gates
pnpm build          # TypeScript (must pass)
npm test            # Tests (must pass)
```

### Task Classification
- **Simple** (<4h): Implement → Commit
- **Medium** (4-8h): Plan → Implement → Review → Checkpoint → Commit
- **Complex** (2-5 days): Research → Plan → Daily execution + checkpoints

### Mandatory Reviews
- **Medium+**: kieran-typescript-reviewer (≥7/10)
- **Auth/RBAC**: + security-sentinel
- **Caching**: + performance-oracle

---

## Troubleshooting

### "Skills not working"
- **Expected**: Skills broken in CC 2.0.26
- **Solution**: Use slash commands instead

### "GitHub MCP not available"
- **Expected**: Disabled in V5.0
- **Solution**: Use `gh` CLI via Bash

### "Checkpoint incomplete"
- **Expected**: V5.0 enforces completeness
- **Solution**: Fill all sections, run reviews

### "Context still high"
- **Expected**: Need session restart
- **Solution**: Close and reopen Claude Code

---

## Success Checklist

After migration, verify:
- [ ] Session restarted (context ~34k)
- [ ] Slash commands work (`/checkpoint`, `/review`, `/commit`)
- [ ] CLAUDE.md read (understand V5.0 workflow)
- [ ] Agent cards reviewed (know when to use)
- [ ] `gh` CLI tested (GitHub operations work)
- [ ] Quality gates enforced (can't commit with errors)

---

**Migration Complete?** Try creating a checkpoint with `/checkpoint` - if it enforces all sections and runs reviews, you're ready!

---

**V5.0** | **Enforced Workflow** | **Actually Works**

**From**: 53k context, broken skills, manual workflow
**To**: 34k context, working commands, enforced quality

**Status**: ✅ READY TO USE
