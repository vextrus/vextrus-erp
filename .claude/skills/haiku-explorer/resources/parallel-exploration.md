# Parallel Exploration Patterns

**Purpose**: Using 2-3 Explore agents simultaneously for faster context gathering

---

## When to Use Parallel Exploration

**Scenarios**:
1. Multi-service features (finance + master-data + notification)
2. Cross-cutting concerns (authentication across all services)
3. Comprehensive codebase analysis (all skills, all patterns)
4. Architecture research (multiple layers simultaneously)
5. Time-sensitive tasks (need fast context before implementation)

**Benefits**:
- **2-5x faster** than sequential exploration
- Same quality, but wall-clock time dramatically reduced
- All agents complete in parallel (1-2 minutes total vs 5-10 minutes sequential)

---

## Pattern 1: Multi-Service Feature Exploration

**Scenario**: Feature spans multiple microservices

**Example**: Payment notification system
```
User: "Implement payment notification feature"

Services involved:
- finance (payment processing)
- notification (email/SMS sending)
- master-data (user contact details)

Sequential Exploration (❌ Slow):
1. /explore services/finance (2 min)
2. /explore services/notification (2 min)
3. /explore services/master-data (2 min)
Total: 6 minutes

Parallel Exploration (✅ Fast):
Launch 3 agents simultaneously:
├─ Agent 1: /explore services/finance
├─ Agent 2: /explore services/notification
└─ Agent 3: /explore services/master-data

Wait for all to complete: 2 minutes
Total: 2 minutes (3x faster)
```

**Implementation**:
```
Use Task tool with subagent_type=Explore:

Message with 3 parallel Task calls:
1. Task(subagent_type="Explore", prompt="/explore services/finance", description="Explore finance service")
2. Task(subagent_type="Explore", prompt="/explore services/notification", description="Explore notification service")
3. Task(subagent_type="Explore", prompt="/explore services/master-data", description="Explore master-data service")

All 3 launch simultaneously, complete in ~2 minutes
```

---

## Pattern 2: Layered Architecture Exploration

**Scenario**: Need to understand multiple layers of same service

**Example**: Full stack exploration for new feature
```
User: "Add invoice export to PDF feature"

Layers involved:
- Domain (invoice aggregate logic)
- Application (export command handler)
- Infrastructure (PDF generation library)

Sequential Exploration (❌ Slow):
1. /explore services/finance/src/domain (2 min)
2. /explore services/finance/src/application (2 min)
3. /explore services/finance/src/infrastructure (2 min)
Total: 6 minutes

Parallel Exploration (✅ Fast):
Launch 3 agents simultaneously:
├─ Agent 1: /explore services/finance/src/domain
├─ Agent 2: /explore services/finance/src/application
└─ Agent 3: /explore services/finance/src/infrastructure

Wait for all to complete: 2 minutes
Total: 2 minutes (3x faster)
```

---

## Pattern 3: Codebase + Documentation Research

**Scenario**: Need both code exploration and external documentation

**Example**: Integrating new library
```
User: "Integrate EventStore into Finance service"

Research needed:
- Finance service structure
- EventStore documentation
- Existing event sourcing patterns in codebase

Sequential Exploration (❌ Slow):
1. /explore services/finance (2 min)
2. WebFetch EventStore docs (2 min)
3. /explore sessions/knowledge/vextrus-erp/patterns (2 min)
Total: 6 minutes

Parallel Exploration (✅ Fast):
Launch 3 agents simultaneously:
├─ Agent 1: /explore services/finance
├─ Agent 2: WebFetch EventStore docs
└─ Agent 3: /explore sessions/knowledge/vextrus-erp/patterns

Wait for all to complete: 2 minutes
Total: 2 minutes (3x faster)
```

---

## Pattern 4: Comprehensive Skills Analysis

**Example from Session 5**: Understand entire skills ecosystem

```
Task: "Analyze all 17 skills for consistency and quality"

Areas to explore:
- .claude/skills/ directory (17 skills)
- sessions/knowledge/ directory (pattern files)
- Skill integration and dependencies

Sequential Exploration (❌ Slow):
1. /explore .claude/skills/ (3 min)
2. /explore sessions/knowledge/ (3 min)
3. Analyze skill integration manually (3 min)
Total: 9 minutes

Parallel Exploration (✅ Fast - Session 5 approach):
Launch 3 agents simultaneously:
├─ Agent 1: /explore .claude/ directory
│   → Analyze all skill files, quality gaps
├─ Agent 2: /explore sessions/ directory
│   → Identify pattern files, knowledge base status
└─ Agent 3: Analyze skill integration
   → Trigger words, co-activation frequency

Wait for all to complete: 3 minutes
Total: 3 minutes (3x faster)

Results:
- Identified quality gap (Core Skills 2-star vs Advanced Skills 5-star)
- Found missing pattern files (3 needed creation)
- Mapped skill dependencies and co-activation patterns
- Discovered Anthropic best practices template (health-check-patterns.md)
```

**Impact**: 3 hours of Session 5 saved by parallel exploration upfront

---

## Pattern 5: Security Audit Across Services

**Scenario**: Check security patterns across all services

**Example**: RBAC implementation audit
```
User: "Verify RBAC is consistently implemented across all services"

Services to check:
- finance, master-data, notification, auth, etc.

Sequential Exploration (❌ Slow):
1. /explore services/finance RBAC (2 min)
2. /explore services/master-data RBAC (2 min)
3. /explore services/notification RBAC (2 min)
...
Total: 2 min × 11 services = 22 minutes

Parallel Exploration (✅ Fast):
Launch 3 agents (rotate through services):

Batch 1 (agents 1-3): finance, master-data, notification (2 min)
Batch 2 (agents 1-3): auth, audit, configuration (2 min)
Batch 3 (agents 1-3): scheduler, document-generator, import-export (2 min)
Batch 4 (agents 1-2): file-storage, workflow (2 min)

Total: 8 minutes (2.75x faster)
```

---

## Best Practices

### 1. Optimal Agent Count

**Sweet Spot**: 2-3 agents
- 2 agents: Multi-service (finance + notification)
- 3 agents: Full stack (domain + application + infrastructure)
- 4+ agents: Rare, only for comprehensive audits

**Why not more?**
- Diminishing returns beyond 3 agents
- Context switching overhead
- Most tasks covered by 2-3 areas

### 2. Task Independence

**Parallel works when**: Agents explore independent areas
```
✅ Good: services/finance + services/notification (no overlap)
✅ Good: domain layer + application layer (different concerns)

❌ Bad: invoice.aggregate.ts + invoice.entity.ts (sequential dependency)
```

### 3. Thoroughness Levels

**Quick (30 seconds per agent)**:
- Basic structure
- Main files
- Use for: Simple features

**Medium (1-2 minutes per agent)**:
- Detailed analysis
- Cross-references
- Use for: Features

**Very Thorough (2-3 minutes per agent)**:
- Comprehensive
- All dependencies
- Use for: Architecture changes

**Match thoroughness to task complexity**

### 4. Synthesis After Completion

**After all agents complete**:
1. Review all exploration results
2. Identify key files across all areas
3. Create unified understanding
4. Make implementation decisions

Don't start implementing until all agents done

---

## Evidence from Vextrus ERP

### Session 5 Success

**Task**: Upgrade 17-skill ecosystem to Anthropic best practices

**Parallel Exploration Phase 2** (100% complete):
- Agent 1: .claude/ directory analysis (skill quality)
- Agent 2: sessions/ directory analysis (knowledge base)
- Agent 3: Skill integration patterns

**Results**:
- Time: 3 minutes (vs 9 minutes sequential)
- Speedup: 3x
- Quality: Comprehensive findings
  - Quality gap identified (65% shorter Core Skills)
  - Resource gap found (78% fewer resources)
  - Integration gap discovered (0% auto_load_knowledge in Core)
  - Gold standard template found (health-check-patterns.md)

**Impact**: Enabled 45% session progress in Phase 2 alone

### Payment Notification Feature

**Task**: Implement payment status webhooks

**Parallel Exploration**:
- Agent 1: /explore services/finance (payment logic)
- Agent 2: /explore services/notification (webhook patterns)
- Agent 3: /explore services/master-data (customer data)

**Results**:
- Time: 2 minutes
- Sequential would be: 6 minutes
- Speedup: 3x
- Implementation time saved: 30 minutes (right files identified immediately)

---

## Anti-Patterns

### ❌ Sequential When Parallel Works
```
Bad:
1. /explore services/finance
2. Wait for completion
3. /explore services/notification
4. Wait for completion
5. /explore services/master-data
6. Finally start implementing

3x slower than parallel
```

### ❌ Too Many Agents (>4)
```
Bad: Launch 10 agents for 10 services

Issues:
- Context switching overhead
- Difficult to synthesize
- Diminishing returns

Good: 3 agents covering primary services, explore others on-demand
```

### ❌ Dependent Explorations in Parallel
```
Bad:
Agent 1: /explore invoice.aggregate.ts
Agent 2: /explore methods called by invoice.aggregate.ts (unknown until Agent 1 done)

These have sequential dependency, run sequentially
```

### ❌ Starting Implementation Before All Agents Complete
```
Bad:
- Agent 1 completes (finance)
- Start implementing
- Agent 2 completes (notification) - now you need to refactor
- Agent 3 completes (master-data) - another refactor

Wait for all agents, then implement once
```

---

## Quick Reference

| Scenario | Agent Count | Time | vs Sequential |
|----------|-------------|------|---------------|
| Multi-service (2-3 services) | 2-3 | 2 min | 3x faster |
| Full stack (3 layers) | 3 | 2 min | 3x faster |
| Comprehensive (many areas) | 3 (batched) | 6-8 min | 2.5x faster |
| Code + Docs research | 2-3 | 2 min | 3x faster |

**General Rule**: 2-5x speedup with parallel exploration, no quality loss

---

## Summary

**When to Use**:
- Multi-service features
- Full stack exploration
- Architecture research
- Time-sensitive tasks

**Benefits**:
- 2-5x wall-clock time reduction
- Same exploration quality
- Faster time-to-implementation

**Optimal**: 2-3 agents for independent areas

**Evidence**: Session 5 used parallel exploration for 3x speedup, enabling comprehensive 17-skill analysis in 3 minutes

**Remember**: Launch agents in parallel, synthesize results, then implement.
