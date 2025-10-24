# Vextrus ERP - Ultimate Workflow Reference

**v4.0** | Agent-First + Full Automation | Context: 46.5k (23%) | Bangladesh Construction & Real Estate

---

## One-Line Philosophy

**Agents > Skills** | **Checkpoints > Exploration** | **Automation > Manual** | **Complete Reading > Partial**

---

## Quick Start Matrix

| Task | Time | Pattern | GitHub | Agents | Quality Gates |
|------|------|---------|--------|--------|---------------|
| **Simple** | <4h | Read → Execute | ❌ No | 0-1 | Pre-commit only |
| **Medium** | 4-8h | Explore → Execute → Review | ✅ Optional | 2-3 | Pre-commit + PR |
| **Complex** | 2-5 days | PLAN → EXECUTE → ASSESS | ✅ MANDATORY | 5-8 | Full automation |

**Templates**: `.claude/github/task-templates/{simple,medium,complex}-task-template.md`

---

## Models

| Task | Model | Reason |
|------|-------|--------|
| Main | Sonnet 4.5 | Best quality (77% SWE-bench) |
| Explore | Haiku 4.5 | 2x faster, 1/3 cost |
| Parallel | Haiku 4.5 | Git worktree (2-5x speedup) |

---

## Quality Gates (v4.0 - Automated)

### Pre-Commit (Husky)
```bash
# Runs automatically before every commit
- Format/lint (lint-staged)
- Type check (tsc)
- Tests (if test files changed)
```

### PR Gates (GitHub Actions)
```bash
# Runs automatically on PR creation
- Quality score (0-10, must be ≥7.0)
- Agent review recommendation (if PR >500 lines)
- Block merge if quality too low
```

### Manual Review (Medium+ Tasks)
- `kieran-typescript-reviewer` (MANDATORY for medium+)
- `security-sentinel` (if auth/RBAC/sensitive)
- `performance-oracle` (if caching/optimization)

**Proven**: 9.5/10 quality, <5% rework, 0 bugs (finance task)

---

## Automation Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **checkpoint-sync** | Push checkpoint-*.md | Auto-sync to GitHub issue |
| **pr-quality-gates** | PR creation | Automated quality check + agent recommendation |
| **metrics-collector** | PR merge to main | Track velocity, quality, time |

**Location**: `.github/workflows/*.yml`

---

## Context Optimization

**Target**: <50k (25%) | **Current**: 46.5k (23%) ✅

| Component | Tokens | Strategy |
|-----------|--------|----------|
| GitHub MCP | 5k (2.5%) | On-demand: `/mcp enable github` |
| VEXTRUS-PATTERNS | 3k (1.5%) | Load sections as needed |
| Agents | 6.2k (3.1%) | On-demand invocation |
| Skills | 0.4k (0.2%) | Progressive disclosure |

**Monitor**: `/context` command

---

## Agents & Skills

**33 Agents**: `.claude/agents/AGENT-DIRECTORY.md`
**4 Skills**: haiku-explorer, vextrus-domain-expert, production-ready-workflow, graphql-event-sourcing

**Skill Triggers**:
- `"where"/"find"` → haiku-explorer
- `"Bangladesh"/"VAT"` → vextrus-domain-expert
- `"checkpoint"` → production-ready-workflow
- `"GraphQL"/"CQRS"` → graphql-event-sourcing

---

## Industry Focus

**Bangladesh Construction & Real Estate**

**Compliance** (NBR):
- VAT: 15% standard (construction), 5% reduced, 0% export
- TDS: 5-10% (vendor type), 1.5x penalty (no TIN)
- Mushak: 6.3 (invoice), fiscal year July-June

**Patterns**: `VEXTRUS-PATTERNS.md` sections 11, 12, 13

---

## Architecture

**18 Microservices** | GraphQL Federation v2 | PostgreSQL | EventStore

**Production**: 11/18 (61%) | **In Progress**: 7/18 (39%)

**Patterns**: DDD + Event Sourcing + CQRS + Multi-Tenancy (5-layer)

---

## Commands

```bash
# Build & Test
pnpm build              # Zero TypeScript errors required
npm test                # All tests passing required

# Automation
/mcp enable github      # Enable GitHub MCP (when needed)
/context                # Monitor token usage
git commit              # Pre-commit hooks run automatically

# Exploration
/explore services/finance    # Haiku 4.5 fast exploration

# Deployment
gh workflow run deploy-automated.yml    # One-click deployment
```

---

## Quick Reference

| Need | See |
|------|-----|
| **Technical patterns** | `VEXTRUS-PATTERNS.md` (17 sections, 1,175 lines) |
| **Agents** | `.claude/agents/AGENT-DIRECTORY.md` (33 agents) |
| **Skills** | `.claude/skills/README.md` (4 skills) |
| **GitHub workflows** | `.claude/github/` (12 files, 5,019 lines) |
| **Task templates** | `.claude/github/task-templates/*.md` |
| **Automation** | `.github/workflows/*.yml` (11 workflows) |
| **Metrics** | `.claude/metrics/README.md` |
| **Deployment** | `.claude/deployment/*.md` |

---

## Troubleshooting

**Which agent?**
- Simple: None (just implement)
- Medium: pattern-recognition-specialist → kieran-typescript-reviewer
- Complex: architecture-strategist → kieran-typescript-reviewer + 2-3 specialized

**Pre-commit failing?**
```bash
# Skip hooks (emergency only)
git commit --no-verify

# Fix issues
pnpm build              # Fix TypeScript errors
npm test                # Fix failing tests
```

**PR blocked?**
- Quality score <7.0 → Fix TypeScript/test issues
- Agent review needed → Run kieran-typescript-reviewer locally

**Context too high?**
```bash
/context                # Check usage
/mcp disable github     # Disable MCPs when not needed
```

---

## Success Metrics (v4.0)

**Automation**: 100% checkpoint sync, 100% quality gates, 100% metrics collection

**Quality**: 9.5/10 average, <5% rework, 0 bugs proven

**Velocity**: 5+ features/week target, 90%+ coverage maintained

**Context**: 46.5k (23%) maintained, 153.5k (77%) free

---

## Version History

- **v1.0**: 17 skills, no automation, high context
- **v2.0**: Agent-first, 0 skills (too harsh)
- **v3.0**: 4 optimized skills, 33 agents, manual workflows
- **v3.5**: GitHub integration, git worktree, context optimization
- **v4.0**: Full automation (pre-commit + PR + metrics + deployment) ✅

---

## Vision

**18 Microservices** | **Bangladesh Compliance** | **Multi-Tenancy** | **Production-Ready**

**How**: 33 agents + 4 skills + full automation + checkpoint-driven + 17 patterns

> "Building partners in creation that help you achieve the impossible." — Boris Cherny, Anthropic

---

**v4.0** | Context: 46.5k (23%) | Updated: 2025-10-24 | **PRODUCTION READY + FULLY AUTOMATED**

**See Also**:
- `VEXTRUS-ERP-v4.0-COMPLETE.md` - v4.0 upgrade summary
- `.claude/github/README.md` - GitHub integration guide
- `.github/workflows/` - Automation workflows

**🚀 Agent-First + Full Automation = Zero-Touch Quality**
