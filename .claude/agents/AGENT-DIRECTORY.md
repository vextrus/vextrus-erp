# Vextrus ERP Agent Directory

**Version**: 3.0
**Total Agents**: 33
**Models**: Sonnet 4.5 (primary), Haiku 4.5 (fast), Opus (specialized)
**Updated**: 2025-10-24

---

## Quick Reference by Task Type

| Task Type | Primary Agents | Model | Typical Combo |
|-----------|---------------|-------|---------------|
| **Simple Bug Fix** | None (direct implementation) | Sonnet | 0 agents |
| **GraphQL API Design** | graphql-architect | Sonnet | 1 agent |
| **Backend Architecture** | backend-architect, architecture-strategist | Sonnet | 2 agents |
| **TDD Implementation** | tdd-orchestrator, test-automator | Sonnet+Haiku | 2 agents |
| **Code Review** | kieran-typescript-reviewer, code-reviewer | Sonnet | 2 agents |
| **Security Audit** | security-sentinel | Sonnet | 1 agent |
| **Performance Optimization** | performance-oracle | Sonnet | 1 agent |
| **Database Design** | data-integrity-guardian | Sonnet | 1 agent |
| **Production Deployment** | deployment-pipeline-orchestrator | Sonnet | 1 agent |
| **Complex Feature** | architecture-strategist + 3-5 review agents | Sonnet | 4-6 agents |

**Decision Tree**: [DECISION-TREE.md](./DECISION-TREE.md)

---

## Agent Categories

### 🏗️ Backend Development (3 agents)

#### backend-architect
**Model**: Sonnet 4.5
**Use When**: Designing scalable backend services, microservices architecture, distributed systems
**Strengths**: REST/GraphQL/gRPC APIs, event-driven architectures, service mesh patterns
**Typical Invocation**:
```
"Design a scalable payment reconciliation service that integrates with our existing finance module"
```
**Success Rate**: 95%
**Best For**: New service design, architecture refactoring, system-level decisions

---

#### graphql-architect
**Model**: Sonnet 4.5
**Use When**: GraphQL Federation v2 schema design, performance optimization, enterprise security
**Strengths**: Schema federation, advanced caching, real-time systems, resolver optimization
**Typical Invocation**:
```
"Design the federated GraphQL schema for the real estate module with property and lease entities"
```
**Success Rate**: 95%
**Best For**: Federation v2 schemas, cross-service entity resolution, GraphQL performance
**Vextrus Context**: Works with our 18 microservices + GraphQL Federation v2 architecture

---

#### tdd-orchestrator
**Model**: Sonnet 4.5
**Use When**: Implementing test-driven development, coordinating multi-agent testing workflows
**Strengths**: Red-green-refactor discipline, comprehensive test strategies, TDD governance
**Typical Invocation**:
```
"Implement the invoice validation feature using strict TDD approach with unit and integration tests"
```
**Success Rate**: 90%
**Best For**: Complex business logic requiring high test coverage (90%+ target)

---

### 🧪 Unit Testing (2 agents)

#### debugger
**Model**: Sonnet 4.5
**Use When**: Errors, test failures, unexpected behavior
**Strengths**: Root cause analysis, stack trace interpretation, fix suggestions
**Typical Invocation**:
```
"The VAT calculation test is failing with 'Expected 15.00 but got 14.85' - debug this"
```
**Success Rate**: 90%
**Best For**: Test failures, production bugs, integration issues

---

#### test-automator
**Model**: Haiku 4.5
**Use When**: Automated test generation, self-healing tests, quality engineering
**Strengths**: Fast test scaffolding, CI/CD integration, test framework expertise
**Typical Invocation**:
```
"Generate comprehensive unit tests for the PaymentAllocationService class"
```
**Success Rate**: 85%
**Best For**: Test automation, increasing coverage from 70% → 90%

---

### 🔀 Git & PR Workflows (1 agent)

#### code-reviewer
**Model**: Sonnet 4.5
**Use When**: Pull request reviews, code quality checks, security scanning
**Strengths**: AI-powered code analysis, security vulnerabilities, performance optimization
**Typical Invocation**:
```
"Review the payment reconciliation PR for code quality, security, and architectural compliance"
```
**Success Rate**: 95%
**Best For**: Pre-merge reviews, catching bugs before production
**Note**: Also use kieran-typescript-reviewer for stricter TypeScript-specific review

---

### 🧩 Compounding Engineering (17 agents)

#### architecture-strategist
**Model**: Sonnet 4.5
**Use When**: System design decisions, cross-service coordination, architectural compliance
**Strengths**: Multi-service design, component boundaries, design pattern selection
**Typical Invocation**:
```
"Design the cross-aggregate invoice-payment linking with event-driven coordination"
```
**Success Rate**: 95%
**Best For**: Complex features spanning multiple aggregates/services

---

#### best-practices-researcher
**Model**: Sonnet 4.5
**Use When**: Need external research, new patterns, industry best practices
**Strengths**: Documentation synthesis, community standards, open-source examples
**Typical Invocation**:
```
"Research best practices for bank statement reconciliation in construction industry ERPs"
```
**Success Rate**: 90%
**Best For**: New problem domains, unfamiliar technologies, industry-specific patterns

---

#### code-simplicity-reviewer
**Model**: Sonnet 4.5
**Use When**: Final review pass, complexity reduction, YAGNI principle enforcement
**Strengths**: Identifying over-engineering, simplification opportunities, dead code
**Typical Invocation**:
```
"Review the invoice service for unnecessary complexity and suggest simplifications"
```
**Success Rate**: 85%
**Best For**: Post-implementation review, technical debt reduction

---

#### data-integrity-guardian
**Model**: Sonnet 4.5
**Use When**: Database migrations, schema changes, data manipulation
**Strengths**: Migration safety, referential integrity, transaction boundaries, privacy
**Typical Invocation**:
```
"Review this migration that adds invoice_status column and backfills existing records"
```
**Success Rate**: 95%
**Best For**: Zero-downtime migrations, data integrity validation
**Critical For**: Production deployments (ALWAYS use for migrations)

---

#### dhh-rails-reviewer
**Model**: Sonnet 4.5
**Use When**: Rails code review (if using Rails for any service)
**Strengths**: Rails conventions, anti-pattern detection, DHH-style brutally honest feedback
**Note**: Vextrus uses NestJS (not Rails), so this agent has limited use
**Typical Invocation**:
```
"Review this Rails admin panel for Rails convention adherence"
```

---

#### every-style-editor
**Model**: Sonnet 4.5
**Use When**: Editing documentation, articles, release notes to conform to style guide
**Strengths**: Title case enforcement, singular/plural usage, passive voice detection
**Typical Invocation**:
```
"Edit this release notes document to follow our style guide"
```
**Success Rate**: 90%
**Best For**: User-facing documentation, blog posts, newsletters

---

#### feedback-codifier
**Model**: Opus (highest reasoning)
**Use When**: Analyzing feedback patterns from reviews to improve reviewer agents
**Strengths**: Pattern extraction, reviewer configuration updates, learning from feedback
**Typical Invocation**:
```
"Analyze my code review feedback from the last 3 tasks and update kieran-typescript-reviewer with new patterns"
```
**Success Rate**: 85%
**Best For**: Workflow improvement, capturing tribal knowledge

---

#### framework-docs-researcher
**Model**: Sonnet 4.5
**Use When**: Need library documentation, framework-specific patterns, version constraints
**Strengths**: Official docs fetching, source code exploration, best practices
**Typical Invocation**:
```
"Research NestJS GraphQL Federation v2 documentation for entity resolution patterns"
```
**Success Rate**: 90%
**Best For**: Framework updates, new library integration, troubleshooting

---

#### git-history-analyzer
**Model**: Sonnet 4.5
**Use When**: Understanding code evolution, tracing pattern origins, identifying expertise areas
**Strengths**: Git archaeology, commit pattern analysis, contributor insights
**Typical Invocation**:
```
"Analyze the git history of the payment service to understand why retry logic was added"
```
**Success Rate**: 85%
**Best For**: Understanding "why" behind code decisions, finding experts

---

#### kieran-python-reviewer
**Model**: Sonnet 4.5
**Use When**: Reviewing Python code (if using Python for scripts/tools)
**Strengths**: Pythonic patterns, type hints, PEP compliance, strict quality bar
**Note**: Vextrus is primarily TypeScript, limited Python usage
**Typical Invocation**:
```
"Review this Python data migration script for quality and safety"
```

---

#### kieran-rails-reviewer
**Model**: Sonnet 4.5
**Use When**: Reviewing Rails code (if using Rails for any service)
**Strengths**: Rails conventions, strict quality enforcement
**Note**: Vextrus uses NestJS (not Rails), so this agent has limited use

---

#### kieran-typescript-reviewer
**Model**: Sonnet 4.5
**Use When**: **ALWAYS** for medium+ TypeScript tasks (strict code quality)
**Strengths**: TypeScript patterns, strict null checks, type safety, code clarity
**Typical Invocation**:
```
"Review the payment reconciliation implementation for TypeScript quality"
```
**Success Rate**: 95%
**Best For**: All TypeScript code (Vextrus primary language)
**Critical**: MANDATORY for medium and complex tasks (proven 9.5/10 quality)

---

#### pattern-recognition-specialist
**Model**: Sonnet 4.5
**Use When**: Analyzing existing patterns before implementing new features
**Strengths**: Design pattern detection, anti-pattern identification, naming conventions
**Typical Invocation**:
```
"Analyze existing payment processing patterns before implementing payment reconciliation"
```
**Success Rate**: 90%
**Best For**: Understanding existing codebase, maintaining consistency

---

#### performance-oracle
**Model**: Sonnet 4.5
**Use When**: Performance optimization, bottleneck identification, caching strategies
**Strengths**: Algorithm optimization, database query tuning, memory profiling
**Typical Invocation**:
```
"Analyze the trial balance query performance and suggest optimizations"
```
**Success Rate**: 90%
**Best For**: <300ms response time requirements, high-traffic endpoints

---

#### pr-comment-resolver
**Model**: Sonnet 4.5
**Use When**: Addressing PR review comments systematically
**Strengths**: Understanding feedback, implementing fixes, reporting resolutions
**Typical Invocation**:
```
"Address the PR comments about adding error handling to the payment processing method"
```
**Success Rate**: 90%
**Best For**: Systematic PR feedback resolution, team collaboration

---

#### repo-research-analyst
**Model**: Sonnet 4.5
**Use When**: Comprehensive repository analysis, architecture understanding, contribution prep
**Strengths**: Repository structure analysis, pattern extraction, GitHub issue patterns
**Typical Invocation**:
```
"Analyze the finance service repository structure and coding patterns"
```
**Success Rate**: 85%
**Best For**: Onboarding, pre-contribution research, architecture review

---

#### security-sentinel
**Model**: Sonnet 4.5
**Use When**: Security audits, vulnerability assessment, OWASP compliance
**Strengths**: Vulnerability scanning, auth/authz review, input validation, secrets detection
**Typical Invocation**:
```
"Perform security audit on the authentication module before production deployment"
```
**Success Rate**: 95%
**Best For**: Authentication, RBAC, sensitive data, production releases
**Critical**: MANDATORY for security-critical changes

---

### 🛠️ Built-in Agents (4 agents)

#### general-purpose
**Model**: Sonnet 4.5
**Use When**: Complex multi-step tasks not covered by specialized agents
**Strengths**: Autonomous task execution, code search, multi-step workflows
**Typical Invocation**:
```
"Research and implement a CSV export feature for invoices"
```
**Success Rate**: 85%
**Best For**: General tasks requiring research + implementation

---

#### Explore
**Model**: Haiku 4.5 (fast)
**Use When**: Quick codebase exploration, finding files by patterns
**Strengths**: 2x faster than Sonnet, 73% SWE-bench, file pattern matching
**Typical Invocation**:
```
/explore services/finance
```
**Success Rate**: 90%
**Best For**: "Where is X?" queries, quick exploration (use before deep work)
**Thoroughness Levels**: quick | medium | very thorough

---

#### statusline-setup
**Model**: Sonnet 4.5
**Use When**: Configuring Claude Code status line settings
**Note**: Utility agent, rarely used after initial setup

---

#### output-style-setup
**Model**: Sonnet 4.5
**Use When**: Creating Claude Code output styles
**Note**: Utility agent, rarely used after initial setup

---

### 🔌 Plugin Agents (6+ agents from slash commands)

#### test-orchestrator
**Model**: Sonnet 4.5
**Slash Command**: `/test-orchestrator:orchestrate`
**Use When**: Orchestrating complex test workflows with smart execution
**Success Rate**: 85%

---

#### api-documentation-generator
**Model**: Sonnet 4.5
**Slash Command**: `/api-documentation-generator:generate-api-docs`
**Use When**: Generating OpenAPI/Swagger documentation from existing APIs
**Success Rate**: 90%

---

#### docker-compose-generator
**Model**: Sonnet 4.5
**Slash Command**: `/docker-compose-generator:docker-compose`
**Use When**: Generating Docker Compose configurations for services
**Success Rate**: 90%

---

#### infrastructure-drift-detector
**Model**: Sonnet 4.5
**Slash Command**: `/infrastructure-drift-detector:drift-detect`
**Use When**: Detecting infrastructure configuration drift
**Success Rate**: 85%

---

#### deployment-pipeline-orchestrator
**Model**: Sonnet 4.5
**Slash Command**: `/deployment-pipeline-orchestrator:pipeline-orchestrate`
**Use When**: Orchestrating deployment pipelines
**Success Rate**: 85%

---

#### authentication-validator
**Model**: Sonnet 4.5
**Slash Command**: `/authentication-validator:validate-auth`
**Use When**: Validating authentication implementations
**Success Rate**: 90%

---

#### unit-test-generator
**Model**: Sonnet 4.5
**Slash Command**: `/unit-test-generator:generate-tests`
**Use When**: Generating comprehensive unit tests for source code files
**Success Rate**: 85%

---

## Agent Orchestration Patterns

### Simple Task (<4 hours) - 0-1 Agents
```
Typical: No agents (direct implementation)
Optional: Explore (if unfamiliar codebase area)
```

### Medium Task (4-8 hours) - 2-4 Agents
```
Planning: pattern-recognition-specialist
Implementation: (direct)
Review: kieran-typescript-reviewer + security-sentinel (if needed)
```

### Complex Task (Multi-day) - 5-8 Agents
```
Planning: architecture-strategist + best-practices-researcher + pattern-recognition-specialist
Implementation: (direct, with checkpoint commits)
Review: kieran-typescript-reviewer + security-sentinel + performance-oracle + data-integrity-guardian
Feedback: feedback-codifier (capture learnings)
```

---

## Vextrus-Specific Agent Usage

### GraphQL Federation v2 Features
```
Planning: graphql-architect + architecture-strategist
Review: kieran-typescript-reviewer
```

### Event Sourcing + CQRS Features
```
Planning: backend-architect + architecture-strategist
Review: kieran-typescript-reviewer + data-integrity-guardian
```

### Bangladesh Compliance Features
```
Note: Use vextrus-domain-expert SKILL (not agent)
Review: kieran-typescript-reviewer + security-sentinel
```

### Construction Project Management
```
Planning: best-practices-researcher (industry patterns)
Review: kieran-typescript-reviewer
```

### Real Estate Management
```
Planning: best-practices-researcher (industry patterns)
Review: kieran-typescript-reviewer + data-integrity-guardian
```

### Production Deployment
```
Pre-Deploy: security-sentinel + performance-oracle + data-integrity-guardian
Deploy: deployment-pipeline-orchestrator
```

---

## Success Metrics by Agent

| Agent | Success Rate | Typical Time | Best Use Case |
|-------|--------------|--------------|---------------|
| kieran-typescript-reviewer | 95% | 15-30 min | All TS code (MANDATORY) |
| security-sentinel | 95% | 20-40 min | Auth, RBAC, prod deploys |
| architecture-strategist | 95% | 30-60 min | System design |
| graphql-architect | 95% | 20-40 min | Federation v2 schemas |
| backend-architect | 95% | 30-60 min | Service architecture |
| data-integrity-guardian | 95% | 15-30 min | Database migrations |
| pattern-recognition-specialist | 90% | 15-30 min | Pre-implementation analysis |
| performance-oracle | 90% | 20-40 min | Optimization |
| best-practices-researcher | 90% | 20-40 min | External research |
| Explore | 90% | 2-5 min | Quick exploration |
| tdd-orchestrator | 90% | 30-60 min | TDD workflows |

---

## Model Selection Guide

**Sonnet 4.5** (77% SWE-bench):
- Main implementation
- Complex logic
- Architecture decisions
- Code review
- Security audits

**Haiku 4.5** (73% SWE-bench, 2x faster):
- Quick exploration (Explore agent)
- Test automation (test-automator)
- Parallel research tasks
- Context gathering

**Opus** (highest reasoning):
- Feedback analysis (feedback-codifier)
- Complex architectural decisions (rare)

---

## Anti-Patterns

❌ **Don't**:
- Use agents for simple tasks (<1 hour) - implement directly
- Launch >8 agents in parallel (diminishing returns)
- Use Rails/Python reviewers for TypeScript code
- Skip kieran-typescript-reviewer for medium+ tasks
- Use agents when patterns already documented in VEXTRUS-PATTERNS.md

✅ **Do**:
- Invoke agents explicitly (don't wait for auto-activation)
- Use 2-4 agents for medium tasks (planning + review)
- Use 5-8 agents for complex tasks (planning + execution + review)
- Always use kieran-typescript-reviewer for TS code
- Always use security-sentinel for auth/RBAC changes
- Always use data-integrity-guardian for migrations

---

## Quick Command Reference

```bash
# Invoke agents explicitly in natural language
"Analyze existing payment patterns before implementing reconciliation"
→ Invokes: pattern-recognition-specialist

"Design the federated schema for real estate module"
→ Invokes: graphql-architect

"Review this implementation for TypeScript quality"
→ Invokes: kieran-typescript-reviewer

"Perform security audit before production deployment"
→ Invokes: security-sentinel

# Slash commands for plugin agents
/test-orchestrator:orchestrate
/api-documentation-generator:generate-api-docs
/docker-compose-generator:docker-compose

# Built-in exploration
/explore services/finance
```

---

**Version**: 3.0
**Total Agents**: 33
**Updated**: 2025-10-24
**Next Review**: After 10 production tasks with v3.0 workflow
