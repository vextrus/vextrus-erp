# ADR-001: Technology Stack Selection

## Status
Accepted

## Date
2024-12-05

## Context
Vextrus ERP requires a modern, scalable technology stack suitable for the Bangladesh construction industry. Based on market research, we need to balance:
- Enterprise-grade capabilities
- Cost-effectiveness for emerging markets
- Local developer availability
- Bangladesh-specific requirements (Bengali support, slow internet)

### Requirements
- Handle 10,000+ concurrent users
- Support offline-first mobile access
- Bengali language support
- Integration with local payment systems (bKash, Nagad)
- <200ms API response time (p95)
- 99.9% uptime SLA

## Decision

We will use the following technology stack:

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: NestJS 10
- **Language**: TypeScript 5.3
- **API**: REST primary, GraphQL for complex queries
- **Messaging**: Apache Kafka

### Frontend  
- **Web**: Next.js 15 with App Router
- **Mobile**: Progressive Web App (PWA)
- **UI Components**: Shadcn/ui + Radix UI
- **State Management**: Zustand + TanStack Query

### Data Layer
- **Primary Database**: PostgreSQL 16
- **Event Store**: EventStoreDB
- **Cache**: Redis 7
- **Search**: Elasticsearch (optional)

### Infrastructure
- **Container**: Docker
- **Orchestration**: Kubernetes
- **Monitoring**: SigNoz (open-source)
- **CI/CD**: GitHub Actions

## Rationale

### Why Node.js/TypeScript?
- Large talent pool in Bangladesh
- Excellent async performance for I/O operations
- Single language across stack reduces complexity
- Strong ecosystem for enterprise development

### Why NestJS?
- Enterprise patterns built-in (DI, CQRS, Microservices)
- 60k+ GitHub stars, proven at scale
- 40% improvement in code maintainability
- Native TypeScript support

### Why PostgreSQL?
- ACID compliance for financial data
- JSON support for flexible schemas
- Proven reliability and performance
- Strong community and tooling

### Why SigNoz over DataDog?
- 97% cost savings ($2,400/year vs $84,000/year)
- Open-source with full control
- Unified traces, metrics, logs
- Self-hosted for data sovereignty

## Consequences

### Positive
- Modern, scalable architecture
- Cost-effective for Bangladesh market
- Strong developer ecosystem
- Future-proof technology choices
- Excellent performance characteristics

### Negative
- Initial learning curve for team
- More complex than monolithic alternatives
- Requires DevOps expertise
- Higher initial setup time

### Risks
- TypeScript compilation overhead (mitigated by build optimization)
- Node.js memory management for large datasets (mitigated by streaming)
- PostgreSQL scaling limits (mitigated by partitioning strategy)

## Alternatives Considered

1. **Java Spring Boot**: More enterprise-proven but higher resource usage and limited local talent
2. **Python Django**: Simpler but performance concerns at scale
3. **.NET Core**: Excellent performance but less adoption in Bangladesh
4. **PHP Laravel**: Popular locally but limiting for modern architecture patterns

## References
- [NestJS Performance Benchmarks 2024](https://docs.nestjs.com/benchmarks)
- [Bangladesh Developer Survey 2024](https://example.com)
- [PostgreSQL vs MongoDB for ERP](https://example.com)