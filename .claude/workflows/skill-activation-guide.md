# Skill Activation Guide

**v3.0 Skills**: 4 optimized skills (vs 17 in v1.0, 0 in v2.0)
**Activation Method**: Trigger words in natural language
**Success Rate Target**: 70%+ (vs 5% in v1.0)

---

## Overview

Skills are **domain-specific expertise modules** that activate automatically when you use certain trigger words in your requests. Unlike agents (which you invoke explicitly), skills work in the background to provide relevant patterns and templates.

**v3.0 Philosophy**: **Few, focused skills** (4 skills) + **Many, explicit agents** (33 agents)

---

## v3.0 Skills (4 Optimized)

### 1. haiku-explorer
**Purpose**: Fast codebase exploration with Haiku 4.5
**Size**: ~200 lines (optimized from 632)
**Model**: Haiku 4.5

**Triggers**:
- "where is"
- "find"
- "explore"
- "locate"
- "search for"

**Example Requests**:
```
"Where is the VAT calculation logic?"
→ Activates haiku-explorer → Fast Haiku exploration

"Find all payment processing files"
→ Activates haiku-explorer → Returns file list

"Explore the invoice module"
→ Activates haiku-explorer → Analyzes structure
```

**When It Works Best**:
- Unfamiliar codebase areas
- "Where is X?" questions
- Quick file finding
- Initial exploration phase

---

### 2. vextrus-domain-expert
**Purpose**: Bangladesh Construction & Real Estate ERP domain expertise
**Size**: ~250 lines
**Model**: Sonnet 4.5

**Triggers**:
- "Bangladesh"
- "VAT" / "TDS" / "AIT" / "Mushak"
- "compliance"
- "NBR" / "RAJUK"
- "construction"
- "real estate"
- "fiscal year"
- "property" / "lease"

**Example Requests**:
```
"Calculate VAT for construction materials in Bangladesh"
→ Activates vextrus-domain-expert → 15% rate, NBR compliance

"How does TDS withholding work for vendors without TIN?"
→ Activates vextrus-domain-expert → 7.5% rate (1.5x), explains

"Generate Mushak 6.3 for invoice approval"
→ Activates vextrus-domain-expert → Template + QR code pattern

"Calculate fiscal year for date 2024-08-15"
→ Activates vextrus-domain-expert → FY 2024 (July-June)

"Implement progress billing with 10% retention"
→ Activates vextrus-domain-expert → Construction pattern
```

**When It Works Best**:
- Bangladesh-specific features
- Compliance requirements (VAT, TDS, Mushak)
- Construction project management
- Real Estate management
- Fiscal year calculations

---

### 3. production-ready-workflow
**Purpose**: Checkpoint-driven development, quality gates, production deployment
**Size**: ~300 lines
**Model**: Sonnet 4.5

**Triggers**:
- "production ready"
- "checkpoint"
- "quality gates"
- "deploy" / "deployment"
- "release"
- "production"

**Example Requests**:
```
"Create a checkpoint for Phase 2 completion"
→ Activates production-ready-workflow → Checkpoint template

"What quality gates should I pass before production?"
→ Activates production-ready-workflow → Build, test, coverage, review

"Prepare this feature for production deployment"
→ Activates production-ready-workflow → Checklist + review agents

"Create comprehensive checkpoint with all context"
→ Activates production-ready-workflow → 300-600 line template
```

**When It Works Best**:
- End of development phase
- Production deployment prep
- Creating comprehensive checkpoints
- Quality validation
- Multi-day task management

---

### 4. graphql-event-sourcing
**Purpose**: Core Vextrus architecture (GraphQL Federation v2 + Event Sourcing + CQRS)
**Size**: ~250 lines
**Model**: Sonnet 4.5

**Triggers**:
- "GraphQL" / "federation"
- "event sourcing"
- "CQRS"
- "aggregate"
- "domain event"
- "projection"
- "@key directive"

**Example Requests**:
```
"Create a new Invoice aggregate with event sourcing"
→ Activates graphql-event-sourcing → Aggregate template

"Design federated GraphQL schema for payments"
→ Activates graphql-event-sourcing → Federation v2 pattern

"Add a domain event for invoice approval"
→ Activates graphql-event-sourcing → Event pattern (past tense, immutable)

"Create projection handler for invoice list query"
→ Activates graphql-event-sourcing → CQRS projection pattern
```

**When It Works Best**:
- New aggregates
- GraphQL schema design
- Event sourcing implementation
- CQRS patterns
- Core architecture work

---

## How Skills Activate

### Activation Flow

```
User Request
     ↓
"Implement VAT calculation for Bangladesh construction"
     ↓
Trigger Detection: "VAT" + "Bangladesh" + "construction"
     ↓
Skill Match: vextrus-domain-expert
     ↓
Skill Loads: 250 lines of Bangladesh domain patterns
     ↓
Claude Applies: 15% VAT rate, NBR compliance, construction-specific rules
     ↓
Implementation: With domain expertise baked in
```

---

### Multi-Skill Activation

**Skills can activate together**:

```
Request: "Create production-ready GraphQL schema for invoice aggregates"

Triggers:
- "production-ready" → production-ready-workflow
- "GraphQL" → graphql-event-sourcing

Result: Both skills active
- graphql-event-sourcing provides: Federation v2 + aggregate patterns
- production-ready-workflow provides: Quality gates + review checklist
```

---

## Optimization Tips

### Tip 1: Use Explicit Trigger Words

✅ **Good** (clear triggers):
```
"Where is the payment service?"           → haiku-explorer activates
"Calculate Bangladesh VAT for invoices"   → vextrus-domain-expert activates
"Create production checkpoint"            → production-ready-workflow activates
"Design federated GraphQL schema"         → graphql-event-sourcing activates
```

❌ **Bad** (vague, no triggers):
```
"Help me find something"                  → No skills activate
"How do I do taxes?"                      → vextrus-domain-expert might not activate
"Ready for prod?"                         → production-ready-workflow might not activate
"Make a schema"                           → graphql-event-sourcing might not activate
```

---

### Tip 2: Combine Triggers for Better Results

```
"Create a checkpoint for the Bangladesh VAT calculation feature"
→ Triggers: "checkpoint" + "Bangladesh" + "VAT"
→ Activates: production-ready-workflow + vextrus-domain-expert
→ Result: Checkpoint template WITH Bangladesh compliance context
```

---

### Tip 3: Skills vs Agents - When to Use What

**Use Skills When**:
- Domain expertise needed (Bangladesh, GraphQL, Event Sourcing)
- Quick exploration (haiku-explorer)
- Production workflow patterns (checkpoints, quality gates)
- Pattern templates (copy-paste ready)

**Use Agents When**:
- Complex planning (architecture-strategist)
- Code review (kieran-typescript-reviewer)
- Security audit (security-sentinel)
- External research (best-practices-researcher)
- Multi-step workflows

**Use Both When**:
```
Request: "Design and implement production-ready invoice aggregate with Bangladesh compliance"

Skills Activate:
- graphql-event-sourcing (aggregate patterns)
- vextrus-domain-expert (Bangladesh VAT/TDS)
- production-ready-workflow (quality gates)

Then Invoke Agents:
- architecture-strategist (system design)
- kieran-typescript-reviewer (code review)
- security-sentinel (multi-tenant check)
```

---

## Troubleshooting

### Problem: Skill not activating

**Symptom**: Expected skill doesn't activate

**Diagnosis**:
1. Check if trigger word used
2. Check if skill exists (4 skills in v3.0)
3. Check if request is clear

**Solutions**:

```
# Unclear request
❌ "Help with taxes"
✅ "Calculate Bangladesh VAT for construction materials"  (clear trigger)

# Wrong trigger word
❌ "Show me payments"
✅ "Where is the payment service?"  (triggers haiku-explorer)

# No trigger word
❌ "I need to deploy"
✅ "Prepare for production deployment"  (triggers production-ready-workflow)
```

---

### Problem: Wrong skill activates

**Symptom**: Different skill than expected activates

**Diagnosis**: Multiple trigger words in request

**Solution**: Be more specific

```
❌ "Create GraphQL production checkpoint for Bangladesh invoices"
   → All 4 skills might activate (too many triggers)

✅ "Create checkpoint for Phase 2" (Step 1)
   → production-ready-workflow activates

✅ "Add Bangladesh VAT calculation" (Step 2)
   → vextrus-domain-expert activates

✅ "Create GraphQL schema" (Step 3)
   → graphql-event-sourcing activates
```

---

### Problem: Skill provides too much information

**Symptom**: Skill response is overwhelming

**Solution**: Ask specific questions

```
❌ "Tell me about Bangladesh compliance"
   → vextrus-domain-expert provides ALL patterns (overwhelming)

✅ "What is the VAT rate for construction materials in Bangladesh?"
   → vextrus-domain-expert provides: 15% + brief explanation

✅ "How do I calculate TDS for vendors without TIN?"
   → vextrus-domain-expert provides: 7.5% formula
```

---

## Skill Coordination with Agents

### Pattern 1: Skill First, Agent Second

```
Step 1: "Create invoice aggregate with event sourcing"
→ graphql-event-sourcing skill provides template

Step 2: Implement using template

Step 3: "Review the invoice aggregate implementation"
→ Invoke kieran-typescript-reviewer agent
```

---

### Pattern 2: Agent First, Skill Second

```
Step 1: "Analyze existing payment patterns"
→ Invoke pattern-recognition-specialist agent

Step 2: "Implement payment with Bangladesh TDS withholding"
→ vextrus-domain-expert skill provides TDS patterns

Step 3: Implement
```

---

### Pattern 3: Parallel (Skill + Agent)

```
Request: "Design production-ready GraphQL schema for real estate with Bangladesh compliance, then review"

Parallel Activation:
- Skills: graphql-event-sourcing + vextrus-domain-expert + production-ready-workflow
- Agent (later): kieran-typescript-reviewer

Flow:
1. Skills provide patterns
2. Implement
3. Agent reviews
```

---

## Success Metrics

### v1.0 (17 Skills)
- Activation rate: 5% (only haiku-explorer)
- Complexity: High (8,683 lines total)
- Overhead: 1,700 tokens always loaded
- Result: FAILED

### v2.0 (0 Skills)
- Activation rate: N/A (no skills)
- Complexity: Low (agent-only)
- Overhead: 0 tokens
- Result: Too extreme, missing domain expertise

### v3.0 (4 Skills) - Target
- Activation rate: 70%+ (all 4 skills)
- Complexity: Low (~800 lines total)
- Overhead: 400 tokens
- Result: Focused, reliable domain expertise

---

## Best Practices

✅ **Do**:
- Use explicit trigger words
- Combine skills with agents (complementary)
- Let skills provide templates, implement yourself
- Use haiku-explorer for quick exploration
- Use vextrus-domain-expert for Bangladesh features

❌ **Don't**:
- Expect skills to implement (they provide patterns)
- Rely only on skills (use agents for review)
- Use vague language (be explicit with triggers)
- Activate all skills at once (focus per task)
- Forget agents exist (use for planning/review)

---

## Quick Command Reference

```bash
# Exploration
"Where is the payment service?"
→ haiku-explorer

# Bangladesh Compliance
"Calculate VAT for construction in Bangladesh"
→ vextrus-domain-expert

# Production Workflow
"Create checkpoint for Phase 2"
→ production-ready-workflow

# Core Architecture
"Create invoice aggregate with event sourcing"
→ graphql-event-sourcing

# Combine Skills + Agents
"Design GraphQL schema" (skill) → "Review implementation" (agent)
→ graphql-event-sourcing + kieran-typescript-reviewer
```

---

**Version**: 3.0
**Updated**: 2025-10-24
**Skills**: 4 optimized (haiku-explorer, vextrus-domain-expert, production-ready-workflow, graphql-event-sourcing)
**See Also**:
- [Agent Directory](../agents/AGENT-DIRECTORY.md) - When to use agents
- [Simple Task Workflow](./simple-task-workflow.md) - Skills rarely needed
- [Medium Task Workflow](./medium-task-workflow.md) - Skills + agents
- [Complex Task Workflow](./complex-task-workflow.md) - Skills + agents + checkpoints
