# Vextrus ERP Constitution

**Purpose**: Non-negotiable principles and standards for Vextrus ERP development
**Status**: Living document - Updated as we learn
**Last Updated**: 2025-10-16

---

## Project Principles

### 1. Plugin-First Development
- **Always use CC 2.0.19 native features** - 41 plugins, 107 agents, MCPs
- **Never build custom infrastructure** - Leverage marketplace plugins
- **Prefer slash commands** - `/review`, `/test`, `/security-scan` over manual processes
- **Use specialized agents** - Backend-architect, database-architect, etc.

### 2. Compounding Quality
- **Each task improves future tasks** - Capture learnings systematically
- **Quality gates are non-negotiable** - /review, /security-scan, /test before PR
- **Plan → Delegate → Assess → Codify** - Standard cycle for complex work
- **Learning capture** - Use feedback-codifier agent after significant work

### 3. Context Efficiency
- **MCP on-demand only** - Enable with @servername when needed
- **Reference > Embed** - Link to docs, don't copy them
- **Task files <500 lines** - Use /explore instead of embedding
- **Separate agent contexts** - Let plugins handle their own context

### 4. Systematic Workflows
- **Explore first** - `/explore services/[name]` before modifying
- **Read service docs** - Check `services/[name]/CLAUDE.md` always
- **Follow protocols** - Use sessions/protocols/ for complex tasks
- **Codify learnings** - Update knowledge base after discoveries

---

## Technology Stack

### Core Technologies
- **Language**: TypeScript (strict mode), Node.js 20+
- **Framework**: NestJS 11 (all services)
- **API**: GraphQL Federation (Apollo Server v4)
- **Database**: PostgreSQL 16+
- **Event Store**: EventStoreDB (event sourcing)
- **Message Queue**: Apache Kafka (async communication)
- **Orchestration**: Docker Compose (local), Kubernetes (production)
- **Monitoring**: SigNoz (OpenTelemetry), Prometheus, Grafana

### Frontend (When Implemented)
- **Framework**: Next.js 15 (React 19)
- **State**: TanStack Query v5
- **UI Components**: Radix UI + Tailwind CSS
- **Forms**: React Hook Form + Zod

### Development Tools
- **Package Manager**: pnpm
- **Monorepo**: Turborepo
- **Testing**: Jest, Playwright
- **Linting**: ESLint (strict), Prettier
- **Type Checking**: TypeScript strict mode

---

## Architecture Patterns

### Microservices Architecture
- **18 services** - Each service = bounded context
- **GraphQL Federation** - Unified API gateway
- **Event-driven** - Services communicate via domain events
- **Database-per-service** - Each service owns its data
- **Shared libraries** - Common code in `shared/` directory

### Domain-Driven Design (DDD)
- **Aggregates** - Consistency boundaries (Invoice, Customer, Order)
- **Value Objects** - Immutable values (Money, Email, TaxNumber)
- **Domain Events** - Business events (InvoiceCreated, PaymentProcessed)
- **Repositories** - Data access abstraction
- **Services** - Domain logic not belonging to entities

### CQRS (Command Query Responsibility Segregation)
- **Commands** - Write operations (CreateInvoice, ProcessPayment)
- **Queries** - Read operations (GetInvoice, ListCustomers)
- **Handlers** - Separate command/query handlers
- **Read Models** - Optimized query projections

### Event Sourcing
- **EventStore** - All changes stored as events
- **Aggregates** - Built from event stream
- **Projections** - Read models updated from events
- **Versioning** - Event schema versioning

---

## API Exposure Patterns

### GraphQL Federation
- **Schema-first** - Define schema, then implement
- **Federation directives** - @key, @extends, @external, @requires
- **Type safety** - DTOs with class-validator
- **Resolvers** - One resolver per query/mutation/field
- **DataLoader** - Prevent N+1 queries
- **Authentication** - JWT tokens via auth service
- **Authorization** - RBAC with decorators

### REST Endpoints (Minimal)
- **Health checks** - `/health` for each service
- **Webhooks** - External integrations only
- **File uploads** - Multipart form data

---

## Data & Persistence

### Database Patterns
- **PostgreSQL** - Primary data store
- **Migrations** - TypeORM migrations (versioned)
- **Transactions** - Use database transactions for consistency
- **Indexes** - Index all foreign keys and query fields
- **Soft deletes** - Use deleted_at timestamp
- **Audit fields** - created_at, updated_at, created_by, updated_by

### Event Store Patterns
- **Stream per aggregate** - One stream per invoice, customer, etc.
- **Event versioning** - Version all event schemas
- **Idempotency** - Handle duplicate events
- **Projections** - Update read models from events
- **Snapshots** - For large aggregates (>100 events)

---

## Code Standards

### TypeScript
- **Strict mode** - Always enabled
- **No any** - Use unknown or proper types
- **Explicit return types** - For public methods
- **Interface over type** - For object shapes
- **Enum alternatives** - Use const objects with 'as const'

### NestJS Conventions
- **Modules** - Feature-based modules
- **Controllers** - Thin, delegate to services
- **Services** - Business logic
- **Providers** - Injectable dependencies
- **Guards** - Authentication/authorization
- **Decorators** - Custom decorators for metadata

### GraphQL Conventions
- **DTOs** - Input types with validation
- **Resolvers** - Thin, delegate to application layer
- **Naming** - PascalCase for types, camelCase for fields
- **Pagination** - Cursor-based (relay-style)
- **Errors** - Structured error responses

### Testing
- **Unit tests** - All business logic (80%+ coverage)
- **Integration tests** - API endpoints and database
- **E2E tests** - Critical user flows
- **Test structure** - AAA (Arrange, Act, Assert)
- **Mocking** - Mock external dependencies

---

## Quality Gates

### Required (All Tasks)
1. **Code Review** - `/review` (code-review-ai plugin)
2. **Security Scan** - `/security-scan` (security-scanning plugin)
3. **Tests Pass** - `/test` (unit-testing plugin)
4. **Build Success** - `pnpm build` (no errors)

### Advanced (Complex Tasks)
5. **Architecture Review** - architecture-strategist agent
6. **Code Quality** - kieran-typescript-reviewer agent
7. **Performance** - performance-oracle agent
8. **Security Audit** - security-sentinel agent
9. **Data Integrity** - data-integrity-guardian agent (if DB changes)

### Domain-Specific (As Needed)
10. **Bangladesh Compliance** - VAT rates, NBR Mushak-6.3, TIN/BIN validation
11. **GraphQL Federation** - Schema compatibility, no breaking changes
12. **Event Sourcing** - Event versioning, idempotency, projections

---

## Development Workflow

### Simple Tasks (<1 day)
```bash
1. /explore services/[name]        # Context gathering
2. Implement feature               # Sonnet 4.5
3. /review                         # Code review
4. /security-scan                  # Security
5. /test                           # Tests
6. git commit && git push          # Commit
```

### Complex Tasks (Multi-day)
```bash
1. Read sessions/protocols/task-startup.md
2. Create spec: sessions/specs/[feature].md
3. Plan phase (architecture-strategist, best-practices-researcher)
4. Delegate phase (backend-architect, database-architect, implementation)
5. Assess phase (quality agents, automated gates)
6. Codify phase (feedback-codifier, update knowledge base)
7. Read sessions/protocols/task-completion.md
```

---

## Code Philosophy

### Locality of Behavior
- **Keep related code together** - Don't scatter feature code
- **Avoid excessive abstraction** - Prefer clarity over cleverness
- **Colocation** - Tests next to implementation

### Minimal Abstraction
- **Simple functions** - Over complex inheritance
- **Composition** - Over inheritance
- **Pure functions** - Where possible
- **Explicit** - Over implicit magic

### Readability > Cleverness
- **Code should be obvious** - Easy to follow
- **Clear naming** - Descriptive variable/function names
- **Comments for why** - Not what (code shows what)
- **Consistent formatting** - Prettier + ESLint

### Domain-Driven
- **Follow service patterns** - Check service CLAUDE.md
- **Ubiquitous language** - Use domain terms
- **Bounded contexts** - Respect service boundaries
- **Domain events** - Express business changes

---

## Performance Standards

### Response Time Targets
- **API endpoints**: <300ms (good), <500ms (acceptable)
- **Database queries**: <100ms (good), <250ms (acceptable)
- **Page loads**: <2s (good), <3s (acceptable)
- **Event processing**: <1s (good), <5s (acceptable)

### Scalability
- **Horizontal scaling** - Services must be stateless
- **Caching** - Redis for frequently accessed data
- **Database optimization** - Indexes, query optimization, connection pooling
- **Event processing** - Kafka partitioning for parallelism

---

## Security Standards

### Authentication & Authorization
- **JWT tokens** - Issued by auth service
- **Role-based access control (RBAC)** - Implemented with decorators
- **Permission checks** - At resolver/service level
- **Token expiration** - Short-lived access tokens (15 min), refresh tokens (7 days)

### Data Protection
- **Encrypt at rest** - PostgreSQL encryption
- **Encrypt in transit** - TLS/HTTPS only
- **PII handling** - Minimal collection, secure storage
- **Audit logging** - All data access logged

### Input Validation
- **Validate all inputs** - Use class-validator
- **Sanitize user input** - Prevent injection attacks
- **Rate limiting** - Protect against abuse
- **CORS** - Restrictive CORS policy

---

## Bangladesh ERP Compliance

### Tax Requirements
- **VAT Rates**: 15% (standard), 10%, 7.5%, 5% (reduced)
- **NBR Format**: Mushak-6.3 compliant invoices
- **TIN/BIN**: Validation for tax identification numbers
- **Tax Periods**: Quarterly/monthly reporting

### Localization
- **Currency**: BDT (Bangladeshi Taka)
- **Timezone**: Asia/Dhaka
- **Language**: English (primary), Bengali (support planned)
- **Date Format**: DD/MM/YYYY (local), ISO 8601 (API)

---

## Monitoring & Observability

### OpenTelemetry
- **Tracing** - All requests traced through services
- **Metrics** - Response times, error rates, throughput
- **Logging** - Structured JSON logs
- **Correlation IDs** - Track requests across services

### SigNoz
- **APM** - Application performance monitoring
- **Dashboards** - Service health, latency, errors
- **Alerts** - Automated alerting on thresholds
- **Traces** - Distributed tracing visualization

---

## Continuous Improvement

### Learning Capture
- **After complex tasks** - Use feedback-codifier agent
- **Update knowledge base** - Add patterns to sessions/knowledge/
- **Document decisions** - Architecture Decision Records (ADRs)
- **Share learnings** - Update service CLAUDE.md files

### Process Improvement
- **Retrospectives** - Regular review of what works
- **Automation** - Automate repetitive tasks
- **Tooling** - Invest in developer experience
- **Metrics** - Track velocity, quality, stability

---

## Context Management

### MCP On-Demand Pattern
- **Default**: sequential-thinking only (1.5k tokens)
- **Enable as needed**: @postgres, @docker, @playwright, @github, @serena
- **Disable when done**: Keep context lean
- **Result**: 98.6% context reduction (111k → 1.5k)

### Task File Size
- **Target**: <500 lines per task file
- **Maximum**: 1000 lines (split if exceeded)
- **Pattern**: Reference > Embed
- **Use /explore**: Instead of copying documentation

---

## Model Selection

| Task Type | Model | Reason |
|-----------|-------|--------|
| **Exploration** | Haiku 4.5 | 2x faster, 1/3 cost, 73% SWE-bench |
| **Complex Logic** | Sonnet 4.5 | 77% SWE-bench, best reasoning |
| **Parallel Work** | Haiku 4.5 (x5) | Execute subtasks simultaneously |
| **Integration** | Sonnet 4.5 | Ensure coherence across changes |

---

## Knowledge Base

### Official Documentation
- **Claude Code**: sessions/knowledge/claude-code/
- **Vextrus ERP**: sessions/knowledge/vextrus-erp/
  - plugin-usage-guide.md (41 plugins, 107 agents)
  - agent-catalog.md (complete agent reference)
  - workflow-patterns.md (proven patterns)
  - context-optimization-tips.md (context strategies)
  - quality-gates-checklist.md (quality requirements)

### Service Documentation
- **Each service**: services/[name]/CLAUDE.md
- **Contents**: Architecture, domain model, patterns, decisions
- **Read before modifying**: Always check service CLAUDE.md

---

## Quick Start Resources

- **Entry Point**: CLAUDE.md (this file's parent)
- **Plugin Guide**: memory/plugins.md → sessions/knowledge/vextrus-erp/plugin-usage-guide.md
- **Workflow Patterns**: memory/patterns.md → sessions/knowledge/vextrus-erp/workflow-patterns.md
- **Protocols**: sessions/protocols/ (task-startup, task-completion, context-compaction)
- **Templates**: sessions/templates/ (5 common patterns)

---

## Version History

**v1.0** (2025-10-16): Initial constitution created during SpecKit integration
- Extracted principles from CLAUDE.md v5.0
- Consolidated 30+ completed tasks' learnings
- Aligned with CC 2.0.19, Sonnet 4.5, Haiku 4.5
- Integrated 41 plugins, 107 agents

---

**Status**: ✅ Active constitution
**Philosophy**: Living document - evolves as we learn
**Enforcement**: Via code review, quality gates, and compounding codify phase
