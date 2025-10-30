# Architecture Decision Records (ADRs)

## Overview
This directory contains Architecture Decision Records for Vextrus ERP - an enterprise resource planning system specifically designed for Bangladesh's construction industry.

## ADR Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [ADR-001](ADR-001-tech-stack-selection.md) | Technology Stack Selection | Accepted | 2024-12-05 |
| [ADR-002](ADR-002-architecture-pattern.md) | Architecture Pattern - Modular Monolith to Microservices | Accepted | 2024-12-05 |
| [ADR-003](ADR-003-database-strategy.md) | Database Strategy and Data Management | Accepted | 2024-12-05 |
| [ADR-004](ADR-004-bangladesh-localization.md) | Bangladesh Localization Strategy | Accepted | 2024-12-05 |
| [ADR-005](ADR-005-security-approach.md) | Security Architecture and Approach | Accepted | 2024-12-05 |

## Quick Summary

### Core Decisions

**Technology Stack**
- Backend: Node.js 20 + NestJS 10 + TypeScript
- Frontend: Next.js 15 + Shadcn/ui
- Database: PostgreSQL 16 + Redis 7 + EventStoreDB
- Infrastructure: Docker + Kubernetes + SigNoz

**Architecture**
- Start with modular monolith (Months 1-6)
- Migrate to microservices using Strangler Fig pattern (Months 7-12)
- CQRS + Event Sourcing for complex domains
- Domain-Driven Design with bounded contexts

**Database**
- PostgreSQL for OLTP
- Schema-based multi-tenancy
- EventStoreDB for event sourcing
- Redis for caching

**Localization**
- Bengali + English support
- bKash, Nagad, Rocket payment integration
- NBR tax compliance (VAT, AIT)
- RAJUK permit integration
- Offline-first PWA for field workers

**Security**
- JWT with 15min access + 7day refresh tokens
- RBAC + Row-level security
- AES-256 encryption at rest
- TLS 1.3 in transit
- Complete audit logging

## Implementation Roadmap

### Phase 1: Foundation (Months 1-2)
- Set up development environment
- Initialize modular monolith structure
- Implement authentication service
- Basic project management CRUD

### Phase 2: Core Features (Months 3-4)
- Project management module
- Finance module with NBR compliance
- Bengali localization
- Payment gateway integration

### Phase 3: Advanced Features (Months 5-6)
- RAJUK API integration
- Offline-first mobile PWA
- Advanced reporting
- HR and SCM modules

### Phase 4: Microservices Migration (Months 7-12)
- Extract auth service
- Extract notification service
- Migrate project management
- Complete service separation

## Key Differentiators

1. **Bangladesh-Specific**: Only ERP with native RAJUK, NBR integration
2. **Cost-Effective**: 97% cheaper monitoring than competitors
3. **Performance**: <200ms API response on slow connections
4. **Localization**: Full Bengali support with local payment methods
5. **Architecture**: Future-proof migration path from monolith to microservices

## Decision Process

All ADRs follow this template:
- **Context**: Problem statement and requirements
- **Decision**: Chosen solution
- **Rationale**: Why this decision
- **Consequences**: Positive, negative, and mitigation
- **Alternatives**: Other options considered

## Review Schedule

- Monthly review of ADR compliance
- Quarterly architecture review board meeting
- Annual strategic architecture assessment

## Contributing

To propose a new ADR:
1. Copy `ADR-TEMPLATE.md`
2. Fill in all sections
3. Submit for review
4. Get approval from 2 senior engineers
5. Update this README

## References

- [Architectural Decision Records](https://adr.github.io/)
- [Bangladesh Digital Transformation Strategy](https://a2i.gov.bd/)
- [NestJS Enterprise Patterns](https://docs.nestjs.com/)