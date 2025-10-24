# Plugin Command Reference - V6.0

**Total Commands**: 47+
**Last Updated**: V6.0 Upgrade
**Primary Orchestrator**: Compounding Engineering Plugin

---

## Table of Contents

1. [Compounding Engineering (Primary Orchestrator)](#compounding-engineering)
2. [TDD Workflows](#tdd-workflows)
3. [Backend Development](#backend-development)
4. [Full Stack Orchestration](#full-stack-orchestration)
5. [Comprehensive Review](#comprehensive-review)
6. [Git & Version Control](#git-version-control)
7. [Testing & Validation](#testing-validation)
8. [Database Operations](#database-operations)
9. [API Development](#api-development)
10. [Deployment & Infrastructure](#deployment-infrastructure)
11. [Documentation](#documentation)
12. [Frontend & Mobile](#frontend-mobile)
13. [Cloud Infrastructure](#cloud-infrastructure)
14. [Observability & Monitoring](#observability-monitoring)
15. [Security & Authentication](#security-authentication)
16. [Docker & Containers](#docker-containers)
17. [Debugging & Error Analysis](#debugging-error-analysis)

---

## <a name="compounding-engineering"></a>1. Compounding Engineering (Primary Orchestrator)

**Philosophy**: Each unit of engineering work makes subsequent units easier—not harder.

### `/compounding-engineering:plan`
**Category**: Planning
**Priority**: PRIMARY PLANNER
**Use When**: All medium/complex tasks

**What It Does**:
- Researches codebase with Haiku 4.5 Explore agent
- Identifies files, patterns, dependencies
- Creates detailed GitHub issue with implementation plan
- Generates structured todos
- Estimates complexity

**Example**:
```bash
/compounding-engineering:plan "Implement invoice-payment linking with Mushak 6.3 generation"
```

**Output**: GitHub issue URL with comprehensive plan

---

### `/compounding-engineering:work`
**Category**: Execution
**Priority**: PRIMARY EXECUTOR
**Use When**: All planned medium/complex tasks

**What It Does**:
- Creates isolated git worktree
- Breaks plan into trackable todos
- Executes systematically with continuous validation
- Runs `pnpm build` + `npm test` after each change
- Auto-commits with conventional commits
- Pushes to dedicated branch

**Example**:
```bash
/compounding-engineering:work #123
# or
/compounding-engineering:work https://github.com/user/repo/issues/123
```

**Requirements**: GitHub issue must exist

---

### `/compounding-engineering:review`
**Category**: Quality Assurance
**Priority**: PRIMARY REVIEWER
**Use When**: ALWAYS after implementation

**What It Does**:
- Runs 12+ specialized agents in parallel:
  - kieran-typescript-reviewer (code quality /10)
  - architecture-strategist
  - security-sentinel
  - performance-oracle
  - data-integrity-guardian
  - pattern-recognition-specialist
  - code-simplicity-reviewer
  - best-practices-researcher
  - git-history-analyzer
  - repo-research-analyst
  - framework-docs-researcher
  - dhh-rails-reviewer (Rails code)
- Generates comprehensive quality report
- Identifies issues by severity
- Provides actionable recommendations

**Target Score**: ≥7/10 on kieran-typescript-reviewer

---

### `/compounding-engineering:triage`
**Category**: Issue Management
**Use When**: After `/review` to address findings

**What It Does**:
- Presents review findings one-by-one
- For each finding: Shows issue + affected code
- User decides: "Fix now", "Defer", or "Ignore"
- Creates todos for "fix now" items
- Documents "defer" items for backlog
- Tracks "ignore" decisions

---

### `/compounding-engineering:resolve_todo_parallel`
**Category**: Task Management
**Use When**: Resolving multiple related todos efficiently

**What It Does**:
- Identifies parallel-executable todos
- Executes multiple todos concurrently
- Coordinates dependencies
- Reports progress in real-time

---

### `/compounding-engineering:generate_command`
**Category**: Workflow Automation
**Use When**: Creating custom commands for repetitive tasks

**What It Does**:
- Analyzes task pattern
- Generates custom slash command
- Integrates with existing workflow
- Saves to `.claude/commands/`

---

## <a name="tdd-workflows"></a>2. TDD Workflows

### `/tdd-workflows:tdd-cycle`
**Category**: Test-Driven Development
**Use When**: Full TDD red-green-refactor cycle

**What It Does**:
- Guides through complete TDD cycle
- Writes failing test (RED)
- Implements minimal code to pass (GREEN)
- Refactors for quality (REFACTOR)
- Iterates until feature complete

**Best For**: New features with clear acceptance criteria

---

### `/tdd-workflows:tdd-red`
**Category**: Test-Driven Development
**Use When**: Writing failing test first

**What It Does**:
- Analyzes requirement
- Writes comprehensive failing test
- Ensures test actually fails (not false positive)
- Documents expected behavior

---

### `/tdd-workflows:tdd-green`
**Category**: Test-Driven Development
**Use When**: Making failing test pass

**What It Does**:
- Implements minimal code to pass test
- Avoids over-engineering
- Runs test to confirm pass
- Prepares for refactor phase

---

### `/tdd-workflows:tdd-refactor`
**Category**: Test-Driven Development
**Use When**: Refactoring after test passes

**What It Does**:
- Improves code quality without changing behavior
- Removes duplication
- Enhances readability
- Runs tests to ensure no regressions

---

## <a name="backend-development"></a>3. Backend Development

### `/backend-development:feature-development`
**Category**: Planning & Execution
**Use When**: Backend-specific feature planning

**What It Does**:
- Analyzes backend architecture
- Plans domain model changes
- Designs API endpoints
- Plans database migrations
- Generates implementation todos

**Integrates With**: `/compounding-engineering:work`

---

### `/backend-development:api-design-principles`
**Category**: Architecture & Design
**Use When**: Designing new APIs or reviewing API design

**What It Does**:
- Applies REST/GraphQL best practices
- Ensures consistent API patterns
- Reviews endpoint naming
- Validates request/response structures
- Checks pagination, filtering, sorting

**Best For**: API design reviews, new endpoint planning

---

### `/backend-development:architecture-patterns`
**Category**: Architecture & Design
**Use When**: Implementing DDD, Clean Architecture, Hexagonal patterns

**What It Does**:
- Guides implementation of architecture patterns
- Ensures proper layer separation
- Validates aggregate boundaries
- Checks dependency direction
- Reviews entity relationships

**Vextrus ERP Context**: Already uses DDD + Event Sourcing + CQRS

---

### `/backend-development:microservices-patterns`
**Category**: Distributed Systems
**Use When**: Implementing microservices patterns

**What It Does**:
- Designs service boundaries
- Plans inter-service communication
- Implements resilience patterns (circuit breaker, retry)
- Sets up service mesh considerations
- Plans event-driven architectures

**Vextrus ERP Context**: 18 microservices, GraphQL Federation v2

---

## <a name="full-stack-orchestration"></a>4. Full Stack Orchestration

### `/full-stack-orchestration:full-stack-featureold`
**Category**: Full Stack Planning
**Use When**: Features spanning backend + frontend

**What It Does**:
- Plans backend API changes
- Plans frontend UI changes
- Coordinates data flow
- Plans tests for both layers
- Generates comprehensive todos

---

### `/full-stack-orchestration:deployment-engineer`
**Category**: Deployment & CI/CD
**Use When**: CI/CD pipeline design, deployment automation

**What It Does**:
- Designs CI/CD pipelines (GitHub Actions)
- Plans zero-downtime deployments
- Sets up blue-green/canary strategies
- Configures environment management
- Plans rollback procedures

---

### `/full-stack-orchestration:performance-engineer`
**Category**: Performance Optimization
**Use When**: Performance analysis and optimization

**What It Does**:
- Analyzes performance bottlenecks
- Identifies N+1 queries
- Reviews caching strategies
- Analyzes memory usage
- Plans performance improvements
- Suggests monitoring/observability

---

### `/full-stack-orchestration:security-auditor`
**Category**: Security
**Use When**: Security audits, compliance reviews

**What It Does**:
- Scans for vulnerabilities (OWASP Top 10)
- Reviews authentication/authorization
- Checks for SQL injection, XSS, CSRF
- Validates input sanitization
- Reviews secret management
- Checks for hardcoded credentials

---

### `/full-stack-orchestration:test-automator`
**Category**: Testing
**Use When**: Test automation strategy, test generation

**What It Does**:
- Designs test automation strategy
- Generates unit tests
- Plans integration tests
- Sets up E2E test framework
- Configures test coverage reporting

---

## <a name="comprehensive-review"></a>5. Comprehensive Review

### `/comprehensive-review:full-review`
**Category**: Exhaustive Quality Review
**Use When**: Major releases, production readiness checks

**What It Does**:
- Runs ALL available reviewer agents
- More exhaustive than `/compounding-engineering:review`
- Checks: code quality, architecture, security, performance, tests, docs
- Generates comprehensive report
- Provides remediation roadmap

**Use Sparingly**: High context usage, prefer `/compounding-engineering:review`

---

### `/comprehensive-review:architect-review`
**Category**: Architecture Review
**Use When**: Architecture decisions, system design reviews

**What It Does**:
- Reviews architecture patterns compliance
- Validates layer separation
- Checks dependency direction
- Reviews module boundaries
- Identifies architectural debt
- Suggests improvements

---

### `/comprehensive-review:code-reviewer`
**Category**: Code Quality
**Use When**: Code quality focus (lighter than full review)

**What It Does**:
- Reviews code style and conventions
- Checks for code smells
- Identifies duplication
- Reviews naming conventions
- Checks complexity metrics
- Suggests refactorings

---

### `/comprehensive-review:security-auditor`
**Category**: Deep Security Audit
**Use When**: Security-critical changes, compliance requirements

**What It Does**:
- Comprehensive security scan
- OWASP compliance check
- Authentication/authorization review
- Secrets scanning
- Dependency vulnerability scan
- Security best practices validation

---

## <a name="git-version-control"></a>6. Git & Version Control

### `/git-pr-workflows:pr-enhance`
**Category**: Pull Requests
**Use When**: Creating or enhancing pull requests

**What It Does**:
- Analyzes changes in branch
- Generates comprehensive PR description
- Creates testing checklist
- Adds related issue links
- Suggests reviewers
- Formats PR with best practices

**Example**:
```bash
/git-pr-workflows:pr-enhance
```

**Requirements**: Must be on a branch with commits

---

### `/git-commit-smart:commit-smart`
**Category**: Commits
**Use When**: Generating conventional commits

**What It Does**:
- Analyzes staged changes
- Generates conventional commit message
- Follows type conventions (feat, fix, refactor, etc.)
- Includes scope and breaking changes
- References related issues

**Example**:
```bash
/git-commit-smart:commit-smart
```

**Note**: `/compounding-engineering:work` auto-commits, use this for manual commits

---

## <a name="testing-validation"></a>7. Testing & Validation

### `/test-orchestrator:orchestrate`
**Category**: Complex Test Workflows
**Use When**: Orchestrating complex test scenarios

**What It Does**:
- Coordinates multiple test types
- Runs unit → integration → E2E in sequence
- Handles test data setup/teardown
- Reports comprehensive results
- Identifies failing test patterns

---

### `/unit-test-generator:generate-tests`
**Category**: Test Generation
**Use When**: Generating comprehensive unit tests

**What It Does**:
- Analyzes source code
- Generates unit tests with high coverage
- Creates test fixtures
- Mocks dependencies
- Tests edge cases and error paths

**Target**: 90%+ coverage

**Example**:
```bash
/unit-test-generator:generate-tests
```

---

### `/unit-testing:test-automator`
**Category**: Test Automation
**Use When**: Setting up test automation infrastructure

**What It Does**:
- Configures test framework
- Sets up CI/CD test integration
- Plans test data management
- Configures coverage reporting
- Sets up test environment

---

### `/authentication-validator:validate-auth`
**Category**: Authentication Testing
**Use When**: Validating authentication/authorization

**What It Does**:
- Tests authentication flows
- Validates JWT/session handling
- Checks authorization rules
- Tests RBAC implementation
- Identifies auth vulnerabilities

**Vextrus ERP Context**: Tests RBAC with Bangladesh compliance

---

## <a name="database-operations"></a>8. Database Operations

### `/database-migrations:sql-migrations`
**Category**: Database Migrations
**Use When**: Zero-downtime database migrations

**What It Does**:
- Plans zero-downtime migration strategy
- Generates migration files
- Handles data backfill
- Plans rollback procedures
- Validates migration safety

**Strategies**: Expand-contract, dual writes, feature flags

**Example**:
```bash
/database-migrations:sql-migrations
```

---

### `/database-migrations:migration-observability`
**Category**: Migration Monitoring
**Use When**: Monitoring migration progress/issues

**What It Does**:
- Sets up migration monitoring
- Tracks migration progress
- Alerts on failures
- Provides rollback triggers
- Logs migration events

---

### `/database-design:database-architect`
**Category**: Database Architecture
**Use When**: Database design from scratch, major schema changes

**What It Does**:
- Designs database schema
- Normalizes/denormalizes appropriately
- Plans indexes for performance
- Designs partitioning strategies
- Reviews entity relationships

---

### `/database-design:sql-pro`
**Category**: SQL Optimization
**Use When**: Query optimization, performance issues

**What It Does**:
- Analyzes slow queries
- Suggests index improvements
- Identifies N+1 queries
- Reviews query plans
- Suggests query rewrites

---

### `/database-cloud-optimization:database-optimizer`
**Category**: Database Optimization Review
**Use When**: Database performance review

**What It Does**:
- Comprehensive database performance review
- Analyzes query patterns
- Reviews indexing strategy
- Checks connection pooling
- Suggests caching strategies

---

## <a name="api-development"></a>9. API Development

### `/api-scaffolding:fastapi-templates`
**Category**: API Scaffolding
**Use When**: Creating new FastAPI service from scratch

**What It Does**:
- Generates FastAPI project structure
- Sets up async patterns
- Configures dependency injection
- Creates error handling
- Sets up OpenAPI documentation

**Vextrus ERP Context**: Use for new microservices

---

### `/api-scaffolding:fastapi-pro`
**Category**: FastAPI Development
**Use When**: FastAPI-specific feature development

**What It Does**:
- Implements FastAPI endpoints
- Uses async/await patterns
- Configures Pydantic models
- Sets up route dependencies
- Implements middleware

---

### `/api-scaffolding:django-pro`
**Category**: Django Development
**Use When**: Django-specific development

**What It Does**:
- Implements Django views/viewsets
- Configures DRF serializers
- Sets up Django models
- Implements Django ORM queries
- Configures Django admin

---

### `/api-scaffolding:graphql-architect`
**Category**: GraphQL Design
**Use When**: GraphQL schema design, federation setup

**What It Does**:
- Designs GraphQL schemas
- Implements federation directives (@key, @extends)
- Plans query optimization
- Implements DataLoader patterns
- Reviews N+1 issues

**Vextrus ERP Context**: 18 microservices with GraphQL Federation v2

---

### `/api-testing-observability:api-documenter`
**Category**: API Documentation
**Use When**: Creating/updating API documentation

**What It Does**:
- Generates OpenAPI/Swagger docs
- Creates API usage examples
- Documents request/response schemas
- Generates Postman collections
- Creates API versioning docs

---

### `/api-documentation-generator:generate-api-docs`
**Category**: API Documentation
**Use When**: Comprehensive API documentation generation

**What It Does**:
- Analyzes API endpoints
- Generates comprehensive documentation
- Creates interactive API explorer
- Documents authentication flows
- Generates client SDKs

---

### `/backend-api-security:backend-security-coder`
**Category**: Secure Backend Coding
**Use When**: Implementing security-critical backend code

**What It Does**:
- Implements secure authentication
- Validates input properly
- Prevents SQL injection
- Implements rate limiting
- Secures API endpoints
- Handles secrets properly

---

### `/data-validation-suite:backend-security-coder`
**Category**: Input Validation
**Use When**: Implementing robust input validation

**What It Does**:
- Implements validation rules
- Sanitizes user input
- Validates data types
- Checks business rules
- Prevents injection attacks

---

## <a name="deployment-infrastructure"></a>10. Deployment & Infrastructure

### `/deployment-pipeline-orchestrator:pipeline-orchestrate`
**Category**: CI/CD Pipeline
**Use When**: Setting up or updating CI/CD pipelines

**What It Does**:
- Designs CI/CD pipeline
- Configures GitHub Actions/GitLab CI
- Sets up deployment stages
- Configures environment secrets
- Plans rollback procedures

**Example**:
```bash
/deployment-pipeline-orchestrator:pipeline-orchestrate
```

---

### `/infrastructure-drift-detector:drift-detect`
**Category**: Infrastructure Monitoring
**Use When**: Detecting infrastructure drift

**What It Does**:
- Compares actual vs expected infrastructure
- Identifies drift in Terraform/CloudFormation
- Reports configuration changes
- Suggests remediation
- Alerts on critical drift

---

## <a name="documentation"></a>11. Documentation

### `/documentation-generation:docs-architect`
**Category**: Documentation Planning
**Use When**: Planning comprehensive documentation

**What It Does**:
- Analyzes codebase for documentation needs
- Plans documentation structure
- Identifies undocumented areas
- Creates documentation roadmap
- Suggests documentation formats

---

## <a name="frontend-mobile"></a>12. Frontend & Mobile

### `/frontend-mobile-development:frontend-developer`
**Category**: Frontend Development
**Use When**: React/Next.js frontend features

**What It Does**:
- Implements React components
- Uses React 19 patterns (use, useOptimistic)
- Implements Next.js 15 features
- Handles client-side state
- Implements responsive design

---

### `/frontend-mobile-development:mobile-developer`
**Category**: Mobile Development
**Use When**: React Native/Flutter mobile development

**What It Does**:
- Implements mobile UI
- Handles native integrations
- Implements offline sync
- Handles platform-specific code
- Optimizes mobile performance

---

### `/application-performance:frontend-developer`
**Category**: Frontend Performance
**Use When**: Frontend performance optimization

**What It Does**:
- Analyzes bundle size
- Implements code splitting
- Optimizes rendering
- Implements lazy loading
- Improves Core Web Vitals

---

## <a name="cloud-infrastructure"></a>13. Cloud Infrastructure

### `/cloud-infrastructure:cloud-architect`
**Category**: Cloud Architecture
**Use When**: Cloud infrastructure design

**What It Does**:
- Designs cloud architecture (AWS/Azure/GCP)
- Plans multi-cloud strategies
- Reviews cost optimization
- Designs high availability
- Plans disaster recovery

---

### `/cloud-infrastructure:terraform-module-library`
**Category**: Infrastructure as Code
**Use When**: Creating Terraform modules

**What It Does**:
- Generates Terraform modules
- Follows IaC best practices
- Creates reusable modules
- Configures state management
- Plans module versioning

---

### `/cloud-infrastructure:kubernetes-architect`
**Category**: Kubernetes
**Use When**: Kubernetes architecture and deployment

**What It Does**:
- Designs K8s architecture
- Plans pod/deployment configurations
- Configures service mesh
- Plans horizontal pod autoscaling
- Reviews security policies

---

### `/cloud-infrastructure:network-engineer`
**Category**: Cloud Networking
**Use When**: Network design, connectivity issues

**What It Does**:
- Designs VPC/subnets
- Plans network segmentation
- Configures load balancers
- Sets up VPN/Direct Connect
- Reviews network security

---

## <a name="observability-monitoring"></a>14. Observability & Monitoring

### `/observability-monitoring:observability-engineer`
**Category**: Production Monitoring
**Use When**: Setting up observability infrastructure

**What It Does**:
- Designs observability strategy
- Sets up Prometheus/Grafana
- Configures distributed tracing
- Plans log aggregation
- Sets up alerting rules

---

### `/observability-monitoring:prometheus-configuration`
**Category**: Metrics Collection
**Use When**: Prometheus setup and configuration

**What It Does**:
- Configures Prometheus
- Sets up metric exporters
- Defines recording rules
- Configures alerting rules
- Plans metric retention

---

### `/observability-monitoring:grafana-dashboards`
**Category**: Dashboard Creation
**Use When**: Creating monitoring dashboards

**What It Does**:
- Designs Grafana dashboards
- Creates visualization panels
- Configures dashboard variables
- Sets up dashboard alerts
- Creates operational views

---

### `/observability-monitoring:distributed-tracing`
**Category**: Distributed Tracing
**Use When**: Implementing distributed tracing

**What It Does**:
- Sets up Jaeger/Tempo
- Instruments services
- Configures trace sampling
- Creates trace visualizations
- Analyzes trace data

---

### `/observability-monitoring:slo-implementation`
**Category**: SLO/SLI
**Use When**: Implementing SRE practices

**What It Does**:
- Defines SLIs (Service Level Indicators)
- Sets SLOs (Service Level Objectives)
- Calculates error budgets
- Configures SLO alerting
- Reports SLO compliance

---

## <a name="security-authentication"></a>15. Security & Authentication

### `/backend-api-security:backend-security-coder`
**Category**: Secure Backend Implementation
**Use When**: Implementing security-critical backend code

**What It Does**:
- Implements OAuth2/OIDC flows
- Validates JWT tokens
- Implements RBAC
- Secures API endpoints
- Handles session management

---

### `/authentication-validator:validate-auth`
**Category**: Authentication Testing
**Use When**: Validating authentication implementation

**What It Does**:
- Tests auth flows
- Validates token handling
- Tests authorization rules
- Checks for auth bypasses
- Tests password policies

---

## <a name="docker-containers"></a>16. Docker & Containers

### `/docker-compose-generator:docker-compose`
**Category**: Docker Compose
**Use When**: Creating Docker Compose configurations

**What It Does**:
- Generates docker-compose.yml
- Configures services
- Sets up networks
- Configures volumes
- Plans multi-stage builds

**Example**:
```bash
/docker-compose-generator:docker-compose
```

---

### `/docker-mcp-toolkit:gateway-debug`
**Category**: Docker MCP Debugging
**Use When**: Debugging Docker MCP Gateway issues

**What It Does**:
- Diagnoses Docker MCP issues
- Checks gateway status
- Validates configuration
- Provides troubleshooting steps

---

### `/docker-mcp-toolkit:gateway-status`
**Category**: Docker MCP Status
**Use When**: Checking Docker MCP Gateway status

**What It Does**:
- Shows gateway status
- Lists enabled MCP servers
- Shows connection status
- Reports errors

---

## <a name="debugging-error-analysis"></a>17. Debugging & Error Analysis

### `/error-debugging:debugger`
**Category**: Debugging
**Use When**: Debugging issues, test failures

**What It Does**:
- Analyzes error messages
- Identifies root causes
- Suggests fixes
- Tests proposed solutions
- Validates fixes

---

### `/error-debugging:error-detective`
**Category**: Error Pattern Analysis
**Use When**: Analyzing error patterns in logs/codebase

**What It Does**:
- Searches logs for error patterns
- Correlates errors across systems
- Identifies root causes
- Suggests preventive measures
- Creates error reports

**Example**:
```bash
/error-debugging:error-detective
```

---

### `/distributed-debugging:devops-troubleshooter`
**Category**: Production Troubleshooting
**Use When**: Production issues, incident response

**What It Does**:
- Analyzes production errors
- Debugs distributed systems
- Reviews logs and traces
- Identifies performance issues
- Provides remediation steps

---

### `/performance-testing-review:performance-engineer`
**Category**: Performance Testing & Review
**Use When**: Performance testing validation

**What It Does**:
- Reviews performance tests
- Analyzes load test results
- Identifies bottlenecks
- Suggests optimizations
- Validates performance improvements

---

### `/application-performance:performance-engineer`
**Category**: Application Performance Analysis
**Use When**: Application performance optimization

**What It Does**:
- Analyzes application performance
- Identifies slow endpoints
- Reviews caching effectiveness
- Suggests code optimizations
- Plans performance improvements

---

## Plugin Usage Patterns

### Task Type → Plugin Selection

| Task Type | Primary Plugin | Supporting Plugins |
|-----------|----------------|-------------------|
| **New Feature** | `/compounding-engineering:plan` → `/work` | `/tdd-workflows:tdd-cycle`<br>`/unit-test-generator:generate-tests` |
| **Bug Fix** | `/error-debugging:error-detective` → `/compounding-engineering:work` | `/compounding-engineering:review` |
| **Refactoring** | `/compounding-engineering:work` | `/comprehensive-review:code-reviewer`<br>`/compounding-engineering:review` |
| **Performance** | `/application-performance:performance-engineer` | `/performance-testing-review:performance-engineer`<br>`/database-design:sql-pro` |
| **Security** | `/comprehensive-review:security-auditor` | `/backend-api-security:backend-security-coder`<br>`/authentication-validator:validate-auth` |
| **Database** | `/database-migrations:sql-migrations` | `/database-design:database-architect`<br>`/compounding-engineering:review` |
| **API** | `/api-scaffolding:fastapi-pro` | `/api-testing-observability:api-documenter`<br>`/backend-api-security:backend-security-coder` |
| **Infrastructure** | `/cloud-infrastructure:cloud-architect` | `/deployment-pipeline-orchestrator:pipeline-orchestrate`<br>`/infrastructure-drift-detector:drift-detect` |
| **Frontend** | `/frontend-mobile-development:frontend-developer` | `/application-performance:frontend-developer`<br>`/compounding-engineering:review` |

---

## Integration Patterns

### Pattern 1: Standard Feature Development
```
1. /compounding-engineering:plan "Feature description"
2. /compounding-engineering:work #issue
3. /compounding-engineering:review
4. /compounding-engineering:triage
5. /git-pr-workflows:pr-enhance
```

### Pattern 2: TDD Feature Development
```
1. /compounding-engineering:plan "Feature description"
2. /tdd-workflows:tdd-cycle
3. /compounding-engineering:review
4. /git-pr-workflows:pr-enhance
```

### Pattern 3: Bug Fix with Analysis
```
1. /error-debugging:error-detective
2. /compounding-engineering:work #issue
3. /compounding-engineering:review
4. /git-commit-smart:commit-smart
```

### Pattern 4: Performance Optimization
```
1. /application-performance:performance-engineer
2. /compounding-engineering:plan "Optimization tasks"
3. /compounding-engineering:work #issue
4. /performance-testing-review:performance-engineer
5. /compounding-engineering:review
```

### Pattern 5: Security Audit & Fix
```
1. /comprehensive-review:security-auditor
2. /compounding-engineering:triage
3. /backend-api-security:backend-security-coder
4. /authentication-validator:validate-auth
5. /compounding-engineering:review
```

---

## Quick Reference

| Need | Command | Category |
|------|---------|----------|
| Plan task | `/compounding-engineering:plan` | Planning |
| Execute | `/compounding-engineering:work` | Execution |
| Review | `/compounding-engineering:review` | Quality |
| Triage | `/compounding-engineering:triage` | Issue Mgmt |
| TDD | `/tdd-workflows:tdd-cycle` | Testing |
| Tests | `/unit-test-generator:generate-tests` | Testing |
| PR | `/git-pr-workflows:pr-enhance` | Git |
| Commit | `/git-commit-smart:commit-smart` | Git |
| Security | `/comprehensive-review:security-auditor` | Security |
| Performance | `/application-performance:performance-engineer` | Performance |
| Database | `/database-migrations:sql-migrations` | Database |
| API | `/api-scaffolding:fastapi-pro` | API |
| Deploy | `/deployment-pipeline-orchestrator:pipeline-orchestrate` | Deployment |
| Debug | `/error-debugging:error-detective` | Debugging |
| Docs | `/documentation-generation:docs-architect` | Documentation |

---

## Plugin Marketplace Sources

- **Every Marketplace**: https://github.com/EveryInc/every-marketplace
- **Seth Hobson's 80+ Agents**: (URL if available)
- **Jeremy Longshore's 227 Plugins**: (URL if available)

---

## Adding Custom Commands

Use `/compounding-engineering:generate_command` to create custom commands for project-specific workflows.

---

**V6.0** | **47+ Plugin Commands** | **Compounding Engineering Philosophy** | **Knowledge Compounds**
