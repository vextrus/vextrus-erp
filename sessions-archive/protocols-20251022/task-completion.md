# Task Completion Protocol

**Purpose**: Quality-gated task completion for Vextrus ERP development
**Last Updated**: 2025-10-19 (v7.0 - Plan Mode Integration)

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
/review                   # Code quality
/security-scan           # Security analysis
/test                    # All tests

# Verify build
pnpm build                # Must pass with no errors
```

**Pass Criteria**:
- `/review`: No critical issues, max 5 warnings
- `/security-scan`: No critical or high vulnerabilities
- `/test`: All tests pass, coverage ≥ baseline
- `build`: Clean build, no TypeScript errors

### B. Advanced Reviews (Medium/Complex Tasks)

**Use specialized agents as needed**:
- `architecture-strategist` - System design, pattern compliance
- `kieran-typescript-reviewer` - TypeScript quality (or `kieran-python-reviewer`)
- `performance-oracle` - Bottlenecks, optimization
- `security-sentinel` - Threat modeling, vulnerabilities
- `data-integrity-guardian` - Migration safety (if database changes)
- `code-simplicity-reviewer` - Unnecessary complexity (final pass)

### C. Domain-Specific Validations

**Bangladesh ERP Compliance** (if applicable):
- [ ] VAT rates correct (15%, 10%, 7.5%, 5%)
- [ ] NBR Mushak-6.3 format compliant
- [ ] TIN/BIN validation implemented

**GraphQL Federation** (if schema changes):
- [ ] Federation directives correct
- [ ] Schema composition valid
- [ ] No breaking changes

**Event Sourcing** (if event-driven):
- [ ] Event versioning implemented
- [ ] Event handlers idempotent
- [ ] Projections updated

**Database Performance** (if DB changes):
- [ ] Indexes added for foreign keys
- [ ] No N+1 queries
- [ ] Migration tested (up/down)

---

## 3. Documentation Updates

**If service interfaces changed**:
- Update `services/[name]/CLAUDE.md` (architecture, patterns, decisions)
- Update GraphQL schema documentation
- Add API examples (if new endpoints)

**If spec-driven feature**:
- Update `sessions/specs/[feature-name].md` with implementation notes, deviations, lessons learned

---

## 4. Compounding: Codify Learnings

**For complex or significant tasks**:

```bash
Task tool: compounding-engineering:feedback-codifier
```

**Capture insights**:
1. **What patterns worked well?** (Architectural decisions, code patterns, tools/libraries)
2. **What could be simplified?** (Over-engineering, unnecessary abstractions, cleaner approaches)
3. **What should be automated?** (Repetitive tasks, manual processes, testing workflows)

**Update knowledge base**:
- [ ] Service CLAUDE.md (patterns, decisions)
- [ ] sessions/knowledge/vextrus-erp/ (if new patterns)
- [ ] memory/constitution.md (if new standards)

**For detailed codify questions**, see: `sessions/knowledge/vextrus-erp/patterns/codify-questions-template.md`

---

## 5. Task Archival

### Update Task Status

Update task file frontmatter:

```yaml
---
task: feature-name
branch: feature/branch-name
status: completed
completed: 2025-10-19
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
  "updated": "2025-10-19"
}
EOF
```

---

## 7. Git Operations

### Review Changes

```bash
git status
git diff
```

### Commit Changes

```bash
git add .

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
git push origin feature/task-name
```

### Merge (If Main Task Complete)

```bash
# Standard tasks - merge to main
git checkout main
git pull origin main
git merge feature/task-name
git push origin main

# Optional: Delete feature branch
git branch -d feature/task-name
git push origin --delete feature/task-name
```

**For subtasks**: Merge into parent task branch instead of main
**For experiments**: Ask user before merging

---

## 8. Select Next Task

**List available tasks**:

```bash
ls -la sessions/tasks/
```

**Present options**:
> "Task complete! ✅ Quality gates passed. Here are the remaining tasks:
> [List tasks]
>
> Which task would you like to tackle next?"

**If user selects task**: Follow `task-startup.md` protocol

---

## 9. Create Pull Request (If Ready for Review)

```bash
/pr
```

**For PR template and details**, see: `sessions/templates/pull-request-template.md`

---

## Plan Mode Integration

**Task completion in plan mode**:
1. User requests task completion
2. Claude presents completion plan:
   - Quality gates to run
   - Documentation to update
   - Learnings to capture
3. User approves plan
4. Claude executes systematically
5. User reviews results

**Skills auto-activate** during completion (security-first, event-sourcing, etc.)

---

## Quick Checklist

**Before marking task complete**:

### Code Quality
- [ ] `/review`, `/security-scan`, `/test` passed
- [ ] Build succeeds
- [ ] No debug statements or TODOs

### Testing
- [ ] Unit tests added
- [ ] Integration tests updated
- [ ] Edge cases tested

### Security
- [ ] No secrets in code
- [ ] Input validation implemented
- [ ] Authorization checks in place

### Documentation
- [ ] Service CLAUDE.md updated
- [ ] Feature spec updated (if exists)
- [ ] Architectural decisions documented

### Git & Archival
- [ ] Commits are atomic and clear
- [ ] Task file status updated
- [ ] Task moved to done/
- [ ] Task state cleared

### Compounding
- [ ] Learnings captured (complex tasks)
- [ ] Knowledge base updated
- [ ] Patterns documented

**For detailed checklist**, see: `sessions/knowledge/vextrus-erp/checklists/completion-checklist-detailed.md`

---

## Related Protocols

- **Task startup**: `sessions/protocols/task-startup.md`
- **Context maintenance**: `sessions/protocols/context-compaction.md`
- **Compounding cycle**: `sessions/protocols/compounding-cycle.md`

---

## Philosophy

> "Complete with quality, capture learnings, compound improvement."

**Key Principles**:
1. **Quality gates non-negotiable** - /review, /security-scan, /test always
2. **Advanced reviews for complexity** - Use specialized agents
3. **Learning capture** - Use feedback-codifier for complex tasks
4. **Knowledge accumulation** - Update knowledge base systematically
5. **Compounding effect** - Each task makes next task easier
6. **Plan mode for system** - Present completion plan before executing

---

**Last Updated**: 2025-10-19
**Version**: 7.0 (Plan Mode Integration)
**Changes**: Condensed verbose sections, extracted detailed checklists, added plan mode workflow
