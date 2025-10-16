# CLAUDE.md - Agent-First Workflow for Bangladesh ERP

**Version**: 2.1 (Reality-Based, Claude Code 2.0.17)
**Last Updated**: 2025-10-16
**Project**: Vextrus ERP - Bangladesh Construction & Real Estate

---

## What This Document Is

This is an **honest, reality-based guide** to the actual workflow infrastructure in this codebase. It documents **what actually works**, not aspirational features.

**Philosophy**: We prefer working infrastructure over impressive documentation. This guide tells you the truth.

---

## Quick Start

### Essential Commands
```bash
# Check current state
cat .claude/state/current_task.json          # Current task
git branch --show-current                     # Current branch

# Execute workflows (semi-automated)
python .claude/libs/workflow-engine.py run --workflow finance-feature

# Use intelligence tools (manual execution)
python .claude/libs/complexity-analyzer.py analyze sessions/tasks/current.md
python .claude/libs/business-rule-registry.py validate

# Cache management
python .claude/libs/agent-cache.py status
```

### Marketplace Plugins (20 Installed)
```bash
# Check installed plugins
/plugin

# Explore available commands from plugins
/help
```

**Note**: The 20 marketplace plugins you installed provide various slash commands. Use `/help` to see what's available from those plugins.

---

## Collaboration Philosophy

### Core Principles
- **Agent-First**: Delegate complex tasks to specialized agents via Task tool
- **Investigate patterns**: Look for existing examples before creating new code
- **Validate continuously**: Use intelligence tools for compliance and performance
- **Cache aggressively**: Reuse agent results when inputs haven't changed (60-70% hit rate)
- **Log everything**: Structured logging for all workflow executions

### Bangladesh ERP Focus
- Always validate TIN/BIN/NID formats, VAT (15%), and fiscal year (July-June)
- Test payment gateways (bKash, Nagad) and government APIs (NBR, RAJUK)
- Include Bengali character support (UTF-8) in all text fields
- Follow NBR Mushak reporting requirements

---

## Agent-First Workflow

### 9 Specialized Agents

**Core Workflow Agents**:
1. **context-gathering** - Creates comprehensive context manifests
2. **context-refinement** - Updates context with session discoveries
3. **logging** - Maintains chronological work logs
4. **code-review** - Reviews code quality and security
5. **service-documentation** - Updates service documentation

**Bangladesh ERP Agents**:
6. **business-logic-validator** - NBR/RAJUK compliance validation
7. **data-migration-specialist** - Zero-downtime migrations with Bengali support
8. **api-integration-tester** - bKash/Nagad/NBR API testing
9. **performance-profiler** - Query optimization and baseline metrics

### Agent Invocation (Task Tool)

**How It Actually Works**: You invoke agents using the Task tool. That's it. No slash commands, no automation - just the Task tool.

```python
# Example: Validate Bangladesh business rules
Task(
    description="Validate Bangladesh VAT compliance",
    prompt="Analyze the finance module for Bangladesh VAT and tax compliance. Check:\n- TIN/BIN/NID validation\n- VAT calculation (15%)\n- Fiscal year logic (July-June)\n- NBR Mushak reporting requirements",
    subagent_type="business-logic-validator"
)

# Example: Review code
Task(
    description="Review finance module code",
    prompt="Review services/finance/ for security vulnerabilities, performance issues, and Bangladesh compliance. Focus on critical paths: transaction_processing, ledger_updates, tax_calculation.",
    subagent_type="code-review"
)

# Example: Explore codebase
Task(
    description="Find payment gateway integration points",
    prompt="Search the codebase for bKash, Nagad, and SSLCommerz integration points. Document API endpoints, authentication flows, and webhook handlers.",
    subagent_type="Explore"
)
```

**That's the actual workflow**. No magic, no automation. Claude uses Task tool → Agent executes → Returns results.

### Agent Caching

All agent results are automatically cached:
- **TTL by agent type**: business-logic-validator (168h), api-integration-tester (48h), code-review (72h)
- **Dependency tracking**: File changes, git commits, config modifications
- **Automatic invalidation**: On code/config changes
- **60-70% hit rate**: After warm-up period

**Cache commands**:
```bash
python .claude/libs/agent-cache.py status        # Check cache stats
python .claude/libs/agent-cache.py invalidate    # Clear specific cache
```

---

## Workflow Orchestration (Semi-Automated)

### How Workflows Actually Work

**Reality**: Workflows are **semi-automated**. The workflow engine gives Claude a plan, but Claude must manually execute each agent step using the Task tool.

**What Happens**:
1. You run: `python .claude/libs/workflow-engine.py run --workflow finance-feature`
2. Workflow engine reads the JSON definition
3. For each agent in the workflow, it **returns instructions to Claude**
4. Claude uses Task tool to execute each agent
5. Claude reports results back to workflow engine
6. Workflow engine caches results, logs execution, tracks progress

**It's interactive, not automatic**. Think of it as a checklist with caching, not a fully automated pipeline.

### 5 Orchestration Patterns

The workflow engine supports 5 execution patterns:

| Pattern | Use Case | Example |
|---------|----------|---------|
| **Sequential** | Step-by-step validation | NBR tax compliance feature |
| **Parallel** | Independent concurrent tasks | Multi-gateway health check |
| **Conditional** | Decision-based branching | Migration safety checks |
| **Iterative** | Optimization loops | Invoice performance < 300ms |
| **Pipeline** | Multi-stage transformation | Fiscal year report generation |

### Workflow Definitions

Workflows are defined in `.claude/workflows/*.json`:

```json
{
  "name": "finance-feature",
  "description": "Implement finance feature with Bangladesh compliance",
  "pattern": "sequential",
  "agents": [
    {
      "agent": "business-logic-validator",
      "prompt": "Validate Bangladesh VAT and tax compliance"
    },
    {
      "agent": "context-gathering",
      "prompt": "Gather existing finance module patterns"
    },
    {
      "agent": "code-review",
      "prompt": "Review implementation for compliance"
    },
    {
      "agent": "performance-profiler",
      "prompt": "Establish performance baselines"
    }
  ]
}
```

**6 workflow definitions available**:
- `finance-feature.json` - Sequential pattern for finance development
- `bangladesh-compliance.json` - Compliance validation workflow
- `payment-gateway-test.json` - Gateway integration testing
- `data-migration.json` - Zero-downtime migration workflow
- `performance-optimization.json` - Iterative optimization workflow
- `health-check.json` - Parallel health check workflow

---

## Intelligence Tools (Manual Execution)

Located in `.claude/libs/`, these tools provide analysis when you run them:

### 1. Complexity Analyzer
```bash
python .claude/libs/complexity-analyzer.py analyze sessions/tasks/task-name.md
```
- Calculates task complexity scores (Trivial < 10, Epic > 75)
- Suggests task splitting for complex work
- Creates dependency graphs

### 2. Dependency Graph Generator
```bash
python .claude/libs/dependency-graph-generator.py scan
python .claude/libs/dependency-graph-generator.py --mermaid  # Visualization
```
- Detects circular dependencies
- Identifies isolated services
- Maps critical paths

### 3. Business Rule Registry
```bash
python .claude/libs/business-rule-registry.py scan
python .claude/libs/business-rule-registry.py validate
```
- Extracts TIN/BIN/NID validation rules
- Tracks NBR/RAJUK compliance rules
- Versions rule changes

### 4. Integration Point Catalog
```bash
python .claude/libs/integration-point-catalog.py scan
python .claude/libs/integration-point-catalog.py inventory
```
- Documents REST/GraphQL/WebSocket endpoints
- Tracks bKash/Nagad/NBR integrations
- Validates API contracts

### 5. Performance Baseline Metrics
```bash
python .claude/libs/performance-baseline-metrics.py measure auth
python .claude/libs/performance-baseline-metrics.py trends
python .claude/libs/performance-baseline-metrics.py alerts
```
- Establishes service KPIs
- Detects performance degradation
- Generates alerts on threshold violations

**13 total tools available** in `.claude/libs/`. All require manual execution - they're not automatically invoked.

---

## Task Management

### Current Task State

Always check before starting work:
```bash
cat .claude/state/current_task.json
```

**Required format**:
```json
{
  "task": "h-implement-finance-backend-business-logic",
  "branch": "feature/implement-finance-backend-business-logic",
  "services": ["finance", "tax", "reporting"],
  "updated": "2025-10-16",
  "complexity": 75,
  "mode": "implement"
}
```

### Task Lifecycle (Manual)

**1. Create Task** - Manually create file in `sessions/tasks/`
```bash
# Optional: Use complexity analyzer first
python .claude/libs/complexity-analyzer.py analyze task-description.md
```

**2. Start Task** - Manually update state
- Edit `.claude/state/current_task.json`
- Check out git branch
- Optionally run context-gathering agent

**3. Work on Task** - Use agents and workflows
- Use Task tool for agent invocation
- Run intelligence tools for validation
- Update work logs as you progress

**4. Complete Task** - Manually finalize
- Run validation tools
- Update work log
- Archive task file
- Clear `.claude/state/current_task.json`

**Note**: There are no slash commands for task management. It's all manual or via Task tool.

---

## Hooks (What Actually Runs Automatically)

Located in `.claude/hooks/`, these Python scripts run automatically:

### 1. session-start.py
- **Trigger**: When Claude Code session starts
- **Actions**:
  - Loads current task context
  - Displays task status and available tasks
  - Shows git branch info

### 2. user-messages.py
- **Trigger**: When user submits a message
- **Actions**:
  - Context monitoring (warns if > 80% usage)
  - Agent suggestions based on keywords
  - MCP server suggestions
  - Emergency stop detection

### 3. sessions-enforce.py
- **Trigger**: Before Write/Edit/MultiEdit/Bash commands
- **Actions**:
  - Validates that a task is set
  - Prevents edits without active task

### 4. post-tool-use.py
- **Trigger**: After Edit/Write/MultiEdit commands
- **Actions**:
  - Tracks progress
  - Updates session logs

**That's it**. These 4 hooks are the only automation in the system. Everything else requires manual execution.

---

## Bangladesh ERP Guidelines

### Mandatory Validations

Always validate:
- **TIN**: 10-digit tax identification number (`/^\d{10}$/`)
- **BIN**: 9-digit business identification number (`/^\d{9}$/`)
- **NID**: 10-17 digit national ID (`/^\d{10,17}$/`)
- **Mobile**: `01[3-9]-XXXXXXXX` format (`/^01[3-9]\d{8}$/`)
- **VAT**: 15% standard rate (as of 2025)
- **Fiscal Year**: July 1 to June 30

### Critical Business Paths

Protected operations requiring extra validation:

```typescript
const CRITICAL_PATHS = {
  finance: ["transaction_processing", "ledger_updates", "tax_calculation"],
  inventory: ["stock_movements", "valuation", "costing"],
  payroll: ["salary_calculation", "tax_deduction", "disbursement"],
  compliance: ["nbr_reporting", "rajuk_submission", "audit_trail"]
};
```

### Integration Standards

**Payment Gateways**:
- **bKash**: Grant token, Create, Execute, Query, Refund, Webhook
- **Nagad**: Similar flow with different API structure
- **SSLCommerz**: Direct payment + IPN callback

**Government APIs**:
- **NBR**: TIN verification, Mushak 6.3/9.1 submission
- **RAJUK**: Building plan submission, approval tracking
- **NID**: National ID verification

**Banking**:
- **BRAC, DBBL, EBL**: Direct debit, salary disbursement
- **Standard formats**: BEFTN, RTGS

**SMS**:
- **Banglalink, Grameenphone**: OTP, notifications
- Bengali character support required

---

## Performance Standards

### Response Time Targets

| Operation | Good | Acceptable | Poor |
|-----------|------|------------|------|
| API endpoints | < 300ms | < 500ms | > 1000ms |
| Database queries | < 100ms | < 250ms | > 500ms |
| Page loads | < 2s | < 3s | > 5s |
| Standard reports | < 10s | < 30s | > 60s |

### Monitoring Practices

**Before implementation**:
```bash
python .claude/libs/performance-baseline-metrics.py baseline
```

**After implementation**:
```bash
python .claude/libs/performance-baseline-metrics.py measure finance
python .claude/libs/performance-baseline-metrics.py alerts
```

**Continuous monitoring**:
- Structured logs at `.claude/logs/workflow-engine.jsonl`
- Prometheus metrics (available via `metrics-server.py`, not running by default)
- Grafana dashboards (template at `.claude/monitoring/grafana-dashboard.json`)

---

## Monitoring & Logging

### Structured Logging

All workflow executions are logged in JSON Lines format:

```json
{
  "timestamp": "2025-10-16T04:11:09.100293",
  "level": "INFO",
  "component": "workflow-engine",
  "message": "Workflow execution started",
  "context": {
    "workflow_name": "finance-feature",
    "workflow_id": "6e97213b",
    "pattern": "sequential"
  }
}
```

**Query logs**:
```bash
python .claude/libs/structured-logger.py query --log-file .claude/logs/workflow-engine.jsonl --level INFO
python .claude/libs/structured-logger.py analyze --log-file .claude/logs/workflow-engine.jsonl
```

### Monitoring Integration (Available, Not Active)

**Prometheus metrics** (start manually):
```bash
python .claude/libs/metrics-server.py --port 9090
curl http://localhost:9090/metrics  # Prometheus format
curl http://localhost:9090/health   # JSON health check
```

**Grafana dashboards**:
- Template: `.claude/monitoring/grafana-dashboard.json`
- Metrics: Workflow executions, success rate, cache stats, agent performance
- **Status**: Template ready, not deployed

---

## Code Philosophy

### Locality of Behavior
- Keep related code close together
- Avoid excessive abstraction
- Functions should live with the data structures they operate on

### Bangladesh-First Design
- Default to Bengali language support
- Implement NBR/RAJUK compliance by default
- Test with Bangladesh data patterns (TIN, BIN, mobile numbers)
- Use Bangladesh fiscal year (July-June) for all financial logic

### Minimal Abstraction
- Prefer simple function calls over complex inheritance
- Use shared libraries (in `shared/`) for cross-service functionality
- Avoid premature optimization

### Readability > Cleverness
- Code should be obvious and easy to follow
- Include Bengali comments where domain-specific
- Follow consistent structure across all services

---

## Validation Checklist

Before marking any task complete, verify:

### Code Quality
- [ ] All intelligence tools run (dependency, rules, integration, performance)
- [ ] No circular dependencies detected
- [ ] Business rules validated for Bangladesh compliance
- [ ] API contracts match implementation
- [ ] Performance baselines maintained or improved

### ERP Compliance
- [ ] TIN/BIN/NID validations implemented correctly
- [ ] VAT calculations follow NBR guidelines (15%)
- [ ] Fiscal year logic uses July-June
- [ ] Bengali language support where required
- [ ] Audit trails implemented for critical paths

### Testing
- [ ] Unit tests cover business logic
- [ ] Integration tests verify API contracts
- [ ] E2E tests validate user workflows
- [ ] Performance tests establish baselines
- [ ] Compliance tests verify NBR/RAJUK regulations

---

## Emergency Procedures

### Context Overflow (> 80% usage)
```bash
python .claude/libs/context-optimizer.py optimize
```

### Performance Degradation
```bash
python .claude/libs/performance-baseline-metrics.py alerts
python .claude/libs/dependency-graph-generator.py --critical-paths
# Identify bottlenecks and use performance-profiler agent
```

### Compliance Violation
```bash
python .claude/libs/business-rule-registry.py validate --strict
# Fix violations before proceeding with implementation
```

### Agent Execution Failure
```bash
python .claude/libs/agent-cache.py invalidate --agent business-logic-validator
# Re-run with fresh execution
```

---

## Quick Reference Card

### Directory Structure
```
.claude/
├── agents/                 # 9 agent prompt definitions
│   └── templates/          # Agent templates
├── cache/                  # Agent execution cache (auto-managed)
│   ├── checkpoints/        # Workflow checkpoints
│   ├── workflow-history/   # Execution history
│   └── stats.json          # Cache statistics
├── docs/                   # Meta documentation
│   ├── AGENT_CACHING.md
│   └── ORCHESTRATION_PATTERNS.md
├── hooks/                  # 4 active hooks (auto-run)
│   ├── session-start.py
│   ├── user-messages.py
│   ├── sessions-enforce.py
│   ├── post-tool-use.py
│   ├── shared_state.py
│   └── README.md
├── libs/                   # 13 intelligence tools + workflow engine
│   ├── workflow-engine.py
│   ├── agent-cache.py
│   ├── complexity-analyzer.py
│   ├── business-rule-registry.py
│   ├── dependency-graph-generator.py
│   ├── integration-point-catalog.py
│   ├── performance-baseline-metrics.py
│   ├── context-optimizer.py
│   ├── structured-logger.py
│   ├── metrics-server.py
│   └── [others]
├── monitoring/             # Monitoring templates (not deployed)
│   └── grafana-dashboard.json
├── state/                  # Active state
│   ├── current_task.json
│   ├── business-rules.json
│   ├── integration-catalog.json
│   └── NEXT_SESSION_INSTRUCTIONS.md
├── workflows/              # 6 workflow definitions (JSON)
│   ├── finance-feature.json
│   ├── bangladesh-compliance.json
│   ├── payment-gateway-test.json
│   ├── data-migration.json
│   ├── performance-optimization.json
│   └── health-check.json
├── settings.json           # Hooks configuration
├── settings.local.json     # Local overrides
└── COMMAND_QUICK_REFERENCE.md

sessions/tasks/             # Active and completed tasks
docs/workflow-history/      # Archived phase reports, checkpoints
```

### Most Used Commands
```bash
# Agent execution (Task tool)
Task(description="...", prompt="...", subagent_type="business-logic-validator")
Task(description="...", prompt="...", subagent_type="code-review")
Task(description="...", prompt="...", subagent_type="Explore")

# Workflow orchestration
python .claude/libs/workflow-engine.py run --workflow finance-feature

# Intelligence tools (manual)
python .claude/libs/complexity-analyzer.py analyze task.md
python .claude/libs/business-rule-registry.py validate
python .claude/libs/dependency-graph-generator.py scan
python .claude/libs/performance-baseline-metrics.py measure auth

# Cache management
python .claude/libs/agent-cache.py status
python .claude/libs/agent-cache.py invalidate

# Task state
cat .claude/state/current_task.json
```

### Bangladesh ERP Constants
```
VAT_RATE = 15%
FISCAL_YEAR_START = July 1
FISCAL_YEAR_END = June 30
TIN_FORMAT = /^\d{10}$/
BIN_FORMAT = /^\d{9}$/
NID_FORMAT = /^\d{10,17}$/
MOBILE_FORMAT = /^01[3-9]\d{8}$/
```

---

## What's Real vs. What's Not

### ✅ What Actually Works

1. **Agent System** - 9 agent definitions, invoked via Task tool
2. **Workflow Engine** - Semi-automated orchestration (requires Claude participation)
3. **Intelligence Tools** - 13 analysis tools (manual execution)
4. **Hooks** - 4 Python scripts run automatically
5. **Agent Caching** - 60-70% hit rate, automatic invalidation
6. **Structured Logging** - JSON Lines format for all workflows
7. **Workflow Definitions** - 6 JSON workflow templates
8. **Monitoring Templates** - Grafana dashboard, Prometheus metrics server (not running)

### ❌ What Doesn't Work (Removed)

1. **Slash Commands** - The ".md files in .claude/commands/" were just documentation, not real commands
2. **Automatic Tool Invocation** - Intelligence tools require manual bash execution
3. **Fully Automated Workflows** - Workflows are semi-automated, require Claude participation
4. **Progressive Mode System** - Removed (daic-mode.json deleted)

### 🔄 What's Available But Not Active

1. **Prometheus Metrics** - `metrics-server.py` exists but not running
2. **Grafana Dashboards** - Template exists at `.claude/monitoring/grafana-dashboard.json`
3. **Some Intelligence Tools** - Created but rarely used

---

## Version History

**v2.1** (2025-10-16)
- **Reality-based rewrite**: Removed fake slash commands, clarified semi-automation
- Deleted 29 fake slash command files
- Archived historical phase reports
- Reorganized `.claude/` directory structure
- Cleaned up custom plugin attempts
- Documented marketplace plugins integration (20 installed)
- Honest about what works vs. what doesn't

**v2.0** (2025-10-16) - Previous Version
- Documented aspirational workflow (many features didn't actually work)
- Created comprehensive infrastructure (mostly disconnected)

**v1.0** (2025-09-xx)
- Initial sessions-based workflow
- Progressive mode system (later removed)

---

## Getting Started (Realistic Approach)

1. **Check current task state**:
   ```bash
   cat .claude/state/current_task.json
   ```

2. **If no task set, create one manually**:
   - Create file in `sessions/tasks/h-task-name.md`
   - Update `.claude/state/current_task.json`

3. **Use agents via Task tool**:
   ```python
   Task(
       description="Explore codebase for payment gateways",
       prompt="Find all bKash/Nagad integration points",
       subagent_type="Explore"
   )
   ```

4. **Run intelligence tools when needed**:
   ```bash
   python .claude/libs/business-rule-registry.py validate
   ```

5. **Check marketplace plugins**:
   ```bash
   /plugin    # See 20 installed plugins
   /help      # See available commands from plugins
   ```

That's the real workflow. Simple, honest, effective.

---

*Last updated: 2025-10-16 | Reality-Based v2.1 | No fake features, just what works*
