# Simple Task Template

**Use for**: Bug fixes, small enhancements, adding fields, config changes
**Duration**: <2 hours
**Files**: 1-3
**Phases**: 4
**Plugins**: 0
**Checkpoints**: 1

---

## Phase 1: READ & ANALYZE (5 min)

### Actions
- [ ] Read affected files directly using Read tool
- [ ] Understand existing code patterns
- [ ] Identify what needs to change
- [ ] Check related tests

### Output
- Clear understanding of changes needed
- List of files to modify

---

## Phase 2: IMPLEMENT (30-90 min)

### Actions
- [ ] Make required changes
- [ ] Follow established patterns from codebase
- [ ] Write/update tests
- [ ] Ensure code quality

### Guidelines
- Use Sonnet 4.5 for implementation
- No planning phase needed (keep it simple)
- Follow existing patterns in the codebase
- Keep changes minimal and focused

### Output
- Changes implemented
- Tests written/updated

---

## Phase 3: VALIDATE (10 min)

### Actions
- [ ] Run `pnpm build` - MUST pass (0 errors)
- [ ] Run `npm test` - MUST pass (all tests passing)
- [ ] Fix any errors if found
- [ ] Re-run until both pass

### Checkpoint
✓ Quality gates passed

### Output
- Build successful
- All tests passing

---

## Phase 4: COMMIT (5 min)

### Actions
- [ ] Stage changes: `git add .`
- [ ] Commit with conventional message:
  ```bash
  git commit -m "type: description

  - Change 1
  - Change 2

  🤖 Generated with Claude Code
  Co-Authored-By: Claude <noreply@anthropic.com>"
  ```
- [ ] Push: `git push`

### Commit Types
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `test`: Test changes
- `docs`: Documentation
- `chore`: Maintenance

### Output
- Changes committed
- Changes pushed to remote

---

## Example Tasks

- Add validation rule to DTO
- Fix typo in error message
- Update configuration value
- Add field to existing entity
- Fix broken test
- Update dependency version
- Add missing type annotation

---

## Success Criteria

✅ Task completed in <2 hours
✅ Build passes (0 TypeScript errors)
✅ Tests pass (all passing)
✅ Changes committed with clear message
✅ No over-engineering (kept it simple)

---

## Common Pitfalls to Avoid

❌ Over-thinking simple changes
❌ Skipping tests
❌ Not running quality gates
❌ Committing with errors
❌ Adding unnecessary complexity

---

**Remember**: Simple tasks should stay simple. No planning, no plugins, just direct implementation.
