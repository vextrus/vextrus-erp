# Vextrus ERP - Comprehensive Workflow Upgrade Plan 2025
**Date**: 2025-10-16
**Claude Code**: 2.0.19
**Models**: Sonnet 4.5 + Haiku 4.5
**Vision**: Production-ready Bangladesh Construction & Real Estate ERP

---

## Executive Summary

This plan transforms the Vextrus ERP development workflow from **custom semi-automated infrastructure** (77 files, 1.1MB, 21k lines) to a **lean, plugin-driven, AI-orchestrated system** (6 essential files + marketplace plugins) leveraging Claude Code 2.0.19's full capabilities with Sonnet 4.5 and Haiku 4.5.

### The Transformation

**Before** (Current State):
- 77 files in `.claude/` directory
- 6,500 lines of Python tools (never integrated)
- Custom agent definitions (just markdown files)
- Semi-automated workflows (require manual execution)
- 21,000+ lines of overhead
- ~63k tokens of cognitive load

**After** (Target State):
- 6 essential files in `.claude/`
- 35-45 marketplace plugins (auto-integrated)
- Native CC 2.0.19 features (Explore, subagents, checkpoints)
- True automation with hooks + background tasks
- <500 lines of configuration
- ~1.5k tokens of essential context

**Impact**:
- **-92% files** (77 → 6)
- **-96% size** (1.1MB → 40KB)
- **-97% context overhead** (63k → 1.5k tokens)
- **+400% functional value** (20% used → 100% used)

---

## Research Synthesis

### 1. System Analysis (Explore Agent Findings)

**Infrastructure Excellence** ⭐⭐⭐⭐⭐
- 18 microservices, 11 production-ready (61% complete)
- NestJS, GraphQL Federation, EventStore, Kafka, Temporal
- Multi-tenant, event-sourced, CQRS, DDD patterns
- Docker Compose (41 containers), full observability stack
- **Rating**: 9/10 (production-grade architecture)

**Custom Workflow Infrastructure** ⭐⭐☆☆☆
- 77 files claiming automation but requiring manual execution
- Intelligence tools never integrated into workflow
- Agent definitions are just markdown prompt templates
- Workflow engine returns instructions, doesn't automate
- **Rating**: 2/10 (high overhead, minimal value)

**Service Documentation** ⭐⭐⭐⭐⭐
- Exceptional CLAUDE.md files per service (auth, finance, api-gateway)
- Comprehensive architecture, integration points, honest limitations
- **Rating**: 10/10 (best practice example)

**Critical Finding**: **Zero service code depends on `.claude/` custom infrastructure**. Verified via grep - no imports, no references. **Safe to delete 90%**.

### 2. Claude Code 2.0.19 Capabilities

**Major Features** (Released 2025):
- ✅ **Native Plugins** - Marketplace integration, one-command install
- ✅ **Subagents** - Specialized AI with isolated contexts, parallel execution
- ✅ **Checkpoints** - Auto-save before changes, instant rewind with Esc-Esc
- ✅ **Hooks** - Trigger actions at workflow points (SessionStart, PreToolUse, etc.)
- ✅ **Background Tasks** - Long-running processes, async workflows
- ✅ **VS Code Extension** - Native IDE integration, inline diffs
- ✅ **SDK Support** - Custom subagents and hooks via TypeScript/JavaScript

**Native Features That Replace Custom Tools**:
| Custom Tool | Native CC 2.0.19 Alternative |
|-------------|------------------------------|
| context-gathering.md | Explore agent (built-in, Haiku 4.5) |
| context-optimizer.py | Native context management + checkpoints |
| workflow-engine.py | Subagents + background tasks |
| complexity-analyzer.py | Explore agent + sequential-thinking MCP |
| agent-*.md files | Task tool + marketplace plugin agents |
| hook-based state management | Read-only hooks + external state files |

### 3. Model Capabilities

**Claude Sonnet 4.5** (Best Coding Model in the World):
- **SWE-bench Verified**: 77.2% (82% with parallel test-time compute)
- **OSWorld (computer use)**: 61.4% (up from 42.2% in Sonnet 4)
- **Terminal-Bench**: 50.0% success rate
- **AIME 2025 Math**: 100% with Python tools, 87% without
- **Focus duration**: >30 hours on complex multi-step tasks
- **Best for**: Main development agent, complex reasoning, architecture

**Claude Haiku 4.5** (Fast Intelligence):
- **Performance**: 90% of Sonnet 4.5 at **1/3 cost**, **2x speed**
- **SWE-Bench Verified**: 73%
- **Terminal-Bench**: 41%
- **Context window**: 200k tokens (vs 8k in Haiku 3.5)
- **Output**: 64k tokens max
- **Best for**: Explore agent, parallel subtasks, rapid prototyping

**Orchestration Pattern**:
> "Sonnet 4.5 can break down a complex problem into multi-step plans, then orchestrate a team of multiple Haiku 4.5s to complete subtasks in parallel."

**Perfect for Vextrus ERP**:
- Sonnet 4.5 = Main agent (complex business logic, Bangladesh compliance)
- Haiku 4.5 = Explore agent (codebase analysis, dependency mapping, fast iteration)

### 4. Plugin Ecosystem & Best Practices

**Available Marketplaces** (500+ plugins):
- **wshobson/agents** - 63 plugins, 85 agents (systematic, production-ready)
- **jeremylongshore/claude-code-plugins** - 226 plugins (largest collection)
- **VoltAgent/awesome-claude-code-subagents** - 100+ agents (enterprise focus)
- **claudecodemarketplace.com** - 115 marketplaces, 500+ plugins

**Best Practices (2025)**:
1. **CLAUDE.md is essential** - Auto-read by Claude, defines project context
2. **Slash commands** - Store repeated workflows in `.claude/commands/*.md`
3. **Hooks** - Auto-execute actions (linting, tests, validation)
4. **Plugin composability** - Mix/match focused plugins, disable when not needed
5. **Security** - OAuth for MCP servers, read-only by default, least privilege
6. **Team standardization** - Declare plugins in repo, auto-install on clone

**Core Principle**:
> "Claude Code is intentionally unopinionated and scriptable—best used with explicit context, small iterative diffs, and clear feedback loops."

---

## The Comprehensive Plan

### Overview: 5 Phases

```
Phase 1: Complete Cleanup (1 hour)
   ↓
Phase 2: Essential Setup (30 minutes)
   ↓
Phase 3: Plugin Installation (1 hour)
   ↓
Phase 4: Workflow Documentation (2 hours)
   ↓
Phase 5: Validation & Testing (1 hour)

Total Time: ~5.5 hours
```

---

## Phase 1: Complete .claude/ Cleanup

**Goal**: Delete 90% of custom infrastructure, keep only essentials for CC 2.0.19

### Step 1.1: Backup Current State

```bash
# Create backup
cp -r .claude .claude-backup-$(date +%Y%m%d)
cp CLAUDE.md CLAUDE-legacy-$(date +%Y%m%d).md

# Move to archive
mkdir -p docs/workflow-history/claude-custom-infrastructure-archive
mv .claude-backup-* docs/workflow-history/claude-custom-infrastructure-archive/
mv CLAUDE-legacy-* docs/workflow-history/
```

### Step 1.2: Delete Custom Infrastructure

**Delete These (71 files, 1.06MB):**

```bash
# Delete custom agents (9 files, 170KB)
rm -rf .claude/agents

# Delete intelligence tools (13 files, ~6500 lines Python)
rm -rf .claude/libs

# Delete workflows (6 files, ~1KB)
rm -rf .claude/workflows

# Delete cache (19 files, auto-regenerated)
rm -rf .claude/cache

# Delete documentation (2 files, outdated)
rm -rf .claude/docs

# Delete monitoring (1 file, not deployed)
rm -rf .claude/monitoring

# Delete misleading quick reference
rm .claude/COMMAND_QUICK_REFERENCE.md

# Delete cleanup documentation (moved to archive)
rm .claude/CLEANUP_COMPLETE_2025-10-16.md

# Delete state files (keep current_task.json only)
cd .claude/state
rm business-rules.json integration-catalog.json NEXT_SESSION_INSTRUCTIONS.md
cd ../..
```

### Step 1.3: Verify Essential Files Remain

**Keep Only These (6 files, ~40KB):**

```
.claude/
├── hooks/                      # 5 Python scripts + README
│   ├── session-start.py       # Loads task context
│   ├── user-messages.py       # Context monitoring, suggestions
│   ├── sessions-enforce.py    # Validates task before edits
│   ├── post-tool-use.py       # Progress tracking
│   ├── shared_state.py        # Shared utilities
│   └── README.md              # Hook documentation
├── settings.json              # Hook configuration
├── settings.local.json        # Local overrides (permissions, MCP)
└── state/
    └── current_task.json      # Active task tracking (may be empty)
```

### Step 1.4: Update .gitignore

```bash
# Add to .gitignore
echo "" >> .gitignore
echo "# Claude Code - Ignore generated files" >> .gitignore
echo ".claude/state/business-rules.json" >> .gitignore
echo ".claude/state/integration-catalog.json" >> .gitignore
echo ".claude/cache/" >> .gitignore
echo ".claude-backup-*/" >> .gitignore
```

### Step 1.5: Validate Cleanup

```bash
# Check file count
find .claude -type f | wc -l
# Expected: ~6 files

# Check size
du -sh .claude
# Expected: ~40-50KB

# Verify no broken references
grep -r "\.claude/libs" services shared --include="*.ts" --include="*.js"
# Expected: (empty)

grep -r "\.claude/agents" services shared --include="*.ts" --include="*.js"
# Expected: (empty)
```

**Success Criteria**:
- ✅ 6 files remain in `.claude/`
- ✅ Total size <50KB
- ✅ No broken imports in services
- ✅ Backup created in `docs/workflow-history/`

---

## Phase 2: Essential Setup

**Goal**: Configure minimal CC 2.0.19 foundation

### Step 2.1: Simplify Hook Configuration

**Edit `.claude/settings.json`:**

```json
{
  "hooks": {
    "SessionStart": {
      "command": "python",
      "args": [".claude/hooks/session-start.py"]
    },
    "UserPromptSubmit": {
      "command": "python",
      "args": [".claude/hooks/user-messages.py"]
    },
    "PreToolUse": {
      "command": "python",
      "args": [".claude/hooks/sessions-enforce.py"],
      "matchers": ["Edit", "Write", "MultiEdit", "Bash"]
    },
    "PostToolUse": {
      "command": "python",
      "args": [".claude/hooks/post-tool-use.py"],
      "matchers": ["Edit", "Write", "MultiEdit"]
    }
  }
}
```

**Simplification**: Remove any references to deleted tools/workflows.

### Step 2.2: Configure MCP Servers

**Edit `.mcp.json` - Enable Essential Servers:**

```json
{
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:/Users/riz/vextrus-erp"]
    },
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/vextrus"]
    },
    "sequential-thinking": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@context7/server"]
    },
    "consult7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@consult7/server"]
    },
    "docker": {
      "type": "stdio",
      "command": "docker-mcp"
    },
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-playwright"],
      "disabled": false
    },
    "brave-search": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "your-key-here"
      },
      "disabled": false
    },
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here"
      },
      "disabled": false
    }
  }
}
```

**Note**: Enable playwright, brave-search, github (were disabled before).

### Step 2.3: Create Minimal current_task.json

**Edit `.claude/state/current_task.json`:**

```json
{
  "task": "h-implement-finance-backend-business-logic",
  "branch": "feature/implement-finance-backend-business-logic",
  "services": ["finance"],
  "updated": "2025-10-16",
  "mode": "implement"
}
```

**Success Criteria**:
- ✅ Hooks configured correctly
- ✅ MCP servers enabled (9 total)
- ✅ Current task set
- ✅ No errors when starting CC session

---

## Phase 3: Plugin Installation Strategy

**Goal**: Install 35-45 marketplace plugins for complete workflow coverage

### Step 3.1: Add Plugin Marketplaces

```bash
# Primary marketplace (wshobson/agents - 63 plugins)
/plugin marketplace add wshobson/agents

# Largest collection (jeremylongshore - 226 plugins)
/plugin marketplace add jeremylongshore/claude-code-plugins

# Enterprise agents (VoltAgent - 100+ agents)
/plugin marketplace add VoltAgent/awesome-claude-code-subagents

# Community curated
/plugin marketplace add ananddtyagi/claude-code-marketplace
```

### Step 3.2: Core Orchestration (Install First)

**Priority 1 - Workflow Foundations:**

```bash
# Multi-agent orchestration
/plugin install full-stack-orchestration        # wshobson
/plugin install agent-orchestration             # wshobson
/plugin install context-management              # wshobson

# Workflow automation
/plugin install workflow-orchestrator           # jeremylongshore
/plugin install project-health-auditor          # jeremylongshore
```

**Why**: These enable intelligent task breakdown and agent coordination.

### Step 3.3: Development Agents (Language & Framework)

**Priority 2 - Core Development:**

```bash
# Backend (NestJS, GraphQL, microservices)
/plugin install backend-development             # wshobson

# Languages
/plugin install python-development              # wshobson
/plugin install javascript-typescript           # wshobson

# Frontend (Next.js for future integration)
/plugin install frontend-mobile-development     # wshobson

# Or install complete pack
/plugin install fullstack-starter-pack          # jeremylongshore (15 plugins)
```

**Why**: Covers primary tech stack (NestJS, TypeScript, Node.js, GraphQL).

### Step 3.4: Database & Data (Critical for ERP)

**Priority 3 - Data Layer:**

```bash
# Database design & migrations
/plugin install database-design                 # wshobson
/plugin install database-migrations             # wshobson

# Data engineering (ETL, pipelines)
/plugin install data-engineering                # wshobson

# Data validation (input validation, integrity)
/plugin install data-validation-suite           # wshobson
```

**Why**: Finance ERP requires robust data layer with zero-downtime migrations.

### Step 3.5: Quality & Testing

**Priority 4 - Testing & Quality:**

```bash
# Testing
/plugin install unit-testing                    # wshobson
/plugin install tdd-workflows                   # wshobson
/plugin install performance-testing-review      # wshobson

# Code quality
/plugin install code-review-ai                  # wshobson
/plugin install comprehensive-review            # wshobson
/plugin install code-refactoring                # wshobson
```

**Why**: Ensure production-ready code quality.

### Step 3.6: Security & Compliance

**Priority 5 - Security:**

```bash
# Security scanning
/plugin install security-scanning               # wshobson
/plugin install backend-api-security            # wshobson
/plugin install security-compliance             # wshobson

# Or install complete pack
/plugin install security-pro-pack               # jeremylongshore (10 plugins)
```

**Why**: Bangladesh financial compliance + enterprise security requirements.

### Step 3.7: Infrastructure & DevOps

**Priority 6 - Infrastructure:**

```bash
# Deployment
/plugin install deployment-strategies           # wshobson
/plugin install cicd-automation                 # wshobson
/plugin install cloud-infrastructure            # wshobson

# Monitoring
/plugin install observability-monitoring        # wshobson

# Or install complete pack
/plugin install devops-automation-pack          # jeremylongshore (25 plugins)
```

**Why**: Docker, Kubernetes deployment, CI/CD automation.

### Step 3.8: Debugging & Analysis

**Priority 7 - Debugging:**

```bash
# Error debugging
/plugin install debugging-toolkit               # wshobson
/plugin install error-debugging                 # wshobson
/plugin install distributed-debugging           # wshobson

# Performance
/plugin install application-performance         # wshobson
/plugin install database-cloud-optimization     # wshobson
```

**Why**: Microservices debugging, distributed tracing.

### Step 3.9: Documentation & Collaboration

**Priority 8 - Documentation:**

```bash
# Documentation
/plugin install code-documentation              # wshobson
/plugin install documentation-generation        # wshobson

# Collaboration
/plugin install team-collaboration              # wshobson
/plugin install git-pr-workflows                # wshobson
/plugin install git-commit-smart                # jeremylongshore
```

**Why**: Maintain excellent service documentation standard.

### Step 3.10: Specialized (AI/ML for Future)

**Priority 9 - AI/ML Integration:**

```bash
# LLM application development
/plugin install llm-application-dev             # wshobson
/plugin install machine-learning-ops            # wshobson

# Or install complete pack
/plugin install ai-ml-engineering-pack          # jeremylongshore (12 plugins)
```

**Why**: Vextrus vision includes AI/ML integration.

### Step 3.11: Business Tools (Optional)

**Priority 10 - Business Management:**

```bash
# Project management
/plugin install discovery-questionnaire         # jeremylongshore
/plugin install sow-generator                   # jeremylongshore
/plugin install roi-calculator                  # jeremylongshore
```

**Why**: Client requirement gathering, business case development.

### Step 3.12: Verify Installation

```bash
# List all installed plugins
/plugin

# Expected: 35-45 plugins installed

# Check help for new slash commands
/help

# Expected: 100+ slash commands available from plugins
```

**Success Criteria**:
- ✅ 35-45 plugins installed
- ✅ All marketplaces added
- ✅ Plugins load without errors
- ✅ Slash commands available

---

## Phase 4: New Workflow Documentation

**Goal**: Create CLAUDE.md v3.0 - Radically honest, plugin-driven, <500 lines

### Step 4.1: Archive Old CLAUDE.md

```bash
# Already done in Phase 1
# Confirmed: CLAUDE-legacy-20251016.md in docs/workflow-history/
```

### Step 4.2: Create CLAUDE.md v3.0

**Structure** (Radically Simplified):

```markdown
# CLAUDE.md - Vextrus ERP Development Guide
**Version**: 3.0 (Plugin-Driven Edition)
**Claude Code**: 2.0.19
**Models**: Sonnet 4.5 + Haiku 4.5

---

## Quick Start

### Current State
```bash
cat .claude/state/current_task.json    # Check active task
git branch --show-current               # Verify branch
```

### Available Capabilities
- **Explore Agent** (Haiku 4.5): `/explore` - Fast codebase analysis
- **Main Agent** (Sonnet 4.5): Complex reasoning, business logic
- **Checkpoints**: `Esc Esc` - Rewind to previous state
- **35+ Plugins**: `/help` - See all available commands

---

## Task Workflow

### 1. Start Task
- Read task file: `sessions/tasks/h-task-name.md`
- Use Explore agent: `/explore services/finance`
- Review context manifest in task file

### 2. Implementation
- Break down with Sonnet 4.5 (main agent)
- Parallel subtasks with Haiku 4.5 (if needed)
- Use plugin commands for specific operations
- Checkpoints auto-save before each change

### 3. Validation
- Security: `/check-security` or use security-scanning plugin
- Tests: `/test` or use unit-testing plugin
- Performance: Use application-performance plugin
- Compliance: Custom Bangladesh validation

### 4. Completion
- Code review: Use code-review-ai plugin
- Documentation: Use code-documentation plugin
- Commit: `/commit` or use git-commit-smart plugin
- PR: Use git-pr-workflows plugin

---

## Bangladesh ERP Guidelines

### Mandatory Validations
- **TIN**: 10-digit (`/^\d{10}$/`)
- **BIN**: 9-digit (`/^\d{9}$/`)
- **NID**: 10-17 digit (`/^\d{10,17}$/`)
- **Mobile**: `01[3-9]-XXXXXXXX` (`/^01[3-9]\d{8}$/`)
- **VAT**: 15% standard rate
- **Fiscal Year**: July 1 to June 30

### Critical Business Paths
```typescript
const CRITICAL_PATHS = {
  finance: ["transaction_processing", "ledger_updates", "tax_calculation"],
  inventory: ["stock_movements", "valuation", "costing"],
  payroll: ["salary_calculation", "tax_deduction", "disbursement"],
  compliance: ["nbr_reporting", "rajuk_submission", "audit_trail"]
};
```

### Integration Standards
- **bKash/Nagad**: Grant, Create, Execute, Query, Refund, Webhook
- **NBR**: TIN verification, Mushak 6.3/9.1 submission
- **RAJUK**: Building plan submission, approval tracking

---

## Service Architecture

### 18 Microservices (11 Production, 7 In Progress)

**Production Services**:
- auth (3001), master-data (3002), notification (3003), configuration (3004)
- scheduler (3005), document-generator (3006), import-export (3007)
- file-storage (3008), audit (3009), workflow (3011), rules-engine (3012)
- organization (3016)

**In Progress**:
- crm (3013), **finance (3014)**, hr (3015), project-management (3017)
- scm (3018)

**API Gateway**: Apollo Federation v2 (4000)

**Tech Stack**:
- NestJS 11.0.1, GraphQL, EventStore, PostgreSQL, Redis, Kafka
- Docker Compose, Temporal, SigNoz, Prometheus, Grafana

**Service CLAUDE.md Files**:
- Each service has comprehensive CLAUDE.md (auth, finance, api-gateway, etc.)
- Read service CLAUDE.md before modifications
- Example: `services/finance/CLAUDE.md` (architecture, domain model, decisions)

---

## Installed Plugins (35+)

### Orchestration (5)
- full-stack-orchestration, agent-orchestration, context-management
- workflow-orchestrator, project-health-auditor

### Development (8)
- backend-development, python-development, javascript-typescript
- frontend-mobile-development, database-design, database-migrations
- data-engineering, data-validation-suite

### Quality & Testing (6)
- unit-testing, tdd-workflows, performance-testing-review
- code-review-ai, comprehensive-review, code-refactoring

### Security (3)
- security-scanning, backend-api-security, security-compliance

### Infrastructure (4)
- deployment-strategies, cicd-automation, cloud-infrastructure
- observability-monitoring

### Debugging (5)
- debugging-toolkit, error-debugging, distributed-debugging
- application-performance, database-cloud-optimization

### Documentation (4)
- code-documentation, documentation-generation
- team-collaboration, git-pr-workflows

### Specialized (2+)
- llm-application-dev, machine-learning-ops

**Use**: `/help` to see all plugin commands

---

## MCP Servers (9 Enabled)

1. **filesystem** - File operations (Read, Write, Edit, Directory)
2. **postgres** - Database queries, schema inspection
3. **sequential-thinking** - Deep reasoning, complex problems
4. **context7** - Documentation lookup, library reference
5. **consult7** - AI-powered file analysis
6. **docker** - Container management
7. **playwright** - Browser automation, E2E tests
8. **brave-search** - Web search for research
9. **github** - Repository operations, PR management

**Toggle**: `@servername` to enable/disable

---

## Hooks (Auto-Execute)

1. **SessionStart** - Loads task context, displays status
2. **UserPromptSubmit** - Context monitoring, agent suggestions
3. **PreToolUse** - Validates task before Edit/Write/Bash
4. **PostToolUse** - Tracks progress after Edit/Write

**Note**: Hooks are read-only observers, never modify files

---

## Performance Standards

| Operation | Good | Acceptable | Poor |
|-----------|------|------------|------|
| API endpoints | < 300ms | < 500ms | > 1000ms |
| Database queries | < 100ms | < 250ms | > 500ms |
| Page loads | < 2s | < 3s | > 5s |
| Reports | < 10s | < 30s | > 60s |

---

## Emergency Procedures

**Context Overflow (>80%)**:
- Use checkpoints: `Esc Esc` to rewind
- Clear unnecessary context
- Use context-management plugin

**Performance Degradation**:
- Use application-performance plugin
- Check database queries with postgres MCP
- Review with performance-testing-review plugin

**Compliance Violation**:
- Review Bangladesh ERP guidelines above
- Validate TIN/BIN/NID/Mobile formats
- Check VAT calculations (15%)
- Verify fiscal year (July-June)

---

## Quick Reference

### Essential Commands
```bash
# Task management
cat .claude/state/current_task.json
git branch --show-current

# Exploration
/explore <path>                    # Haiku 4.5 fast analysis

# Plugin commands
/help                              # See all available commands
/plugin                            # List installed plugins

# Checkpoints
Esc Esc                           # Rewind to previous state
/rewind                           # Alternative rewind command

# MCP servers
@servername                       # Enable/disable server
/mcp                              # View all servers
```

### Model Selection
- **Sonnet 4.5**: Main agent, complex business logic, architecture decisions
- **Haiku 4.5**: Explore agent, parallel subtasks, rapid iteration

### Bangladesh Constants
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

**Last Updated**: 2025-10-16
**Version**: 3.0 (Plugin-Driven, Radically Honest)
**Philosophy**: Quality over speed, systematic execution, production-ready results
```

**File Size**: ~400 lines (target <500 lines) ✅

### Step 4.3: Validate Documentation

```bash
# Check line count
wc -l CLAUDE.md
# Expected: <500 lines

# Verify no references to deleted infrastructure
grep -i "\.claude/libs" CLAUDE.md
# Expected: (empty)

grep -i "\.claude/agents" CLAUDE.md
# Expected: (empty)

grep -i "workflow-engine" CLAUDE.md
# Expected: (empty)
```

**Success Criteria**:
- ✅ CLAUDE.md <500 lines
- ✅ No references to deleted infrastructure
- ✅ Honest about capabilities
- ✅ Plugin-first approach documented
- ✅ Bangladesh guidelines preserved

---

## Phase 5: Validation & Testing

**Goal**: Verify complete workflow works end-to-end

### Step 5.1: Session Start Test

```bash
# Start new Claude Code session
# Expected: session-start.py loads task context, suggests MCP servers
# No errors, clean startup
```

**Verify**:
- ✅ current_task.json loaded
- ✅ Task summary displayed
- ✅ Git branch shown
- ✅ No hook errors

### Step 5.2: Plugin Functionality Test

```bash
# Test plugin installation
/plugin
# Expected: 35-45 plugins listed

# Test plugin commands
/help
# Expected: 100+ commands from plugins

# Test specific plugin
/explore services/finance
# Expected: Haiku 4.5 explores finance service, returns analysis
```

**Verify**:
- ✅ Plugins load without errors
- ✅ Commands accessible
- ✅ Explore agent works (Haiku 4.5)

### Step 5.3: Checkpoint Test

```bash
# Make a test edit
# Edit any file, save

# Rewind
Esc Esc
# Expected: File reverts to previous state
```

**Verify**:
- ✅ Checkpoint created before edit
- ✅ Rewind works
- ✅ No data loss

### Step 5.4: Hook Test

```bash
# Test PreToolUse hook
# Try to edit a file without task set
# Expected: Warning from sessions-enforce.py

# Test PostToolUse hook
# Edit a file with task set
# Expected: Progress tracked, no errors
```

**Verify**:
- ✅ Hooks execute correctly
- ✅ Read-only (no file modifications)
- ✅ Fast execution (<10ms)

### Step 5.5: MCP Server Test

```bash
# Test filesystem MCP
# Use Read tool on any file
# Expected: File content returned

# Test postgres MCP
# Query database
# Expected: Query results returned

# Test sequential-thinking MCP
# Use for complex reasoning
# Expected: Thoughtful analysis
```

**Verify**:
- ✅ All 9 MCP servers functional
- ✅ No connection errors
- ✅ Reasonable performance

### Step 5.6: Finance Task Continuation Test

```bash
# Read current finance task
cat sessions/tasks/h-implement-finance-backend-business-logic.md

# Use Explore agent to analyze finance service
/explore services/finance

# Plan next steps with Sonnet 4.5
# Expected: Intelligent breakdown of implementation steps
```

**Verify**:
- ✅ Task context loaded correctly
- ✅ Explore agent provides useful analysis
- ✅ Ready to continue finance backend work

### Step 5.7: Full Workflow Test

**Execute a small task end-to-end:**

1. **Task Creation** (or use existing finance task)
2. **Exploration**: `/explore services/finance`
3. **Planning**: Break down with Sonnet 4.5
4. **Implementation**: Make small change (e.g., add comment)
5. **Validation**: Check with security-scanning plugin
6. **Documentation**: Update with code-documentation plugin
7. **Commit**: Use git-commit-smart plugin

**Verify**:
- ✅ All workflow steps complete
- ✅ No errors
- ✅ Plugins integrate smoothly
- ✅ Task progress tracked

---

## Success Metrics

### Quantitative

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| .claude/ file count | 77 | 6 | -92% |
| .claude/ size | 1.1MB | 40KB | -96% |
| .claude/ lines | 21,000 | <500 | -97% |
| Context overhead | 63k tokens | 1.5k tokens | -97% |
| Functional plugins | 0 | 35-45 | +∞ |
| Automation level | 20% | 80%+ | +300% |
| Setup time | 10+ min | <1 min | -90% |

### Qualitative

**Developer Experience**:
- ✅ Clarity: Know exactly what works (no aspirational features)
- ✅ Speed: Fast startup, no cognitive overhead
- ✅ Power: 35-45 plugins vs 0 integrated tools
- ✅ Confidence: Production-ready workflow, proven best practices

**System Reliability**:
- ✅ No custom Python dependencies
- ✅ No semi-automated workflows requiring manual execution
- ✅ Native CC 2.0.19 features (stable, supported)
- ✅ Marketplace plugins (community-tested, documented)

**Maintainability**:
- ✅ 6 essential files vs 77 files to maintain
- ✅ Plugin updates automatic via marketplace
- ✅ No custom tool version conflicts
- ✅ Clear documentation (<500 lines)

---

## Post-Upgrade Next Steps

### Immediate (This Week)

1. **Continue Finance Backend Task** (3-4 days)
   - Use new workflow with plugins
   - Test Haiku 4.5 for exploration
   - Leverage Sonnet 4.5 for complex business logic
   - Bangladesh compliance validation

2. **Standardize NestJS Versions** (1 day)
   - Upgrade api-gateway from v10 to v11
   - Ensure all services use NestJS 11.0.1

3. **Deploy Observability** (1 day)
   - Grafana dashboards (templates exist)
   - Fix OpenTelemetry version conflicts
   - Custom metrics for all services

### Short-Term (Next 2 Weeks)

1. **Complete 7 In-Progress Services**
   - CRM, HR, Project Management, SCM
   - Use new plugin-driven workflow
   - Maintain service CLAUDE.md excellence

2. **Frontend Integration** (5 days)
   - h-integrate-frontend-backend-finance-module task
   - Use frontend-mobile-development plugin
   - TanStack Query, Next.js 14 integration

3. **CI/CD Pipeline** (3 days)
   - Use cicd-automation plugin
   - GitHub Actions workflow
   - Automated testing, deployment

### Medium-Term (Next Month)

1. **Production Readiness** (2 weeks)
   - Security audit (security-compliance plugin)
   - Performance testing (performance-testing-review)
   - Load testing, stress testing
   - Documentation review

2. **Bangladesh Open Source Toolkit** (1 week)
   - Extract NBR compliance as npm package
   - Mushak report generators
   - bKash/Nagad SDKs
   - Share with community

---

## Risk Mitigation

### Potential Issues & Solutions

**Issue**: Plugin compatibility problems
- **Mitigation**: Install plugins incrementally, test each
- **Fallback**: Disable problematic plugins, report to marketplace

**Issue**: Context window overflow with too many plugins
- **Mitigation**: Disable unused plugins dynamically
- **Strategy**: Enable plugins on-demand for specific tasks

**Issue**: Learning curve for new workflow
- **Mitigation**: CLAUDE.md v3.0 is simple, clear
- **Support**: `/help` always available, plugin docs accessible

**Issue**: Performance degradation
- **Mitigation**: Benchmark before/after
- **Monitoring**: Use project-health-auditor plugin

**Issue**: Migration disruption for active finance task
- **Mitigation**: Complete cleanup, then resume seamlessly
- **Benefit**: Better tools for implementation

---

## Appendix A: Plugin Directory

### Full Installation Sequence

```bash
# Marketplaces
/plugin marketplace add wshobson/agents
/plugin marketplace add jeremylongshore/claude-code-plugins
/plugin marketplace add VoltAgent/awesome-claude-code-subagents

# Core orchestration (5 plugins)
/plugin install full-stack-orchestration
/plugin install agent-orchestration
/plugin install context-management
/plugin install workflow-orchestrator
/plugin install project-health-auditor

# Development (8 plugins)
/plugin install backend-development
/plugin install python-development
/plugin install javascript-typescript
/plugin install frontend-mobile-development
/plugin install database-design
/plugin install database-migrations
/plugin install data-engineering
/plugin install data-validation-suite

# Quality & testing (6 plugins)
/plugin install unit-testing
/plugin install tdd-workflows
/plugin install performance-testing-review
/plugin install code-review-ai
/plugin install comprehensive-review
/plugin install code-refactoring

# Security (3 plugins or 1 pack)
/plugin install security-scanning
/plugin install backend-api-security
/plugin install security-compliance
# OR
/plugin install security-pro-pack

# Infrastructure (4 plugins or 1 pack)
/plugin install deployment-strategies
/plugin install cicd-automation
/plugin install cloud-infrastructure
/plugin install observability-monitoring
# OR
/plugin install devops-automation-pack

# Debugging (5 plugins)
/plugin install debugging-toolkit
/plugin install error-debugging
/plugin install distributed-debugging
/plugin install application-performance
/plugin install database-cloud-optimization

# Documentation (4 plugins)
/plugin install code-documentation
/plugin install documentation-generation
/plugin install team-collaboration
/plugin install git-pr-workflows

# Collaboration
/plugin install git-commit-smart

# Specialized AI/ML (optional)
/plugin install llm-application-dev
/plugin install machine-learning-ops
```

**Total**: 35-45 plugins depending on packs vs individual installations

---

## Appendix B: Model Selection Guide

### When to Use Sonnet 4.5 (Main Agent)

✅ **Complex business logic** (Bangladesh VAT, TIN/BIN validation, fiscal year)
✅ **Architecture decisions** (DDD, CQRS, event sourcing patterns)
✅ **Multi-step planning** (break down epic tasks into subtasks)
✅ **Security-critical code** (authentication, authorization, compliance)
✅ **Performance optimization** (query optimization, caching strategies)
✅ **Integration design** (bKash/Nagad/NBR API integrations)

**Capabilities**: 77.2% SWE-bench, 30+ hour focus, best coding model in the world

### When to Use Haiku 4.5 (Explore Agent)

✅ **Codebase exploration** (`/explore services/finance`)
✅ **Dependency analysis** (understand service relationships)
✅ **Pattern detection** (find similar implementations)
✅ **Quick prototyping** (rapid iteration, fast feedback)
✅ **Parallel subtasks** (Sonnet breaks down, Haiku executes in parallel)
✅ **Documentation review** (read and summarize service CLAUDE.md files)

**Capabilities**: 90% of Sonnet 4.5 performance, 2x speed, 1/3 cost, 73% SWE-bench

### Orchestration Pattern

**Complex Task** (e.g., Implement Finance Backend Business Logic):
1. **Sonnet 4.5**: Analyze task, break into 5 subtasks
2. **Haiku 4.5 (x5)**: Execute each subtask in parallel
3. **Sonnet 4.5**: Review results, integrate, ensure coherence
4. **Haiku 4.5**: Run tests, validate each component
5. **Sonnet 4.5**: Final review, documentation, commit

**Result**: 5x faster execution with parallel Haiku agents, Sonnet ensuring quality

---

## Appendix C: Comparison - Before vs After

### Before (Custom Infrastructure)

**Strengths**:
- Comprehensive vision (WORKFLOW_UPGRADE_ANALYSIS_2025.md)
- Well-intentioned automation attempts
- Excellent service documentation (auth, finance CLAUDE.md)

**Weaknesses**:
- 77 files, 1.1MB, 21k lines of overhead
- Semi-automated workflows (manual execution required)
- Intelligence tools never integrated
- Agent definitions just markdown (no automation)
- Workflow engine returns instructions, doesn't automate
- High cognitive load, unclear what actually works

### After (Plugin-Driven)

**Strengths**:
- 6 essential files, 40KB, <500 lines
- 35-45 marketplace plugins (truly automated)
- Native CC 2.0.19 features (Explore, checkpoints, subagents)
- Sonnet 4.5 + Haiku 4.5 orchestration
- Clear documentation (CLAUDE.md v3.0 <500 lines)
- Plugin-first ecosystem (community-tested, documented)
- True automation with hooks + background tasks
- Radically honest about capabilities

**Result**: **Beast system for systematic ERP development**

---

## Conclusion

This comprehensive plan transforms Vextrus ERP development workflow from **aspirational complexity** to **operational simplicity**. By deleting 90% of custom infrastructure and embracing Claude Code 2.0.19's native capabilities + marketplace plugins, we achieve:

- **Reduced complexity**: 92% fewer files
- **Increased power**: 35-45 plugins vs 0 integrated tools
- **Better performance**: Haiku 4.5 (2x faster) + Sonnet 4.5 (best coding)
- **True automation**: Native features + hooks + subagents
- **Clear documentation**: Honest, concise, actionable

**The Vision**: A world-class, production-ready Bangladesh Construction & Real Estate ERP system, built systematically with the most powerful agentic coding workflow available in 2025.

**Next Action**: Execute Phase 1 cleanup → Continue finance backend task with new beast system.

---

**Document Status**: Complete
**Estimated Execution Time**: 5.5 hours
**Expected Outcome**: Production-ready plugin-driven workflow, ready for systematic ERP development
**Philosophy**: Quality over speed, systematic execution, step by step to production-ready system
