# ADR-002: Architecture Pattern - Modular Monolith to Microservices

## Status
Accepted

## Date
2024-12-05

## Context
Vextrus ERP needs an architecture that can:
- Start simple and evolve with business needs
- Handle complex business domains (construction projects, finance, HR)
- Scale to support enterprise clients
- Maintain data consistency across modules
- Support team autonomy as we grow

Research shows 60% of CIOs prioritize modular ERP for digital transformation. The construction industry specifically requires handling of complex workflows, multi-project management, and real-time collaboration.

## Decision

### Phase 1: Modular Monolith (Months 1-6)
Start with a modular monolith architecture with clear module boundaries:
- Single deployable unit
- Modules communicate via events (not direct calls)
- Shared database with logical separation
- Module structure mirrors future microservices

### Phase 2: Gradual Migration (Months 7-12)
Migrate to microservices using Strangler Fig pattern:
- Extract services based on business value and stability
- Start with low-risk services (notifications, reports)
- Use event streaming for service communication
- Maintain backward compatibility

### Architecture Patterns
- **Domain-Driven Design (DDD)**: Bounded contexts for each module
- **CQRS**: Separate read/write models for complex domains
- **Event Sourcing**: Complete audit trail for compliance
- **Saga Pattern**: Distributed transaction management

## Module Structure

```
vextrus-erp/
├── services/
│   ├── auth/              # Authentication & Authorization
│   ├── project-management/ # Core business domain
│   ├── finance/           # Accounting & Invoicing
│   ├── hr/                # Human Resources
│   ├── scm/               # Supply Chain Management
│   └── crm/               # Customer Relations
├── shared/
│   ├── kernel/            # Domain primitives
│   ├── contracts/         # Service interfaces
│   └── events/            # Domain events
```

## Migration Priority

1. **Auth Service** (Month 3) - Clear boundaries, stateless
2. **Notification Service** (Month 4) - Cross-cutting, low risk
3. **Project Management** (Month 6) - Core domain, high value
4. **Finance** (Month 9) - Complex, regulatory requirements
5. **HR & SCM** (Month 12) - Dependent on other services

## Rationale

### Why Start with Modular Monolith?
- 80% less operational complexity than microservices
- Faster initial development (3-4 months vs 6-8 months)
- Easier debugging and testing
- Natural migration path when ready
- Proven pattern (Shopify, StackOverflow started this way)

### Why CQRS + Event Sourcing?
- 30% reduction in data inconsistency issues
- Complete audit trail for Bangladesh regulatory compliance
- 50% performance improvement at scale
- Natural fit for event-driven architecture

### Why Strangler Fig Pattern?
- Zero downtime migration
- Rollback capability at each step
- Gradual risk mitigation
- Team can learn microservices incrementally

## Consequences

### Positive
- Fast initial delivery (MVP in 3 months)
- Lower initial infrastructure costs
- Simpler deployment and debugging
- Clear migration path
- Team can focus on business logic

### Negative
- Initial shared database (temporary)
- Module boundaries must be strictly enforced
- Event-driven adds initial complexity
- Requires discipline to avoid coupling

### Mitigation Strategies
- Automated architecture tests to enforce boundaries
- Code reviews focused on module isolation
- Event schema versioning from day one
- Regular architecture review sessions

## Alternatives Considered

1. **Microservices from Start**: 
   - Rejected: Too complex for initial team size and timeline
   
2. **Traditional Monolith**:
   - Rejected: Difficult to scale and maintain for enterprise ERP
   
3. **Service-Oriented Architecture (SOA)**:
   - Rejected: Heavier than microservices without the benefits

## Success Criteria

### Phase 1 (Modular Monolith)
- All modules deployable as single unit
- <5% cross-module direct dependencies
- 100% inter-module communication via events
- <200ms average response time

### Phase 2 (Microservices)
- Services independently deployable
- <1% service coupling
- 99.9% uptime per service
- <10 minutes from commit to production

## References
- [Modular Monolith: A Primer](https://www.kamilgrzybek.com/design/modular-monolith-primer/)
- [CQRS Journey by Microsoft](https://docs.microsoft.com/en-us/previous-versions/msp-n-p/jj554200(v=pandp.10))
- [Event Sourcing in Production](https://medium.com/@hugo.oliveira.rocha/what-they-dont-tell-you-about-event-sourcing-6afc23c69e9a)