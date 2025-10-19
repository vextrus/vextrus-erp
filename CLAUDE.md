# Vextrus ERP - Ultimate Agentic Workflow

**Claude Code 2.0.22** | **Sonnet 4.5 + Haiku 4.5** | **Skills-Only** | **Zero Overhead** ✅

---

## Philosophy: Skills-Driven, Zero-Friction Execution

**9 Skills Available via Progressive Disclosure** (3 Core + 3 Domain + 3 Infrastructure):

**Core Skills**:
- **execute-first** - "implement", "fix", "add" → Direct code execution
- **haiku-explorer** - "where", "find", "understand" → Fast Haiku 4.5 exploration
- **test-first** - "test", "TDD" → Test-driven development

**Domain Skills**:
- **graphql-schema** - "graphql", "schema", "resolver" → Federation v2 patterns
- **event-sourcing** - "aggregate", "event", "CQRS" → Domain-driven design
- **security-first** - "security", "auth", "rbac" → Security-by-design

**Infrastructure Skills** (NEW):
- **database-migrations** - "migration", "schema change", "typeorm" → Zero-downtime migrations
- **multi-tenancy** - "tenant", "multi-tenant", "isolation" → 5-layer tenant isolation
- **production-deployment** - "deploy", "production", "k8s" → Phased rollout + observability

**No Hooks** = No Overhead = Maximum Parallel Execution

---

## Daily Workflow (80% of Tasks)

```bash
# 1. Explore (30 seconds, Haiku 4.5)
/explore services/finance

# 2. Direct Execution (Skills load when relevant)
"implement invoice payment with validation"
→ Claude loads relevant skills: execute-first, test-first, graphql-schema, event-sourcing, security-first

# 3. Quality Gates (2-5 minutes)
/review /test /security-scan

# 4. Commit (30 seconds)
git add . && git commit -m "feat: invoice payment"
```

**Total**: 1-4 hours | **Context**: <30k tokens (15%)

---

## Complex Workflow (20% of Tasks)

### Compounding Cycle: PLAN → DELEGATE → ASSESS → CODIFY

**Phase 1: PLAN** (1-3 hours, Sonnet orchestrates)
- Parallel Haiku exploration (2-3 agents)
- Specialized agents (3-5 max): architecture-strategist, pattern-recognition, best-practices-researcher
- Create SpecKit feature spec

**Phase 2: DELEGATE** (2-8 hours, parallel execution)
- Break into subtasks (TodoWrite: 5-15 items)
- Parallel Haiku execution (2-5 agents)
- **2-5x faster** than sequential

**Phase 3: ASSESS** (30 min - 2 hours, 4-level quality)
- Level 1: Automated (/review /security-scan /test pnpm build)
- Level 2: Language-specific (kieran-typescript-reviewer)
- Level 3: Specialized (performance-oracle, security-sentinel, data-integrity-guardian)
- Level 4: Domain-specific (Bangladesh compliance, GraphQL Federation, Event Sourcing)

**Phase 4: CODIFY** (15-45 minutes, learning capture)
- feedback-codifier agent captures patterns
- Update knowledge base
- **Each task 20-40% faster**

See: `ULTIMATE_WORKFLOW_DESIGN.md` for complete details

---

## Service Architecture

**18 NestJS Microservices** | GraphQL Federation v2 | PostgreSQL | EventStore

**Production (11)**: auth, master-data, notification, configuration, scheduler, document-generator, import-export, file-storage, audit, workflow, rules-engine

**In Progress (7)**: finance (Day 1/18), crm, hr, project-management, scm, inventory, reporting

**Before modifying**: `cat services/<name>/CLAUDE.md`

---

## Model Selection Strategy

| Task Type | Model | Performance | Use When |
|-----------|-------|-------------|----------|
| Exploration | Haiku 4.5 | 73% SWE-bench, 2x faster, 1/3 cost | /explore, context gathering, analysis |
| Implementation | Sonnet 4.5 | 77% SWE-bench, best quality | Complex logic, critical code, orchestration |

**Parallel Execution**: Multiple Haiku agents = 2-5x wall-clock speed

---

## Agent Usage (Optimized: 21 agents, 5.8k tokens)

**Current State** (2025-10-20):
- **17 compounding-engineering agents** + 4 built-in = 21 total
- **Context**: 5.8k tokens (2.9%) ✅
- **Optimization**: 206 → 21 agents (90% reduction, 7.2k tokens saved)

**Essential Agents** (compounding-engineering plugin):
- architecture-strategist (258 tokens) - System design decisions
- kieran-typescript-reviewer (433 tokens) - Code quality bar
- performance-oracle (383 tokens) - Performance optimization
- security-sentinel (388 tokens) - Security audits
- data-integrity-guardian (270 tokens) - Database safety
- feedback-codifier (267 tokens) - Learning capture
- pattern-recognition-specialist (280 tokens) - Pattern analysis
- best-practices-researcher (511 tokens) - External research
- framework-docs-researcher (431 tokens) - Library documentation
- repo-research-analyst (434 tokens) - Codebase archaeology
- pr-comment-resolver (272 tokens) - PR feedback implementation
- code-simplicity-reviewer (256 tokens) - Simplification review
- git-history-analyzer (278 tokens) - Historical analysis
- kieran-python-reviewer (423 tokens) - Python quality
- kieran-rails-reviewer (433 tokens) - Rails quality
- dhh-rails-reviewer (419 tokens) - Rails philosophy
- every-style-editor (105 tokens) - Content editing

**Use Agents For** (selective, <3 per task):
- Security-critical (security-sentinel)
- Performance optimization (performance-oracle)
- Architecture decisions (architecture-strategist)
- Code quality review (kieran-*-reviewer)
- Pattern extraction (pattern-recognition-specialist)

**Skip Agents For** (Skills handle 80%):
- Simple features (<100 lines)
- Bug fixes
- CRUD operations
- Test writing
- GraphQL schemas
- Domain aggregates

---

## Essential Commands

```bash
# Current task state
cat .claude/state/current_task.json

# Fast exploration (Haiku 4.5)
/explore services/[name]

# Quality gates (automated)
/review /test /security-scan

# Build verification
pnpm build

# Environment (for agent output limit)
export CLAUDE_CODE_MAX_OUTPUT_TOKENS=16384

# Help
/help
```

---

## Context Optimization (Fully Optimized)

**Current Context Breakdown** (65k/200k, 33%):
- System prompt: 4.6k (2.3%)
- System tools: 20.3k (10.1%)
- MCP tools: 1.5k (0.7%) ✅
- **Custom agents: 5.8k (2.9%)** ✅ **(Optimized from 13.0k!)**
- Memory files: 3.6k (1.8%)
- Free space: **135k (67.4%)** ✅

**Agent Optimization** (2025-10-20):
- Before: 206 agents = 13.0k tokens (6.5%)
- After: 21 agents = 5.8k tokens (2.9%)
- **Savings: 7.2k tokens (55% reduction)**

**MCP On-Demand**: Enable only when needed
- Default: `sequential-thinking` (1.5k tokens, 0.7% context)
- On-demand: `@postgres`, `@docker`, `@github`, `@serena`

**Task Files**: Reference, don't embed
- Target: <500 lines (optimal)
- Maximum: 1,000 lines
- Use `/explore` instead of reading 10+ files

**Total Context Savings**: 22.2k tokens (from 80k to 65k in fresh session)

---

## Code Philosophy

- **Execute First**: Code > Plans > Docs
- **Locality of Behavior**: Keep related code together
- **Minimal Abstraction**: Simple > Complex
- **Readability > Cleverness**: Obvious > Clever
- **Domain-Driven**: Follow service CLAUDE.md patterns
- **Skills-Driven**: Let skills guide implementation

---

## Performance Standards

| Metric | Good | Acceptable |
|--------|------|------------|
| API Endpoints | <300ms | <500ms |
| DB Queries | <100ms | <250ms |
| Page Loads | <2s | <3s |

---

## Directory Structure

```
.claude/
  ├── skills/          # 9 auto-activating skills (3 core + 3 domain + 3 infrastructure)
  ├── hooks/           # Disabled (present but not in settings)
  └── state/           # current_task.json
services/*/            # 18 microservices + CLAUDE.md
sessions/              # Task protocols + knowledge base
  ├── protocols/       # 5 core protocols
  ├── knowledge/vextrus-erp/  # Categorized knowledge base (20 files)
  │   ├── patterns/    # 6 implementation patterns
  │   ├── checklists/  # 4 quality/compliance checklists
  │   ├── guides/      # 6 how-to guides
  │   └── workflows/   # 3 proven workflows
  ├── specs/           # SpecKit feature specs
  └── tasks/           # Active + done tasks
```

---

## When to Use Protocols

**Simple Tasks (<1 day, <100 lines)**: Skip protocols, skills handle it
**Complex Tasks (multi-day, >100 lines)**: Use `sessions/protocols/`

**5 Core Protocols**:
1. `task-startup.md` - Systematic initialization
2. `task-completion.md` - Quality gates, archival
3. `compounding-cycle.md` - PLAN→DELEGATE→ASSESS→CODIFY
4. `task-creation.md` - Task file structure
5. `context-compaction.md` - Context reset preparation

---

## Quality Gates (Non-Negotiable)

### Automated (2-5 minutes)
```bash
/review           # Code quality, patterns
/security-scan    # SAST analysis
/test             # Unit + integration
pnpm build        # TypeScript compilation
```
**Fail = Block commit**

### Advanced (Medium/Complex, 15-45 minutes)
- architecture-strategist (system design)
- kieran-typescript-reviewer (code quality)
- performance-oracle (bottlenecks)
- security-sentinel (security audit)
- data-integrity-guardian (database safety)

### Domain-Specific (15-30 minutes)
- **Bangladesh Compliance**: VAT, TIN, Mushak-6.3, fiscal year
- **GraphQL Federation**: @key directives, pagination, error handling
- **Event Sourcing**: Versioning, idempotency, replay safety

---

## Skill Activation Examples

### Single Skill
```
User: "implement invoice validation"
→ execute-first activates
→ Direct code execution, no docs
```

### Multi-Skill Coordination
```
User: "implement invoice payment with security"
→ execute-first (orchestration)
→ test-first (TDD for payment logic)
→ graphql-schema (payment mutation)
→ event-sourcing (PaymentProcessed event)
→ security-first (RBAC guard)

Flow:
1. /explore services/finance (haiku-explorer)
2. Write failing test (test-first)
3. Implement Payment aggregate (event-sourcing)
4. Create GraphQL mutation (graphql-schema)
5. Add RBAC guard (security-first)
6. Tests pass (execute-first)
7. /security-scan (security-first)
```

---

## Compounding Effect

**Proven Over 40+ Completed Tasks**:
```
Feature 1:  10 hours (baseline)
Feature 2:   6 hours (40% faster - learnings applied)
Feature 3:   4 hours (60% faster - patterns reused)
Feature 4:   2 hours (80% faster - automated)
```

**Goal**: Each unit of work makes future work easier

---

## Success Metrics

### Performance
- Haiku Exploration: **2x faster** than Sonnet
- Parallel Execution: **2-5x faster** than sequential
- Context Optimization: **Agent context reduced 55%** (13.0k → 5.8k tokens)
- Agent Efficiency: **21 total agents, <3 per task** (90% reduction from 206)

### Quality
- Test Coverage: **>90%** for financial services
- Security Gates: **100% pass** before commit
- GraphQL Compliance: **100% Federation v2**
- Bangladesh Compliance: **100% NBR** requirements

### Project (Vextrus ERP)
- Completed Tasks: **40+** documented
- Active Services: **11 production**, 7 in progress
- Total Target: **18 microservices**
- Test Coverage: **85% average** (target: 90%)

---

## Quick Reference

| Need | Command/Action |
|------|----------------|
| Current task | `cat .claude/state/current_task.json` |
| Explore service | `/explore services/[name]` |
| Quality check | `/review /test /security-scan` |
| Build check | `pnpm build` |
| Skills catalog | `.claude/skills/README.md` (9 skills) |
| Knowledge base index | `sessions/knowledge/vextrus-erp/README.md` (20 files) |
| Full workflow | `ULTIMATE_WORKFLOW_DESIGN.md` |
| Protocols | `sessions/protocols/` (5 core protocols) |
| Patterns | `sessions/knowledge/vextrus-erp/patterns/` (6 patterns) |
| Checklists | `sessions/knowledge/vextrus-erp/checklists/` (4 checklists) |
| Guides | `sessions/knowledge/vextrus-erp/guides/` (6 guides) |
| Workflows | `sessions/knowledge/vextrus-erp/workflows/` (3 workflows) |
| Plugins | `/help` (41 plugins) |

---

## Troubleshooting

**Agent output truncated?**
```bash
export CLAUDE_CODE_MAX_OUTPUT_TOKENS=16384
```

**Skills not activating?**
- Restart Claude Code (skills load at startup)
- Use explicit trigger words
- Check `.claude/skills/*/SKILL.md` frontmatter

**Context bloat?**
- Apply `sessions/protocols/context-compaction.md`
- Refactor task file to <500 lines
- Use reference pattern, not embed
- Enable MCPs on-demand only

**Parallel agents fail?**
- Verify no hooks in `.claude/settings.json`
- Should only show schema reference
- Restart after removing hooks

---

## Vision: Making the Impossible Possible

**Vextrus ERP Goals**:
- 18 microservices (DDD + Event Sourcing + CQRS + GraphQL Federation v2)
- Bangladesh-specific compliance (NBR, Mushak-6.3, TIN validation)
- Production-ready (90%+ test coverage, <300ms API response)
- Built by 1 developer + Claude Code

**How This Workflow Achieves It**:
1. **Skills Load Progressively** → Zero cognitive overhead, only relevant skills loaded
2. **Haiku Exploration** → 98.6% context saved, 2x faster
3. **Compounding Quality** → Each task 20-40% easier
4. **Parallel Execution** → 2-5x wall-clock speed
5. **Zero Overhead** → No blocking hooks
6. **Systematic Protocols** → Battle-tested over 40+ tasks

> "We're not just building tools; we're building **partners in creation** that can help you achieve the impossible." — Boris Cherny, Anthropic

---

**Version**: 7.0 (Ultimate Agentic Workflow)
**Updated**: 2025-10-20
**Architecture**: 9 Skills (3+3+3) | Haiku + Sonnet | Zero-Friction | Compounding Quality ✅

**See**:
- `ULTIMATE_WORKFLOW_DESIGN.md` - Comprehensive 16-section guide
- `.claude/skills/README.md` - 9 skills catalog (core + domain + infrastructure)
- `sessions/knowledge/vextrus-erp/README.md` - 20-file knowledge base
