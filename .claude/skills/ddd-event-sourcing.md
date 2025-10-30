---
name: ddd-event-sourcing
description: |
  DDD + Event Sourcing + CQRS patterns for domain-driven microservices.
  Auto-activates on: aggregate, event, command, query, CQRS, domain, repository, saga.
triggers:
  - aggregate
  - event
  - command
  - query
  - CQRS
  - domain
  - repository
  - saga
  - DDD
  - event sourcing
---

# DDD Event Sourcing (Quick Reference)

## Aggregate Patterns

**Core Rules**:
- **Small**: One aggregate per transaction
- **Enforce Invariants**: Business rules at aggregate boundaries
- **Factory Methods**: Static `create()` for instantiation
- **Event-Sourced**: State from event stream

**Location**: `services/*/src/domain/aggregates/`

**Key Methods**:
- `static create()` - Factory for new aggregates
- `businessMethod()` - State changes + emit events
- `apply(event)` - Apply domain event

**Rules**:
- One aggregate per transaction
- Reference others by ID only
- Idempotent operations

---

## Event Naming

**Format**: `{Entity}{Action}Event` (past tense)

**Examples**:
- ✅ `InvoiceCreatedEvent`, `PaymentReceivedEvent`
- ❌ `CreateInvoiceEvent` (not past tense)

**Properties**:
- Past tense
- Immutable
- Versioned (schema evolution)

**Location**: `services/*/src/domain/events/`

**Structure**:
```
static eventType = 'invoice.created'
static eventVersion = 1
data: { ... }
metadata: EventMetadata
```

---

## Command Patterns

**Format**: `{Action}{Entity}Command` (imperative)

**Examples**:
- ✅ `CreateInvoiceCommand`, `ApproveInvoiceCommand`
- ❌ `InvoiceCreatedCommand` (past tense)

**Properties**:
- Imperative/present tense
- Include all data needed
- Validation before execution

**Location**: `services/*/src/application/commands/`

---

## Query Patterns (CQRS)

**Format**: `Get{Entity}{Criteria}Query`

**Examples**:
- ✅ `GetInvoiceByIdQuery`, `GetInvoicesByCustomerQuery`
- ❌ `InvoiceQuery` (too generic)

**Properties**:
- Read-only
- No side effects
- Return DTOs (not aggregates)

**Location**: `services/*/src/application/queries/`

---

## Repository Patterns

**Event-Sourced Repository**:
- Load aggregate from event stream
- Save by appending events
- No direct state persistence

**Location**: `services/*/src/infrastructure/repositories/`

**Key Methods**:
- `save(aggregate)` - Append uncommitted events
- `findById(id)` - Replay events to reconstruct
- `findByStream(stream)` - Load from event stream

---

## Event Store Pattern

**Purpose**: Persist event stream

**Key Concepts**:
- Append-only log
- Stream per aggregate
- Event versioning
- Snapshots for performance

---

## Saga Pattern (Process Managers)

**Use Cases**:
- Cross-aggregate workflows
- Long-running processes
- Compensating transactions

**Example**: Order fulfillment, payment processing

**Location**: `services/*/src/application/sagas/`

---

## Best Practices

**DO ✅**:
- Small aggregates
- Events past tense, immutable
- Commands imperative, validated
- CQRS separation
- Idempotent commands

**DON'T ❌**:
- Modify multiple aggregates in one transaction
- Reference aggregate instances (use IDs)
- Mutate events after creation
- Mix command and query responsibilities

---

## Quick Patterns

**Aggregate**: Small, enforces invariants, emits events
**Event**: Past tense, immutable, versioned
**Command**: Imperative, validated, idempotent
**Query**: Read-only, returns DTOs
**Repository**: Event-sourced, loads from stream
**Saga**: Orchestrates cross-aggregate workflows

---

## Reference

- **Full Patterns**: `VEXTRUS-PATTERNS.md` sections 1-5
- **Examples**: See `services/*/src/domain/` for implementations
- **Location Convention**: aggregates/, events/, commands/, queries/

---

**Always follow DDD + Event Sourcing + CQRS patterns for domain layer.**
