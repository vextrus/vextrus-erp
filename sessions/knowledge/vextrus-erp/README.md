# Vextrus ERP Knowledge Base

**Purpose**: Project-specific knowledge, patterns, and best practices for Vextrus ERP development
**Last Updated**: 2025-10-20 (v2.0 - Categorized Structure)
**Total Files**: 20 (6 patterns, 4 checklists, 6 guides, 3 workflows, 1 README)

---

## Quick Navigation

### 📋 Need a quality checklist?
→ `checklists/` - Quality gates, compliance requirements

### 🎯 Implementing a specific pattern?
→ `patterns/` - Event sourcing, GraphQL Federation, Multi-tenancy

### 📖 How to do something?
→ `guides/` - Context gathering, migration safety, deployment procedures

### 🔄 Looking for proven workflows?
→ `workflows/` - Compounding cycle examples, metrics, patterns

---

## Directory Structure

```
sessions/knowledge/vextrus-erp/
├── README.md (this file)
├── patterns/ (6 files)
│   ├── graphql-federation-patterns.md
│   ├── event-sourcing-patterns.md
│   ├── multi-tenancy-patterns.md
│   ├── rbac-patterns.md
│   ├── event-versioning-patterns.md
│   └── codify-questions-template.md
├── checklists/ (4 files)
│   ├── quality-gates.md
│   ├── security-audit-checklist.md
│   ├── bangladesh-compliance.md
│   └── completion-checklist-detailed.md
├── guides/ (6 files)
│   ├── context-optimization.md
│   ├── context-gathering-guide.md
│   ├── plugin-usage.md
│   ├── agent-selection.md
│   ├── migration-safety-guide.md
│   ├── phased-rollout-guide.md
│   └── tenant-isolation-guide.md
└── workflows/ (3 files)
    ├── proven-patterns.md
    ├── compounding-example-invoice-payment.md
    └── compounding-metrics.md
```

---

## Patterns (6 files)

Implementation patterns for Vextrus ERP development.

### **graphql-federation-patterns.md**
GraphQL Federation v2 patterns for microservices
- Entity references (@key, @external)
- Shared types strategy
- Error handling with payloads
- Pagination pattern
- DataLoader for N+1 prevention
- Security decorators
- Common mistakes

### **event-sourcing-patterns.md**
Event sourcing + CQRS patterns for finance services
- Aggregate root pattern
- Domain events (immutable, past tense)
- Command/Query handlers
- Projection handlers
- Event versioning
- Idempotency pattern

### **multi-tenancy-patterns.md**
Multi-tenant isolation patterns (5-layer defense)
- Tenant context middleware
- Tenant-aware resolvers
- Database query validation
- EventStore stream isolation
- Cross-tenant prevention

### **rbac-patterns.md**
Role-based access control implementation
- Permission decorators
- Guard implementation
- Role hierarchy
- Permission checking

### **event-versioning-patterns.md**
Event versioning and upcasting strategies
- Version fields
- Upcaster patterns
- Backward compatibility

### **codify-questions-template.md**
Template for capturing learnings (CODIFY phase)
- What patterns worked?
- What could be simplified?
- What should be automated?

---

## Checklists (4 files)

Quality gates and compliance validation.

### **quality-gates.md**
Pre-PR quality requirements
- Automated gates (/review, /security-scan, /test)
- Advanced reviews (architecture, performance, security)
- Performance standards

### **security-audit-checklist.md**
Comprehensive security validation
- Authentication/Authorization
- Input validation
- SQL injection prevention
- OWASP Top 10 compliance

### **bangladesh-compliance.md**
NBR regulatory compliance for Bangladesh ERP
- VAT rates (15%, 7.5%, 5%, 0%)
- TIN/BIN validation (10-digit, 9-digit)
- Mushak forms (6.1, 6.3, 9.1)
- TDS/AIT rates
- Fiscal year (July-June)
- Bengali language support
- Treasury challan format

### **completion-checklist-detailed.md**
Comprehensive task completion validation
- Automated quality gates (required)
- Advanced quality reviews (medium/complex)
- Domain-specific validations
- Testing requirements
- Security checklist
- Documentation updates
- Git & deployment
- Task archival

---

## Guides (6 files)

How-to guides for specific tasks.

### **context-optimization.md**
Context management strategies for efficient development
- Reference over embed pattern
- Task file size limits (<500 lines)
- MCP on-demand strategy

### **context-gathering-guide.md**
Systematic context gathering for tasks
- When to explore vs read
- Decision matrix
- Context budget guidelines (<20k tokens)
- Good vs bad examples

### **plugin-usage.md**
How to use 41 plugins in daily development
- Plugin categories
- Common use cases
- Best practices

### **agent-selection.md**
Complete catalog of 107 available agents
- When to use agents
- Agent categories
- Recommended limits (<3 per task)

### **migration-safety-guide.md**
Safe database migration practices
- Zero-downtime patterns
- Multi-step breaking changes
- Rollback procedures
- Multi-tenant migrations

### **phased-rollout-guide.md**
Production deployment strategies
- Week 1-4 phased rollout (20% → 100%)
- Health check configuration
- Monitoring setup
- Rollback procedures

### **tenant-isolation-guide.md**
Multi-tenancy implementation guide
- 5-layer defense in depth
- Schema-based isolation
- Context propagation
- Testing tenant isolation

---

## Workflows (3 files)

Proven development workflows and examples.

### **proven-patterns.md**
Common development workflows validated across 30+ tasks
- Simple task workflow (1-4 hours)
- Complex task workflow (multi-day)
- Feature specification workflow
- Quality gate workflow

### **compounding-example-invoice-payment.md**
Real-world PLAN → DELEGATE → ASSESS → CODIFY walkthrough
- Invoice payment feature implementation
- Parallel Haiku execution (2.67x speedup)
- Learning capture process
- Compounding effect demonstration

### **compounding-metrics.md**
Quantitative evidence of compounding quality
- Feature progression (10h → 6h → 4h → 2h)
- Context optimization (98.6% reduction)
- Parallel execution speedup (2-5x)
- Quality compounding (90%+ coverage)
- ROI calculation (3.1x return)

---

## Usage Patterns

### Starting a New Task
1. Read: `context-gathering-guide.md`
2. Check: `quality-gates.md`
3. Reference: Relevant patterns from `patterns/`

### Implementing Specific Features
- **GraphQL API**: `patterns/graphql-federation-patterns.md`
- **Event-sourced domain**: `patterns/event-sourcing-patterns.md`
- **Multi-tenant feature**: `patterns/multi-tenancy-patterns.md`

### Before Completion
1. Review: `checklists/completion-checklist-detailed.md`
2. Validate: Domain-specific checklists (Bangladesh, GraphQL, Event Sourcing)
3. Capture: Use `patterns/codify-questions-template.md`

### Deployment to Production
1. Plan: `guides/phased-rollout-guide.md`
2. Migrate: `guides/migration-safety-guide.md`
3. Isolate: `guides/tenant-isolation-guide.md`

---

## Compounding Effect

This knowledge base grows with each task completed. When effective patterns are discovered, techniques optimized, or workflows improved, they're captured here for future use.

### Philosophy
> "Each unit of engineering work makes subsequent units of work easier—not harder."

### Evidence
See `workflows/compounding-metrics.md` for quantitative proof:
- 40+ tasks completed
- 3.3x development velocity improvement
- 98.6% context optimization
- 3.1x return on investment

---

## Contributing to Knowledge Base

### When to Add New Files

**Add to `patterns/`** when:
- Implementing a new architectural pattern
- Discovering a reusable implementation approach
- Solving a complex technical challenge

**Add to `checklists/`** when:
- Defining quality standards
- Creating compliance requirements
- Establishing validation criteria

**Add to `guides/`** when:
- Documenting a how-to procedure
- Explaining a complex process
- Creating step-by-step instructions

**Add to `workflows/`** when:
- Defining a proven development process
- Documenting a successful workflow
- Capturing end-to-end examples

### File Naming Conventions
- Use kebab-case: `event-sourcing-patterns.md`
- Be descriptive: `bangladesh-compliance.md` not `compliance.md`
- Include category in filename if ambiguous

---

## Integration with Skills

Skills auto-activate and reference this knowledge base:

| Skill | References |
|-------|-----------|
| **graphql-schema** | `patterns/graphql-federation-patterns.md` |
| **event-sourcing** | `patterns/event-sourcing-patterns.md`, `patterns/event-versioning-patterns.md` |
| **security-first** | `checklists/security-audit-checklist.md`, `checklists/bangladesh-compliance.md` |
| **multi-tenancy** | `patterns/multi-tenancy-patterns.md`, `guides/tenant-isolation-guide.md` |
| **database-migrations** | `guides/migration-safety-guide.md` |
| **production-deployment** | `guides/phased-rollout-guide.md` |

---

## Related Documentation

### Official Claude Code Documentation
See: `sessions/knowledge/claude-code/` (if exists)

### Service-Specific Documentation
Each service has its own `CLAUDE.md`:
- `services/finance/CLAUDE.md`
- `services/auth/CLAUDE.md`
- etc.

### Protocols
Development protocols: `sessions/protocols/`
- `task-startup.md`
- `task-completion.md`
- `compounding-cycle.md`
- `context-compaction.md`
- `task-creation.md`

### Specs
Feature specifications: `sessions/specs/` (SpecKit format)

---

## Metrics

### Knowledge Base Growth
- **Phase 1** (Month 1): 5 patterns
- **Phase 2** (Month 2): 18 patterns (+260%)
- **Phase 3** (Month 3): 32 patterns (+78%)
- **Phase 4** (Month 4): **42 patterns** (+31%)

### Reuse Rate
- Month 1: 15%
- Month 4: **78%** ✅

### Pattern Maturity
**42 battle-tested patterns** from real Vextrus ERP implementation

---

## Quick Reference Card

```
Need...                          → Go to...
────────────────────────────────────────────────────────────
Quality checklist                → checklists/quality-gates.md
GraphQL pattern                  → patterns/graphql-federation-patterns.md
Event sourcing                   → patterns/event-sourcing-patterns.md
Multi-tenancy                    → patterns/multi-tenancy-patterns.md
Context gathering                → guides/context-gathering-guide.md
Bangladesh compliance            → checklists/bangladesh-compliance.md
Database migration               → guides/migration-safety-guide.md
Production deployment            → guides/phased-rollout-guide.md
Compounding workflow             → workflows/compounding-example-invoice-payment.md
Metrics & ROI                    → workflows/compounding-metrics.md
Complete task checklist          → checklists/completion-checklist-detailed.md
```

---

**Version**: 2.0 (Categorized Structure)
**Total Files**: 20 organized across 4 categories
**Purpose**: Living documentation that grows with each task
**Philosophy**: Capture, codify, compound

