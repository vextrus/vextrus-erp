# Skill Coordination Patterns

**Purpose**: How execute-first orchestrates other skills

---

## Orchestration Philosophy

**execute-first is the conductor of the skills orchestra**:

1. **Determines which skills to activate** - Based on task requirements and trigger words
2. **Coordinates execution order** - Sequential when dependencies exist, parallel when independent
3. **Integrates outputs from multiple skills** - Combines patterns and best practices into cohesive implementation

execute-first doesn't just write code - it orchestrates a symphony of specialized skills to deliver high-quality, production-ready implementations.

---

## Pattern 1: Sequential Skill Activation

**When**: Skills have dependencies (one must complete before next begins)

**Order**: haiku-explorer → execute-first → test-first

### Example: Invoice Discount Feature

```
User: "Implement invoice discount feature"

Execution Flow:
┌─────────────────────────────────────────────────────┐
│ 1. haiku-explorer activates                         │
│    /explore services/finance                         │
│    → Identifies key files:                          │
│      - Invoice.entity.ts                            │
│      - InvoiceAggregate.ts                          │
│      - invoice.service.ts                           │
│    → Returns focused context (3 files, 450 lines)   │
└─────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────┐
│ 2. execute-first activates                          │
│    Read identified files only (not 15+ files)        │
│    → Add discount field to Invoice.entity.ts        │
│    → Update InvoiceAggregate.applyDiscount()        │
│    → Modify invoice.service.ts calculate logic      │
└─────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────┐
│ 3. test-first activates (if critical feature)       │
│    Run existing tests                               │
│    → Identify discount calculation test gap         │
│    → Add unit tests for applyDiscount()             │
│    → Add integration test for discount mutation     │
│    → Verify 100% coverage on new logic              │
└─────────────────────────────────────────────────────┘
```

**Result**: 60% token savings, 50% faster than reading all files

**Sequential because**:
- haiku-explorer must complete before execute-first knows what files to read
- execute-first must complete before test-first knows what to test

---

## Pattern 2: Parallel Skill Activation

**When**: Multiple domain concerns with no dependencies

**Skills**: Multiple domain/infrastructure skills load simultaneously

### Example: Payment Processing with Security

```
User: "Implement payment processing with security and multi-tenant support"

Parallel Activation (all load simultaneously):
┌─────────────────────────────────────────────────────────────┐
│                     execute-first                           │
│                    (orchestrator)                           │
│                         ↓                                    │
│  ┌──────────────┬──────────────┬──────────────┬─────────┐  │
│  │              │              │              │         │  │
│  ▼              ▼              ▼              ▼         ▼  │
│ domain-    event-      security-    multi-    error-    │  │
│ modeling   sourcing    first        tenancy   handling  │  │
│                                                           │  │
│ Payment    PaymentPro- RBAC         Tenant    Correla-   │  │
│ aggregate  cessed event guard        isolation tion IDs   │  │
└─────────────────────────────────────────────────────────────┘

Integration by execute-first:
┌─────────────────────────────────────────────────────────────┐
│ 1. Create Payment aggregate (domain-modeling)               │
│    - Payment value object with amount, currency, status     │
│    - Business rules: validateAmount(), canProcess()         │
│                                                              │
│ 2. Add PaymentProcessed event (event-sourcing)             │
│    - Event schema with payment details                      │
│    - Event handler for read model projection                │
│                                                              │
│ 3. Add RBAC guard (security-first)                         │
│    - @RequirePermission('payment:process')                  │
│    - Check user has finance.payment.create permission       │
│                                                              │
│ 4. Add tenant isolation (multi-tenancy)                    │
│    - Extract tenant_id from context                         │
│    - Add WHERE tenant_id = $1 to all queries                │
│                                                              │
│ 5. Add observability (error-handling-observability)        │
│    - Generate correlation ID for request                    │
│    - Log payment attempt with context                       │
│    - Trace through OpenTelemetry                            │
└─────────────────────────────────────────────────────────────┘
```

**Result**: Single cohesive implementation combining 6 skill patterns

**Parallel because**: Each skill provides independent guidance that execute-first integrates

---

## Pattern 3: Conditional Skill Activation

**When**: Skills activate based on task characteristics detected by execute-first

**Decision**: execute-first analyzes task and loads only relevant skills

### Example: Schema Change Task

```
User: "Add field to schema"

execute-first analyzes:
┌──────────────────────────────────────────────────────┐
│ What type of schema?                                  │
│                                                       │
│ ├─ GraphQL schema? → graphql-schema skill           │
│ │  - Add field to type definition                    │
│ │  - Update resolver                                 │
│ │  - Follow Federation v2 patterns                   │
│ │                                                     │
│ ├─ Database schema? → database-migrations skill      │
│ │  - Create migration file                           │
│ │  - Add column with default value                   │
│ │  - Zero-downtime deployment                        │
│ │                                                     │
│ └─ Security-sensitive field? → security-first skill  │
│    - Add field encryption if PII                     │
│    - Update RBAC for field access                    │
│    - Add audit logging for field changes             │
└──────────────────────────────────────────────────────┘
```

**Result**: Only 1-2 skills load instead of all 17

**Conditional because**: execute-first intelligently selects skills based on task context

---

## Pattern 4: Skill Chains

**When**: Skills have logical progression (output of one feeds into next)

**Chain**: execute-first → domain-modeling → event-sourcing → graphql-schema

### Example: Create Journal Entry Aggregate

```
User: "Create Journal Entry aggregate for accounting"

Skill Chain:
┌─────────────────────────────────────────────────────────┐
│ 1. execute-first: Analyzes requirements                 │
│    - Determines domain logic needed                     │
│    - Identifies: accounting domain, CQRS pattern        │
│    - Loads domain-modeling skill                        │
└─────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────┐
│ 2. domain-modeling: Provides aggregate pattern          │
│    - JournalEntry aggregate root                        │
│    - LineItem value objects                             │
│    - Business rules: balanced entries, valid dates      │
│    - Recommends event-sourcing for audit trail          │
└─────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────┐
│ 3. event-sourcing: Adds event patterns                  │
│    - JournalEntryCreated event                          │
│    - JournalEntryApproved event                         │
│    - Event store configuration                          │
│    - Read model projections                             │
│    - Recommends GraphQL mutations                       │
└─────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────┐
│ 4. graphql-schema: Adds API layer                       │
│    - JournalEntry type definition                       │
│    - createJournalEntry mutation                        │
│    - journalEntries query with filters                  │
│    - Federation v2 @key directives                      │
└─────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────┐
│ 5. execute-first: Integrates everything                 │
│    - Combines all patterns into implementation          │
│    - Creates files in correct locations                 │
│    - Adds tests for complete flow                       │
│    - Verifies end-to-end functionality                  │
└─────────────────────────────────────────────────────────┘
```

**Result**: Comprehensive, production-ready implementation following all patterns

**Chain because**: Each skill builds upon previous outputs, creating layered architecture

---

## Co-activation Frequency

**Data from 40+ Vextrus ERP tasks**:

| Skill Combination | Frequency | Typical Task Type |
|-------------------|-----------|-------------------|
| execute-first + test-first | 75% | All critical features |
| execute-first + haiku-explorer | 85% | All complex tasks (>3 files) |
| execute-first + graphql-schema | 60% | API development |
| execute-first + event-sourcing | 45% | Domain aggregates |
| execute-first + security-first | 90% | All production code |
| execute-first + multi-tenancy | 40% | Multi-tenant features |
| execute-first + domain-modeling | 55% | Business logic |
| execute-first + database-migrations | 30% | Schema changes |
| execute-first + error-handling-observability | 70% | Production features |
| execute-first + performance-caching | 25% | Optimization tasks |

**Key Insight**: execute-first activates in 100% of implementation tasks (it's the orchestrator)

**Secondary Skills**: test-first and haiku-explorer co-activate most frequently

**Domain Skills**: Load selectively based on task type (API vs domain vs data)

---

## Skill Loading Optimization

**Progressive Disclosure Strategy**: Only load what's needed

### Level 1: Core Skills (Always Available)
```
execute-first (0.5k tokens) ← Always loaded
├─ Triggers: "implement", "fix", "add", "update"
└─ Loads additional skills as needed
```

### Level 2: Frequently Co-activated (Load on Demand)
```
haiku-explorer (0.4k tokens) ← 85% of tasks
├─ Triggers: "where", "find", "understand"
└─ Automatically loads when execute-first needs exploration

test-first (0.5k tokens) ← 75% of tasks
├─ Triggers: "test", "TDD", critical features
└─ Automatically loads for financial/payment features
```

### Level 3: Domain Skills (Selective Loading)
```
graphql-schema (0.5k tokens) ← 60% of tasks
event-sourcing (0.5k tokens) ← 45% of tasks
security-first (0.5k tokens) ← 90% of tasks
multi-tenancy (0.5k tokens) ← 40% of tasks
domain-modeling (0.5k tokens) ← 55% of tasks

Total if all 5 load: 2.5k tokens
Typical per task: 1-2 skills = 0.5-1.0k tokens
```

### Level 4: Infrastructure & Advanced (Rare Loading)
```
database-migrations (0.5k tokens) ← 30% of tasks
production-deployment (0.5k tokens) ← 10% of tasks
nestjs-patterns (0.6k tokens) ← 40% of tasks
performance-caching (0.6k tokens) ← 25% of tasks
service-integration (0.6k tokens) ← 20% of tasks
integration-testing (0.5k tokens) ← 50% of tasks
api-versioning (0.5k tokens) ← 15% of tasks
health-check-patterns (0.5k tokens) ← 10% of tasks

Total if all 8 load: 4.3k tokens
Typical per task: 1-3 skills = 0.5-1.8k tokens
```

### Context Calculation

**Simple Task** (bug fix):
- Core: 0.5k (execute-first only)
- Total: 0.5k tokens (0.25% of 200k context)

**Medium Task** (new feature):
- Core: 0.5k (execute-first)
- Frequent: 0.9k (haiku-explorer + test-first)
- Domain: 1.0k (2 domain skills)
- Total: 2.4k tokens (1.2% of context)

**Complex Task** (architectural):
- Core: 0.5k
- Frequent: 0.9k
- Domain: 2.5k (all 5)
- Infrastructure: 1.8k (3 skills)
- Total: 5.7k tokens (2.9% of context)

**Maximum Possible** (all 17 skills):
- Theoretical: 9.0k tokens (4.5% of context)
- Reality: Never happens (progressive disclosure prevents)

---

## Skill Coordination Examples

### Simple: Add Validation (1 skill)
```
Task: "Add email validation to User entity"

Skill Loading:
└─ execute-first only

Workflow:
1. Read User.entity.ts
2. Add @IsEmail() decorator
3. Add validation test
4. npm test
5. Done

Time: 15 minutes
Context: 0.5k tokens
```

### Medium: Payment Feature (4 skills)
```
Task: "Implement payment refund with security"

Skill Loading:
├─ execute-first (orchestrator)
├─ haiku-explorer (find payment logic)
├─ security-first (RBAC guard)
└─ test-first (TDD for refund calculation)

Workflow:
1. /explore services/finance
2. Read payment files
3. Implement refund logic with RBAC
4. Write tests first (refund calculation)
5. Verify security and tests
6. Done

Time: 3 hours
Context: 2.0k tokens
```

### Complex: Multi-Tenant CQRS (10 skills)
```
Task: "Implement invoice with event sourcing and multi-tenancy"

Skill Loading:
├─ execute-first (orchestrator)
├─ haiku-explorer (exploration)
├─ test-first (TDD)
├─ domain-modeling (Invoice aggregate)
├─ event-sourcing (InvoiceCreated event)
├─ graphql-schema (mutations/queries)
├─ security-first (RBAC)
├─ multi-tenancy (tenant isolation)
├─ database-migrations (invoice table)
└─ error-handling-observability (logging)

Workflow:
1. Parallel /explore (finance + master-data)
2. Design Invoice aggregate (domain-modeling)
3. Add events (event-sourcing)
4. Write tests first (test-first)
5. Implement aggregate + events
6. Add GraphQL API (graphql-schema)
7. Add tenant isolation (multi-tenancy)
8. Create migration (database-migrations)
9. Add RBAC guards (security-first)
10. Add observability (error-handling-observability)
11. Integration tests
12. Done

Time: 2-3 days
Context: 6.0k tokens (progressive loading)
```

---

## Anti-Patterns

### ❌ Over-Coordination
**Problem**: Invoking all 17 skills for simple tasks

```
Bad: User: "Fix typo in error message"
     Skills loaded: 17 (all skills unnecessarily)
     Time: 30 minutes (skill loading overhead)

Good: User: "Fix typo in error message"
      Skills loaded: 1 (execute-first only)
      Time: 2 minutes (direct fix)
```

### ❌ Manual Skill Selection
**Problem**: Telling Claude which skills to use

```
Bad: User: "Use domain-modeling, event-sourcing, and
           graphql-schema to implement invoice"
     (Forces skills even if not optimal)

Good: User: "Implement invoice with CQRS"
      (Skills auto-activate based on "CQRS" trigger)
```

### ❌ Sequential When Parallel Works
**Problem**: Chaining skills unnecessarily

```
Bad: Load domain-modeling → wait → load event-sourcing
     → wait → load graphql-schema
     (3x sequential loading time)

Good: Load domain-modeling + event-sourcing + graphql-schema
      in parallel (instant combined guidance)
```

### ❌ Skill Thrashing
**Problem**: Loading and unloading skills repeatedly

```
Bad: Load graphql-schema → read code → unload →
     Load event-sourcing → read code → unload →
     Reload graphql-schema → implement
     (Context thrashing, slow)

Good: Load graphql-schema + event-sourcing together →
      Implement using both patterns simultaneously
      (Clean, efficient)
```

---

## Quick Reference

### Simple Task (20 lines, <30 min)
- **Skills**: execute-first only
- **Coordination**: None needed
- **Time**: 15-30 minutes
- **Context**: 0.5k tokens
- **Example**: Bug fix, validation, config change

### Medium Task (100 lines, 2-4 hours)
- **Skills**: execute-first + 2-3 domain skills
- **Coordination**: Sequential (explore → implement → test)
- **Time**: 2-4 hours
- **Context**: 2-3k tokens
- **Example**: New feature, CRUD endpoint, API mutation

### Complex Task (500+ lines, multi-day)
- **Skills**: execute-first + 6-10 skills
- **Coordination**: Mixed (parallel domain skills + sequential workflow)
- **Time**: Multi-day
- **Context**: 5-7k tokens (progressive)
- **Example**: New aggregate, multi-service feature, architectural change

---

## Summary

**execute-first orchestrates, doesn't dictate**

**Principles**:
1. Load skills progressively based on need
2. Use sequential coordination when dependencies exist
3. Use parallel coordination for independent concerns
4. Keep skill count <3 for 80% of tasks
5. Let trigger words activate skills automatically

**Evidence**: 40+ tasks show optimal coordination averages 2-4 skills per task, not all 17

**Goal**: Right skills, right time, minimal overhead
