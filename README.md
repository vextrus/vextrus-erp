# Vextrus ERP - Enterprise Resource Planning for Bangladesh Construction Industry

## 🏗️ Overview

Vextrus ERP is a next-generation enterprise resource planning system specifically designed for the Bangladesh construction industry. Built on modern microservices architecture with Domain-Driven Design (DDD) principles, CQRS pattern, and event sourcing, it provides comprehensive project management, financial control, and operational excellence capabilities.

## 🌟 Key Features

### Core Modules
- **Project Management**: Primavera P6-level CPM scheduling with earned value management
- **Finance & Accounting**: Multi-currency support with Bangladesh tax compliance
- **Human Resources**: Local labor law compliance and payroll processing
- **Supply Chain Management**: Vendor management and procurement workflows
- **CRM & Sales**: Lead management and customer portal

### Bangladesh-Specific Features
- **RAJUK Integration**: Direct API integration for construction permits
- **NBR Tax Compliance**: Automated VAT (15%) and AIT calculations
- **Payment Gateways**: bKash and Nagad integration
- **Bengali Language**: Full Unicode support for বাংলা
- **District Operations**: Hierarchical location management
- **Weather Impact**: Monsoon season calculations for project scheduling

## 🚀 Quick Start

### Prerequisites
- Node.js 20 LTS or Bun
- PostgreSQL 16
- Redis 7
- Docker & Docker Compose
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/vextrus-erp.git
cd vextrus-erp

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Start infrastructure services
docker-compose up -d postgres redis kafka

# Run database migrations
npm run db:migrate

# Seed initial data
npm run db:seed

# Start development servers
npm run dev
```

### Development Mode

```bash
# Start all services in development mode
npm run dev

# Start specific service
npm run dev:auth
npm run dev:project-management
npm run dev:web

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage
```

## 🏛️ Architecture

### Technology Stack

#### Backend
- **Runtime**: Node.js 20 LTS / Bun
- **Framework**: NestJS 10
- **Language**: TypeScript 5.3
- **API**: REST + GraphQL
- **Database**: PostgreSQL 16 (OLTP), ClickHouse (OLAP)
- **Cache**: Redis 7
- **Message Queue**: Apache Kafka
- **Search**: Elasticsearch

#### Frontend
- **Framework**: Next.js 15
- **UI Components**: Shadcn/ui + Radix UI
- **State Management**: Zustand + TanStack Query
- **Forms**: React Hook Form + Zod
- **PWA**: Offline-first mobile support

#### Infrastructure
- **Container**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack

### Project Structure

```
vextrus-erp/
├── apps/                    # Frontend applications
│   ├── web/                # Next.js web app
│   ├── mobile/             # PWA mobile app
│   └── api-gateway/        # Kong/Express gateway
├── services/               # Microservices
│   ├── auth/              # Authentication service
│   ├── project-management/ # PM module
│   ├── finance/           # Finance module
│   ├── hr/                # Human resources
│   ├── scm/               # Supply chain
│   └── crm/               # Customer relations
├── shared/                # Shared npm packages
│   ├── kernel/           # @vextrus/kernel - Domain primitives
│   ├── contracts/        # @vextrus/contracts - Service contracts
│   └── utils/           # @vextrus/utils - Common utilities
├── infrastructure/       # DevOps configuration
│   ├── docker/          # Docker configs
│   ├── kubernetes/      # K8s manifests
│   └── terraform/       # IaC configs
└── docs/                # Documentation
    ├── architecture/    # Architecture docs
    ├── adr/            # Decision records
    ├── api/            # API documentation
    └── guides/         # User guides
```

### Monorepo Structure

This project uses npm workspaces and Turborepo for efficient monorepo management:

- **Workspace Packages**: All services and shared libraries are npm workspaces
- **Turbo Pipeline**: Optimized build pipeline with caching and parallelization
- **TypeScript Project References**: Incremental compilation across packages
- **Shared Libraries**: Published as internal npm packages (`@vextrus/*`)

### Shared Libraries

The monorepo includes three core shared libraries as npm packages:

#### @vextrus/kernel
Core domain primitives implementing Domain-Driven Design patterns:
- `AggregateRoot` - Event sourcing support
- `Entity` - Identity management
- `ValueObject` - Immutable value types
- `Specification` - Business rule patterns
- Repository interfaces

#### @vextrus/contracts
Cross-service contracts and interfaces:
- Authentication contracts (IAuthUser, IAuthTokens)
- Event contracts (domain events)
- Error contracts (standardized errors)
- DTOs and API contracts

#### @vextrus/utils
Common utilities and helpers:
- Date/time formatting
- Currency formatting (BDT support)
- Bengali language utilities
- Validation helpers
- Common constants

## 📦 Package Publishing

### Prerequisites
- Node.js 20.x and pnpm 8.x
- GPG key for signing (see [GPG Setup Guide](docs/GPG_KEY_SETUP.md))
- npm account with 2FA enabled (future)

### Publishing Workflow

#### Local Development
```bash
# Create a changeset for your changes
pnpm changeset

# Version packages based on changesets
pnpm version-packages

# Build all packages
pnpm build:packages

# Publish to local registry (Verdaccio)
docker-compose up -d verdaccio
pnpm release:local
```

#### Production Publishing (CI/CD)
```bash
# Create changeset
pnpm changeset

# Commit and push to feature branch
git add .changeset/
git commit -m "chore: add changeset for [feature]"
git push origin feature/your-feature

# Create PR - GitHub Actions will handle the rest
gh pr create
```

### Automated Publishing
Our GitHub Actions workflow automatically:
1. Creates version PR when changesets are detected
2. Bumps versions according to changesets
3. Publishes to npm registry (when configured)
4. Creates GitHub releases with changelogs
5. Signs packages with GPG (when configured)

### Security & Quality
- ✅ All packages are GPG signed for integrity
- ✅ Automated vulnerability scanning with npm audit
- ✅ Pre-publish testing and linting
- ✅ Semantic versioning enforced
- ✅ Changeset-based version management

### Registry Configuration
Currently using:
- **Development**: Local Verdaccio registry
- **Future Production**: NPM Enterprise (pending budget approval)

### Package Versions
| Package | Current Version | Status |
|---------|-----------------|--------|
| @vextrus/kernel | 1.0.1 | ✅ Published |
| @vextrus/contracts | 1.0.1 | ✅ Published |
| @vextrus/utils | 1.0.1 | ✅ Published |
| @vextrus/distributed-transactions | 1.0.1 | ✅ Published |

### Monitoring & Status
- Package health: `npm run check:packages`
- Dependency updates: `npm run update:deps`
- Security audit: `npm audit`
- Registry status: http://localhost:4873 (local)

## 📊 Performance Targets

- **API Response**: < 200ms (p95)
- **Frontend Load**: < 2s (3G network)
- **Database Queries**: < 50ms (average)
- **Concurrent Users**: 10,000+
- **Uptime**: 99.9% SLA

## 🔒 Security

- JWT authentication with refresh tokens
- Role-Based Access Control (RBAC)
- Multi-Factor Authentication (MFA)
- Encryption at rest (AES-256) and in transit (TLS 1.3)
- OWASP Top 10 compliance
- Regular security audits

## 🇧🇩 Bangladesh Compliance

### Regulatory
- RAJUK ECPS integration
- NBR e-filing compliance
- Bangladesh Data Protection Act
- Local labor law compliance

### Localization
- Bengali (বাংলা) language support
- Bangladesh fiscal year (July-June)
- BDT currency with proper formatting
- District-based hierarchical operations

## 📦 API Documentation

### REST API
- OpenAPI 3.0 specification
- Interactive Swagger UI at `/api/docs`
- Postman collection available

### GraphQL API
- GraphQL Playground at `/graphql`
- Schema introspection enabled in development
- Subscription support for real-time updates

## 🧪 Testing

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Load testing
npm run test:load

# Security testing
npm run test:security
```

## 🚢 Deployment

### Development
```bash
docker-compose up -d
npm run dev
```

### Staging
```bash
kubectl apply -f infrastructure/kubernetes/staging/
```

### Production
```bash
# Build production images
npm run build:prod

# Deploy to Kubernetes
kubectl apply -f infrastructure/kubernetes/production/

# Run database migrations
npm run db:migrate:prod
```

## 📈 Monitoring

- **Metrics**: Prometheus + Grafana dashboards
- **Logs**: Centralized logging with ELK Stack
- **APM**: Application Performance Monitoring
- **Alerts**: PagerDuty integration
- **Health Checks**: `/health` and `/ready` endpoints

## 🤝 Contributing

Please read [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Development Workflow
1. Create feature branch from `develop`
2. Write tests for new features
3. Ensure all tests pass
4. Submit pull request
5. Code review by 2 team members
6. Merge to `develop` after approval

## 📝 Documentation

- [Architecture Overview](docs/architecture/ENTERPRISE_ARCHITECTURE.md)
- [Technology Stack](docs/architecture/TECHNOLOGY_STACK.md)
- [API Documentation](docs/api/README.md)
- [Development Guide](docs/guides/DEVELOPMENT.md)
- [Deployment Guide](docs/guides/DEPLOYMENT.md)

## 📄 License

This project is proprietary software. All rights reserved.

## 🏢 About Vextrus

Vextrus ERP is developed specifically for the Bangladesh construction industry, addressing unique local requirements while maintaining international standards of quality and performance.

## 📞 Support

- **Email**: support@vextrus.com
- **Phone**: +880 1234567890
- **Documentation**: [docs.vextrus.com](https://docs.vextrus.com)
- **Issue Tracker**: [GitHub Issues](https://github.com/your-org/vextrus-erp/issues)

---

**Version**: 1.0.0  
**Status**: In Development  
**Target Release**: Q1 2026