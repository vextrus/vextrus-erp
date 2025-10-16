# Vextrus ERP Agent Catalog

**Purpose**: Complete catalog of 107 available agents from 41 installed plugins
**Context**: Vextrus ERP development with 18 microservices
**Last Updated**: 2025-10-16

---

## Quick Stats

- **Total Agents**: 107
- **Total Plugins**: 41
- **Categories**: 11

---

## How to Use This Catalog

Each agent entry includes:
- **Name**: Agent identifier for Task tool
- **Plugin**: Source plugin
- **Specialization**: What the agent excels at
- **When to Use**: Specific scenarios
- **Invoke**: How to call with Task tool

**Example Usage**:
```bash
# Use Task tool with subagent_type parameter
Task tool: backend-development:backend-architect
Task tool: compounding-engineering:kieran-typescript-reviewer
```

---

## Category 1: Backend Development (18 agents)

### Plugin: backend-development

#### 1. backend-architect
- **Specialization**: Scalable API design, microservices architecture, distributed systems
- **When to Use**:
  - Designing new microservices
  - Planning service boundaries
  - Reviewing system architecture
  - GraphQL Federation design
  - Event-driven architecture
- **Key Capabilities**: REST/GraphQL/gRPC APIs, service mesh patterns, inter-service communication, resilience patterns, observability
- **Invoke**: `backend-development:backend-architect`

#### 2. graphql-architect
- **Specialization**: GraphQL federation, performance optimization, enterprise security
- **When to Use**:
  - Designing GraphQL schemas
  - Federation setup across services
  - Query optimization
  - Real-time subscription design
- **Key Capabilities**: Schema design, federation patterns, advanced caching, resolver optimization
- **Invoke**: `backend-development:graphql-architect`

#### 3. tdd-orchestrator
- **Specialization**: Test-driven development, red-green-refactor, multi-agent coordination
- **When to Use**:
  - Starting TDD workflow
  - Complex test scenarios
  - Test strategy planning
- **Key Capabilities**: TDD discipline enforcement, test automation, AI-assisted testing
- **Invoke**: `backend-development:tdd-orchestrator`

### Plugin: api-scaffolding

#### 4. backend-architect (api-scaffolding)
- **Specialization**: API scaffolding and initial structure
- **When to Use**: Creating new API endpoints from scratch
- **Invoke**: `api-scaffolding:backend-architect`

#### 5. django-pro
- **Specialization**: Django 5.x, async views, DRF, Celery, Django Channels
- **When to Use**: Django service implementation (if using Django)
- **Key Capabilities**: Django ORM optimization, DRF APIs, background tasks
- **Invoke**: `api-scaffolding:django-pro`

#### 6. fastapi-pro
- **Specialization**: High-performance async APIs with FastAPI, SQLAlchemy 2.0, Pydantic V2
- **When to Use**: FastAPI service implementation, async optimization
- **Key Capabilities**: WebSockets, microservices patterns, modern Python async
- **Invoke**: `api-scaffolding:fastapi-pro`

#### 7. graphql-architect (api-scaffolding)
- **Specialization**: GraphQL API scaffolding
- **When to Use**: Initial GraphQL schema creation
- **Invoke**: `api-scaffolding:graphql-architect`

### Plugin: database-design

#### 8. database-architect
- **Specialization**: Data layer design, technology selection, schema modeling
- **When to Use**:
  - Designing database schema
  - Choosing SQL/NoSQL/TimeSeries DB
  - Planning migrations
  - Re-architecting data layer
- **Key Capabilities**: Normalization, performance-first design, migration planning
- **Invoke**: `database-design:database-architect`

#### 9. sql-pro
- **Specialization**: Modern SQL, cloud-native databases, OLTP/OLAP optimization
- **When to Use**:
  - Complex query optimization
  - Performance tuning
  - Data modeling
- **Key Capabilities**: Query performance, indexing strategies, hybrid analytical systems
- **Invoke**: `database-design:sql-pro`

### Plugin: database-migrations

#### 10. database-admin
- **Specialization**: Cloud databases, automation, reliability engineering
- **When to Use**:
  - Database operations
  - High availability setup
  - Disaster recovery planning
- **Key Capabilities**: AWS/Azure/GCP databases, IaC, multi-cloud strategies
- **Invoke**: `database-migrations:database-admin`

#### 11. database-optimizer
- **Specialization**: Performance tuning, query optimization, scalable architectures
- **When to Use**:
  - Slow queries
  - N+1 problems
  - Caching strategies
  - Partitioning
- **Key Capabilities**: Advanced indexing, multi-tier caching, cloud database optimization
- **Invoke**: `database-migrations:database-optimizer`

### Plugin: backend-api-security

#### 12. backend-architect (security)
- **Specialization**: Secure API architecture
- **When to Use**: Security-critical API design
- **Invoke**: `backend-api-security:backend-architect`

#### 13. backend-security-coder
- **Specialization**: Secure backend coding, input validation, authentication, API security
- **When to Use**:
  - Implementing auth/authz
  - Input validation
  - API security hardening
- **Key Capabilities**: OWASP best practices, secure coding patterns
- **Invoke**: `backend-api-security:backend-security-coder`

### Plugin: data-validation-suite

#### 14. backend-security-coder (validation)
- **Specialization**: Data validation security
- **When to Use**: Complex validation logic implementation
- **Invoke**: `data-validation-suite:backend-security-coder`

### Plugin: data-engineering

#### 15. backend-architect (data)
- **Specialization**: Data engineering architecture
- **When to Use**: Data pipeline design
- **Invoke**: `data-engineering:backend-architect`

#### 16. data-engineer
- **Specialization**: Scalable data pipelines, modern data warehouses, streaming architectures
- **When to Use**:
  - ETL pipeline design
  - Data warehouse setup
  - Real-time streaming
- **Key Capabilities**: Apache Spark, dbt, Airflow, cloud-native data platforms
- **Invoke**: `data-engineering:data-engineer`

### Plugin: api-testing-observability

#### 17. api-documenter
- **Specialization**: API documentation, OpenAPI 3.1, developer experience
- **When to Use**:
  - Creating API docs
  - Developer portal setup
  - SDK generation
- **Key Capabilities**: Interactive docs, OpenAPI specs, DX optimization
- **Invoke**: `api-testing-observability:api-documenter`

### Plugin: python-development

#### 18. python-pro
- **Specialization**: Python 3.12+, async programming, performance optimization
- **When to Use**:
  - Python service development
  - Async pattern implementation
  - Python optimization
- **Key Capabilities**: Modern Python features, uv, ruff, pydantic, FastAPI
- **Invoke**: `python-development:python-pro`

---

## Category 2: Quality & Testing (14 agents)

### Plugin: code-review-ai

#### 19. code-reviewer
- **Specialization**: AI-powered code analysis, security vulnerabilities, performance optimization
- **When to Use**: Pre-PR code review (always)
- **Key Capabilities**: Static analysis, security scanning, production reliability checks
- **Invoke**: `code-review-ai:code-reviewer`
- **Slash Command**: `/review`

### Plugin: unit-testing

#### 20. debugger
- **Specialization**: Test failure debugging
- **When to Use**: Test failures, unexpected test behavior
- **Invoke**: `unit-testing:debugger`

#### 21. test-automator
- **Specialization**: AI-powered test automation, self-healing tests, quality engineering
- **When to Use**:
  - Test automation setup
  - CI/CD test integration
  - Quality assurance strategy
- **Key Capabilities**: Modern frameworks, scalable testing, AI-assisted testing
- **Invoke**: `unit-testing:test-automator`
- **Slash Command**: `/test`

### Plugin: tdd-workflows

#### 22. code-reviewer (tdd)
- **Specialization**: TDD-focused code review
- **When to Use**: TDD workflow validation
- **Invoke**: `tdd-workflows:code-reviewer`

#### 23. tdd-orchestrator (tdd-workflows)
- **Specialization**: TDD orchestration and governance
- **When to Use**: TDD implementation, team coordination
- **Invoke**: `tdd-workflows:tdd-orchestrator`

### Plugin: performance-testing-review

#### 24. performance-engineer
- **Specialization**: Observability, application optimization, scalable system performance
- **When to Use**:
  - Performance bottlenecks
  - Load testing
  - Caching strategies
- **Key Capabilities**: OpenTelemetry, distributed tracing, Core Web Vitals, monitoring
- **Invoke**: `performance-testing-review:performance-engineer`

#### 25. test-automator (performance)
- **Specialization**: Performance test automation
- **When to Use**: Automated performance testing
- **Invoke**: `performance-testing-review:test-automator`

### Plugin: comprehensive-review

#### 26. architect-review
- **Specialization**: Architecture patterns, clean architecture, microservices, DDD
- **When to Use**:
  - Architecture decisions
  - Design pattern validation
  - System design reviews
- **Key Capabilities**: Modern patterns, event-driven systems, scalability, maintainability
- **Invoke**: `comprehensive-review:architect-review`

#### 27. code-reviewer (comprehensive)
- **Specialization**: Comprehensive code quality review
- **When to Use**: Deep code analysis
- **Invoke**: `comprehensive-review:code-reviewer`

#### 28. security-auditor
- **Specialization**: DevSecOps, cybersecurity, compliance frameworks
- **When to Use**:
  - Security audits
  - Compliance validation (GDPR, HIPAA, SOC2)
  - Threat modeling
- **Key Capabilities**: Vulnerability assessment, OAuth2/OIDC, OWASP, cloud security
- **Invoke**: `comprehensive-review:security-auditor`

### Plugin: code-refactoring

#### 29. code-reviewer (refactoring)
- **Specialization**: Refactoring quality assurance
- **When to Use**: Post-refactoring validation
- **Invoke**: `code-refactoring:code-reviewer`

#### 30. legacy-modernizer
- **Specialization**: Legacy code refactoring, framework migration, technical debt
- **When to Use**:
  - Legacy system updates
  - Framework migrations
  - Technical debt reduction
- **Key Capabilities**: Gradual modernization, dependency updates, backward compatibility
- **Invoke**: `code-refactoring:legacy-modernizer`

### Plugin: dependency-management

#### 31. legacy-modernizer (dependencies)
- **Specialization**: Dependency modernization
- **When to Use**: Dependency updates, package upgrades
- **Invoke**: `dependency-management:legacy-modernizer`

### Plugin: code-documentation

#### 32. code-reviewer (documentation)
- **Specialization**: Documentation quality review
- **When to Use**: Documentation validation
- **Invoke**: `code-documentation:code-reviewer`

---

## Category 3: Security (6 agents)

### Plugin: security-scanning

#### 33. security-auditor (scanning)
- **Specialization**: SAST analysis, dependency scanning
- **When to Use**: Pre-PR security scan (required)
- **Invoke**: `security-scanning:security-auditor`
- **Slash Command**: `/security-scan`

### Plugin: backend-api-security

#### 34. backend-security-coder (see Category 1, #13)

### Plugin: security-compliance

#### 35. security-auditor (compliance)
- **Specialization**: Compliance frameworks, security policies
- **When to Use**: Compliance validation (GDPR, HIPAA, SOC2)
- **Invoke**: `security-compliance:security-auditor`

### Plugin: full-stack-orchestration

#### 36. security-auditor (full-stack)
- **Specialization**: Full-stack security orchestration
- **When to Use**: End-to-end security review
- **Invoke**: `full-stack-orchestration:security-auditor`

### Plugin: comprehensive-review

#### 37. security-auditor (comprehensive - see Category 2, #28)

### Plugin: application-performance

#### 38. security-auditor (performance)
- **Specialization**: Security in performance optimization
- **When to Use**: Secure performance tuning
- **Invoke**: `application-performance:security-auditor`

---

## Category 4: Infrastructure & DevOps (16 agents)

### Plugin: deployment-strategies

#### 39. deployment-engineer
- **Specialization**: CI/CD pipelines, GitOps workflows, deployment automation
- **When to Use**:
  - CI/CD setup
  - GitOps implementation
  - Zero-downtime deployments
- **Key Capabilities**: GitHub Actions, ArgoCD/Flux, progressive delivery, platform engineering
- **Invoke**: `deployment-strategies:deployment-engineer`

#### 40. terraform-specialist
- **Specialization**: Terraform/OpenTofu, IaC automation, state management
- **When to Use**:
  - Infrastructure as code
  - Terraform module design
  - Multi-cloud deployments
- **Key Capabilities**: Advanced IaC, policy as code, CI/CD integration
- **Invoke**: `deployment-strategies:terraform-specialist`

### Plugin: cicd-automation

#### 41. cloud-architect
- **Specialization**: AWS/Azure/GCP multi-cloud, IaC, FinOps cost optimization
- **When to Use**:
  - Cloud architecture design
  - Cost optimization
  - Migration planning
- **Key Capabilities**: Serverless, microservices, security, compliance, disaster recovery
- **Invoke**: `cicd-automation:cloud-architect`

#### 42. deployment-engineer (cicd)
- **Specialization**: CI/CD automation
- **When to Use**: Pipeline automation
- **Invoke**: `cicd-automation:deployment-engineer`

#### 43. devops-troubleshooter
- **Specialization**: Incident response, debugging, observability
- **When to Use**:
  - Production issues
  - System debugging
  - Root cause analysis
- **Key Capabilities**: Log analysis, distributed tracing, Kubernetes debugging
- **Invoke**: `cicd-automation:devops-troubleshooter`

#### 44. kubernetes-architect
- **Specialization**: Cloud-native infrastructure, GitOps, container orchestration
- **When to Use**:
  - Kubernetes architecture
  - Service mesh design
  - Multi-tenancy setup
- **Key Capabilities**: EKS/AKS/GKE, Istio/Linkerd, platform engineering
- **Invoke**: `cicd-automation:kubernetes-architect`

#### 45. terraform-specialist (cicd)
- **Specialization**: IaC in CI/CD
- **When to Use**: Automated infrastructure provisioning
- **Invoke**: `cicd-automation:terraform-specialist`

### Plugin: cloud-infrastructure

#### 46. cloud-architect (cloud-infra)
- **Specialization**: Cloud infrastructure design
- **When to Use**: Cloud platform setup
- **Invoke**: `cloud-infrastructure:cloud-architect`

#### 47. deployment-engineer (cloud-infra)
- **Specialization**: Cloud deployment
- **When to Use**: Cloud-based deployments
- **Invoke**: `cloud-infrastructure:deployment-engineer`

#### 48. hybrid-cloud-architect
- **Specialization**: Multi-cloud solutions, hybrid connectivity, edge computing
- **When to Use**:
  - Hybrid cloud architecture
  - Multi-cloud strategy
  - Complex infrastructure integration
- **Key Capabilities**: OpenStack/VMware, cross-cloud automation, compliance
- **Invoke**: `cloud-infrastructure:hybrid-cloud-architect`

#### 49. kubernetes-architect (cloud-infra)
- **Specialization**: Cloud Kubernetes
- **When to Use**: Managed Kubernetes setup
- **Invoke**: `cloud-infrastructure:kubernetes-architect`

#### 50. network-engineer
- **Specialization**: Cloud networking, security architectures, performance optimization
- **When to Use**:
  - Network design
  - Connectivity issues
  - Performance optimization
- **Key Capabilities**: Multi-cloud connectivity, service mesh, zero-trust, SSL/TLS
- **Invoke**: `cloud-infrastructure:network-engineer`

#### 51. terraform-specialist (cloud-infra)
- **Specialization**: Cloud IaC
- **When to Use**: Cloud infrastructure as code
- **Invoke**: `cloud-infrastructure:terraform-specialist`

### Plugin: observability-monitoring

#### 52. database-optimizer (observability)
- **Specialization**: Database performance monitoring
- **When to Use**: Database observability
- **Invoke**: `observability-monitoring:database-optimizer`

#### 53. network-engineer (observability)
- **Specialization**: Network monitoring
- **When to Use**: Network observability
- **Invoke**: `observability-monitoring:network-engineer`

#### 54. observability-engineer
- **Specialization**: Production monitoring, logging, tracing systems
- **When to Use**:
  - Monitoring infrastructure
  - SLI/SLO management
  - Incident response workflows
- **Key Capabilities**: Comprehensive observability, alerting, dashboards
- **Invoke**: `observability-monitoring:observability-engineer`

#### 55. performance-engineer (observability)
- **Specialization**: Performance monitoring
- **When to Use**: Performance observability setup
- **Invoke**: `observability-monitoring:performance-engineer`

---

## Category 5: Debugging (11 agents)

### Plugin: debugging-toolkit

#### 56. debugger
- **Specialization**: General debugging, test failures, unexpected behavior
- **When to Use**: Any debugging task (first choice)
- **Key Capabilities**: Error analysis, stack trace investigation, behavior debugging
- **Invoke**: `debugging-toolkit:debugger`

#### 57. dx-optimizer
- **Specialization**: Developer experience, tooling, workflows
- **When to Use**:
  - Setting up new projects
  - Developer friction issues
  - Workflow improvements
- **Key Capabilities**: Tooling optimization, setup automation, workflow enhancement
- **Invoke**: `debugging-toolkit:dx-optimizer`

### Plugin: error-debugging

#### 58. debugger (error)
- **Specialization**: Error-specific debugging
- **When to Use**: Error messages, exceptions
- **Invoke**: `error-debugging:debugger`

#### 59. error-detective
- **Specialization**: Log analysis, error patterns, root cause analysis
- **When to Use**:
  - Log investigation
  - Error pattern detection
  - Root cause analysis
- **Key Capabilities**: Log correlation, stack trace analysis, system-wide error tracking
- **Invoke**: `error-debugging:error-detective`

### Plugin: error-diagnostics

#### 60. debugger (diagnostics)
- **Specialization**: Diagnostic debugging
- **When to Use**: Diagnostic investigation
- **Invoke**: `error-diagnostics:debugger`

#### 61. error-detective (diagnostics)
- **Specialization**: Diagnostic error detection
- **When to Use**: Complex error diagnostics
- **Invoke**: `error-diagnostics:error-detective`

### Plugin: distributed-debugging

#### 62. devops-troubleshooter (distributed)
- **Specialization**: Distributed system debugging
- **When to Use**: Microservices debugging
- **Invoke**: `distributed-debugging:devops-troubleshooter`

#### 63. error-detective (distributed)
- **Specialization**: Distributed error tracking
- **When to Use**: Cross-service error investigation
- **Invoke**: `distributed-debugging:error-detective`

### Plugin: application-performance

#### 64. frontend-developer
- **Specialization**: Frontend performance debugging
- **When to Use**: Client-side performance issues
- **Invoke**: `application-performance:frontend-developer`

#### 65. observability-engineer (performance)
- **Specialization**: Performance observability
- **When to Use**: Performance monitoring setup
- **Invoke**: `application-performance:observability-engineer`

#### 66. performance-engineer (application)
- **Specialization**: Application performance optimization
- **When to Use**: Performance bottlenecks, profiling
- **Invoke**: `application-performance:performance-engineer`

### Plugin: database-cloud-optimization

#### 67. database-optimizer (cloud)
- **Specialization**: Cloud database performance
- **When to Use**: Cloud database optimization
- **Invoke**: `database-cloud-optimization:database-optimizer`

---

## Category 6: Documentation (9 agents)

### Plugin: code-documentation

#### 68. docs-architect
- **Specialization**: Technical documentation, architecture guides, technical manuals
- **When to Use**:
  - System documentation
  - Architecture guides
  - Technical deep-dives
- **Key Capabilities**: Long-form documentation, comprehensive manuals, ebooks
- **Invoke**: `code-documentation:docs-architect`

#### 69. tutorial-engineer
- **Specialization**: Step-by-step tutorials, educational content
- **When to Use**:
  - Onboarding guides
  - Feature tutorials
  - Concept explanations
- **Key Capabilities**: Progressive learning experiences, hands-on examples
- **Invoke**: `code-documentation:tutorial-engineer`

### Plugin: documentation-generation

#### 70. api-documenter (docs-gen)
- **Specialization**: API documentation generation
- **When to Use**: API docs creation
- **Invoke**: `documentation-generation:api-documenter`
- **Slash Command**: `/docs`

#### 71. docs-architect (docs-gen)
- **Specialization**: Documentation architecture
- **When to Use**: Documentation structure design
- **Invoke**: `documentation-generation:docs-architect`

#### 72. mermaid-expert
- **Specialization**: Mermaid diagrams - flowcharts, sequences, ERDs, architectures
- **When to Use**:
  - Visual documentation
  - System diagrams
  - Process flows
- **Key Capabilities**: All Mermaid diagram types, styling
- **Invoke**: `documentation-generation:mermaid-expert`

#### 73. reference-builder
- **Specialization**: Technical references, API documentation
- **When to Use**:
  - API reference docs
  - Configuration guides
  - Complete technical specifications
- **Key Capabilities**: Exhaustive parameter listings, searchable references
- **Invoke**: `documentation-generation:reference-builder`

#### 74. tutorial-engineer (docs-gen)
- **Specialization**: Tutorial generation
- **When to Use**: Tutorial creation
- **Invoke**: `documentation-generation:tutorial-engineer`

### Plugin: team-collaboration

#### 75. dx-optimizer (collaboration)
- **Specialization**: Team workflow optimization
- **When to Use**: Team collaboration improvements
- **Invoke**: `team-collaboration:dx-optimizer`

### Plugin: git-pr-workflows

#### 76. code-reviewer (git-pr)
- **Specialization**: PR code review
- **When to Use**: Pull request review
- **Invoke**: `git-pr-workflows:code-reviewer`

---

## Category 7: Frontend Development (5 agents)

### Plugin: frontend-mobile-development

#### 77. frontend-developer
- **Specialization**: React components, responsive layouts, client-side state
- **When to Use**:
  - React/Next.js development
  - Frontend optimization
  - UI component creation
- **Key Capabilities**: React 19, Next.js 15, TanStack Query, Radix UI, accessibility
- **Invoke**: `frontend-mobile-development:frontend-developer`

#### 78. mobile-developer
- **Specialization**: React Native, Flutter, native mobile apps
- **When to Use**:
  - Mobile app development
  - Cross-platform code
  - App optimization
- **Key Capabilities**: Native integrations, offline sync, app store optimization
- **Invoke**: `frontend-mobile-development:mobile-developer`

### Plugin: javascript-typescript

#### 79. javascript-pro
- **Specialization**: Modern JavaScript, ES6+, async patterns, Node.js APIs
- **When to Use**:
  - JavaScript optimization
  - Async debugging
  - Complex JS patterns
- **Key Capabilities**: Promises, event loops, browser/Node compatibility
- **Invoke**: `javascript-typescript:javascript-pro`

#### 80. typescript-pro
- **Specialization**: TypeScript, advanced types, generics, strict type safety
- **When to Use**:
  - TypeScript architecture
  - Type inference optimization
  - Advanced typing patterns
- **Key Capabilities**: Complex type systems, decorators, enterprise patterns
- **Invoke**: `javascript-typescript:typescript-pro`

### Plugin: application-performance

#### 81. frontend-developer (performance - see Category 5, #64)

---

## Category 8: Compounding Engineering (17 agents)

**Plugin**: compounding-engineering

**Philosophy**: Each unit of engineering work makes subsequent work easier through learning capture and systematic improvement.

### Architecture & Design

#### 82. architecture-strategist
- **Specialization**: Architecture review, strategic guidance, design decisions
- **When to Use**:
  - Analyzing code changes from architectural perspective
  - Evaluating system design decisions
  - Reviewing PRs for architectural compliance
- **Key Capabilities**: System design validation, component boundaries, pattern enforcement
- **Invoke**: `compounding-engineering:architecture-strategist`

#### 83. pattern-recognition-specialist
- **Specialization**: Design patterns, anti-patterns, code smells
- **When to Use**:
  - Code quality analysis
  - Detecting anti-patterns
  - Ensuring consistency
- **Key Capabilities**: Pattern detection, code smell identification, architecture analysis
- **Invoke**: `compounding-engineering:pattern-recognition-specialist`

#### 84. best-practices-researcher
- **Specialization**: External best practices research, documentation gathering
- **When to Use**:
  - Researching technology best practices
  - Finding official documentation
  - Community standards research
- **Key Capabilities**: Documentation synthesis, example gathering, industry standards
- **Invoke**: `compounding-engineering:best-practices-researcher`

### Code Quality (Language-Specific)

#### 85. kieran-python-reviewer
- **Specialization**: Python code quality with extremely high standards
- **When to Use**: After implementing Python features or services
- **Key Capabilities**: Kieran's strict Python conventions, quality checks
- **Invoke**: `compounding-engineering:kieran-python-reviewer`

#### 86. kieran-typescript-reviewer
- **Specialization**: TypeScript code quality with extremely high standards
- **When to Use**: After implementing TypeScript features
- **Key Capabilities**: Kieran's strict TypeScript conventions, naming, simplicity
- **Invoke**: `compounding-engineering:kieran-typescript-reviewer`

#### 87. kieran-rails-reviewer
- **Specialization**: Rails code quality (if using Rails services)
- **When to Use**: Rails code review
- **Invoke**: `compounding-engineering:kieran-rails-reviewer`

#### 88. dhh-rails-reviewer
- **Specialization**: Brutally honest Rails review from DHH perspective
- **When to Use**: Rails anti-pattern detection, convention validation
- **Invoke**: `compounding-engineering:dhh-rails-reviewer`

### Performance & Security

#### 89. performance-oracle
- **Specialization**: Performance analysis, optimization strategies
- **When to Use**:
  - After implementing features
  - Performance concerns
  - Scalability analysis
- **Key Capabilities**: Algorithm optimization, bottleneck identification, caching
- **Invoke**: `compounding-engineering:performance-oracle`

#### 90. security-sentinel
- **Specialization**: Security audit, vulnerability assessment, threat modeling
- **When to Use**:
  - Security reviews
  - Threat modeling
  - Vulnerability assessment
- **Key Capabilities**: OWASP compliance, security patterns, defensive coding
- **Invoke**: `compounding-engineering:security-sentinel`

#### 91. data-integrity-guardian
- **Specialization**: Database migrations, data models, data validation
- **When to Use**:
  - Reviewing migrations
  - Data model changes
  - Data manipulation code
- **Key Capabilities**: Migration safety, referential integrity, privacy requirements
- **Invoke**: `compounding-engineering:data-integrity-guardian`

### Simplicity & Research

#### 92. code-simplicity-reviewer
- **Specialization**: Simplification opportunities, YAGNI principles
- **When to Use**: After implementation (final review pass)
- **Key Capabilities**: Complexity reduction, unnecessary abstraction removal
- **Invoke**: `compounding-engineering:code-simplicity-reviewer`

#### 93. framework-docs-researcher
- **Specialization**: Framework documentation, library research
- **When to Use**:
  - Understanding framework features
  - Troubleshooting library issues
  - Best practice discovery
- **Key Capabilities**: Documentation gathering, source code exploration, pattern identification
- **Invoke**: `compounding-engineering:framework-docs-researcher`

### Learning & Improvement

#### 94. feedback-codifier
- **Specialization**: Analyzing and codifying feedback patterns from reviews
- **When to Use**: After detailed code reviews to capture insights
- **Key Capabilities**: Pattern extraction, knowledge capture, reviewer configuration
- **Invoke**: `compounding-engineering:feedback-codifier`

#### 95. git-history-analyzer
- **Specialization**: Historical context, code evolution, contributor analysis
- **When to Use**:
  - Understanding code history
  - Tracing pattern origins
  - Identifying expertise areas
- **Key Capabilities**: Git archaeology, evolution analysis, pattern tracking
- **Invoke**: `compounding-engineering:git-history-analyzer`

#### 96. pr-comment-resolver
- **Specialization**: PR comment resolution workflow
- **When to Use**: Addressing PR review comments systematically
- **Key Capabilities**: Comment implementation, resolution reporting
- **Invoke**: `compounding-engineering:pr-comment-resolver`

#### 97. repo-research-analyst
- **Specialization**: Repository structure analysis, documentation research
- **When to Use**:
  - Understanding new repositories
  - Analyzing project conventions
  - Studying contribution guidelines
- **Key Capabilities**: Architecture analysis, pattern extraction, convention discovery
- **Invoke**: `compounding-engineering:repo-research-analyst`

### Documentation Style

#### 98. every-style-editor
- **Specialization**: Every.to style guide compliance
- **When to Use**: Editing content for Every.to standards
- **Key Capabilities**: Title case, sentence case, company usage, style enforcement
- **Invoke**: `compounding-engineering:every-style-editor`

---

## Category 9: Orchestration (5 agents)

### Plugin: full-stack-orchestration

#### 99. deployment-engineer (full-stack)
- **Specialization**: Full-stack deployment orchestration
- **When to Use**: End-to-end deployment coordination
- **Invoke**: `full-stack-orchestration:deployment-engineer`

#### 100. performance-engineer (full-stack)
- **Specialization**: Full-stack performance orchestration
- **When to Use**: System-wide performance optimization
- **Invoke**: `full-stack-orchestration:performance-engineer`

#### 101. security-auditor (full-stack - see Category 3, #36)

#### 102. test-automator (full-stack)
- **Specialization**: Full-stack test orchestration
- **When to Use**: System-wide test automation
- **Invoke**: `full-stack-orchestration:test-automator`

### Plugin: agent-orchestration

#### 103. context-manager
- **Specialization**: AI context engineering, dynamic context management
- **When to Use**:
  - Complex AI orchestration
  - Multi-agent workflows
  - Long-running projects
- **Key Capabilities**: Vector databases, knowledge graphs, intelligent memory systems
- **Invoke**: `agent-orchestration:context-manager`

### Plugin: context-management

#### 104. context-manager (context-mgmt)
- **Specialization**: Context optimization
- **When to Use**: Context management strategy
- **Invoke**: `context-management:context-manager`

### Plugin: workflow-orchestrator

#### 105. workflow-coordinator
- **Specialization**: Complex workflow orchestration
- **When to Use**: Multi-step workflow coordination
- **Invoke**: `workflow-orchestrator:workflow-coordinator`

### Plugin: project-health-auditor

#### 106. reviewer
- **Specialization**: Code health review, refactor suggestions based on metrics
- **When to Use**: Project health assessment
- **Invoke**: `project-health-auditor:reviewer`
- **Slash Command**: `/project-health-auditor:analyze`

---

## Category 10: Specialized (2 agents)

### Plugin: llm-application-dev

#### 107. ai-engineer
- **Specialization**: Production LLM applications, RAG systems, intelligent agents
- **When to Use**:
  - Building AI features
  - Chatbot development
  - Agent orchestration
- **Key Capabilities**: Vector search, multimodal AI, enterprise AI integrations
- **Invoke**: `llm-application-dev:ai-engineer`

### Plugin: machine-learning-ops

*Note: No individual agents exposed, uses ML/MLOps infrastructure*

---

## Usage Patterns

### Simple Task (1-3 agents)
```markdown
1. Use backend-development:backend-architect
2. Implement feature
3. /review
4. /security-scan
5. /test
```

### Complex Task (5-7 agents)
```markdown
1. Use backend-development:backend-architect (design)
2. Use database-design:database-architect (schema)
3. Use backend-development:graphql-architect (API)
4. Implement feature
5. Use compounding-engineering:kieran-typescript-reviewer (quality)
6. Use compounding-engineering:performance-oracle (optimize)
7. /review, /security-scan, /test
```

### Compounding Cycle (Full workflow)
```markdown
## Plan Phase
- architecture-strategist
- pattern-recognition-specialist
- best-practices-researcher

## Delegate Phase
(Implement changes)

## Assess Phase
- kieran-typescript-reviewer OR kieran-python-reviewer
- performance-oracle
- security-sentinel
- data-integrity-guardian (if DB changes)
- code-simplicity-reviewer

## Codify Phase
- feedback-codifier
- Update knowledge base
- Document patterns
```

---

## Tips for Agent Selection

1. **Start with specialized agents**: backend-architect, database-architect, etc.
2. **Language-specific quality**: kieran-typescript-reviewer, kieran-python-reviewer, python-pro
3. **Always run quality gates**: /review, /security-scan, /test
4. **Complex refactoring**: Use compounding-engineering agents
5. **Learning capture**: Use feedback-codifier after significant work

---

## Integration with Workflow

- **Quick tasks**: Plugin slash commands (`/review`, `/test`, `/security-scan`)
- **Medium tasks**: 2-3 specialized agents + slash commands
- **Complex tasks**: Full compounding cycle (Plan→Delegate→Assess→Codify)
- **Learning**: feedback-codifier + knowledge base updates

---

## Quick Reference by Need

| Need | Agent | Plugin |
|------|-------|--------|
| API Design | backend-architect | backend-development |
| GraphQL Schema | graphql-architect | backend-development |
| Database Schema | database-architect | database-design |
| Query Optimization | database-optimizer | database-migrations |
| Security Review | security-sentinel | compounding-engineering |
| Performance | performance-oracle | compounding-engineering |
| Code Quality (TS) | kieran-typescript-reviewer | compounding-engineering |
| Code Quality (PY) | kieran-python-reviewer | compounding-engineering |
| Simplification | code-simplicity-reviewer | compounding-engineering |
| Learning Capture | feedback-codifier | compounding-engineering |
| Documentation | docs-architect | documentation-generation |
| Diagrams | mermaid-expert | documentation-generation |
| Debugging | debugger | debugging-toolkit |
| DevOps | devops-troubleshooter | cicd-automation |
| Cloud Architecture | cloud-architect | cicd-automation |

---

**Last Updated**: 2025-10-16
**Status**: Phase 2 - Knowledge Base Expansion
**Philosophy**: Right agent, right task, compounding quality
