# Vextrus ERP Plugin Usage Guide

**Purpose**: Quick reference for using 41 plugins in Vextrus ERP development
**Context**: 18 microservices, NestJS, GraphQL Federation, DDD/CQRS/Event Sourcing
**Last Updated**: 2025-10-16

---

## Quick Reference by Task Type

| Task Type | Primary Plugins | Commands |
|-----------|-----------------|----------|
| **Backend Implementation** | backend-development, database-design | Use Task tool with agents |
| **Code Review** | code-review-ai, compounding-engineering | `/review` + agents |
| **Testing** | unit-testing, tdd-workflows | `/test` |
| **Security** | security-scanning, backend-api-security | `/security-scan` |
| **Documentation** | documentation-generation | `/docs` |
| **Performance** | application-performance | Use Task tool with performance-oracle |
| **Database** | database-design, database-migrations | Use Task tool with agents |
| **Infrastructure** | deployment-strategies, cicd-automation | Use Task tool with agents |

---

## Backend Development (Most Common)

### When to Use
- Implementing NestJS services
- Designing GraphQL APIs
- Domain logic (DDD aggregates, value objects)
- Event sourcing with EventStore
- CQRS command/query handlers

### Plugins (10 total, 18 agents)
- backend-development
- api-scaffolding
- database-design
- backend-api-security
- python-development (if using Python services)

### How to Use

**Architecture Decisions**:
```bash
# Use Task tool with backend-development:backend-architect
# Specializes in: Microservices patterns, API design, DDD/CQRS
```

**GraphQL Schema Design**:
```bash
# Use Task tool with backend-development:graphql-architect
# Specializes in: GraphQL Federation, schema design, resolvers
```

**Database Schema**:
```bash
# Use Task tool with database-design:database-architect
# Specializes in: PostgreSQL schema, normalization, migrations
```

**SQL Query Optimization**:
```bash
# Use Task tool with database-design:sql-pro
# Specializes in: Query performance, indexing, OLTP/OLAP
```

**Example Workflow**:
```markdown
# Task: Implement Invoice Management GraphQL API

1. Architecture Design
   Use Task tool: backend-development:backend-architect
   - Design aggregate boundaries
   - Plan event sourcing strategy
   - Define CQRS handlers

2. Database Schema
   Use Task tool: database-design:database-architect
   - Design invoice, line_item tables
   - Add proper indexes
   - Migration strategy

3. GraphQL Schema
   Use Task tool: backend-development:graphql-architect
   - Design InvoiceDto, CreateInvoiceInput
   - Plan federation with other services
   - Resolver structure

4. Implementation
   (Write code using Sonnet 4.5)

5. Quality Gates
   /review - Code review
   /test - Run tests
   /security-scan - Security analysis
```

---

## Quality & Testing

### When to Use
- Before creating PR
- After implementing features
- During refactoring
- Regular quality checks

### Plugins (7 total, 14 agents)
- code-review-ai
- unit-testing
- tdd-workflows
- performance-testing-review
- comprehensive-review
- code-refactoring
- dependency-management

### Slash Commands (Quick)

```bash
# Required before PR
/review                  # AI-powered code review
/test                   # Run all tests
/security-scan          # Security analysis

# Optional but recommended
/docs                   # Update documentation
```

### Advanced Reviews (Use Task tool)

**TDD Workflow**:
```bash
# Use Task tool: tdd-workflows:tdd-orchestrator
# Specializes in: Red-Green-Refactor, test-first development
```

**Architecture Review**:
```bash
# Use Task tool: comprehensive-review:architect-review
# Specializes in: System design, patterns, DDD compliance
```

**Security Audit**:
```bash
# Use Task tool: comprehensive-review:security-auditor
# Specializes in: OWASP, auth/authz, compliance (GDPR, SOC2)
```

**Performance Review**:
```bash
# Use Task tool: performance-testing-review:performance-engineer
# Specializes in: Load testing, bottleneck identification, caching
```

---

## Compounding Engineering (Quality Improvement)

### When to Use
- Complex refactoring
- Architecture decisions
- Learning from completed work
- Quality improvement cycles
- Best practices research

### Plugin (1 plugin, 17 agents)
- compounding-engineering

### Specialized Agents

**Architecture & Design**:
- **architecture-strategist** - Architecture review and guidance
- **pattern-recognition-specialist** - Detect patterns and anti-patterns
- **best-practices-researcher** - Research industry best practices

**Code Quality (Language-Specific)**:
- **kieran-python-reviewer** - Python code quality (strict standards)
- **kieran-typescript-reviewer** - TypeScript code quality (strict standards)
- **dhh-rails-reviewer** - Rails code quality (if Rails services)

**Performance & Security**:
- **performance-oracle** - Performance optimization strategies
- **security-sentinel** - Security audit and threat modeling
- **data-integrity-guardian** - Data validation and integrity

**Best Practices & Research**:
- **code-simplicity-reviewer** - Find simplification opportunities
- **framework-docs-researcher** - Research framework documentation
- **best-practices-researcher** - Industry standard patterns

**Learning & Improvement**:
- **feedback-codifier** - Capture feedback patterns for future
- **git-history-analyzer** - Historical context and evolution
- **pr-comment-resolver** - PR comment resolution workflow
- **repo-research-analyst** - Repository structure analysis

**Documentation**:
- **every-style-editor** - Every.to style guide compliance

### Example Workflow

**Refactoring with Compounding Cycle**:
```markdown
1. Plan Phase
   Use Task tool: compounding-engineering:architecture-strategist
   - Analyze current architecture
   - Identify improvement opportunities
   - Create detailed plan

   Use Task tool: compounding-engineering:pattern-recognition-specialist
   - Detect anti-patterns
   - Find code smells
   - Suggest patterns

2. Delegate Phase
   (Implement changes)

3. Assess Phase
   Use Task tool: compounding-engineering:kieran-typescript-reviewer
   - Strict TypeScript quality review
   - Check naming, simplicity
   - Verify patterns

   Use Task tool: compounding-engineering:performance-oracle
   - Performance analysis
   - Caching opportunities
   - Bottleneck identification

   Use Task tool: compounding-engineering:security-sentinel
   - Security audit
   - Threat modeling
   - Vulnerability assessment

4. Codify Phase
   Use Task tool: compounding-engineering:feedback-codifier
   - Capture learnings
   - Update knowledge base
   - Document patterns for reuse
```

---

## Python Development

### When to Use
- FastAPI services
- Data processing scripts
- ML model training
- Background jobs
- ETL pipelines

### Plugins (3 total, 7 agents)
- python-development
- data-engineering
- llm-application-dev

### How to Use

**Python Code Review**:
```bash
# Use Task tool: python-development:python-pro
# Specializes in: Python 3.12+, async, type hints, best practices
```

**FastAPI Development**:
```bash
# Use Task tool: python-development:fastapi-pro
# Specializes in: FastAPI, Pydantic V2, SQLAlchemy 2.0, async
```

**Django Development** (if using Django):
```bash
# Use Task tool: python-development:django-pro
# Specializes in: Django 5.x, DRF, Celery, async views
```

**Data Engineering**:
```bash
# Use Task tool: data-engineering:data-engineer
# Specializes in: ETL pipelines, data warehouses, Spark, Airflow
```

---

## Security

### When to Use
- Before PR (always)
- After implementing auth/authz
- When handling sensitive data
- Regular security audits
- Compliance validation

### Plugins (3 total, 6 agents)
- security-scanning
- backend-api-security
- security-compliance

### How to Use

**Quick Security Scan** (Required):
```bash
/security-scan           # SAST analysis, dependency scanning
```

**API Security Implementation**:
```bash
# Use Task tool: backend-api-security:backend-security-coder
# Specializes in: Input validation, authentication, API security
```

**Compliance Validation**:
```bash
# Use Task tool: security-compliance:security-auditor
# Specializes in: GDPR, HIPAA, SOC2, security policies
```

**Deep Security Audit** (Compounding):
```bash
# Use Task tool: compounding-engineering:security-sentinel
# Specializes in: Threat modeling, vulnerability assessment, OWASP
```

---

## Infrastructure & DevOps

### When to Use
- CI/CD pipeline setup
- Docker configuration
- Kubernetes deployment
- Terraform infrastructure
- Cloud architecture

### Plugins (4 total, 16 agents)
- deployment-strategies
- cicd-automation
- cloud-infrastructure
- observability-monitoring

### How to Use

**CI/CD Setup**:
```bash
# Use Task tool: cicd-automation:deployment-engineer
# Specializes in: GitHub Actions, ArgoCD, GitOps, security scanning
```

**Terraform Infrastructure**:
```bash
# Use Task tool: cicd-automation:terraform-specialist
# Specializes in: Terraform/OpenTofu, state management, modules
```

**Kubernetes Architecture**:
```bash
# Use Task tool: cicd-automation:kubernetes-architect
# Specializes in: EKS/AKS/GKE, service mesh, GitOps, multi-tenancy
```

**Cloud Architecture**:
```bash
# Use Task tool: cloud-infrastructure:cloud-architect
# Specializes in: AWS/Azure/GCP, serverless, cost optimization
```

**Observability Setup**:
```bash
# Use Task tool: observability-monitoring:observability-engineer
# Specializes in: OpenTelemetry, monitoring, logging, tracing
```

---

## Debugging

### When to Use
- Test failures
- Production issues
- Unexpected behavior
- Performance problems
- Complex bugs

### Plugins (6 total, 11 agents)
- debugging-toolkit
- error-debugging
- error-diagnostics
- distributed-debugging
- application-performance
- database-cloud-optimization

### How to Use

**Quick Debugging**:
```bash
# Use Task tool: debugging-toolkit:debugger
# Specializes in: Errors, test failures, unexpected behavior
```

**Distributed System Debugging**:
```bash
# Use Task tool: distributed-debugging:devops-troubleshooter
# Specializes in: Kubernetes, logs, distributed tracing
```

**Error Pattern Analysis**:
```bash
# Use Task tool: error-debugging:error-detective
# Specializes in: Log analysis, error patterns, root cause
```

**Performance Issues**:
```bash
# Use Task tool: application-performance:performance-engineer
# Specializes in: Profiling, bottlenecks, Core Web Vitals
```

**Database Performance**:
```bash
# Use Task tool: database-cloud-optimization:database-optimizer
# Specializes in: Query optimization, indexing, N+1, caching
```

---

## Documentation

### When to Use
- Creating technical docs
- API documentation
- Architecture diagrams
- Onboarding guides
- README files

### Plugins (4 total, 9 agents)
- code-documentation
- documentation-generation
- team-collaboration
- git-pr-workflows

### How to Use

**Quick Documentation Update**:
```bash
/docs                    # Generate/update documentation
```

**Comprehensive Documentation**:
```bash
# Use Task tool: documentation-generation:docs-architect
# Specializes in: Technical manuals, architecture guides, deep-dives
```

**API Documentation**:
```bash
# Use Task tool: documentation-generation:api-documenter
# Specializes in: OpenAPI 3.1, interactive docs, SDK generation
```

**Diagrams**:
```bash
# Use Task tool: documentation-generation:mermaid-expert
# Specializes in: Flowcharts, sequences, ERDs, architectures
```

**Tutorials**:
```bash
# Use Task tool: documentation-generation:tutorial-engineer
# Specializes in: Step-by-step tutorials, onboarding guides
```

---

## Frontend Development

### When to Use
- React components
- Next.js pages
- Mobile apps (React Native, Flutter)
- Frontend optimization

### Plugins (2 total, 5 agents)
- frontend-mobile-development
- javascript-typescript

### How to Use

**React/Next.js Development**:
```bash
# Use Task tool: frontend-mobile-development:frontend-developer
# Specializes in: React 19, Next.js 15, TanStack Query, Radix UI
```

**Mobile Development**:
```bash
# Use Task tool: frontend-mobile-development:mobile-developer
# Specializes in: React Native, Flutter, offline sync, app stores
```

**JavaScript Optimization**:
```bash
# Use Task tool: javascript-typescript:javascript-pro
# Specializes in: ES6+, async patterns, Node.js APIs
```

**TypeScript Quality**:
```bash
# Use Task tool: javascript-typescript:typescript-pro
# Specializes in: Advanced types, generics, strict type safety
```

---

## Context Management (Critical!)

**Problem**: 200k token limit, MCP servers consume heavily

**Solution**: On-demand MCP enabling

### Default (Always On)
```bash
# Only sequential-thinking stays enabled (1.5k tokens)
```

### Enable on Demand with @servername
```bash
@postgres              # Database queries
@docker                # Container management
@playwright            # Browser automation
@github                # Repository operations
@serena                # Advanced code analysis
@context7              # Library documentation
@consult7              # Technical consultations
```

### Context Savings
- **Before**: All MCPs enabled = 111k tokens (55% of context!)
- **After**: On-demand = 1.5k tokens (0.7% of context)
- **Savings**: 98.6% reduction

### Best Practices
1. Only enable MCP when actively using it
2. Use `/explore` instead of manual file reading
3. Reference service CLAUDE.md instead of copying
4. Keep task files <500 lines
5. Use plugin subagents (separate context windows)

---

## Common Workflows

### New Feature (Backend)
```bash
1. /explore services/[name]              # Context gathering
2. Use backend-development:backend-architect # Architecture
3. Use database-design:database-architect    # Schema
4. (Implement feature)
5. /test                                     # Run tests
6. /review                                   # Code review
7. /security-scan                            # Security
8. /docs                                     # Documentation
```

### Bug Fix
```bash
1. Use debugging-toolkit:debugger            # Analyze bug
2. (Fix implementation)
3. /test                                     # Verify fix
4. /review                                   # Code review
```

### Refactoring
```bash
1. Use compounding-engineering:architecture-strategist  # Plan
2. Use compounding-engineering:pattern-recognition-specialist # Patterns
3. (Implement changes)
4. Use compounding-engineering:kieran-typescript-reviewer # Quality
5. Use compounding-engineering:performance-oracle # Performance
6. Use compounding-engineering:feedback-codifier # Learn
```

### Database Migration
```bash
1. Use database-design:database-architect    # Design
2. Use database-migrations:database-admin    # Migration strategy
3. (Create migration)
4. Use database-migrations:database-optimizer # Performance
5. /test                                     # Test migration
```

---

## Tips & Tricks

### 1. Use /explore Liberally
- Fast (Haiku 4.5 - 2x faster)
- Cheap (1/3 the cost)
- Separate context window
- Comprehensive analysis

### 2. Chain Agents for Complex Work
```markdown
1. Use architecture-strategist (plan)
2. Use backend-architect (design)
3. Use database-architect (schema)
4. (Implement)
5. Use kieran-typescript-reviewer (quality)
6. Use performance-oracle (optimize)
7. Use feedback-codifier (learn)
```

### 3. Quality Gates Before PR
Always run this sequence:
```bash
/review
/security-scan
/test
```

### 4. Compounding Cycle for Learning
After completing complex work:
```markdown
1. What worked well?
2. What could be simplified?
3. What patterns emerged?
4. What should be automated?
5. Update knowledge base
```

### 5. Context Optimization
- Reference > Embed
- /explore > Manual reading
- MCP on-demand > Pre-enable all
- Task files <500 lines

---

## Plugin Availability Matrix

| Plugin Category | Plugins | Agents | Slash Commands | Task Tool |
|-----------------|---------|--------|----------------|-----------|
| Orchestration | 5 | 5 | - | ✅ |
| Backend Dev | 10 | 18 | - | ✅ |
| Quality | 7 | 14 | `/review`, `/test` | ✅ |
| Security | 3 | 6 | `/security-scan` | ✅ |
| Infrastructure | 4 | 16 | - | ✅ |
| Debugging | 6 | 11 | - | ✅ |
| Documentation | 4 | 9 | `/docs` | ✅ |
| Specialized | 3 | 11 | - | ✅ |
| Compounding | 1 | 17 | - | ✅ |

**Total**: 41 plugins, 107 agents, 3 slash commands

---

## Further Reading

- **Agent Catalog**: `sessions/knowledge/vextrus-erp/agent-catalog.md` (107 agents)
- **Workflow Patterns**: `sessions/knowledge/vextrus-erp/workflow-patterns.md`
- **Context Optimization**: `sessions/knowledge/vextrus-erp/context-optimization-tips.md`
- **Quality Gates**: `sessions/knowledge/vextrus-erp/quality-gates-checklist.md`
- **Official CC Docs**: `sessions/knowledge/claude-code/`

---

**Last Updated**: 2025-10-16
**Status**: Phase 2 - Knowledge Base Expansion
**Philosophy**: Plugin-first, compounding quality, context-optimized
