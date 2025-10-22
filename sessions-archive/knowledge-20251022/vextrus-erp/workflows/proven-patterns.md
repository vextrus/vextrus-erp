# Vextrus ERP Workflow Patterns

**Purpose**: Common development workflows proven in 30+ completed tasks
**Context**: 18 microservices, NestJS, GraphQL Federation, DDD/CQRS/Event Sourcing
**Last Updated**: 2025-10-16

---

## Pattern Categories

1. **New Feature Implementation** (Simple, Medium, Complex)
2. **Bug Investigation & Fix**
3. **Database Operations** (Schema, Migrations, Optimization)
4. **GraphQL API Development**
5. **Refactoring & Technical Debt**
6. **Security & Compliance**
7. **Performance Optimization**
8. **Microservice Creation**

---

## Pattern 1: Simple Feature Implementation

**When**: Single service, straightforward logic, no architecture changes

**Time Estimate**: 2-4 hours

### Workflow

```markdown
## 1. Context Gathering
/explore services/[service-name]
cat services/[service-name]/CLAUDE.md

## 2. Implementation
- Write code using Sonnet 4.5
- Follow service patterns
- Update tests

## 3. Quality Gates (Required)
/review                  # Code quality
/security-scan          # Security check
/test                   # Run tests

## 4. Documentation
- Update service CLAUDE.md if patterns changed
- Update task file

## 5. Commit
git add .
git commit -m "feat: implement [feature]"
```

### Example: Add New Field to Existing Entity

```markdown
**Task**: Add "tax_number" field to Customer entity

1. /explore services/master-data
2. Read domain model: services/master-data/CLAUDE.md
3. Add field:
   - Domain entity: customer.entity.ts
   - DTO: customer.dto.ts
   - Resolver: customer.resolver.ts
   - Migration: create-migration.ts
4. Update tests
5. /review, /security-scan, /test
6. Commit
```

**No agents needed** - Straightforward implementation

---

## Pattern 2: Medium Feature Implementation

**When**: Multiple services, business logic, some architecture decisions

**Time Estimate**: 4-8 hours

### Workflow

```markdown
## 1. Context Gathering
/explore services/[service-name]
/explore shared/

## 2. Architecture Design
Use Task tool: backend-development:backend-architect
- Review architecture decisions
- Plan service integration
- Validate patterns

## 3. Database Design (if needed)
Use Task tool: database-design:database-architect
- Schema design
- Migration strategy
- Index planning

## 4. Implementation
- Write code using Sonnet 4.5
- Follow DDD/CQRS patterns
- Implement event sourcing if needed

## 5. Quality Gates
/review
/security-scan
/test
Use Task tool: compounding-engineering:performance-oracle (if performance-critical)

## 6. Documentation
- Update service CLAUDE.md
- Document decisions
- Update task file

## 7. Commit & PR
git commit
/pr
```

### Example: Invoice Payment Processing

```markdown
**Task**: Implement invoice payment processing with event sourcing

## Phase 1: Design (1 hour)
1. /explore services/finance
2. Use Task tool: backend-development:backend-architect
   - Design Payment aggregate
   - Plan event sourcing strategy
   - Define domain events

## Phase 2: Database (30 min)
Use Task tool: database-design:database-architect
- Payment table schema
- Event store schema
- Indexes

## Phase 3: Implementation (4 hours)
1. Domain layer:
   - Payment aggregate (src/domain/aggregates/payment/)
   - Payment value objects
   - Domain events
2. Application layer:
   - ProcessPaymentCommand
   - ProcessPaymentHandler
3. Infrastructure:
   - EventStore repository
   - Read model projections
4. GraphQL:
   - Mutations, queries, resolvers

## Phase 4: Quality (1 hour)
1. /test
2. /review
3. /security-scan
4. Use Task tool: compounding-engineering:performance-oracle

## Phase 5: Documentation (30 min)
Update services/finance/CLAUDE.md:
- Payment aggregate
- Domain events
- Integration points
```

**Agents used**: 3 (backend-architect, database-architect, performance-oracle)

---

## Pattern 3: Complex Feature Implementation

**When**: Cross-service, significant architecture, new patterns

**Time Estimate**: 1-3 days

### Workflow: Full Compounding Cycle

```markdown
## PLAN PHASE (2-4 hours)

### 1. Context Gathering
/explore services/[all-related-services]
cat shared/domain-primitives/
Read all relevant CLAUDE.md files

### 2. Architecture Strategy
Use Task tool: compounding-engineering:architecture-strategist
- Analyze system impact
- Review architectural implications
- Validate integration points

### 3. Pattern Analysis
Use Task tool: compounding-engineering:pattern-recognition-specialist
- Identify existing patterns
- Detect potential anti-patterns
- Recommend patterns

### 4. Best Practices Research
Use Task tool: compounding-engineering:best-practices-researcher
- Research technology patterns
- Find similar implementations
- Document industry standards

### 5. Detailed Design
Use Task tool: backend-development:backend-architect
- Service boundaries
- Event-driven design
- CQRS structure

Use Task tool: database-design:database-architect
- Complete schema design
- Migration strategy
- Performance considerations

Use Task tool: backend-development:graphql-architect
- Federation schema
- Resolver structure
- Type definitions

## DELEGATE PHASE (Implementation - varies)

### Break down into subtasks using Haiku 4.5
1. Subtask 1: Domain layer → Haiku 4.5
2. Subtask 2: Application layer → Haiku 4.5
3. Subtask 3: Infrastructure → Haiku 4.5
4. Subtask 4: GraphQL → Haiku 4.5
5. Subtask 5: Tests → Haiku 4.5

### Integration by Sonnet 4.5
- Integrate all subtasks
- Ensure coherence
- Final touches

## ASSESS PHASE (2-3 hours)

### 1. Code Quality Review
Use Task tool: compounding-engineering:kieran-typescript-reviewer
- Strict TypeScript conventions
- Naming clarity
- Simplicity validation

### 2. Performance Analysis
Use Task tool: compounding-engineering:performance-oracle
- Identify bottlenecks
- Caching opportunities
- Scalability assessment

### 3. Security Audit
Use Task tool: compounding-engineering:security-sentinel
- Threat modeling
- Vulnerability assessment
- OWASP compliance

### 4. Data Integrity
Use Task tool: compounding-engineering:data-integrity-guardian
- Migration safety
- Referential integrity
- Privacy requirements

### 5. Simplification Review
Use Task tool: compounding-engineering:code-simplicity-reviewer
- Remove unnecessary complexity
- YAGNI validation
- Abstraction review

### 6. Automated Quality Gates
/review
/security-scan
/test

## CODIFY PHASE (30-60 min)

### 1. Capture Learnings
Use Task tool: compounding-engineering:feedback-codifier

Questions to answer:
- What patterns worked well?
- What could be simplified?
- What should be automated?
- What anti-patterns to avoid?

### 2. Update Knowledge Base
- Update service CLAUDE.md
- Add patterns to sessions/knowledge/
- Document new conventions

### 3. Team Communication
- Comprehensive PR description
- Architecture decision records
- Migration guides
```

### Example: Distributed Transaction Implementation

```markdown
**Task**: Implement distributed transaction for Order→Payment→Inventory

## PLAN PHASE

### Context
/explore services/finance
/explore services/inventory
/explore shared/

### Architecture (2 hours)
Use Task tool: compounding-engineering:architecture-strategist
Use Task tool: compounding-engineering:pattern-recognition-specialist
Use Task tool: backend-development:backend-architect

Decisions:
- Saga pattern (choreography)
- EventStore for coordination
- Compensating transactions

### Design (2 hours)
Use Task tool: database-design:database-architect
- Saga state tracking table
- Event schemas
- Compensation events

Use Task tool: backend-development:graphql-architect
- Mutation: processOrder
- Query: orderStatus
- Subscription: orderProgress

## DELEGATE PHASE (8 hours)

Sonnet 4.5 breaks down:
1. Create OrderSaga aggregate
2. Implement event handlers
3. Add compensation logic
4. Update inventory service
5. Update payment service
6. GraphQL integration

Haiku 4.5 executes in parallel

Sonnet 4.5 integrates

## ASSESS PHASE (3 hours)

1. Use Task tool: compounding-engineering:kieran-typescript-reviewer
2. Use Task tool: compounding-engineering:performance-oracle
3. Use Task tool: compounding-engineering:security-sentinel
4. Use Task tool: compounding-engineering:data-integrity-guardian
5. /review, /security-scan, /test

## CODIFY PHASE (1 hour)

Use Task tool: compounding-engineering:feedback-codifier

Capture:
- Saga pattern implementation guide
- Compensation strategies
- Error handling patterns
- Testing approach

Update:
- services/finance/CLAUDE.md
- services/inventory/CLAUDE.md
- sessions/knowledge/vextrus-erp/distributed-transactions.md (new)
```

**Agents used**: 12+ (full compounding cycle)

---

## Pattern 4: Bug Investigation & Fix

**When**: Production issue, test failure, unexpected behavior

**Time Estimate**: 1-4 hours

### Workflow

```markdown
## 1. Reproduce & Analyze
@postgres                        # Enable if DB-related
@docker                         # Enable if infra-related

/explore services/[affected-service]
cat logs/[service].log

## 2. Debug
Use Task tool: debugging-toolkit:debugger
- Analyze error
- Identify root cause
- Propose fix

## 3. Fix Implementation
- Write fix using Sonnet 4.5
- Add regression test
- Verify fix

## 4. Quality Gates
/test                           # Must pass
/review
/security-scan

## 5. Documentation
- Document root cause
- Update troubleshooting guide
- Update task file

## 6. Commit
git commit -m "fix: [description]"
```

### Example: N+1 Query Problem

```markdown
**Issue**: GraphQL query for invoices with line items taking 5+ seconds

## Investigation (30 min)
1. @postgres
2. Use Task tool: debugging-toolkit:debugger
3. Use Task tool: database-cloud-optimization:database-optimizer

Finding: N+1 query problem in invoice resolver

## Fix (1 hour)
1. Implement DataLoader for line items
2. Add batching logic
3. Update resolver
4. Test with 100+ invoices

## Verification (30 min)
1. Query performance: 5000ms → 250ms ✅
2. /test - all tests pass
3. /review, /security-scan

## Documentation (15 min)
Update services/finance/CLAUDE.md:
- DataLoader pattern
- Performance optimization notes
```

**Agents used**: 2 (debugger, database-optimizer)

---

## Pattern 5: Database Schema Change

**When**: New tables, migrations, schema modifications

**Time Estimate**: 1-3 hours

### Workflow

```markdown
## 1. Context & Planning
/explore services/[service-name]
@postgres

Use Task tool: database-design:database-architect
- Schema design
- Migration strategy
- Backward compatibility

## 2. Create Migration
- Generate migration
- Add indexes
- Add constraints
- Seed data if needed

## 3. Test Migration
npm run migration:run
npm run migration:revert
npm run migration:run

## 4. Verify Data Integrity
Use Task tool: compounding-engineering:data-integrity-guardian
- Check referential integrity
- Validate constraints
- Test rollback

## 5. Update Code
- Update entities
- Update DTOs
- Update resolvers
- Update tests

## 6. Quality Gates
/test
/review
/security-scan
```

### Example: Add Audit Fields to All Tables

```markdown
**Task**: Add created_by, updated_by, deleted_by to all entities

## Planning (30 min)
Use Task tool: database-design:database-architect

Strategy:
- Base entity with audit fields
- Migration for each table
- Populate from existing data

## Implementation (2 hours)
1. Create BaseAuditEntity
2. Create migrations for 15 tables
3. Update all entities to extend BaseAuditEntity
4. Update repositories
5. Add audit interceptor

## Testing (1 hour)
1. Test migrations up/down
2. Use Task tool: compounding-engineering:data-integrity-guardian
3. Verify all CRUD operations
4. /test

## Documentation (15 min)
Update shared/domain-primitives/CLAUDE.md:
- Audit pattern
- Usage guide
```

**Agents used**: 2 (database-architect, data-integrity-guardian)

---

## Pattern 6: GraphQL API Development

**When**: New GraphQL API, federation setup, schema design

**Time Estimate**: 2-6 hours

### Workflow

```markdown
## 1. Context
/explore services/[service-name]
Review GraphQL Federation setup

## 2. Schema Design
Use Task tool: backend-development:graphql-architect
- Type definitions
- Queries/Mutations/Subscriptions
- Federation directives

## 3. Implementation
- Create DTOs
- Implement resolvers
- Add federation references
- Write tests

## 4. Testing
Test queries in Apollo Sandbox
/test

## 5. Documentation
Use Task tool: documentation-generation:api-documenter
- Query examples
- Mutation examples
- Type documentation

## 6. Quality Gates
/review
/security-scan
```

### Example: Customer Management API

```markdown
**Task**: Create Customer GraphQL API with federation

## Design (1 hour)
Use Task tool: backend-development:graphql-architect

Schema:
- Customer type (with @key directive)
- Query: customers, customer(id)
- Mutation: createCustomer, updateCustomer, deleteCustomer
- Federation: extended by Order service

## Implementation (3 hours)
1. Create customer.dto.ts
2. Create customer.resolver.ts
3. Add federation decorators
4. Implement resolvers
5. Write tests

## Federation Testing (1 hour)
1. Test in Apollo Sandbox
2. Test from other services (Order service)
3. Verify @key directive works

## Documentation (30 min)
Use Task tool: documentation-generation:api-documenter

Create: services/master-data/docs/customer-api.md
```

**Agents used**: 2 (graphql-architect, api-documenter)

---

## Pattern 7: Refactoring with Compounding Cycle

**When**: Technical debt, code smells, architecture improvement

**Time Estimate**: 1-2 days

### Workflow

```markdown
## PLAN PHASE

### 1. Analysis
Use Task tool: compounding-engineering:architecture-strategist
Use Task tool: compounding-engineering:pattern-recognition-specialist

Identify:
- Code smells
- Anti-patterns
- Improvement opportunities

### 2. Research
Use Task tool: compounding-engineering:best-practices-researcher
- Find better patterns
- Research alternatives
- Gather examples

### 3. Strategy
- Incremental refactoring plan
- Risk assessment
- Rollback strategy

## DELEGATE PHASE

### Implementation (varies)
- Refactor in small steps
- Keep tests passing
- Checkpoint frequently (Esc-Esc)

## ASSESS PHASE

### 1. Quality Review
Use Task tool: compounding-engineering:kieran-typescript-reviewer
- Naming improvements
- Clarity validation
- Convention adherence

### 2. Simplification
Use Task tool: compounding-engineering:code-simplicity-reviewer
- Remove unnecessary abstraction
- YAGNI validation
- Reduce complexity

### 3. Performance
Use Task tool: compounding-engineering:performance-oracle
- Performance impact
- Optimization opportunities

### 4. Automated Gates
/review
/test
/security-scan

## CODIFY PHASE

Use Task tool: compounding-engineering:feedback-codifier

Capture:
- What patterns replaced?
- Why better?
- When to apply?
- Examples
```

### Example: Extract Domain Services

```markdown
**Issue**: Bloated controllers with business logic

## PLAN PHASE (2 hours)

### Analysis
Use Task tool: compounding-engineering:architecture-strategist
Use Task tool: compounding-engineering:pattern-recognition-specialist

Findings:
- Business logic in controllers
- Fat controllers (500+ lines)
- No domain service layer

### Research
Use Task tool: compounding-engineering:best-practices-researcher

Pattern: Domain Service Layer
- Thin controllers
- Rich domain services
- DDD approach

## DELEGATE PHASE (6 hours)

### Refactoring Plan
1. Extract InvoiceService
2. Extract PaymentService
3. Extract CustomerService
4. Move logic from controllers
5. Update tests

Sonnet 4.5 breaks down
Haiku 4.5 executes
Sonnet 4.5 integrates

## ASSESS PHASE (2 hours)

1. Use Task tool: compounding-engineering:kieran-typescript-reviewer
2. Use Task tool: compounding-engineering:code-simplicity-reviewer
3. Use Task tool: compounding-engineering:performance-oracle
4. /review, /test

Results:
- Controllers: 500 lines → 150 lines
- Domain services: 0 → 3 services
- Test coverage: Maintained
- Performance: No regression

## CODIFY PHASE (1 hour)

Use Task tool: compounding-engineering:feedback-codifier

Captured:
- Domain service pattern guide
- Controller responsibility guidelines
- Refactoring strategy

Updated:
- CLAUDE.md with domain service pattern
- sessions/knowledge/vextrus-erp/domain-services.md
```

**Agents used**: 7 (full assessment cycle)

---

## Pattern 8: Security Implementation

**When**: Auth/authz, encryption, compliance requirements

**Time Estimate**: 3-8 hours

### Workflow

```markdown
## 1. Security Analysis
Use Task tool: compounding-engineering:security-sentinel
- Threat modeling
- Vulnerability assessment
- Compliance requirements

## 2. Design
Use Task tool: backend-api-security:backend-security-coder
- Authentication strategy
- Authorization patterns
- Encryption approach

## 3. Implementation
- Implement auth/authz
- Add encryption
- Input validation
- Rate limiting

## 4. Security Testing
/security-scan
Use Task tool: comprehensive-review:security-auditor

## 5. Compliance Validation
Use Task tool: security-compliance:security-auditor
- GDPR compliance
- Data protection
- Audit logging

## 6. Documentation
- Security policies
- Compliance docs
- Integration guide
```

### Example: Implement OAuth2 + RBAC

```markdown
**Task**: Implement OAuth2 authentication with RBAC

## Security Analysis (1 hour)
Use Task tool: compounding-engineering:security-sentinel

Requirements:
- OAuth2 with JWT
- Role-based access control
- Refresh tokens
- Token rotation

## Design (2 hours)
Use Task tool: backend-api-security:backend-security-coder

Architecture:
- Auth service with OAuth2
- JWT token generation
- RBAC with decorators
- Permission system

## Implementation (4 hours)
1. Auth module setup
2. OAuth2 flow implementation
3. JWT strategy
4. RBAC decorators
5. Permission guards
6. Integration with GraphQL

## Security Testing (1 hour)
1. /security-scan
2. Use Task tool: comprehensive-review:security-auditor
3. Penetration testing
4. Token security validation

## Compliance (1 hour)
Use Task tool: security-compliance:security-auditor
- GDPR compliance check
- Audit logging setup
- Data protection measures
```

**Agents used**: 4 (security-sentinel, backend-security-coder, security-auditor x2)

---

## Pattern 9: Performance Optimization

**When**: Slow endpoints, high latency, resource issues

**Time Estimate**: 2-6 hours

### Workflow

```markdown
## 1. Profiling
@postgres
@docker

Use Task tool: application-performance:performance-engineer
- Identify bottlenecks
- Measure baseline
- Set targets

## 2. Analysis
Use Task tool: compounding-engineering:performance-oracle
- Root cause analysis
- Optimization strategy
- Implementation plan

## 3. Database Optimization
Use Task tool: database-cloud-optimization:database-optimizer
- Query optimization
- Index analysis
- Caching strategy

## 4. Implementation
- Add indexes
- Implement caching
- Optimize queries
- Add DataLoaders

## 5. Verification
- Measure performance
- Compare to baseline
- Load testing

## 6. Monitoring
Use Task tool: observability-monitoring:performance-engineer
- Add metrics
- Setup alerts
- Dashboard creation
```

### Example: API Endpoint Optimization

```markdown
**Issue**: /api/reports endpoint taking 8+ seconds

## Profiling (1 hour)
@postgres

Use Task tool: application-performance:performance-engineer
Use Task tool: database-cloud-optimization:database-optimizer

Findings:
- 12 N+1 queries
- No indexes on foreign keys
- No caching
- Complex aggregations

## Optimization Plan (30 min)
Use Task tool: compounding-engineering:performance-oracle

Strategy:
1. Add DataLoaders (N+1)
2. Add database indexes
3. Implement Redis caching
4. Optimize aggregations
5. Add pagination

## Implementation (3 hours)
1. DataLoader for related entities
2. Create indexes migration
3. Redis cache layer
4. Query optimization
5. Pagination logic

## Verification (1 hour)
Before: 8500ms
After: 320ms
Improvement: 96.2% ✅

Load testing: 100 req/s - stable

## Monitoring (30 min)
Use Task tool: observability-monitoring:performance-engineer

Added:
- Response time metrics
- Cache hit rate
- Query performance logs
```

**Agents used**: 4 (performance-engineer, database-optimizer, performance-oracle, observability-engineer)

---

## Pattern 10: New Microservice Creation

**When**: New bounded context, new business domain

**Time Estimate**: 1-2 weeks

### Workflow

```markdown
## WEEK 1: Foundation

### Day 1: Architecture & Design
Use Task tool: compounding-engineering:architecture-strategist
Use Task tool: backend-development:backend-architect
- Service boundaries
- Integration points
- Event-driven design

Use Task tool: database-design:database-architect
- Database schema
- Data model
- Migration strategy

Use Task tool: backend-development:graphql-architect
- GraphQL schema
- Federation setup
- API design

### Day 2-3: Core Implementation
- Service bootstrap
- Domain layer
- Application layer
- Infrastructure layer

### Day 4: GraphQL Federation
- Schema implementation
- Resolvers
- Federation directives
- Integration testing

### Day 5: Testing & Documentation
- Unit tests
- Integration tests
- Service CLAUDE.md
- API documentation

## WEEK 2: Integration & Quality

### Day 1: Service Integration
- Event publishing
- Event handling
- Inter-service communication

### Day 2: Security & Compliance
Use Task tool: compounding-engineering:security-sentinel
Use Task tool: comprehensive-review:security-auditor
- Auth/authz
- Compliance validation
- Security testing

### Day 3: Performance & Observability
Use Task tool: compounding-engineering:performance-oracle
Use Task tool: observability-monitoring:observability-engineer
- Performance optimization
- Monitoring setup
- Alerting

### Day 4: Quality Assurance
Full compounding cycle ASSESS phase:
- kieran-typescript-reviewer
- code-simplicity-reviewer
- /review, /security-scan, /test

### Day 5: Deployment & Codify
- Deployment setup
- Documentation
- Knowledge capture (feedback-codifier)
```

---

## Anti-Patterns to Avoid

### 1. Skip Quality Gates
❌ **Don't**: Implement → Commit → Deploy
✅ **Do**: Implement → /review, /security-scan, /test → Commit

### 2. Embed Full Context
❌ **Don't**: Copy entire service architecture into task file (3000+ lines)
✅ **Do**: Reference service CLAUDE.md, use /explore

### 3. No Agent Usage for Complex Work
❌ **Don't**: Try to architect complex system alone
✅ **Do**: Use architecture-strategist, backend-architect, database-architect

### 4. Skip Compounding Codify
❌ **Don't**: Finish task and move on
✅ **Do**: Use feedback-codifier, capture learnings, update knowledge base

### 5. Wrong Model Selection
❌ **Don't**: Use Sonnet 4.5 for file exploration
✅ **Do**: Use /explore (Haiku 4.5) - 2x faster, 1/3 cost

---

## Quick Decision Matrix

| Complexity | Duration | Agents | Quality Gates | Codify |
|-----------|----------|--------|---------------|---------|
| **Simple** | <4 hours | 0-1 | /review, /test | Optional |
| **Medium** | 4-8 hours | 2-4 | All required | Recommended |
| **Complex** | 1-3 days | 5-12 | All + compounding | Required |
| **Microservice** | 1-2 weeks | 10+ | Full assessment | Required |

---

## Tips for Success

1. **Always start with /explore** - Fast context gathering
2. **Use architecture agents early** - Prevent rework
3. **Quality gates are non-negotiable** - /review, /security-scan, /test
4. **Compounding for complexity** - Learn from complex work
5. **Reference > Embed** - Keep task files <500 lines
6. **Right model for task** - Sonnet for complexity, Haiku for exploration
7. **Checkpoint frequently** - Use Esc-Esc to rewind

---

**Last Updated**: 2025-10-16
**Status**: Phase 2 - Knowledge Base Expansion
**Source**: 30+ completed tasks in Vextrus ERP
