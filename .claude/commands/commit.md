# Guided Commit Workflow

Guide user through proper commit workflow with quality gates.

## Instructions for Claude

1. **Verify quality gates FIRST**:
   ```bash
   # TypeScript check
   pnpm build
   # Must be: 0 errors

   # Tests
   npm test
   # Must be: all passing
   ```

2. **If quality gates FAIL**:
   ```
   ❌ Quality gates failed. Cannot commit.

   TypeScript Errors: __ [list if any]
   Test Failures: __ [list if any]

   Fix these issues first, then run /commit again.
   ```

   **STOP HERE** - Do not proceed to commit

3. **If quality gates PASS**, prepare commit:
   ```bash
   # Get changed files
   git diff --name-only HEAD

   # Get stats
   git diff --stat
   ```

4. Provide commit commands to user:
   ```
   ✅ Quality gates passed. Ready to commit.

   Changed: __ files, __ lines added, __ lines deleted

   Execute these commands:

   ```bash
   # Stage changes
   git add .

   # Commit (copy this entire command)
   git commit -m "feat: [DESCRIBE CHANGES HERE]

   - [Change 1 - be specific]
   - [Change 2 - be specific]
   - [Change 3 - be specific]

   Quality: kieran-typescript-reviewer __/10 [if review was run]
   Tests: __/__ passing (__%)
   Build: ✅ 0 TypeScript errors

   [Checkpoint: checkpoint-[name].md if applicable]

   🤖 Generated with Claude Code
   Co-Authored-By: Claude <noreply@anthropic.com>"

   # Push
   git push

   # Verify GitHub Actions (if applicable)
   gh run list --limit 3
   ```

   **Next**: Replace [DESCRIBE CHANGES HERE] with a clear, concise description.
   ```

5. After user commits, offer to check GitHub Actions:
   ```bash
   gh run list --limit 3
   ```

## Commit Message Guidelines

### Type Prefixes
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring (no functional change)
- `test:` - Adding/updating tests
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks

### Good Examples
```
feat: add invoice-payment linking with reconciliation

- Implement PaymentAllocationService
- Add InvoiceLinked domain event
- Create payment-invoice projection

Quality: kieran-typescript-reviewer 9/10
Tests: 45/45 passing (92% coverage)
Build: ✅ 0 TypeScript errors

Checkpoint: checkpoint-phase2-complete.md
```

### Bad Examples
```
update stuff  ❌ (vague)
WIP ❌ (not descriptive)
fix bug ❌ (which bug?)
```

## Quality Gates Checklist

- [ ] `pnpm build` → 0 errors
- [ ] `npm test` → all passing
- [ ] Code review done (if medium+ task)
- [ ] Commit message drafted
- [ ] User ready to execute
- [ ] Post-commit verification offered

## Emergency Skip

**ONLY use `--no-verify` if**:
- Pre-commit hooks are blocking for wrong reason
- User explicitly requests it
- You understand the risk

```bash
git commit --no-verify -m "[message]"
```

**WARNING**: Skipping hooks bypasses quality checks. Use sparingly.
