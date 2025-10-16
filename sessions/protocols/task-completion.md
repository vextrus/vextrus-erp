# Task Completion Protocol

**Purpose**: Quality-gated task completion for Vextrus ERP development
**Last Updated**: 2025-10-16 (Modernized for CC 2.0.19 + SpecKit)

---

## 1. Pre-Completion Checks

**Verify before proceeding**:

- [ ] All success criteria checked off in task file
- [ ] All work completed (no pending items)
- [ ] Work log updated with final session
- [ ] No uncommitted changes (check `git status`)

**NOTE**: Don't commit yet - quality gates may modify files

---

## 2. Run Quality Gates

**Non-negotiable**: Always run these before completion

### A. Automated Quality Gates (Required)

```bash
# Required for ALL tasks (no exceptions)
/review                   # code-review-ai plugin - Code quality
/security-scan           # security-scanning plugin - Security analysis
/test                    # unit-testing plugin - All tests

# Verify build
pnpm build                # Must pass with no errors
```

**Pass Criteria**:
- `/review`: No critical issues, max 5 warnings
- `/security-scan`: No critical or high vulnerabilities
- `/test`: All tests pass, coverage ≥ baseline
- `build`: Clean build, no TypeScript errors

### B. Advanced Reviews (Complex/Critical Tasks)

**For medium or complex tasks**, use specialized agents:

**Architecture Review**:
```bash
Task tool: compounding-engineering:architecture-strategist
# Reviews: System design changes, pattern compliance, scalability
```

**Code Quality (Language-Specific)**:
```bash
Task tool: compounding-engineering:kieran-typescript-reviewer
# Reviews: TypeScript conventions, naming, simplicity, quality

# For Python services:
Task tool: compounding-engineering:kieran-python-reviewer
```

**Performance Analysis**:
```bash
Task tool: compounding-engineering:performance-oracle
# Reviews: Bottlenecks, caching, optimization opportunities
```

**Security Audit**:
```bash
Task tool: compounding-engineering:security-sentinel
# Reviews: Threat modeling, vulnerabilities, defensive coding
```

**Data Integrity** (if database changes):
```bash
Task tool: compounding-engineering:data-integrity-guardian
# Reviews: Migration safety, referential integrity, privacy
```

**Simplification Review** (final pass):
```bash
Task tool: compounding-engineering:code-simplicity-reviewer
# Reviews: Unnecessary complexity, over-engineering, YAGNI
```

### C. Domain-Specific Validations

**Bangladesh ERP Compliance** (if applicable):
- [ ] VAT rates correct (15%, 10%, 7.5%, 5%)
- [ ] NBR Mushak-6.3 format compliant
- [ ] TIN/BIN validation implemented
- [ ] Currency (BDT) handling correct

**GraphQL Federation** (if schema changes):
- [ ] Federation directives correct
- [ ] Schema composition valid
- [ ] No breaking changes
- [ ] Tested in Apollo Sandbox

**Event Sourcing** (if event-driven):
- [ ] Event versioning implemented
- [ ] Event handlers idempotent
- [ ] Projections updated
- [ ] Replay logic tested

**Database Performance** (if DB changes):
- [ ] Indexes added for foreign keys
- [ ] Query performance tested
- [ ] No N+1 queries
- [ ] Migration tested (up/down)

---

## 3. Documentation Updates

### Service Documentation

**If service interfaces changed**:

```bash
# Update service architecture docs
/docs

# OR use docs-architect agent for comprehensive updates
Task tool: documentation-generation:docs-architect
```

**Update**:
- `services/[name]/CLAUDE.md` - Architecture, patterns, decisions
- GraphQL schema documentation
- API examples (if new endpoints)

### Feature Specification

**If spec-driven feature**:

```bash
# Update feature spec with actual implementation
vi sessions/specs/[feature-name].md
```

**Add**:
- Implementation notes
- Deviations from original spec
- Lessons learned
- Known limitations

---

## 4. Compounding: Codify Learnings

**For complex or significant tasks** (always recommended):

```bash
Task tool: compounding-engineering:feedback-codifier
```

**Capture insights** (answer these questions):

1. **What patterns worked well?**
   - Architectural decisions
   - Code patterns
   - Tools/libraries

2. **What could be simplified?**
   - Over-engineering identified
   - Unnecessary abstractions
   - Cleaner approaches

3. **What should be automated?**
   - Repetitive tasks
   - Manual processes
   - Testing workflows

4. **Knowledge gaps?**
   - What wasn't documented?
   - What was hard to understand?
   - What needs better docs?

5. **Future improvements?**
   - Technical debt introduced
   - Refactoring opportunities
   - Pattern extraction

**Update knowledge base**:
- [ ] Service CLAUDE.md (patterns, decisions)
- [ ] sessions/knowledge/vextrus-erp/ (if new patterns)
- [ ] Shared library documentation
- [ ] memory/constitution.md (if new standards)

---

## 5. Task Archival

### Update Task Status

Update task file frontmatter:

```yaml
---
task: feature-name
branch: feature/branch-name
status: completed                      # Update this
completed: 2025-10-16                  # Add this date
---
```

### Move to Done Directory

```bash
# For task files
mv sessions/tasks/[priority]-[task-name].md sessions/tasks/done/

# For task directories
mv sessions/tasks/[priority]-[task-name]/ sessions/tasks/done/
```

---

## 6. Clear Task State

```bash
# Create empty task state
cat > .claude/state/current_task.json << 'EOF'
{
  "task": null,
  "branch": null,
  "services": [],
  "updated": "2025-10-16"
}
EOF
```

---

## 7. Git Operations (Simplified)

### Review Changes

```bash
# Check all changes
git status
git diff

# Review staged changes
git diff --cached
```

### Commit Changes

```bash
# Stage all changes
git add .

# OR stage selectively
git add <specific-files>

# Commit with descriptive message
git commit -m "feat(finance): implement invoice payment processing

- Add Payment aggregate with event sourcing
- Implement ProcessPaymentCommand and handler
- Add GraphQL mutations for payment processing
- Update projections for invoice status
- Add comprehensive tests (unit + integration)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Push to Remote

```bash
# Push branch
git push origin feature/task-name
```

### Merge (If Main Task Complete)

**For standard tasks**:
```bash
# Switch to main
git checkout main

# Pull latest
git pull origin main

# Merge task branch
git merge feature/task-name

# Push main
git push origin main

# Optional: Delete feature branch
git branch -d feature/task-name
git push origin --delete feature/task-name
```

**For subtasks**: Merge into parent task branch instead of main

**For experiments**: Ask user before merging (may want to keep separate)

**For complex Git workflows**: See `sessions/docs/git-workflows.md` (optional)

---

## 8. Select Next Task

**List available tasks**:

```bash
# Simple and reliable
ls -la sessions/tasks/

# OR with details
find sessions/tasks/ -maxdepth 1 -type f -name "*.md" -o -type d
```

**Present to user**:
> "Task complete! ✅
>
> Quality gates passed:
> - ✅ Code review
> - ✅ Security scan
> - ✅ Tests (100% passing)
> - ✅ Build success
> - ✅ [Advanced reviews if applicable]
>
> Here are the remaining tasks:
> [List tasks]
>
> Which task would you like to tackle next?"

**If user selects task**:
```bash
# Checkout task branch
git checkout <branch-name>

# Update task state
vi .claude/state/current_task.json

# Follow task-startup.md protocol
cat sessions/protocols/task-startup.md
```

**If no tasks remain**:
> "🎉 All tasks complete!
>
> What would you like to tackle next?"

---

## 9. Create Pull Request (If Ready for Review)

**For feature branches ready for PR**:

```bash
/pr

# OR manually with GitHub CLI
gh pr create --title "feat(finance): Invoice payment processing" --body "$(cat <<'EOF'
## Summary
- Implemented Payment aggregate with event sourcing
- Added GraphQL mutations for payment processing
- Comprehensive test coverage (unit + integration)

## Quality Gates
- ✅ Code review (/review)
- ✅ Security scan (/security-scan)
- ✅ Tests pass (/test)
- ✅ Architecture review (architecture-strategist)
- ✅ Performance review (performance-oracle)

## Test Plan
- [x] Unit tests (100% coverage)
- [x] Integration tests (API endpoints)
- [x] Event replay tested
- [x] Manual testing in dev environment

## Breaking Changes
None

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Complete Checklist

**Before marking task complete**:

### Code Quality
- [ ] `/review` passed (no critical issues)
- [ ] `/security-scan` passed (no vulnerabilities)
- [ ] `/test` passed (all tests)
- [ ] Build succeeds (no errors)
- [ ] No console.log or debug statements
- [ ] No commented-out code
- [ ] No TODOs without issue references

### Testing
- [ ] Unit tests added for new code
- [ ] Integration tests updated
- [ ] Test coverage maintained or improved
- [ ] Edge cases tested
- [ ] Error cases tested

### Security
- [ ] No secrets in code
- [ ] Environment variables used correctly
- [ ] Input validation implemented
- [ ] Authorization checks in place

### Performance
- [ ] API endpoints <500ms
- [ ] Database queries optimized
- [ ] No N+1 queries
- [ ] Caching used where appropriate

### Documentation
- [ ] Service CLAUDE.md updated
- [ ] API documentation updated
- [ ] Feature spec updated (if exists)
- [ ] Architectural decisions documented
- [ ] Inline comments for complex logic

### Domain-Specific
- [ ] DDD patterns followed
- [ ] Domain events published
- [ ] GraphQL Federation tested (if applicable)
- [ ] Bangladesh compliance verified (if applicable)
- [ ] Event sourcing correctly implemented (if applicable)

### Git & PR
- [ ] Branch name follows convention
- [ ] Commits are atomic and clear
- [ ] No merge conflicts
- [ ] PR description complete (if creating PR)

### Compounding
- [ ] Learnings captured (feedback-codifier for complex tasks)
- [ ] Knowledge base updated
- [ ] Patterns documented
- [ ] Service docs updated

---

## Special Cases

### Experiment Branches
- Ask user whether to keep for reference
- If keeping: Just push, don't merge
- If not: Document findings first, then delete

### Research Tasks (No Branch)
- No merging needed
- Ensure findings documented in task file
- Archive normally

### Incomplete Tasks
- Document why incomplete
- Archive with "blocked" or "abandoned" status
- Create follow-up task if needed

---

## Important Notes

- **Never skip quality gates** - They maintain system integrity
- **Compounding is critical** - Capture learnings for future tasks
- **Task files are history** - Done/ directory serves as record
- **Git complexity is optional** - Most tasks use simple workflow
- **Quality compounds** - Each task improves next task

---

## Related Protocols

- **Task startup**: `sessions/protocols/task-startup.md`
- **Context maintenance**: `sessions/protocols/context-compaction.md`
- **Compounding cycle**: `sessions/protocols/compounding-cycle.md`
- **Git workflows** (optional): `sessions/docs/git-workflows.md`

---

## Philosophy

> "Complete with quality, capture learnings, compound improvement."

**Key Principles**:
1. **Quality gates non-negotiable** - /review, /security-scan, /test always
2. **Advanced reviews for complexity** - Use specialized agents
3. **Learning capture** - Use feedback-codifier for complex tasks
4. **Knowledge accumulation** - Update knowledge base systematically
5. **Compounding effect** - Each task makes next task easier

---

**Last Updated**: 2025-10-16
**Status**: ✅ Modernized for CC 2.0.19 + SpecKit
**Changes**: Removed super-repo complexity, updated for plugins, added SpecKit integration
