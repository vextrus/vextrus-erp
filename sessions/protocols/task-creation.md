# Task Creation Protocol

**Purpose**: Systematic task creation for Vextrus ERP development
**Last Updated**: 2025-10-16 (Modernized for CC 2.0.19 + SpecKit)

---

## Configuration
Task naming conventions can be customized in `sessions/sessions-config.json`.
If no config exists, the defaults below are used.

## Priority Prefix System

Check `sessions/sessions-config.json` for configured prefixes.
Default prefixes:
- `h-` → High priority
- `m-` → Medium priority  
- `l-` → Low priority
- `?-` → Investigate (task may be obsolete, speculative priority)

Examples:
- `h-fix-auth-redirect.md`
- `m-implement-oauth.md`
- `l-docs-api-reference.md`
- `?-research-old-feature.md`

## Task Type Prefix Enum

Task type comes after priority prefix. Check `sessions/sessions-config.json` for branch mappings.
Default mappings:

- `implement-` → Creates feature/ branch
- `fix-` → Creates fix/ branch  
- `refactor-` → Creates feature/ branch
- `research-` → No branch needed
- `experiment-` → Creates experiment/ branch
- `migrate-` → Creates feature/ branch
- `test-` → Creates feature/ branch
- `docs-` → Creates feature/ branch

## File vs Directory Decision

**Use a FILE when**:
- Single focused goal
- Estimated < 3 days work
- No obvious subtasks at creation time
- Examples:
  - `h-fix-auth-redirect.md`
  - `m-research-mcp-features.md`
  - `l-refactor-redis-client.md`

**Use a DIRECTORY when**:
- Multiple distinct phases
- Needs clear subtasks from the start
- Estimated > 3 days work
- Examples:
  - `h-implement-auth/` (magic links + OAuth + sessions)
  - `m-migrate-to-postgres/` (schema + data + cutover)
  - `l-test-all-services/` (per-service test files)

## Creating a Task

1. **Copy template**:
   ```bash
   cp sessions/tasks/TEMPLATE.md sessions/tasks/[priority]-[task-name].md
   ```
   Or for directory:
   ```bash
   mkdir sessions/tasks/[priority]-[task-name]
   cp sessions/tasks/TEMPLATE.md sessions/tasks/[priority]-[task-name]/README.md
   ```

2. **Fill out frontmatter**:
   - task: Must match filename (including priority prefix)
   - branch: Based on task type prefix (or 'none' for research)
   - status: Start as 'pending'
   - created: Today's date
   - modules: List all services/modules that will be touched
   - spec: (Optional) Path to feature spec in sessions/specs/ if using SpecKit

3. **Write clear success criteria**:
   - Specific and measurable
   - Defines "done" unambiguously
   - Checkboxes for tracking

---

## 4. SpecKit Feature Specification (Complex Features)

**For medium/complex features**, create a feature spec first:

```bash
# Copy spec template
cp sessions/specs/TEMPLATE.md sessions/specs/[feature-name].md

# Fill out spec sections:
# - Context & Research
# - Requirements & Acceptance Criteria
# - Technical Approach & Decisions
# - Quality Gates to Apply
# - References to constitution and service docs
```

**Benefits**:
- Forces upfront thinking and research
- Documents technical decisions
- Provides clear implementation guidance
- Creates reference for future similar features

**When to skip**:
- Simple features (<4 hours)
- Bug fixes
- Straightforward refactoring
- Research tasks

**Link spec in task frontmatter**:
```yaml
spec: sessions/specs/invoice-payment-processing.md
```

---

## 5. Review Project Constitution

**Before starting work**, review project principles:

```bash
cat memory/constitution.md
```

**Contains**:
- Non-negotiable project principles
- Technology stack standards
- Architecture patterns
- Code quality standards
- Quality gates requirements

---

## 6. Context Gathering (Recommended)

**Use /explore for fast context** (Haiku 4.5 - separate context):

```bash
# Explore affected services
/explore services/finance
/explore services/master-data

# Explore specific domains
/explore services/finance/src/domain
```

**Benefits**:
- 2x faster than manual reading
- 1/3 the cost of Sonnet 4.5
- Separate context window (preserves main context)
- Comprehensive analysis with summary

**Alternative**: Read service documentation directly:
```bash
cat services/[service-name]/CLAUDE.md
```

**Avoid**: Copying full context into task file (causes bloat)
**Instead**: Reference documentation, use /explore on-demand

---

## 7. Starting Work

**When ready to begin implementation**:

1. **Create branch** (if not research task):
   ```bash
   git checkout -b feature/implement-cool-thing
   ```

2. **Update task state**:
   ```bash
   # IMPORTANT: Use exactly these field names:
   #   - "task" - just the task name (no path, no .md)
   #   - "branch" - full Git branch name
   #   - "services" - array of affected services
   #   - "updated" - current date (YYYY-MM-DD)

   cat > .claude/state/current_task.json << EOF
   {
     "task": "m-implement-cool-thing",
     "branch": "feature/implement-cool-thing",
     "services": ["service1", "service2"],
     "updated": "$(date +%Y-%m-%d)"
   }
   EOF
   ```

3. **Follow task-startup protocol**:
   ```bash
   cat sessions/protocols/task-startup.md
   ```

---

## Task Evolution

If a file task needs subtasks during work:
1. Create directory with same name
2. Move original file to directory as README.md
3. Add subtask files
4. Update active task reference if needed

## For Agents Creating Tasks

When programmatically creating tasks:
1. Read `sessions/sessions-config.json` for:
   - Priority prefixes from `config.task_prefixes.priority`
   - Type-to-branch mappings from `config.task_prefixes.types`
2. If config doesn't exist, use defaults documented above
3. Always use the template structure from `sessions/tasks/TEMPLATE.md`
4. Suggest using `/explore` for context gathering (not old agents)
5. For complex features, suggest creating feature spec in `sessions/specs/`

---

## Quick Checklist

Before starting work on a task:

- [ ] Task file created with proper naming (`[priority]-[task-name].md`)
- [ ] Frontmatter filled out completely (task, branch, status, created, modules)
- [ ] Success criteria written (specific, measurable, checkboxes)
- [ ] Feature spec created (if complex feature, in `sessions/specs/`)
- [ ] Constitution reviewed (`memory/constitution.md`)
- [ ] Context gathered (`/explore` or service CLAUDE.md)
- [ ] Branch created (if not research task)
- [ ] Task state updated (`.claude/state/current_task.json`)

---

## Related Protocols

- **Task startup**: `sessions/protocols/task-startup.md`
- **Task completion**: `sessions/protocols/task-completion.md`
- **Context maintenance**: `sessions/protocols/context-compaction.md`
- **Compounding cycle**: `sessions/protocols/compounding-cycle.md`

---

## Philosophy

> "Start with clarity, spec for complexity, reference for context, execute systematically."

**Key Principles**:
1. **Clear naming** - Priority and type prefixes enable quick scanning
2. **Spec-driven** - SpecKit feature specs for complex work
3. **Constitution-aware** - Review principles before starting
4. **Context efficiency** - Reference > Embed, use /explore
5. **Systematic execution** - Follow protocols, update state, track progress

---

**Last Updated**: 2025-10-16
**Status**: ✅ Modernized for CC 2.0.19 + SpecKit
**Changes**: Removed old agent references, added SpecKit integration, updated for plugins