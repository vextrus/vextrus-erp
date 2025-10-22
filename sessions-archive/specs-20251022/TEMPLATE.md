---
feature: [feature-name]
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft|approved|implemented
complexity: medium|high
services: [list of affected services]
author: [developer name]
---

# Feature: [Human-Readable Feature Name]

**SpecKit Feature Specification** - Plan before code, reference during implementation

---

## 1. Context & Research

### Problem Statement

[What problem are we solving? Why is this needed?]

### Background Research

**Exploration Performed**:
```bash
/explore services/[service-name]
/explore services/[other-service]
```

**Key Findings**:
- Finding 1: [What we learned]
- Finding 2: [What exists already]
- Finding 3: [What patterns to follow]

**External Best Practices** (if researched):
- Pattern: [Name]
- Source: [Reference]
- Applicability: [How it fits]

**Similar Features**:
- Reference: `services/[name]/[feature]` - [How it's similar]

---

## 2. Requirements & Acceptance Criteria

### Functional Requirements

**FR-1**: [Requirement description]
- **User story**: As a [user], I want [capability], so that [benefit]
- **Input**: [What goes in]
- **Output**: [What comes out]
- **Behavior**: [What happens]

**FR-2**: [Requirement description]
- ...

### Non-Functional Requirements

**Performance**:
- API response time: <300ms (target), <500ms (max)
- Database queries: <100ms (target), <250ms (max)
- Concurrent users: 100+ simultaneous

**Security**:
- Authentication: Required (JWT)
- Authorization: [Role/permission requirements]
- Input validation: All inputs sanitized
- Secrets: Never logged or exposed

**Scalability**:
- Data volume: [Expected data size]
- Growth rate: [Expected growth]
- Horizontal scaling: [Yes/No + strategy]

**Bangladesh ERP Compliance** (if applicable):
- VAT rates: 15%, 10%, 7.5%, 5%
- NBR Mushak-6.3: [Compliance requirements]
- TIN/BIN validation: [Requirements]

### Acceptance Criteria (Testable)

- [ ] User can [action] and sees [result]
- [ ] System handles [edge case] by [behavior]
- [ ] Performance target met: [specific metric]
- [ ] Security requirement met: [specific check]
- [ ] Integration works: [specific integration]

---

## 3. Technical Approach & Decisions

### Architecture Decision

**Pattern**: [Architecture pattern - e.g., Event Sourcing, CQRS, Saga]

**Rationale**:
- Why: [Reasoning]
- Pros: [Benefits]
- Cons: [Trade-offs]
- Alternatives considered: [What else was evaluated]

**Reference**: `memory/constitution.md` - [Relevant principle]

### Domain Model

**Aggregates**:
```
[AggregateName]
├── Entities
│   ├── [EntityName]
│   └── [EntityName]
├── Value Objects
│   ├── [ValueObjectName]
│   └── [ValueObjectName]
└── Domain Events
    ├── [EventName]
    └── [EventName]
```

**Business Rules**:
1. [Rule 1]: [Description]
2. [Rule 2]: [Description]

**Invariants** (must always be true):
- Invariant 1: [Description]
- Invariant 2: [Description]

### Database Schema

**New Tables** (if creating):
```sql
CREATE TABLE table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field1 VARCHAR(255) NOT NULL,
  field2 INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_table_field1 ON table_name(field1);
```

**Modifications** (if altering):
- Table: [table_name]
- Change: [description]
- Migration: [up/down strategy]

**Performance Considerations**:
- Indexes: [Which fields, why]
- Queries: [Expected query patterns]
- Caching: [What to cache, TTL]

### GraphQL Schema

**Types**:
```graphql
type TypeName {
  id: ID!
  field1: String!
  field2: Int
}

input TypeInput {
  field1: String!
  field2: Int
}
```

**Queries**:
```graphql
type Query {
  getItem(id: ID!): TypeName
  listItems(filter: FilterInput): [TypeName!]!
}
```

**Mutations**:
```graphql
type Mutation {
  createItem(input: TypeInput!): TypeName!
  updateItem(id: ID!, input: TypeInput!): TypeName!
}
```

**Federation** (if applicable):
- Service: [service-name]
- Key fields: [@key(fields: "id")]
- Extended types: [List]

### Event Design (if Event Sourcing)

**Events**:
```typescript
interface EventName {
  type: 'EventName'
  version: 1  // Event versioning
  aggregateId: string
  timestamp: Date
  data: {
    field1: string
    field2: number
  }
}
```

**Event Handlers**:
- Handler: [HandlerName]
- Purpose: [What it does]
- Idempotency: [How ensured]

**Projections**:
- Projection: [ProjectionName]
- Read model: [TableName]
- Update strategy: [Append/Replace]

### Integration Points

**Service 1: [service-name]**:
- Integration type: REST API / GraphQL / Event
- Purpose: [Why integrating]
- Error handling: [Strategy]

**Service 2: [service-name]**:
- ...

### Error Handling

**Expected Errors**:
- Error: [ErrorType]
- Cause: [What triggers it]
- Response: [How to handle]

**Unexpected Errors**:
- Strategy: [Logging, alerting, fallback]

---

## 4. Quality Gates to Apply

### Required (Always)

- [ ] `/review` - Code quality analysis
- [ ] `/security-scan` - Security vulnerability scan
- [ ] `/test` - All tests passing (unit + integration)
- [ ] `pnpm build` - Clean TypeScript compilation

### Recommended (For This Feature)

- [ ] `architecture-strategist` - Architecture review
- [ ] `performance-oracle` - Performance analysis
- [ ] `security-sentinel` - Deep security audit
- [ ] `data-integrity-guardian` - Database integrity (if DB changes)
- [ ] `code-simplicity-reviewer` - Simplification check

### Domain-Specific

- [ ] Bangladesh ERP compliance (if applicable)
- [ ] GraphQL Federation validation (if schema changes)
- [ ] Event sourcing correctness (if event-driven)
- [ ] Database performance (if DB changes)

---

## 5. Implementation Plan

### Phase 1: Foundation (Estimated: [time])

1. **Database Migration** (if needed)
   - Create migration file
   - Test up/down
   - Review with data-integrity-guardian

2. **Domain Model**
   - Implement aggregates
   - Implement entities
   - Implement value objects
   - Write domain tests

### Phase 2: Application Layer (Estimated: [time])

1. **Commands/Queries** (if CQRS)
   - Implement command handlers
   - Implement query handlers
   - Write application tests

2. **Event Handlers** (if event-driven)
   - Implement event handlers
   - Ensure idempotency
   - Test event replay

### Phase 3: API Layer (Estimated: [time])

1. **GraphQL Resolvers**
   - Implement queries
   - Implement mutations
   - Test in Apollo Sandbox

2. **Integration**
   - Connect to other services
   - Test integrations
   - Handle errors

### Phase 4: Quality & Documentation (Estimated: [time])

1. **Quality Gates**
   - Run all automated gates
   - Run specialized agent reviews
   - Fix identified issues

2. **Documentation**
   - Update service CLAUDE.md
   - Update GraphQL schema docs
   - Update integration docs

---

## 6. Testing Strategy

### Unit Tests

- **Domain Logic**: [What to test]
- **Business Rules**: [What to validate]
- **Edge Cases**: [What to cover]

### Integration Tests

- **API Endpoints**: [Which endpoints]
- **Database Operations**: [Which operations]
- **Event Handling**: [Which events]

### E2E Tests (if applicable)

- **User Flows**: [Which flows]
- **Integration Scenarios**: [Which scenarios]

---

## 7. References

### Constitution Principles Applied

- Principle 1: `memory/constitution.md` - [Specific section]
- Principle 2: `memory/constitution.md` - [Specific section]

### Service Documentation Consulted

- `services/[name]/CLAUDE.md` - [What was learned]
- `services/[name]/CLAUDE.md` - [What was learned]

### Patterns Used

- Pattern: `memory/patterns.md` or `sessions/knowledge/vextrus-erp/workflow-patterns.md`
- Pattern: [Reference]

### External References

- [Article/Documentation]: [URL or description]

---

## 8. Implementation Notes

<!-- Updated during implementation -->

### What Actually Happened

**Deviations from Spec**:
- Deviation 1: [What changed and why]
- Deviation 2: [What changed and why]

**Challenges Encountered**:
- Challenge 1: [What was difficult]
- Challenge 2: [How it was solved]

### Lessons Learned

**What Worked Well**:
- [What went smoothly]

**What Could Be Improved**:
- [What was harder than expected]

**Patterns Discovered**:
- [New reusable patterns]

---

## 9. Compounding (Post-Implementation)

### Knowledge Base Updates

- [ ] Updated `services/[name]/CLAUDE.md` with new patterns
- [ ] Updated `memory/patterns.md` with reusable pattern
- [ ] Updated `memory/constitution.md` with new principle (if applicable)

### Templates Created

- [ ] Template: [Name and location]

### Automation Added

- [ ] Script: [Name and purpose]

### Documentation Improved

- [ ] Doc: [What was improved]

---

**Status**: draft → approved → implemented
**Last Updated**: YYYY-MM-DD
