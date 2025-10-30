# CLAUDE.sessions.md - Enterprise ERP Optimized Edition

This file provides collaborative guidance and philosophy when using the Claude Code Sessions system with enterprise-grade optimizations for Bangladesh Construction & Real Estate ERP development.

## Collaboration Philosophy

**Core Principles**:
- **Investigate patterns** - Look for existing examples, understand established conventions, don't reinvent what already exists
- **Confirm approach** - Explain your reasoning, show what you found in the codebase, get consensus before proceeding  
- **State your case if you disagree** - Present multiple viewpoints when architectural decisions have trade-offs
- **Progressive refinement** - Start with exploration, progress through prototype to implementation
- **Validate continuously** - Use intelligence tools to verify compliance and performance
- When working on highly standardized tasks: Provide SOTA (State of the Art) best practices
- When working on paradigm-breaking approaches: Generate "opinion" through rigorous deductive reasoning from available evidence

## Progressive Mode System

### Current Mode Management
The system now uses **Progressive Modes** instead of binary DAIC:

```bash
pmode                     # Check current mode
pmode explore            # Read-only exploration
pmode prototype          # Test directory writes
pmode implement          # Full implementation
pmode validate           # Testing and validation
pmode deploy            # Production deployment
```

### Mode Characteristics
| Mode | Read | Write | Test | Use Case |
|------|------|-------|------|----------|
| **explore** | ✅ | ❌ | ❌ | Understanding code, planning |
| **prototype** | ✅ | test/* only | ✅ | Trying ideas, POCs |
| **implement** | ✅ | ✅ | ✅ | Building features |
| **validate** | ✅ | ❌ | ✅ | Testing, verification |
| **deploy** | ✅ | production/* | ✅ | Production changes |

### Auto-Elevation Triggers
- "let's implement" → prototype mode
- "make it so" → implement mode
- "test this" → validate mode
- "deploy this" → deploy mode (requires confirmation)

## Task Management

### Best Practices
- One task at a time (check .claude/state/current_task.json)
- Check task complexity before starting
- Update work logs as you progress  
- Mark todos as completed immediately after finishing
- Use intelligence tools for analysis

### Quick State Checks
```bash
# Core State
cat .claude/state/current_task.json     # Current task
cat .claude/state/progressive-mode.json # Current mode
git branch --show-current                # Current branch

# Intelligence Commands
python .claude/libs/complexity-analyzer.py analyze tasks/current.md
python .claude/libs/dependency-graph-generator.py --summary
python .claude/libs/business-rule-registry.py validate
python .claude/libs/integration-point-catalog.py inventory
python .claude/libs/performance-baseline-metrics.py report
```

### Task Complexity Management
Before starting complex tasks, analyze complexity:

```bash
# Analyze task complexity
cd .claude/libs
python complexity-analyzer.py analyze ../sessions/tasks/task-name.md

# If complexity > 75 points, generate split plan
python complexity-analyzer.py split ../sessions/tasks/task-name.md
```

**Complexity Thresholds**:
- **< 10**: Trivial - Direct implementation
- **10-25**: Small - Single session work
- **25-50**: Medium - Multi-session work
- **50-75**: Large - Consider splitting
- **75+**: Epic/Mega - Must split into subtasks

### current_task.json Format

**ALWAYS use this exact format for .claude/state/current_task.json:**
```json
{
  "task": "task-name",        // Just the task name, NO path, NO .md extension
  "branch": "feature/branch", // Git branch (NOT "branch_name")
  "services": ["service1"],   // Array of affected services/modules
  "updated": "2025-08-27",    // Current date in YYYY-MM-DD format
  "complexity": 45,           // Optional: Complexity score
  "mode": "implement"         // Optional: Current progressive mode
}
```

## Using Specialized Agents

### Core Workflow Agents

1. **context-gathering** - Creates comprehensive context manifests for tasks
   - Use when: Creating new task OR task lacks context manifest
   - ALWAYS provide the task file path so the agent can update it directly

2. **code-review** - Reviews code for quality and security
   - Use when: After writing significant code, before commits
   - Provide files and line ranges where code was implemented

3. **context-refinement** - Updates context with discoveries from work session
   - Use when: End of context window (if task continuing)

4. **logging** - Maintains clean chronological logs
   - Use when: End of context window or task completion

5. **service-documentation** - Updates service CLAUDE.md files
   - Use when: After service changes

### ERP-Specific Agents (NEW)

6. **business-logic-validator** - Validates Bangladesh business rules
   - Use when: Implementing financial, tax, or regulatory features
   - Validates: NBR compliance, VAT calculations, TIN/BIN formats
   - Checks: RAJUK regulations, fiscal year rules, Bengali formats

7. **data-migration-specialist** - Handles complex data migrations
   - Use when: Database schema changes, bulk imports, ETL operations
   - Capabilities: Zero-downtime migrations, rollback strategies
   - Validates: Data integrity, Bengali character encoding

8. **api-integration-tester** - Tests external integrations
   - Use when: Integrating with bKash/Nagad, government portals
   - Tests: REST/GraphQL contracts, webhooks, authentication
   - Validates: NBR/RAJUK API compliance

9. **performance-profiler** - Analyzes performance bottlenecks
   - Use when: Slow queries, high memory usage, poor response times
   - Measures: Query optimization, caching effectiveness
   - Establishes: Performance baselines, alerts on degradation

### Agent Principles
- **Delegate heavy work** - Let agents handle file-heavy operations
- **Be specific** - Give agents clear context and goals
- **One agent, one job** - Don't combine responsibilities
- **Trust agent expertise** - ERP agents have domain knowledge

## Intelligence Tools

### Analysis Tools
Located in `.claude/libs/`, these tools provide deep insights:

#### Dependency Graph Generator
```bash
python dependency-graph-generator.py scan      # Analyze all dependencies
python dependency-graph-generator.py --mermaid # Generate visualization
```
- Detects circular dependencies
- Identifies isolated services
- Maps critical paths

#### Business Rule Registry
```bash
python business-rule-registry.py scan     # Extract all rules
python business-rule-registry.py validate # Check compliance
```
- Tracks TIN/BIN/NID validation
- Monitors NBR/RAJUK compliance
- Versions rule changes

#### Integration Point Catalog
```bash
python integration-point-catalog.py scan      # Find all APIs
python integration-point-catalog.py inventory # Generate report
```
- Documents REST/GraphQL/WebSocket endpoints
- Tracks bKash/Nagad integrations
- Validates API contracts

#### Performance Baseline
```bash
python performance-baseline-metrics.py measure auth  # Measure service
python performance-baseline-metrics.py trends       # Analyze trends
```
- Establishes KPIs
- Detects performance degradation
- Generates alerts

#### Task Complexity Analyzer
```bash
python complexity-analyzer.py analyze task.md  # Analyze complexity
python complexity-analyzer.py split task.md    # Generate split plan
```
- Calculates complexity scores
- Suggests task splitting
- Creates dependency graphs

## Context Optimization

### Automatic Management
Context optimizer activates at 80%+ usage with suggestions:
- Archive completed subtasks
- Summarize old discussions  
- Focus on current objectives

### Manual Optimization
```bash
# Check context usage
cat .claude/state/context-warning-*.flag

# Run context optimizer manually
python .claude/libs/context-optimizer.py optimize
```

### Context Retention by Mode
- **explore**: Full context retained
- **prototype**: Keep relevant code and decisions
- **implement**: Focus on changes and errors
- **validate**: Test results and fixes only
- **deploy**: Audit trail only

## ERP Domain Guidelines

### Bangladesh-Specific Validations
Always validate these patterns:
- **TIN**: 10-digit tax identification
- **BIN**: 9-digit business identification  
- **NID**: 10-17 digit national ID
- **Mobile**: 01[3-9]-XXXXXXXX format
- **VAT**: 15% standard rate
- **Fiscal Year**: July to June

### Critical Business Paths
Protected operations requiring extra validation:
```python
CRITICAL_PATHS = {
    "finance": ["transaction_processing", "ledger_updates", "tax_calculation"],
    "inventory": ["stock_movements", "valuation", "costing"],
    "payroll": ["salary_calculation", "tax_deduction", "disbursement"],
    "compliance": ["nbr_reporting", "rajuk_submission", "audit_trail"]
}
```

### Integration Patterns
Standard patterns for external services:
- **Payment Gateways**: bKash, Nagad, SSLCommerz
- **Government APIs**: NBR, RAJUK, NID verification
- **Banking**: BRAC, DBBL, EBL integrations
- **SMS**: Banglalink, Grameenphone APIs

## Performance Standards

### Response Time Targets
- API endpoints: < 300ms (good), < 500ms (acceptable)
- Database queries: < 100ms (good), < 250ms (acceptable)
- Page loads: < 2s (good), < 3s (acceptable)
- Report generation: < 10s for standard reports

### Monitoring Practices
```bash
# Before implementation
python performance-baseline-metrics.py baseline

# After implementation  
python performance-baseline-metrics.py measure service-name

# Check for degradation
python performance-baseline-metrics.py alerts
```

## Code Philosophy

### Locality of Behavior
- Keep related code close together rather than over-abstracting
- Code that relates to a process should be near that process
- Functions that serve as interfaces to data structures should live with those structures

### Solve Today's Problems
- Deal with local problems that exist today
- Avoid excessive abstraction for hypothetical future problems
- But consider Bangladesh regulatory requirements that may change

### Minimal Abstraction
- Prefer simple function calls over complex inheritance hierarchies
- Just calling a function is cleaner than complex inheritance scenarios
- Use shared libraries for cross-service functionality

### Readability > Cleverness
- Code should be obvious and easy to follow
- Same structure in every file reduces cognitive load
- Include Bengali comments where domain-specific

## Protocol Management

### CRITICAL: Protocol Recognition Principle

**When the user mentions protocols:**

1. **EXPLICIT requests → Read protocol first, then execute**
   - Clear commands like "let's compact", "complete the task", "create a new task"
   - Read the relevant protocol file immediately and proceed

2. **VAGUE indications → Confirm first, read only if confirmed**
   - Ambiguous statements like "I think we're done", "context seems full"
   - Ask if they want to run the protocol BEFORE reading the file
   - Only read the protocol file after they confirm

**Never attempt to run protocols from memory. Always read the protocol file before executing.**

### Protocol Files and Recognition

These protocols guide specific workflows:

1. **sessions/protocols/task-creation.md** - Creating new tasks
   - EXPLICIT: "create a new task", "let's make a task for X"
   - VAGUE: "we should track this", "might need a task for that"
   - NEW: Auto-runs complexity analyzer for new tasks

2. **sessions/protocols/task-startup.md** - Beginning work on existing tasks  
   - EXPLICIT: "switch to task X", "let's work on task Y"
   - VAGUE: "maybe we should look at the other thing"
   - NEW: Sets appropriate progressive mode based on task phase

3. **sessions/protocols/task-completion.md** - Completing and closing tasks
   - EXPLICIT: "complete the task", "finish this task", "mark it done"
   - VAGUE: "I think we're done", "this might be finished"
   - NEW: Runs validation suite before completion

4. **sessions/protocols/context-compaction.md** - Managing context window limits
   - EXPLICIT: "let's compact", "run context compaction", "compact and restart"
   - VAGUE: "context is getting full", "we're using a lot of tokens"
   - NEW: Uses context optimizer for intelligent archiving

### Behavioral Examples

**Progressive Mode Awareness:**
- User: "Let's explore this codebase"
- You: [Set explore mode] → "Switching to explore mode for read-only analysis..."

**Complexity Detection:**
- User: "Create a task for implementing full invoice system"
- You: [Run complexity analyzer] → "This task scores 95 complexity points. Let me create a split plan..."

**ERP Validation:**
- User: "Implement the tax calculation"
- You: [Check NBR rules] → "I'll implement this following NBR's 15% VAT requirements..."

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
- [ ] VAT calculations follow NBR guidelines
- [ ] Fiscal year logic uses July-June
- [ ] Bengali language support where required
- [ ] Audit trails implemented for critical paths

### Testing
- [ ] Unit tests cover business logic
- [ ] Integration tests verify API contracts
- [ ] E2E tests validate user workflows
- [ ] Performance tests establish baselines
- [ ] Compliance tests verify regulations

## Emergency Procedures

### Context Overflow
```bash
# Immediate actions
pmode explore                    # Lock writes
python .claude/libs/context-optimizer.py emergency-archive
# Then run context-compaction protocol
```

### Performance Degradation
```bash
python performance-baseline-metrics.py alerts
python dependency-graph-generator.py --critical-paths
# Identify bottlenecks and optimize
```

### Compliance Violation
```bash
python business-rule-registry.py validate --strict
python api-integration-tester.py verify-compliance
# Fix violations before proceeding
```

## Quick Reference Card

### Most Used Commands
```bash
# Mode Management
pmode                           # Check mode
pmode implement                 # Switch mode

# Task Management  
cat .claude/state/current_task.json
python complexity-analyzer.py analyze task.md

# Validation
python business-rule-registry.py validate
python performance-baseline-metrics.py alerts

# Context Management
python context-optimizer.py status
```

### Key File Locations
- Task state: `.claude/state/current_task.json`
- Mode state: `.claude/state/progressive-mode.json`
- Intelligence tools: `.claude/libs/*.py`
- ERP agents: `.claude/agents/*-validator.md`
- Templates: `sessions/templates/*/`

### Bangladesh ERP Constants
- VAT Rate: 15%
- Fiscal Year: July 1 - June 30
- TIN Format: 10 digits
- BIN Format: 9 digits
- Mobile: 01[3-9]-XXXXXXXX

---
*This optimized workflow maintains discipline while adding enterprise-grade capabilities for production ERP deployment.*