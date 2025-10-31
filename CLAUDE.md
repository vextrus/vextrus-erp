# Vextrus ERP - V10.0 Ultimate Agentic Coding System

**System**: Bangladesh Construction & Real Estate ERP (18 microservices)
**Model**: Sonnet 4.5 (200k context) + Haiku 4.5 (Explore/quick tasks)
**Philosophy**: Agent-First → Skills-Driven → Plugin-Orchestrated → Metrics-Informed
**Baseline Context**: <15k tokens (90% reduction from V8.1)

---

## 🚀 Quick Start

### Step 1: Task Classification (AUTO-DETECT)

**Answer ONE question**: *"What level is this task?"*

```
LEVEL 0: IMMEDIATE → 1 file, <30min, trivial (config, typo, version bump)
  └─ 3 steps | No agents | Quality gates only | <20k context

LEVEL 1: SIMPLE → 1-3 files, <2h, single service, known patterns
  └─ 5 steps | Optional agents | Basic gates | <50k context

LEVEL 2: STANDARD → 4-15 files, 2-8h, moderate complexity
  └─ 9 phases | MANDATORY agents | Full orchestration | <100k context
  └─ Uses: Plan + Explore + 5 specialized subagents + 12-15 plugins

LEVEL 3: COMPLEX → 15+ files, 2-5 days, cross-service, distributed
  └─ Multi-day | MANDATORY agents | Comprehensive gates | <120k/session
  └─ Uses: All subagents + 15-20 plugins + parallel execution
```

**⚠️ When uncertain** → Choose HIGHER level (better to over-prepare)

---

### Step 2: Skills Auto-Load (PRIMARY)

**Agent Skills activate AUTOMATICALLY** based on keywords in task:

- **"VAT" / "TDS" / "Mushak" / "NBR"** → `bangladesh-erp-compliance` skill
- **"Aggregate" / "Event" / "Command" / "CQRS"** → `ddd-event-sourcing` skill
- **"GraphQL" / "Federation" / "@key" / "Entity"** → `graphql-federation-v2` skill
- **"NestJS" / "Module" / "@Injectable" / "Multi-tenant"** → `nestjs-microservices` skill

**Skills provide**: Domain patterns, compliance rules, code examples (inline, self-contained)

**Location**: `.claude/skills/` (4 skills, 200-250 lines each, NO external dependencies)

---

### Step 3: Execute Workflow

**Detailed workflows**: See `.claude/WORKFLOWS.md`

**Level 0** (IMMEDIATE): `EDIT → VALIDATE → COMMIT`

**Level 1** (SIMPLE): `RESEARCH → PLAN → IMPLEMENT → VALIDATE → COMMIT`

**Level 2** (STANDARD):
```
PLAN (subagent)
  → EXPLORE (subagent)
  → SPEC (subagent)
  → ARCHITECT (subagent)
  → IMPLEMENT (with TEST-GEN parallel)
  → SECURITY (subagent)
  → REVIEW (plugin)
  → FINALIZE
```

**Level 3** (COMPLEX): Multi-day with checkpoints every 2 phases

---

### Step 4: Plugin Orchestration (AUTO-SELECT)

**Plugins activate AUTOMATICALLY** based on:
- **Domain**: Backend / Frontend / Full-Stack / DevOps / Database
- **Concerns**: Performance / Security / Auth / Distributed / Compliance

**Quick Reference** (31 plugins available):

| Domain | Mandatory Plugins (Level 2+) | Optional Plugins |
|--------|------------------------------|------------------|
| **Backend** | backend-development:feature-development<br>tdd-workflows:tdd-cycle<br>comprehensive-review:full-review | database-migrations:sql-migrations<br>api-documentation-generator:generate-api-docs |
| **Full-Stack** | full-stack-orchestration:full-stack-feature<br>frontend-mobile-development:component-scaffold | application-performance:performance-optimization |
| **Security** | backend-api-security:backend-security-coder<br>authentication-validator:validate-auth | agent-orchestration:multi-agent-optimize |
| **DevOps** | deployment-pipeline-orchestrator:pipeline-orchestrate<br>infrastructure-drift-detector:drift-detect | database-cloud-optimization:cost-optimize |
| **Debugging** | error-debugging:error-analysis<br>debugging-toolkit:smart-debug | distributed-debugging:debug-trace<br>error-debugging:multi-agent-review |
| **Testing** | test-orchestrator:orchestrate<br>unit-testing:test-generate | performance-testing-review:multi-agent-review |

**Full plugin matrix**: See `.claude/PLUGINS.md` (15 pre-defined combos)

---

### Step 5: Quality Gates (MANDATORY)

**Automated (Hooks)**:
- Pre-commit: Auto-format → Auto-lint → Build (BLOCKING) → Test (BLOCKING)
- Post-commit: Metrics collection → Dashboard update

**Manual Verification (Level 2/3)**:
- `/comprehensive-review:full-review` → Score ≥8/10 (BLOCKING)
- `/backend-api-security:backend-security-coder` → 0 critical/high (BLOCKING)

**Enforcement**: Hooks in `.claude/hooks/` (pre-commit.sh, post-commit.sh)

---

## 🧠 Context Management

### Smart Monitoring (Progressive)

**After each phase**:
- **Level 0/1**: Auto-suggest `/context` (non-blocking)
- **Level 2/3**: MANDATORY `/context` (blocking gate)

### Thresholds (Adjusted for V10.0)

| Status | Range | Action | Checkpoint |
|--------|-------|--------|------------|
| **GREEN** | <100k (50%) | Continue | No |
| **YELLOW** | 100-130k (50-65%) | Log warning | No |
| **ORANGE** | 130-160k (65-80%) | Force checkpoint (Level 2/3) | MANDATORY |
| **RED** | ≥160k (80%+) | BLOCKING - new session | Emergency |

### Context Budget by Level

- **Level 0**: Target <20k (10%)
- **Level 1**: Target <50k (25%)
- **Level 2**: Target <100k (50%)
- **Level 3**: Target <120k per session (60%)

**MCP Strategy**: See `.claude/CONTEXT.md` (profiles: minimal/standard/full)

---

## 🤖 Specialized Subagents

**5 specialized subagents** (Level 2/3):

1. **spec-writer**: Plan → Technical specification
2. **architect**: DDD patterns → Architecture decisions
3. **test-generator**: Implementation → Unit + integration tests (parallel)
4. **security-auditor**: Code → OWASP scan + Bangladesh compliance
5. **performance-optimizer**: Code → Bottleneck analysis + recommendations

**Configuration**: `.claude/subagents/*.md`
**Orchestration patterns**: See `.claude/AGENTS.md`

---

## 📊 Metrics & Observability

**Real-time tracking**:
- Tier performance (duration, context, success rate)
- Context health (GREEN/YELLOW/ORANGE/RED distribution)
- Quality scores (build/test/review/security)
- Plugin usage (utilization %, combos)
- Developer experience (satisfaction, productivity)

**Dashboard**: `.claude/metrics/dashboard.html` (auto-generated)
**Collection**: Automated via post-commit hooks

---

## 📚 Resources

| Resource | Purpose | Lines |
|----------|---------|-------|
| **WORKFLOWS.md** | All 4 level workflows (detailed) | 400 |
| **AGENTS.md** | Subagent orchestration patterns | 300 |
| **PLUGINS.md** | 31 plugins + 15 combos | 400 |
| **CONTEXT.md** | Context optimization strategies | 250 |
| **Skills/** | 4 self-contained domain skills | 900 |
| **V10.0-QUICKSTART.md** | 5-minute onboarding | 100 |

---

## 🎯 V10.0 Key Innovations

1. **Level 0 (IMMEDIATE)**: NEW fast-path for trivial tasks (<30min)
2. **9-Phase Pipeline**: Specialized subagents (vs V8.1: 6 generic phases)
3. **Auto-Plugin Orchestration**: Intelligent routing based on domain + concerns
4. **Skills-First**: Auto-invoked domain expertise (no manual selection)
5. **Automated Hooks**: Quality gates without manual commands
6. **Real-Time Metrics**: Dashboard + continuous improvement loop
7. **MCP Profiles**: Context optimization (15k/30k/50k baselines)
8. **90% Context Savings**: Baseline 100k → 15k (lazy-load everything)
9. **31 Plugins @ 48%**: Full utilization (vs V8.1: 6 plugins @ 19%)
10. **Production-Proven**: Based on Netflix, Expedia, Anthropic patterns

---

## ⚡ Success Metrics

| Metric | Target | V8.1 Baseline | Improvement |
|--------|--------|---------------|-------------|
| **Baseline Context** | <15k | 100-125k | 90% reduction |
| **Plugin Usage** | 48% (15/31) | 19% (6/31) | 250% increase |
| **Agent Coverage** | 100% (Level 2/3) | 100% | Maintained |
| **Automation** | 100% (hooks) | 0% (manual) | Full automation |
| **Context RED** | 0/month | 1-2/month | Eliminated |
| **Productivity** | +50% | Baseline | 50% faster |
| **Quality Score** | 9.0/10 | 7.8/10 | +15% |

---

**V10.0: The Ultimate Agentic Coding System**
**Agent-First | Skills-Driven | Plugin-Orchestrated | Metrics-Informed**
**Production-Proven | Context-Optimized | Fully Automated**

**See `.claude/V10.0-QUICKSTART.md` for 5-minute onboarding →**
