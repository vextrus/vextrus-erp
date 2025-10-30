# Context Compaction Protocol

**Purpose**: Reset context while preserving progress for long-running tasks
**Last Updated**: 2025-10-19 (v7.0 - Plan Mode Integration)

---

## When to Use

**Trigger conditions**:
- Context usage >150k tokens (75% of 200k limit)
- Context feels "sluggish" or slow
- Multiple checkpoint cycles completed
- Need fresh start while preserving work

---

## 1. Update Task State

### Update Work Log

Add final entry for current session:
```markdown
### Session [N] - 2025-10-19
**Status**: Context compaction checkpoint
**Progress**: [What was accomplished]
**Next**: [What comes next]
```

---

## 2. Update Task File

**Update frontmatter**:
```yaml
status: in-progress
checkpoint: sessions/tasks/done/[task-name]-checkpoint-[N].md
```

**Update success criteria** with current status.

---

## 3. Update Documentation

**If service interfaces changed**:
- Update `services/[name]/CLAUDE.md`
- Update GraphQL documentation
- Update API examples

---

## 4. Context Optimization Check

**Verify**:
- [ ] Task file <1,000 lines
- [ ] References used (not embeds)
- [ ] MCPs disabled when not needed
- [ ] No duplicate context

**For optimization strategies**, see: `sessions/knowledge/vextrus-erp/guides/context-optimization-tips.md`

---

## 5. Create Checkpoint

**Move current task to done/**:
```bash
cp sessions/tasks/[task-name].md sessions/tasks/done/[task-name]-checkpoint-[N].md
```

**For checkpoint template**, see: `sessions/templates/checkpoint-template.md`

---

## 6. Verify Quality State

**Before compacting**:
- [ ] All code committed
- [ ] Tests passing
- [ ] Build succeeds
- [ ] No uncommitted changes

---

## 7. Announce Readiness

**Message**:
> "Context compaction complete. Checkpoint created at `sessions/tasks/done/[task-name]-checkpoint-[N].md`.
>
> Ready for fresh session. Next session should:
> 1. Read checkpoint file
> 2. Load current task file
> 3. Continue from [specific point]"

---

## Plan Mode Integration

**Compaction in plan mode**:
1. User requests context compaction
2. Claude presents compaction plan:
   - What to checkpoint
   - Where to resume
   - Verification steps
3. User approves
4. Execute compaction
5. Announce readiness

---

## Quick Checklist

- [ ] Work log updated
- [ ] Task file updated
- [ ] Documentation updated
- [ ] Context optimized
- [ ] Checkpoint created
- [ ] Quality verified (tests pass, build succeeds)
- [ ] Ready message sent

---

## Related Protocols

- **Task startup**: `sessions/protocols/task-startup.md`
- **Task completion**: `sessions/protocols/task-completion.md`
- **Compounding cycle**: `sessions/protocols/compounding-cycle.md`

---

## Philosophy

> "Compact context preserves momentum: checkpoints capture progress, fresh sessions maintain clarity."

---

**Last Updated**: 2025-10-19
**Version**: 7.0 (Plan Mode Integration)
**Changes**: Condensed verbose sections, added plan mode workflow
