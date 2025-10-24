# V6.0 Plugin Orchestration Workflow Guide

**Version**: 6.0
**Last Updated**: V6.0 Upgrade
**Primary Orchestrator**: Compounding Engineering Plugin
**Philosophy**: Each unit of engineering work makes subsequent units easier—not harder

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Workflow Patterns](#workflow-patterns)
3. [Task Classification Guide](#task-classification)
4. [Detailed Workflows](#detailed-workflows)
5. [Integration Patterns](#integration-patterns)
6. [Real-World Scenarios](#real-world-scenarios)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## <a name="quick-start"></a>Quick Start

### The Core V6.0 Workflow

```bash
# 1. Plan (creates GitHub issue)
/compounding-engineering:plan "Your task description"

# 2. Work (creates git worktree, executes, auto-commits)
/compounding-engineering:work #<issue_number>

# 3. Review (runs 12+ agents in parallel)
/compounding-engineering:review

# 4. Triage (address findings)
/compounding-engineering:triage

# 5. Create PR (optional)
/git-pr-workflows:pr-enhance
```

**That's it!** This replaces the entire V5.0 manual workflow.

---

## <a name="workflow-patterns"></a>Workflow Patterns

### Pattern 1: Simple Task (Direct Implementation)
**Duration**: <1 hour
**Files**: 1-2 files
**Examples**: Add field, fix typo, update validation

```bash
# NO PLUGIN NEEDED - Direct implementation
1. Read files: Read tool
2. Implement: Edit tool
3. Test: pnpm build && npm test
4. Commit: git add . && git commit && git push
```

**When**: Single file changes, no architecture decisions, clear requirements

---

### Pattern 2: Medium Task (Compounding Engineering)
**Duration**: 2-8 hours
**Files**: 3-15 files
**Examples**: New feature, CRUD implementation, service enhancement

```bash
# CORE COMPOUNDING ENGINEERING WORKFLOW
1. /compounding-engineering:plan "Task description"
   → Creates GitHub issue with implementation plan

2. /compounding-engineering:work #<issue>
   → Creates git worktree
   → Executes systematically
   → Auto-commits with proper messages
   → Runs pnpm build + npm test after each change

3. /compounding-engineering:review
   → Runs 12+ agents in parallel
   → Generates quality report
   → Target: ≥7/10 on kieran-typescript-reviewer

4. /compounding-engineering:triage
   → Present findings one-by-one
   → User decides: fix, defer, or ignore
   → Creates todos for fixes

5. /git-pr-workflows:pr-enhance (optional)
   → Generates comprehensive PR description
```

**Git Worktree Benefits**:
- Clean isolation (no conflicts)
- Automatic branch management
- Easy cleanup after merge
- Parallel development possible

---

### Pattern 3: Complex Task (Full Orchestration)
**Duration**: 2-5 days
**Files**: 15+ files
**Examples**: Production-ready module, cross-service changes

```bash
# DAY 0: Research & Planning
1. Use Haiku 4.5 Explore agent to understand codebase
   → Bash: explore services/[name]

2. /compounding-engineering:plan "Comprehensive task description with all requirements"
   → Review generated GitHub issue
   → Ensure all acceptance criteria captured

3. May use specialized planners:
   → /backend-development:feature-development (backend)
   → /database-migrations:sql-migrations (database)
   → /api-scaffolding:fastapi-pro (new service)

# DAY 1-N: Implementation
4. /compounding-engineering:work #<issue>
   → Plugin manages git worktree
   → Todo tracking automatic
   → Daily commits
   → Continuous validation

5. Combine with domain plugins as needed:
   → /tdd-workflows:tdd-cycle (TDD approach)
   → /unit-test-generator:generate-tests (test generation)
   → /api-testing-observability:api-documenter (API docs)

# FINAL DAY: Review & Release
6. /compounding-engineering:review
   → 12+ agent reviews

7. May run specialized reviews:
   → /comprehensive-review:security-auditor (security)
   → /performance-testing-review:performance-engineer (performance)

8. /compounding-engineering:triage
   → Address all critical/high issues

9. /git-pr-workflows:pr-enhance
   → Create comprehensive PR
```

---

## <a name="task-classification"></a>Task Classification Guide

### How to Classify Tasks

```
┌─────────────────────────────────────────────────────────┐
│                    Task Classification                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Simple (<4 hours, 1-3 files)                           │
│  ├── Single file or 2-3 related files                   │
│  ├── Clear requirement                                   │
│  ├── No architecture decisions                           │
│  └── Examples: Add field, fix bug, update validation    │
│      → Direct implementation (no plugins)                │
│                                                          │
│  Medium (4-8 hours, 5-15 files)                         │
│  ├── Multiple files across layers                       │
│  ├── Some architectural decisions                        │
│  ├── Requires planning                                   │
│  └── Examples: New feature, CRUD, service enhancement   │
│      → Compounding Engineering workflow                  │
│                                                          │
│  Complex (2-5 days, 15+ files)                          │
│  ├── Multi-day implementation                            │
│  ├── Cross-service changes                               │
│  ├── New aggregates/services                             │
│  └── Examples: Production module, invoice-payment link  │
│      → Full plugin orchestration + specialized plugins   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## <a name="detailed-workflows"></a>Detailed Workflows

### Workflow A: TDD Feature Development

**Use When**: Test-driven development preferred, clear acceptance criteria

```bash
# Step 1: Plan with TDD in mind
/compounding-engineering:plan "Feature: [description] with TDD approach"

# Step 2: TDD Cycle
/tdd-workflows:tdd-cycle
# This will guide through:
# - RED: Write failing test
# - GREEN: Implement minimal code to pass
# - REFACTOR: Improve code quality
# - Repeat until feature complete

# Step 3: Generate additional tests for coverage
/unit-test-generator:generate-tests

# Step 4: Review
/compounding-engineering:review

# Step 5: Create PR
/git-pr-workflows:pr-enhance
```

**Benefits**: High test coverage, design-first thinking, regression protection

---

### Workflow B: Bug Fix with Root Cause Analysis

**Use When**: Bug reported, need to understand root cause

```bash
# Step 1: Analyze error patterns
/error-debugging:error-detective
# Searches logs, identifies patterns, suggests root cause

# Step 2: Plan fix (if complex) or implement directly (if simple)
# Complex:
/compounding-engineering:plan "Bug Fix: [description] - Root cause: [analysis]"
/compounding-engineering:work #<issue>

# Simple:
# Direct implementation with Read/Edit tools

# Step 3: Review
/compounding-engineering:review

# Step 4: Verify fix doesn't introduce regressions
/unit-test-generator:generate-tests

# Step 5: Commit
# If used /work: auto-committed
# If manual: /git-commit-smart:commit-smart
```

---

### Workflow C: Database Migration (Zero-Downtime)

**Use When**: Schema changes, data migrations

```bash
# Step 1: Design migration strategy
/database-migrations:sql-migrations
# Analyzes current schema
# Plans zero-downtime strategy (expand-contract)
# Generates migration files

# Step 2: Review migration
/database-design:sql-pro
# Validates migration safety
# Checks for data loss risks
# Reviews rollback plan

# Step 3: Execute migration
/compounding-engineering:work #<migration_issue>

# Step 4: Monitor migration
/database-migrations:migration-observability
# Sets up monitoring
# Tracks progress
# Alerts on failures

# Step 5: Review
/compounding-engineering:review

# Step 6: Validate performance
/database-cloud-optimization:database-optimizer
```

**Critical**: Always test migrations on staging first

---

### Workflow D: API Development (GraphQL Federation)

**Use When**: New GraphQL endpoint, Vextrus ERP microservice

```bash
# Step 1: Design API
/api-scaffolding:graphql-architect
# Designs schema
# Plans federation directives
# Reviews N+1 issues

# Step 2: Plan implementation
/compounding-engineering:plan "API Endpoint: [description]"

# Step 3: Implement
/compounding-engineering:work #<issue>

# Step 4: Generate documentation
/api-testing-observability:api-documenter
# Or
/api-documentation-generator:generate-api-docs

# Step 5: Security review
/backend-api-security:backend-security-coder

# Step 6: Full review
/compounding-engineering:review

# Step 7: Validate auth
/authentication-validator:validate-auth
```

**Vextrus ERP Context**: 18 microservices with GraphQL Federation v2

---

### Workflow E: Performance Optimization

**Use When**: Slow endpoints, high latency, scalability issues

```bash
# Step 1: Analyze performance
/application-performance:performance-engineer
# Identifies bottlenecks
# Reviews caching
# Analyzes database queries

# Step 2: Database optimization (if needed)
/database-design:sql-pro
# Analyzes slow queries
# Suggests indexes
# Identifies N+1 queries

# Step 3: Plan optimizations
/compounding-engineering:plan "Performance: [specific optimizations]"

# Step 4: Implement
/compounding-engineering:work #<issue>

# Step 5: Test performance improvements
/performance-testing-review:performance-engineer

# Step 6: Review
/compounding-engineering:review

# Step 7: Set up monitoring
/observability-monitoring:observability-engineer
```

---

### Workflow F: Security Audit & Remediation

**Use When**: Security concerns, compliance requirements, pre-release audit

```bash
# Step 1: Comprehensive security audit
/comprehensive-review:security-auditor
# Scans for vulnerabilities
# Checks OWASP Top 10
# Reviews auth/authz
# Scans for secrets

# Step 2: Triage findings
/compounding-engineering:triage
# Prioritize issues
# Decide what to fix now

# Step 3: Implement security fixes
/backend-api-security:backend-security-coder

# Step 4: Validate fixes
/authentication-validator:validate-auth

# Step 5: Re-audit
/comprehensive-review:security-auditor

# Step 6: Review
/compounding-engineering:review
```

---

### Workflow G: Infrastructure & Deployment

**Use When**: CI/CD setup, infrastructure changes, deployment automation

```bash
# Step 1: Design infrastructure
/cloud-infrastructure:cloud-architect
# Designs cloud architecture
# Plans high availability
# Reviews cost optimization

# Step 2: Create IaC modules
/cloud-infrastructure:terraform-module-library

# Step 3: Design CI/CD pipeline
/deployment-pipeline-orchestrator:pipeline-orchestrate

# Step 4: Plan implementation
/compounding-engineering:plan "Infrastructure: [description]"

# Step 5: Implement
/compounding-engineering:work #<issue>

# Step 6: Set up monitoring
/observability-monitoring:observability-engineer

# Step 7: Detect drift
/infrastructure-drift-detector:drift-detect

# Step 8: Review
/compounding-engineering:review
```

---

## <a name="integration-patterns"></a>Integration Patterns

### Combining Multiple Plugins

#### Pattern: Backend Feature with TDD + Security + Performance

```bash
# Phase 1: Planning
/backend-development:feature-development
/compounding-engineering:plan "Feature from above analysis"

# Phase 2: TDD Implementation
/tdd-workflows:tdd-cycle
/compounding-engineering:work #<issue>

# Phase 3: Security hardening
/backend-api-security:backend-security-coder

# Phase 4: Performance validation
/application-performance:performance-engineer

# Phase 5: Comprehensive review
/compounding-engineering:review
/comprehensive-review:security-auditor
/performance-testing-review:performance-engineer

# Phase 6: Triage & finalize
/compounding-engineering:triage
/git-pr-workflows:pr-enhance
```

---

#### Pattern: Full-Stack Feature

```bash
# Phase 1: Full-stack planning
/full-stack-orchestration:full-stack-featureold
/compounding-engineering:plan "Full-stack feature from above"

# Phase 2: Backend implementation
/api-scaffolding:fastapi-pro
/backend-development:architecture-patterns

# Phase 3: Frontend implementation
/frontend-mobile-development:frontend-developer

# Phase 4: API documentation
/api-testing-observability:api-documenter

# Phase 5: E2E testing
/test-orchestrator:orchestrate

# Phase 6: Performance optimization
/application-performance:performance-engineer (backend)
/application-performance:frontend-developer (frontend)

# Phase 7: Full review
/compounding-engineering:review
/comprehensive-review:full-review

# Phase 8: Deploy
/deployment-pipeline-orchestrator:pipeline-orchestrate
```

---

## <a name="real-world-scenarios"></a>Real-World Scenarios (Vextrus ERP)

### Scenario 1: Invoice-Payment Linking with Mushak 6.3

**Requirements**:
- Link invoices to payments
- Generate Bangladesh Mushak 6.3 VAT invoice
- Handle partial payments
- Event sourcing + CQRS

**Workflow**:

```bash
# Day 0: Research & Planning
1. Explore existing invoice/payment services
   Bash: explore services/finance-service

2. /compounding-engineering:plan "Production-ready Invoice-Payment Linking with Mushak 6.3 Generation
   Requirements:
   - Link invoices to payments (one-to-many)
   - Handle partial payments
   - Generate Mushak 6.3 on invoice approval
   - Include TIN/BIN validation (Bangladesh NBR)
   - Calculate VAT correctly (15% standard, 7.5% reduced)
   - Use Event Sourcing (events: InvoiceLinkedToPayment, MushakGenerated)
   - GraphQL mutations for linking
   - Comprehensive tests"

3. Review GitHub issue, ensure VEXTRUS-PATTERNS.md sections 11-13 referenced

# Day 1: Domain Model Implementation
4. /compounding-engineering:work #<issue>
   # Plugin will:
   # - Create git worktree
   # - Implement Invoice aggregate changes
   # - Add InvoiceLinkedToPayment event
   # - Update Payment aggregate
   # - Add MushakGenerated event
   # - Run tests continuously

5. /tdd-workflows:tdd-cycle (if preferred)

# Day 2: Application & Presentation Layers
6. Continue /compounding-engineering:work
   # Plugin handles:
   # - Command handlers (LinkInvoiceToPaymentCommand)
   # - Query handlers (GetInvoiceWithPaymentsQuery)
   # - GraphQL mutations (linkInvoiceToPayment)
   # - Mushak 6.3 generator service

7. /api-testing-observability:api-documenter

# Day 3: Bangladesh Compliance & Testing
8. Implement Bangladesh compliance patterns
   # Reference: VEXTRUS-PATTERNS.md sections 11-13
   # - TIN/BIN validation
   # - VAT calculation (15%/7.5%/0%)
   # - Mushak 6.3 format (QR code, fiscal year)

9. /unit-test-generator:generate-tests
   # Target: 90%+ coverage

# Day 4: Security & Performance
10. /backend-api-security:backend-security-coder
    # Ensure RBAC for finance operations

11. /application-performance:performance-engineer
    # Check for N+1 queries, caching

# Day 5: Reviews & Finalize
12. /compounding-engineering:review
    # Runs 12+ agents

13. /comprehensive-review:security-auditor
    # Deep security audit

14. /compounding-engineering:triage
    # Address findings

15. /git-pr-workflows:pr-enhance
    # Create comprehensive PR
```

**Expected Quality**: 9.5/10, 90%+ coverage, zero security issues

---

### Scenario 2: Performance Optimization for Trial Balance Query

**Problem**: Trial balance query taking 5+ seconds, timeout issues

**Workflow**:

```bash
# Step 1: Analyze performance
/application-performance:performance-engineer
# Results show:
# - N+1 query issue (loading accounts one by one)
# - Missing indexes on account_code
# - No caching

# Step 2: Database analysis
/database-design:sql-pro
# Suggests:
# - Composite index on (fiscal_year, account_code)
# - Query rewrite with JOIN instead of multiple queries
# - Consider materialized view

# Step 3: Plan optimizations
/compounding-engineering:plan "Performance: Optimize Trial Balance Query
   - Fix N+1 query with batch loading
   - Add composite index (fiscal_year, account_code)
   - Implement Redis caching (TTL: 5 minutes)
   - Add query result pagination
   Target: <500ms response time"

# Step 4: Implement
/compounding-engineering:work #<issue>

# Step 5: Create migration
/database-migrations:sql-migrations
# Zero-downtime index creation

# Step 6: Test performance improvements
/performance-testing-review:performance-engineer
# Load test with 100 concurrent requests

# Step 7: Review
/compounding-engineering:review

# Step 8: Set up monitoring
/observability-monitoring:observability-engineer
# Add Prometheus metrics for query duration
```

---

## <a name="troubleshooting"></a>Troubleshooting

### Issue: `/compounding-engineering:work` fails with "No GitHub issue found"

**Solution**:
```bash
# Ensure issue exists
gh issue list | grep <issue_number>

# Create issue manually if needed
/compounding-engineering:plan "Task description"
# This creates the issue

# Then work
/compounding-engineering:work #<issue_number>
```

---

### Issue: Git worktree conflicts

**Solution**:
```bash
# List worktrees
git worktree list

# Remove problematic worktree
git worktree remove <path>

# Retry
/compounding-engineering:work #<issue>
```

---

### Issue: Review score <7/10

**Solution**:
```bash
# Run triage to see specific issues
/compounding-engineering:triage

# Address critical/high issues

# Re-run review
/compounding-engineering:review

# Continue until ≥7/10
```

---

### Issue: Plugin command not found

**Solution**:
```bash
# List installed plugins
/plugin list

# Reinstall if needed
/plugin install compounding-engineering

# Verify
/help
# Should show /compounding-engineering:* commands
```

---

## <a name="best-practices"></a>Best Practices

### DO ✅

1. **Always use `/compounding-engineering:review`** after implementation
2. **Run `/triage`** to systematically address findings
3. **Let `/work` handle commits** (automatic, proper format)
4. **Use specialized plugins** when applicable (TDD, security, performance)
5. **Reference VEXTRUS-PATTERNS.md** for Bangladesh compliance
6. **Target ≥7/10** on kieran-typescript-reviewer
7. **Trust the git worktree** isolation
8. **Combine plugins** for comprehensive workflows
9. **Use manual tools** for quick operations (Read, Grep, Glob)
10. **Create GitHub issues** for all medium/complex tasks

### DON'T ❌

1. ❌ Skip `/compounding-engineering:review` to "save time"
2. ❌ Commit manually when using `/work` (it auto-commits)
3. ❌ Use plugins for simple file reads (use Read tool)
4. ❌ Ignore plugin errors (investigate and report)
5. ❌ Create checkpoints when using `/work` (worktree is the checkpoint)
6. ❌ Skip quality gates even with plugins
7. ❌ Use Task tool for agents when plugin exists
8. ❌ Forget to run `/triage` after `/review`
9. ❌ Deploy without running security audit
10. ❌ Commit with TypeScript errors or failing tests

---

## Plugin Workflow vs Manual Workflow

### V5.0 (Manual)
```
1. Manual TodoWrite for planning (2-5 minutes)
2. Read files manually (5-10 minutes)
3. Implement code (30-120 minutes)
4. Run pnpm build (2 minutes)
5. Run npm test (3 minutes)
6. Manual Task tool agent invocation (5-10 minutes)
7. Wait for agent results (2-5 minutes)
8. Fix issues based on agent feedback (10-30 minutes)
9. Manual checkpoint creation (5-10 minutes)
10. Manual commit message creation (3-5 minutes)
11. git add, commit, push (1 minute)

Total: 70-200 minutes
Context: High (manual orchestration)
```

### V6.0 (Plugin-Orchestrated)
```
1. /compounding-engineering:plan (1 minute to invoke)
2. /compounding-engineering:work (automatic execution)
3. /compounding-engineering:review (1 minute to invoke, automatic)
4. /compounding-engineering:triage (5-10 minutes for decisions)
5. /git-pr-workflows:pr-enhance (1 minute to invoke)

Total: 50-140 minutes (30% faster)
Context: Low (plugins handle orchestration)
Quality: 50% better (12+ agent reviews)
```

---

## Success Metrics

### V6.0 Target Metrics

| Metric | V5.0 | V6.0 Target | Measurement |
|--------|------|-------------|-------------|
| Code Quality Score | 7.5/10 avg | 9.0/10 avg | kieran-typescript-reviewer |
| Test Coverage | 75% avg | 90%+ | Jest/Coverage |
| Security Issues | 2-3/feature | 0 critical | security-auditor |
| Development Speed | Baseline | 30% faster | Task completion time |
| Context Usage | ~34k | <60k | Token count |
| Manual Steps | 11 steps | 5 steps | Workflow steps |
| Git Conflicts | Occasional | Rare | Git worktree isolation |
| Review Time | 10-15 min | 2-5 min | Parallel agents |

---

## Quick Reference Card

### Most Common Workflows

```
┌─────────────────────────────────────────────────────────┐
│              V6.0 Quick Workflow Reference               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Simple Task: Direct implementation                      │
│  → Read → Edit → Test → Commit                          │
│                                                          │
│  Medium Task: Compounding Engineering                    │
│  → /plan → /work → /review → /triage → /pr-enhance     │
│                                                          │
│  Complex Task: Full Orchestration                        │
│  → Explore → /plan + specialized → /work + domain       │
│  → /review + specialized → /triage → /pr-enhance       │
│                                                          │
│  TDD: Test-Driven Development                           │
│  → /plan → /tdd-cycle → /review → /pr-enhance          │
│                                                          │
│  Bug Fix: Root Cause Analysis                           │
│  → /error-detective → /work → /review → /commit        │
│                                                          │
│  Performance: Optimization                               │
│  → /performance-engineer → /plan → /work               │
│  → /performance-review → /review → /pr-enhance         │
│                                                          │
│  Security: Audit & Fix                                   │
│  → /security-auditor → /triage → /backend-security     │
│  → /validate-auth → /review → /pr-enhance              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

**V6.0** | **Plugin-Orchestrated Workflows** | **30% Faster** | **50% Better Quality** | **Knowledge Compounds**

**System**: Vextrus ERP | 18 Microservices | GraphQL Federation v2 | Bangladesh Construction & Real Estate

**Primary Orchestrator**: Compounding Engineering Plugin

**Philosophy**: Each unit of engineering work makes subsequent units easier—not harder
