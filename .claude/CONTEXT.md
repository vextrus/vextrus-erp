# V10.0 Context Management & Optimization

**Purpose**: Smart context strategies to achieve <15k baseline (90% reduction from V8.1)

**V10.0 Target**: Baseline <15k tokens (vs V8.1: 100-125k)

---

## Context Budget Philosophy

### V8.1 Problem

**Baseline context**: 100-125k tokens
- CLAUDE.md: ~100k (loaded always)
- Skills: ~28k (4 skills loaded upfront)
- MCPs: ~20-40k (all servers enabled)
- **Total**: 148-168k before ANY work (74-84% consumed)

**Result**: <40k available for actual work (RED risk constant)

### V10.0 Solution

**Baseline context**: <15k tokens
- CLAUDE.md: ~10k (concise entry point)
- Skills: 0k (lazy-loaded on keywords)
- MCPs: ~4-8k (minimal profile, selective enabling)
- **Total**: 14-18k baseline (7-9% consumed)

**Result**: 182-186k available for work (91-93% capacity)

**Savings**: 130-150k tokens (87-90% reduction)

---

## Smart Context Monitoring

### Progressive Monitoring (by Level)

**Level 0/1** (Non-blocking):
```
After phase complete:
  "Consider running /context to check status (recommended)"

No enforcement - trust Claude for simple tasks
```

**Level 2/3** (MANDATORY):
```
After phase complete:
  "MANDATORY: Please run /context now"

  [Wait for user response]

  User: "Context: 85k tokens (42.5%)"

  Parse & Evaluate:
  - Tokens: 85k
  - Percentage: 42.5%
  - Status: GREEN (<100k / 50%)

  Action: Continue to next phase
```

### Thresholds (Adjusted for V10.0)

| Status | Range | Percentage | Action | Checkpoint |
|--------|-------|------------|--------|------------|
| **GREEN** | <100k | <50% | Continue | No |
| **YELLOW** | 100-130k | 50-65% | Log warning | No |
| **ORANGE** | 130-160k | 65-80% | Force checkpoint (Level 2/3) | MANDATORY |
| **RED** | ≥160k | ≥80% | BLOCKING - new session | Emergency |

### Why These Thresholds?

**Research-backed** (production systems):
- **50% safe zone**: Quality maintained, no degradation
- **65% warning zone**: Monitor closely, optimize if possible
- **80% danger zone**: Quality degradation begins, checkpoint required
- **≥80% critical**: High risk, BLOCKING prevents issues

**Conservative but effective**: Leaves 20% buffer for safety

---

## MCP Server Strategy

### The Problem

**Each MCP server costs 4-10k tokens** (tool definitions + schemas):
- 1 server: ~5k (2.5%)
- 4 servers: ~20k (10%)
- 8 servers: ~40k (20%)

**V8.1**: 4 servers always on = ~20-40k baseline waste

### The Solution: MCP Profiles

**Profile 1: MINIMAL** (Core only - 4-8k tokens):
```json
{
  "enabled": ["filesystem", "git", "bash"],
  "disabled": ["database", "docs", "sequential-thinking", "exa", "playwright", "brave-search"]
}
```
- **When**: Level 0/1, Implementation phase
- **Baseline**: ~8k tokens (4%)

**Profile 2: STANDARD** (Common tools - 15-20k tokens):
```json
{
  "enabled": ["filesystem", "git", "bash", "database", "docs"],
  "disabled": ["sequential-thinking", "exa", "playwright", "brave-search"]
}
```
- **When**: Level 2 Design/Review phases
- **Baseline**: ~18k tokens (9%)

**Profile 3: FULL** (All servers - 30-50k tokens):
```json
{
  "enabled": ["filesystem", "git", "bash", "database", "docs", "sequential-thinking", "exa", "playwright", "brave-search"]
}
```
- **When**: Level 3 Complex planning, Explore subagent (separate context)
- **Baseline**: ~40k tokens (20%)

### Per-Phase MCP Strategy

**Level 2 Workflow**:
```
Phase 1 (PLAN): Standard profile (~18k)
  └─ Enabled: filesystem, git, bash, docs
  └─ Disabled: database, sequential-thinking, exa

Phase 2 (EXPLORE): Full profile (~40k, but separate 200k window - 0 main cost)
  └─ Enabled: ALL (separate context, doesn't affect main)

Phase 3 (DESIGN): Standard profile (~18k)
  └─ Enabled: filesystem, git, bash, database, docs

Phase 4 (IMPLEMENT): Minimal profile (~8k)
  └─ Enabled: filesystem, git, bash only

Phase 5 (REVIEW): Standard profile (~18k)
  └─ Enabled: filesystem, git, bash, database (for queries)

Phase 6 (FINALIZE): Minimal profile (~8k)
  └─ Enabled: filesystem, git, bash
```

**Savings**: Average 30k tokens (15%) vs always-on approach

### MCP Toggle Syntax

**Enable MCP**:
```bash
@database-mcp    # Enable for this session
```

**Disable MCP**:
```bash
@@database-mcp   # Disable for this session
```

**List active MCPs**:
```bash
/mcp             # Show all MCPs and status
```

---

## File Reading Strategy

### The Problem

**Reading entire directories = context explosion**:
```bash
# BAD: Read entire service (200+ files, 200k+ tokens)
Read services/finance/src/**/*.ts

# RESULT: Instant RED, session blocked
```

### The Solution: Targeted Reading

**Strategy 1: Explore Subagent First** (0 main context cost):
```bash
# Use Explore in separate 200k window
Task(subagent_type="Explore", prompt="Find invoice domain models in finance service")

# Explore returns SUMMARY (5-10k tokens to main)
# NOT full files (0 waste)
```

**Strategy 2: Grep Before Read**:
```bash
# Step 1: Find files (1k tokens)
Grep "InvoiceAggregate" services/finance/

# Step 2: Read ONLY relevant files (5k tokens)
Read services/finance/src/domain/invoice.aggregate.ts
Read services/finance/src/domain/invoice.repository.ts

# Total: 6k tokens vs 200k (97% savings)
```

**Strategy 3: Glob for File Discovery**:
```bash
# Step 1: Find pattern (500 tokens)
Glob "**/*invoice*.ts" services/finance/

# Step 2: Read targeted files (5k tokens)
Read [specific files from glob results]

# Total: 5.5k tokens vs 200k (97% savings)
```

### File Reading Limits

**Recommended limits**:
- **Level 0**: 1 file max
- **Level 1**: 3 files max per phase
- **Level 2**: 5 files max per phase
- **Level 3**: 10 files max per phase (multi-service)

**If exceeding limits**: Use Explore subagent instead

---

## Skills Strategy (Lazy Loading)

### V8.1 Problem

**All 4 skills loaded upfront**:
```
bangladesh-erp-compliance: 7k tokens (always loaded)
ddd-event-sourcing: 7k tokens (always loaded)
graphql-federation-v2: 7k tokens (always loaded)
nestjs-microservices: 7k tokens (always loaded)
Total: 28k tokens (14%)
```

**Even if task doesn't need them**: Wasted 28k

### V10.0 Solution

**Skills are lazy-loaded** by keyword matching:
```
Task: "Implement VAT calculation"
  └─ Keywords: "VAT"
  └─ Auto-loads: bangladesh-erp-compliance skill (7k)
  └─ Skips: ddd, graphql, nestjs (0k waste)

Task: "Add GraphQL entity resolution"
  └─ Keywords: "GraphQL", "entity"
  └─ Auto-loads: graphql-federation-v2 skill (7k)
  └─ Auto-loads: ddd-event-sourcing skill (7k) [entity = DDD]
  └─ Skips: bangladesh, nestjs (14k saved)
```

**Result**: Load only what's needed, save 21k average (10.5%)

### Skill Keyword Mapping

**bangladesh-erp-compliance**:
- Keywords: VAT, TDS, Mushak, NBR, Bangladesh, compliance, fiscal year

**ddd-event-sourcing**:
- Keywords: aggregate, event, command, CQRS, projection, domain, entity, value object

**graphql-federation-v2**:
- Keywords: GraphQL, federation, @key, entity resolution, subgraph, schema

**nestjs-microservices**:
- Keywords: NestJS, @Injectable, @Module, microservice, multi-tenant, module

**Auto-loading**: Claude Code matches task description to keywords

---

## Auto-Compact Strategy

### V8.1 Issue

**Auto-compact enabled**: Uses 45k tokens for summarization
- Compresses old conversation history
- Stores in context (not free)
- Low-quality compressed data
- **Waste**: 45k tokens (22.5%)

### V10.0 Recommendation

**Disable auto-compact**:
```json
// .claude/settings.json
{
  "autoCompact": false
}
```

**Why?**
- Git-tracked TODO (.claude/todo/current.md) = explicit memory
- Checkpoints (.claude/checkpoints/) = detailed recovery
- CLAUDE.md = persistent project context
- Fresh sessions = clean context

**Alternative**: Use `/clear` between unrelated tasks

---

## Session Hygiene Patterns

### Pattern 1: Clear Between Features

```bash
# Complete feature A
git commit -m "feat: Invoice-payment linking"
git push

# Clear context before feature B
/clear

# Start feature B with fresh context
# Claude reads CLAUDE.md, TODO, and continues
```

**Benefit**: Each feature starts at ~15k baseline (not accumulated)

### Pattern 2: Checkpoint at ORANGE

```bash
# Phase 5 complete, context at 145k (ORANGE)
MANDATORY: Create checkpoint

# Checkpoint captures state
.claude/checkpoints/2025-10-31-1445-ORANGE.md

# Commit checkpoint
git add . && git commit -m "chore: Checkpoint - context at 145k"

# Continue to Phase 6 (allowed for ORANGE)
```

**Benefit**: Safe recovery point if context reaches RED

### Pattern 3: Multi-Session for Level 3

```bash
# Day 1: Implementation (context: 110k)
Phase 1-5 complete
Checkpoint: DAY1-COMPLETE.md
Commit & push

# Day 2: New session (starts fresh at 15k baseline)
Read TODO + checkpoint
Phase 6-8 complete
```

**Benefit**: Each session stays <120k (never RED)

---

## RAG Pattern for Large Codebases

### The Problem

**18 microservices = millions of tokens**
- Cannot load entire codebase
- Cannot read all services
- Must be selective

### The Solution: Repository Overview

**Create**: `.claude/REPO-OVERVIEW.md` (maintained manually)
```markdown
# Vextrus ERP Repository Overview

## Services (18)

### finance (Domain: Financial operations)
- Location: services/finance/
- Key modules: invoice, payment, vat-calculator
- Key patterns: Event sourcing, GraphQL Federation
- Entry point: src/main.ts

### accounting (Domain: Accounting operations)
- Location: services/accounting/
- Key modules: ledger, journal, trial-balance
- ...

[17 more services...]

## Shared Libraries

- @vextrus/domain-core: DDD primitives (aggregate, entity, value object)
- @vextrus/event-sourcing: Event store, projections
- @vextrus/graphql-federation: Federation utilities

## Common Patterns

- Multi-tenancy: Schema-per-tenant + RLS
- Authentication: JWT + RBAC
- Event sourcing: EventStore + PostgreSQL
- GraphQL: Apollo Federation v2
```

**Usage**:
```bash
# Instead of reading entire codebase
Read .claude/REPO-OVERVIEW.md  # 5k tokens

# Then targeted exploration
Task(subagent_type="Explore", prompt="Explore finance service invoice module")
```

**Savings**: 5k overview vs 200k+ full codebase (98% savings)

---

## Context Budget Per Level

### Level 0: IMMEDIATE (<20k / 10%)

**Budget breakdown**:
- Baseline (CLAUDE.md + MCPs minimal): 12k
- Read 1 file: 3k
- Edit file: 2k
- Quality gates (output): 3k
- **Total**: 20k (10%)

**Remaining**: 180k (90% free)

### Level 1: SIMPLE (<50k / 25%)

**Budget breakdown**:
- Baseline: 12k
- Read 3 files: 9k
- Optional Plan subagent (output): 5k
- Implement: 15k
- Quality gates: 9k
- **Total**: 50k (25%)

**Remaining**: 150k (75% free)

### Level 2: STANDARD (<100k / 50%)

**Budget breakdown**:
- Baseline: 12k
- Plan subagent (output): 5k
- Explore subagent (output): 7k
- SPEC subagent (output): 8k
- ARCHITECT subagent (output): 6k
- Skills (1-2 loaded): 14k
- Implement: 30k
- Security/Review: 18k
- **Total**: 100k (50%)

**Remaining**: 100k (50% free)

### Level 3: COMPLEX (<120k per session / 60%)

**Budget breakdown (per session)**:
- Baseline: 12k
- All subagents (outputs): 30k
- Skills (2-3 loaded): 21k
- Implement (one service): 35k
- Review/Security: 22k
- **Total**: 120k (60%)

**Remaining**: 80k (40% free)

**Multi-session**: 3 sessions @ 120k each = 360k total across 3 days

---

## Context Optimization Checklist

**Before starting session**:
- [ ] Auto-compact disabled (settings.json)
- [ ] MCP profile selected (minimal/standard/full)
- [ ] CLAUDE.md is concise (<15k)
- [ ] Skills are lazy-loaded (not upfront)

**During session**:
- [ ] Use Explore subagent for codebase analysis (0 main cost)
- [ ] Use Grep/Glob before Read (targeted, not bulk)
- [ ] Read ≤5 files per phase (Level 2)
- [ ] Monitor context after every phase (Level 2/3)
- [ ] Clear context between unrelated tasks

**After session**:
- [ ] Update TODO (.claude/todo/current.md)
- [ ] Create checkpoint if ORANGE/RED
- [ ] Disable unused MCPs for next session

---

## Emergency Context Recovery

### If Context Reaches RED (≥160k / 80%)

**IMMEDIATE ACTIONS**:
1. **STOP all work** (RED is BLOCKING)
2. **Create emergency checkpoint**:
   ```bash
   cat > .claude/checkpoints/EMERGENCY-RED.md <<EOF
   # EMERGENCY: Context RED at [X]k

   **BLOCKING**: New session required

   **Last phase**: [phase name]
   **Completion**: [percentage]%
   **Last commit**: [hash]

   **Recovery**: Read this file in new session
   EOF
   ```
3. **Update TODO**:
   ```bash
   # Update .claude/todo/current.md with current state
   ```
4. **Commit everything**:
   ```bash
   git add .
   git commit -m "chore: EMERGENCY checkpoint - context RED"
   git push
   ```
5. **End session** (DO NOT CONTINUE)

**Next session**:
```bash
# 1. Read recovery files
Read .claude/todo/current.md
Read .claude/checkpoints/EMERGENCY-RED.md

# 2. Resume from checkpoint phase
# 3. Continue workflow
```

---

## Success Metrics

| Metric | V8.1 | V10.0 Target | Improvement |
|--------|------|--------------|-------------|
| **Baseline context** | 100-125k | <15k | 90% reduction |
| **Context/session** | 160k avg | <100k avg | 38% reduction |
| **RED incidents** | 1-2/month | 0/month | 100% elimination |
| **Context efficiency** | 20-30% usable | 85-90% usable | 300% improvement |

---

**V10.0 Context Management**
**Smart | Efficient | Research-Backed | Production-Proven**
