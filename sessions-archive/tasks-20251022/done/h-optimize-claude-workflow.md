---
task: h-optimize-claude-workflow
branch: feature/optimize-claude-workflow
status: in-progress
created: 2025-01-10
modules: [.claude, sessions, shared/monitoring, shared/validation]
---

# Optimize Claude Code Workflow for Enterprise ERP Development

## Problem/Goal
Our Claude Code workflow has been highly effective, but as we scale to business modules and production deployment, we need enterprise-grade enhancements. This task optimizes our development workflow to maximize efficiency, minimize context usage, and ensure production-quality output for our Bangladesh Construction & Real Estate ERP system.

## Success Criteria
- [x] Implement ERP-specific subagents for business logic validation
- [x] Create progressive implementation modes (explore/prototype/implement/validate/deploy)
- [x] Add MCP integrations for database, monitoring, and testing
- [x] Optimize context window management with smart archiving
- [x] Build business module templates for rapid development
- [x] Enhance hook intelligence for ERP-critical path protection
- [x] Create automated validation pipelines
- [x] Implement service dependency graph auto-generation
- [x] Add performance baseline tracking
- [x] Document all optimizations in comprehensive guide

## Implementation Phases

### Phase 1: Core Workflow Enhancements
- Upgrade DAIC system to progressive modes
- Implement context window optimization
- Add complexity detection for auto-task-splitting

### Phase 2: ERP-Specific Tooling
- Create business-logic-validator agent
- Build data-migration-specialist agent
- Implement api-integration-tester agent
- Add performance-profiler agent

### Phase 3: Template & Pattern Library
- CRUD service template
- Report generator template
- Approval workflow template
- Data importer template
- Integration connector template

### Phase 4: Intelligence Layer
- Service dependency graph generator
- Business rule registry
- Integration point catalog
- Performance baseline metrics

### Phase 5: Validation & Testing
- Pre-implementation check pipelines
- Business rule compliance validator
- API contract validator
- Performance impact analyzer

## Technical Approach

### 1. Progressive Implementation Modes
```python
# Replace binary discussion/implementation with:
MODES = {
    "explore": {"read": True, "write": False, "test": False},
    "prototype": {"read": True, "write": "test_dirs_only", "test": True},
    "implement": {"read": True, "write": True, "test": True},
    "validate": {"read": True, "write": False, "test": True},
    "deploy": {"read": True, "write": "production", "test": True}
}
```

### 2. Context Optimization Strategy
```json
{
  "auto_archive": {
    "completed_subtasks": true,
    "old_discussions": true,
    "threshold_tokens": 50000
  },
  "selective_loading": {
    "load_only_affected_services": true,
    "summarize_long_contexts": true,
    "reference_external_docs": true
  }
}
```

### 3. ERP Critical Path Protection
```python
CRITICAL_PATHS = {
    "finance": {
        "protected": ["transaction_processing", "ledger_updates", "tax_calculation"],
        "requires_approval": true,
        "validation_level": "strict"
    },
    "inventory": {
        "protected": ["stock_movements", "valuation", "costing"],
        "requires_approval": true,
        "validation_level": "strict"
    }
}
```

## Integration Requirements

### MCP Servers to Configure
- PostgreSQL/SQLite for direct database operations
- Monitoring server for health checks
- Testing server for automated test execution
- Documentation server for API specs

### Hook Modifications
- Enhance sessions-enforce.py with progressive modes
- Add complexity detection to user-messages.py
- Implement validation pipeline in post-tool-use.py

### Agent Specifications
Each new agent requires:
- Clear responsibility boundaries
- Integration with existing workflow
- Performance metrics tracking
- Error recovery strategies

## Performance Goals
- Reduce context usage by 40% through smart archiving
- Decrease task completion time by 30% with templates
- Eliminate 90% of business logic errors via validation
- Achieve 100% API contract compliance

## User Notes
This optimization focuses on maintaining our excellent workflow discipline while adding enterprise-grade capabilities needed for production ERP deployment. The goal is to make the system even more efficient without losing the clarity and structure that has made it successful.

## Context Manifest

### How Claude Code Workflow Currently Works: Session-Based Enterprise Development System

The Claude Code workflow is a sophisticated session-based task management system built around a set of Python hooks, specialized agents, and state management mechanisms designed for enterprise ERP development. When a developer starts a session, the system immediately establishes context through multiple interconnected components that enforce development discipline while maximizing productivity.

At the core is the DAIC (Discussion, Alignment, Implementation, Check) pattern managed through `.claude/state/daic-mode.json`. The system starts in "discussion" mode where all write operations (Edit, Write, MultiEdit) are blocked by the `sessions-enforce.py` hook. This forces proper planning before implementation. The user can toggle modes via the `daic` command, which updates the state file and enables implementation tools. The `user-messages.py` hook detects trigger phrases like "make it so" or "run that" to automatically transition from discussion to implementation mode, ensuring alignment before action.

State management is centralized through `.claude/state/` directory containing multiple JSON files. The `current_task.json` tracks active work with fields for task name, git branch, affected services, and update date. The system enforces branch consistency through the `sessions-enforce.py` hook, which validates that files being edited are in services listed in the task and on the correct git branch. This prevents accidental cross-contamination between tasks and ensures proper feature branch workflow.

The hook system operates at multiple lifecycle points defined in `.claude/settings.json`. The `UserPromptSubmit` hook runs `user-messages.py` to detect patterns and add context warnings. `PreToolUse` hooks run `sessions-enforce.py` for DAIC enforcement and branch validation, plus `task-transcript-link.py` for Task tool usage. `PostToolUse` hooks run `post-tool-use.py` for DAIC reminders and directory change notifications. The `SessionStart` hook runs `session-start.py` to initialize state on session startup.

Context window management is sophisticated with token monitoring built into `user-messages.py`. It reads transcript files to extract usage data from the most recent main-chain message, calculating context length from input_tokens, cache_read_input_tokens, and cache_creation_input_tokens. Warning flags are created at 75% and 90% usage thresholds to prevent hitting limits. The system supports both Sonnet models (800k practical limit) and smaller models (160k limit) with automatic detection.

The specialized agent system provides heavy-lifting capabilities through separate context windows. Five core agents handle specific responsibilities: `context-gathering` creates comprehensive task manifests by reading the entire codebase and documenting current state, integration points, and implementation requirements; `context-refinement` updates manifests when implementation discoveries occur; `logging` maintains chronological work logs by reading transcripts and updating task files; `code-review` analyzes code for security, performance, and consistency issues; and `service-documentation` maintains CLAUDE.md files for service-specific documentation.

Agent invocation is managed through transcript file storage in `.claude/state/[agent-name]/current_transcript_*.json` files. When agents are called, they receive full conversation context and can read/write specific files within their defined boundaries. Critical restrictions prevent agents from modifying system state files or controlling workflow - they operate within defined lanes.

Task management follows a structured protocol system with files in `sessions/protocols/`. The task creation protocol enforces naming conventions (priority prefixes h-/m-/l-/?- followed by action type like implement-/fix-/refactor-), branch mapping rules, and template usage. Task startup protocol manages context gathering and branch creation. Task completion protocol coordinates agent execution for logging and documentation. Context compaction protocol manages transcript maintenance and continuation checkpoints.

The MCP (Model Context Protocol) integration provides extensive external service access through `.mcp.json` configuration. Active servers include filesystem, github, postgres, sqlite, serena (code analysis), playwright (browser automation), memory, sequential-thinking, and various APIs. The `settings.local.json` configures permissions, performance settings, and server-specific parameters. This enables direct database operations, code analysis, web automation, and external service integration.

File system organization follows strict conventions with `services/` containing microservices, `shared/` containing reusable libraries, `apps/` for frontend applications, and `infrastructure/` for deployment configurations. The turbo.json configures the monorepo build system with dependency management and caching. The pnpm workspace configuration manages package dependencies across the entire codebase.

Performance optimization is built-in through several mechanisms. Parallel tool calls are enabled for batch operations. Context caching is configured with 15-minute duration for MCP servers. The statusline script provides real-time session information including context usage, task status, DAIC mode, modified files, and open task count. Token monitoring prevents context overflow through progressive warnings and automatic compaction triggers.

Current implementation serves a production Bangladesh Construction & Real Estate ERP system with 13+ microservices, shared libraries for contracts/kernel/utils, comprehensive observability via OpenTelemetry, RBAC with Bengali translation support, and multi-tenant architecture. The system has evolved through 48+ development sessions with full audit trails maintained through checkpoint files and work logs.

### For Claude Workflow Optimization Implementation: Enterprise-Grade Enhancements Needed

Since we're implementing comprehensive workflow optimizations for enterprise ERP development, this integration will touch every aspect of the current system while maintaining backward compatibility and existing discipline patterns.

The progressive implementation modes will require modifying the current binary DAIC system in `shared_state.py` and related hooks. Instead of just discussion/implementation, we need explore/prototype/implement/validate/deploy modes with different tool access patterns. The `sessions-enforce.py` hook will need enhancement to understand these nuanced permissions - explore mode allows read-only operations and note-taking, prototype mode enables writing to test directories, implement mode provides full access, validate mode restricts to testing tools, and deploy mode limits to production deployment tools.

Context optimization will integrate with the existing token monitoring system in `user-messages.py` but add intelligent archiving capabilities. The current transcript reading logic will be extended to identify completed subtasks, outdated discussions, and non-essential context for automatic archiving. Smart loading will need to understand service dependencies from the existing `services` array in task state and only load relevant contexts. The checkpoint system will be enhanced to create rolling snapshots that can be referenced instead of maintaining full context.

The ERP-specific agents will follow the existing agent pattern established in `.claude/agents/` but with specialized knowledge bases. The business-logic-validator will understand Bangladesh construction industry rules, RAJUK compliance requirements, and NBR tax regulations. The data-migration-specialist will work with the existing database patterns shown in the auth service and shared contracts. The api-integration-tester will leverage the current OpenTelemetry observability infrastructure and health check patterns. The performance-profiler will integrate with the existing metrics collection system shown in the telemetry modules.

Template and pattern libraries will extend the current service template system. The existing `services/service-template/` provides a foundation, but we need industry-specific templates for construction project management, real estate transactions, financial reporting, and regulatory compliance. These templates must integrate with the shared contracts system, follow the established CQRS patterns, and include the OpenTelemetry instrumentation patterns already implemented.

The intelligence layer will build upon existing architectural knowledge captured in CLAUDE.md files and shared contracts. Service dependency graph generation will analyze import statements, shared library usage, and event publishing/consumption patterns. The business rule registry will extract validation logic from existing domain aggregates and shared contracts. Integration point catalogs will document the MCP server configurations and service communication patterns.

Validation and testing pipelines will leverage the existing test infrastructure including integration tests, E2E Playwright tests, and performance benchmarks with Artillery/K6. Pre-implementation checks will analyze the existing codebase patterns, verify shared library compatibility, and validate against established architectural decisions documented in the ADR files.

### Technical Reference Details

#### Current Hook System Architecture

**Core Hook Files:**
- `user-messages.py`: Pattern detection, context monitoring, protocol triggering
- `sessions-enforce.py`: DAIC enforcement, branch validation, tool blocking
- `post-tool-use.py`: DAIC reminders, directory tracking
- `shared_state.py`: State management primitives and file operations

**Hook Registration in settings.json:**
```json
{
  "UserPromptSubmit": [{"command": "python user-messages.py"}],
  "PreToolUse": [
    {"matcher": "Write|Edit|MultiEdit|Task|Bash", "command": "python sessions-enforce.py"},
    {"matcher": "Task", "command": "python task-transcript-link.py"}
  ],
  "PostToolUse": [{"command": "python post-tool-use.py"}]
}
```

#### State Management Data Structures

**Current Task State Format (current_task.json):**
```json
{
  "task": "h-optimize-claude-workflow",
  "branch": "feature/optimize-claude-workflow", 
  "services": [".claude", "sessions", "shared/monitoring"],
  "updated": "2025-01-10"
}
```

**DAIC Mode State (daic-mode.json):**
```json
{"mode": "discussion"}
```

#### Agent System Specifications

**Agent Definition Format:**
```markdown
---
name: agent-name
description: Usage conditions and capabilities
tools: Read, Glob, Grep, Edit, MultiEdit, Bash
---
```

**Agent Boundaries:**
- context-gathering: Can only edit the specific task file provided
- logging: Updates task Work Log sections, reads transcript files
- code-review: Read-only analysis with structured output
- context-refinement: Updates Context Manifest sections only
- service-documentation: Updates service CLAUDE.md files

#### MCP Integration Architecture

**Active MCP Servers:**
- filesystem: Direct file operations with directory restrictions
- postgres/sqlite: Database operations for validation and analysis
- serena: Advanced code analysis and symbol searching
- github: Repository operations and issue management
- playwright: Browser automation for E2E testing
- memory: Knowledge base for patterns and decisions

#### Current ERP Architecture Patterns

**Microservice Structure:**
- Domain-driven design with aggregates and value objects
- CQRS pattern with command/query separation
- Event sourcing with domain events via Kafka
- OpenTelemetry instrumentation for distributed tracing
- Health check patterns with readiness/liveness separation

**Shared Libraries:**
- @vextrus/kernel: Domain primitives and base classes
- @vextrus/contracts: Interface definitions and DTOs
- @vextrus/utils: Observability utilities and decorators
- @vextrus/distributed-transactions: Transaction coordination

#### Configuration Requirements

**Environment Variables for Enhanced System:**
- Progressive mode configuration in sessions-config.json
- Context optimization thresholds and archive paths
- ERP-specific validation rules and business constraints
- Template repository locations and update frequencies
- Intelligence layer cache configurations

#### File Locations

**Implementation Areas:**
- Enhanced hooks: `.claude/hooks/sessions-enforce.py`, `user-messages.py`
- New agents: `.claude/agents/business-logic-validator.md`, `data-migration-specialist.md`
- Templates: `sessions/templates/` for ERP-specific patterns
- Intelligence: `shared/intelligence/` for dependency graphs and rule registries
- Validation: `shared/validation/` for pipeline implementations

**Configuration Files:**
- `.claude/settings.json` - Hook and MCP configuration updates
- `sessions/sessions-config.json` - Progressive mode definitions
- `shared/intelligence/business-rules.json` - Industry rule registry
- `shared/templates/patterns.json` - Template and pattern definitions

## Work Log

### 2025-01-10 - Task Completed Successfully

#### Phase 1: Core Workflow Enhancements (Completed)
- Implemented progressive mode system (explore/prototype/implement/validate/deploy)
- Created pmode command-line interface with Windows UTF-8 encoding fixes
- Enhanced context window management with intelligent optimization
- Integrated context optimizer into user-messages.py hook for automatic suggestions
- Updated CLAUDE.md with comprehensive workflow documentation

#### Phase 2: ERP-Specific Tooling (Completed)
- Created 4 specialized agents with Bangladesh construction industry expertise:
  - business-logic-validator: VAT/NBR compliance, RAJUK regulations
  - data-migration-specialist: ETL operations, zero-downtime migrations
  - api-integration-tester: Government portal integrations, payment gateway testing
  - performance-profiler: Query optimization, memory profiling, KPI tracking
- Each agent includes TIN/BIN/NID validations and bKash/Nagad payment patterns

#### Phase 3: Template & Pattern Library (Completed)
- Developed 5 ERP-specific templates:
  - CRUD Service Template with DDD/CQRS patterns
  - Report Generator Template with NBR compliance
  - Approval Workflow Template with Bangladesh amount thresholds
  - Data Importer Template with Bengali numeral conversion
  - Integration Connector Template for government portals
- All templates include Docker/Kubernetes deployment configurations

#### Phase 4: Intelligence Layer (Completed)
- Built 6 analysis tools in .claude/libs/:
  - dependency-graph-generator.py: Maps service communications and detects circular dependencies
  - business-rule-registry.py: Extracts validation logic with Bangladesh-specific patterns
  - integration-point-catalog.py: Documents API contracts and health check coverage
  - performance-baseline-metrics.py: Tracks KPIs and generates performance alerts
  - complexity-analyzer.py: Analyzes task complexity with automatic split suggestions
  - context-optimizer.py: Intelligent context management with relevance scoring
- Enhanced statusline with progressive mode indicators and UTF-8 support

#### Phase 5: Validation & Testing (Completed)
- Created comprehensive validation test suite (test-optimized-workflow.py)
- All 5 validation categories passed:
  - Progressive Modes: ✓ PASS
  - Intelligence Tools: ✓ PASS
  - ERP Validation: ✓ PASS
  - StatusLine: ✓ PASS
  - Context Optimization: ✓ PASS
- System is production-ready with all components integrated

#### Key Deliverables
- Progressive mode system replacing binary DAIC with nuanced permissions
- 6 intelligence tools for dependency analysis, business rules, and performance monitoring
- 4 ERP-specific agents with Bangladesh industry expertise
- 5 production-ready templates for rapid development
- Enhanced context optimization with automatic archiving
- Complete workflow documentation and training examples

#### Final Status
- ✅ All success criteria met
- ✅ All 5 implementation phases completed
- ✅ Validation tests passed (5/5)
- ✅ System ready for production ERP development