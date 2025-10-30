# Vextrus ERP - Ultimate Development Workflow

**Claude Code**: 2.0.19 | **Models**: Sonnet 4.5 + Haiku 4.5
**Plugins**: 41 | **Agents**: 107 | **MCP**: On-demand

---

## Quick Start

**Daily workflow for experienced developers**:

```bash
# 1. Check current task
cat .claude/state/current_task.json

# 2. Explore codebase (Haiku 4.5 - fast & cheap)
/explore services/finance

# 3. Work with plugins
/help                    # Discover all commands
/review                  # Code review
/test                    # Run tests
/security-scan           # Security analysis

# 4. Complete task
cat sessions/protocols/task-completion.md
```

---

## Core Workflows

### Simple Tasks (Single Service, <1 day)

**Plugin-first approach**:
1. Explore: `/explore services/[name]`
2. Implement: Use Sonnet 4.5 with specialized plugins
3. Quality: `/review`, `/test`, `/security-scan`
4. Commit: Standard git workflow

### Complex Tasks (Multi-service, Multi-day)

**SpecKit + Sessions protocol-guided**:
1. **Plan**: Create feature spec (`sessions/specs/[name].md`)
   - SpecKit template for structured planning
   - Constitution principles, best practices research
   - Technical approach and quality gates
2. **Start**: `sessions/protocols/task-startup.md`
   - Git branch management
   - Task state initialization
   - Load feature spec and service docs
3. **Execute**: Compounding cycle (`sessions/protocols/compounding-cycle.md`)
   - Plan → Delegate → Assess → Codify
   - Use 107 specialized agents
   - Quality compounding throughout
4. **Complete**: `sessions/protocols/task-completion.md`
   - All quality gates (automated + specialized agents)
   - Learning capture with feedback-codifier
   - Task archival and knowledge base updates

### Compounding Engineering Cycle

**For quality improvement and learning**:

1. **Plan** - Break down with clear steps
   - Use: architecture-strategist, best-practices-researcher
2. **Delegate** - Execute with specialized agents
   - Use: backend-architect, database-architect, etc.
3. **Assess** - Test thoroughly and verify quality
   - Use: kieran-*-reviewer, performance-oracle, security-sentinel
4. **Codify** - Record learnings for next time
   - Use: docs-architect, feedback-codifier

**Philosophy**: Each unit of work makes the next easier.

---

## 107 Available Agents

**Orchestration** (5 plugins → 5 agents):
- full-stack-orchestration, agent-orchestration, context-management
- workflow-orchestrator, project-health-auditor

**Backend Development** (10 plugins → 18 agents):
- backend-architect, graphql-architect, tdd-orchestrator
- database-architect, sql-pro, database-admin, database-optimizer
- django-pro, fastapi-pro, python-pro, data-engineer
- backend-security-coder, api-documenter

**Quality & Testing** (7 plugins → 14 agents):
- code-reviewer, tdd-orchestrator, test-automator
- performance-engineer, architect-review, comprehensive-review
- security-auditor, legacy-modernizer

**Security** (3 plugins → 6 agents):
- security-auditor (3 instances), backend-security-coder (2 instances)

**Infrastructure** (4 plugins → 16 agents):
- deployment-engineer (3), terraform-specialist (3)
- cloud-architect (3), kubernetes-architect (2)
- devops-troubleshooter (2), hybrid-cloud-architect, network-engineer
- observability-engineer

**Debugging** (6 plugins → 11 agents):
- debugger (3), error-detective (3), devops-troubleshooter
- dx-optimizer (2), performance-engineer, database-optimizer

**Documentation** (4 plugins → 9 agents):
- docs-architect, tutorial-engineer, api-documenter (2)
- mermaid-expert, reference-builder, code-reviewer (2)

**Specialized** (4 plugins → 11 agents):
- ai-engineer, prompt-engineer, data-scientist
- ml-engineer, mlops-engineer, frontend-developer, mobile-developer
- javascript-pro, typescript-pro, data-engineer

**Compounding Engineering** (1 plugin → 17 agents):
- architecture-strategist, best-practices-researcher, code-simplicity-reviewer
- data-integrity-guardian, dhh-rails-reviewer, every-style-editor
- feedback-codifier, framework-docs-researcher, git-history-analyzer
- kieran-python-reviewer, kieran-rails-reviewer, kieran-typescript-reviewer
- pattern-recognition-specialist, performance-oracle, pr-comment-resolver
- repo-research-analyst, security-sentinel

**View all**: `/help` or `/agents`

---

## Essential Commands

```bash
# Task Management
cat .claude/state/current_task.json    # Current task
cat sessions/tasks/h-*.md              # Task files

# Exploration (Haiku 4.5 - fast, cheap, 73% SWE-bench)
/explore services/finance              # Service exploration
/explore @services/finance/src/domain  # Specific path

# Plugin Operations (Quality Gates)
/review                  # code-review-ai plugin
/test                   # unit-testing plugin
/security-scan          # security-scanning plugin
/docs                   # documentation-generation plugin

# Complex Workflows
cat sessions/protocols/task-startup.md      # Systematic start
cat sessions/protocols/task-completion.md   # Quality-gated completion
cat sessions/protocols/context-compaction.md # Context maintenance

# Checkpoints
Esc Esc                 # Rewind changes
/rewind                 # Alternative
```

---

## MCP Servers (On-Demand)

**Active** (minimize context):
- `sequential-thinking` (1.5k tokens) - Complex reasoning

**Enable when needed** with `@servername`:
```bash
@postgres              # Database queries
@docker                # Container management
@playwright            # Browser automation
@github                # Repository operations
@serena                # Advanced code analysis
@context7              # Library documentation
@consult7              # Technical consultations
```

**Context Optimization**:
- Before: 111k tokens (all MCPs enabled) = 55% of context
- After: 1.5k tokens (on-demand) = 0.7% of context
- **Savings**: 98.6% reduction

---

## Service Architecture

**18 Microservices**: NestJS 11, GraphQL Federation, PostgreSQL, EventStore, Kafka, Docker Compose

**Production** (11):
- auth, master-data, notification, configuration, scheduler
- document-generator, import-export, file-storage, audit
- workflow, rules-engine, organization

**In Progress** (7):
- finance, crm, hr, project-management, scm, inventory, reporting

**Each service has**: `services/<name>/CLAUDE.md` (architecture, domain model, decisions)

**Read before modifying**: `cat services/<name>/CLAUDE.md`

---

## Model Selection

| Task Type | Agent | Why |
|-----------|-------|-----|
| Exploration | Haiku 4.5 | 2x faster, 1/3 cost, 73% SWE-bench |
| Complex logic | Sonnet 4.5 | 77% SWE-bench, 30h focus, best coding |
| Parallel work | Haiku 4.5 (x5) | Execute subtasks simultaneously |
| Integration | Sonnet 4.5 | Ensure coherence across changes |

---

## Context Optimization

**Critical for 200k token limit**:

### 1. MCP On-Demand
Enable only when needed with `@servername`:
- Default: sequential-thinking only (1.5k tokens)
- On-demand: @postgres, @docker, @playwright, @github, @serena
- **Result**: 98.6% context reduction (111k → 1.5k)

### 2. Reference > Embed
**Don't do this** (3168 lines!):
```markdown
## Context Manifest
[Copy entire service architecture here]
[Copy entire domain model here]
[Copy all business rules here]
```

**Do this instead** (<100 lines):
```markdown
## Context
See: `services/finance/CLAUDE.md` for architecture
Use: `/explore services/finance` for analysis
Key files:
- Domain: `src/domain/aggregates/invoice/`
- Resolvers: `src/graphql/resolvers/`
```

### 3. Task File Size Limits
- **Target**: <500 lines per task file
- **Maximum**: 1000 lines (if exceeded, split task)
- **Use**: Explore agent for context gathering
- **Pattern**: Reference service docs, don't copy them

### 4. Plugin Subagents
- Separate context windows per agent
- Specialized expertise without main context pollution
- Automatic context management

---

## Validation Checklist

**Before task completion**:
- [ ] Security scan (`/security-scan`)
- [ ] Code review (`/review`)
- [ ] Tests pass (`/test`)
- [ ] Performance check (performance-oracle agent)
- [ ] Architecture review (architecture-strategist agent)
- [ ] Documentation updated (`/docs` or docs-architect agent)
- [ ] Compounding codify (learnings captured)

---

## Hooks (Auto-Execute)

**SessionStart**: Load task, display status, suggest MCP servers
**UserPromptSubmit**: Context monitoring, agent suggestions
**PreToolUse**: Validate task set before Edit/Write/Bash
**PostToolUse**: Track progress, suggest next actions

**Location**: `.claude/hooks/*.py`
**Config**: `.claude/settings.json`
**Note**: Read-only observers, never modify files

---

## Code Philosophy

**Locality of Behavior**: Keep related code together, avoid excessive abstraction

**Minimal Abstraction**: Prefer simple functions over complex inheritance

**Readability > Cleverness**: Code should be obvious and easy to follow

**Domain-Driven**: Follow patterns in service CLAUDE.md files

---

## Compounding Engineering Philosophy

**Core Principle**: Each unit of engineering work makes subsequent units of work easier—not harder.

**Workflow**:
1. **Plan** it out in detail → architecture-strategist, best-practices-researcher
2. **Delegate** to specialized agents → Use 107 available agents
3. **Assess** thoroughly (quality gates) → kieran-*-reviewer, performance-oracle, security-sentinel
4. **Codify** learnings for next time → docs-architect, feedback-codifier

**17 Specialized Agents**:
- architecture-strategist (architecture review)
- best-practices-researcher (research patterns)
- code-simplicity-reviewer (simplification)
- data-integrity-guardian (data validation)
- framework-docs-researcher (framework docs)
- kieran-python-reviewer (Python quality)
- kieran-typescript-reviewer (TypeScript quality)
- pattern-recognition-specialist (pattern detection)
- performance-oracle (performance optimization)
- security-sentinel (security audit)
- git-history-analyzer (historical context)
- feedback-codifier (capture feedback patterns)
- pr-comment-resolver (PR workflow)
- And 4 more specialized reviewers

**Protocol**: `sessions/protocols/compounding-cycle.md`
**SpecKit Template**: `sessions/specs/TEMPLATE.md`

---

## Getting Started

### Experienced Developer
1. **Check task**: `cat .claude/state/current_task.json`
2. **Explore**: `/explore services/finance`
3. **Use plugins**: `/help` for all commands
4. **Quality gates**: `/review`, `/test`, `/security-scan`
5. **Complete**: Follow checklist above

### Complex Multi-Service Task
1. **Start**: Read `sessions/protocols/task-startup.md`
2. **Execute**: Plugin-driven with compounding cycle
3. **Complete**: Follow `sessions/protocols/task-completion.md`
4. **Codify**: Capture learnings

### New to Project
1. **Read**: Service CLAUDE.md files (`services/*/CLAUDE.md`)
2. **Explore**: Use `/explore` liberally
3. **Start simple**: Pick a small task
4. **Learn plugins**: `/help` to discover commands

---

## Advanced: Sessions System

**Full workflow protocols** in `sessions/`:

### Protocols (5 files, 2000+ lines)
- `task-creation.md` (263 lines) - Task initialization with SpecKit integration
- `task-startup.md` (336 lines) - Git setup, constitution review, spec loading
- `compounding-cycle.md` (600+ lines) - Plan → Delegate → Assess → Codify
- `task-completion.md` (505 lines) - Quality gates, learning capture, archival
- `context-compaction.md` (307 lines) - Context optimization and reset prep

### SpecKit (Spec-Driven Development)

**Foundation**: `memory/` directory
- `constitution.md` - Non-negotiable project principles, tech stack, standards
- `plugins.md` - Quick reference to 41 plugins and 107 agents
- `patterns.md` - Quick reference to proven workflow patterns

**Feature Specs**: `sessions/specs/`
- `TEMPLATE.md` - Comprehensive spec template (500+ lines)
- 9 sections: Context, Requirements, Technical Approach, Quality Gates, etc.
- For complex features: Create spec BEFORE coding
- Link spec in task frontmatter: `spec: sessions/specs/[name].md`

**Benefits**:
- Forces upfront thinking and research
- Documents technical decisions for future reference
- Provides clear implementation guidance
- Creates learning repository for similar features

### Knowledge Base
- `knowledge/claude-code/` - Official CC 2.0.19 reference docs
- `knowledge/vextrus-erp/` - Project-specific guides:
  - `plugin-usage-guide.md` (600 lines) - 41 plugins, 107 agents
  - `agent-catalog.md` (900 lines) - Complete agent documentation
  - `workflow-patterns.md` (850 lines) - 10 proven patterns
  - `context-optimization-tips.md` (900 lines) - Context management
  - `quality-gates-checklist.md` (800 lines) - Pre-PR requirements

### Task Templates
- `TEMPLATE.md` - Modernized task template with SpecKit integration
- References constitution, enables /explore, includes quality gates

### When to Use Sessions Protocols
- Multi-service tasks
- Super-repo branch management
- Complex git workflows (subtasks, experiments)
- Formal task lifecycle
- Team collaboration

---

## Performance Standards

**API endpoints**: <300ms (good), <500ms (ok)
**Database queries**: <100ms (good), <250ms (ok)
**Page loads**: <2s (good), <3s (ok)

**Monitoring**: Use `application-performance` plugin, `postgres` MCP, SigNoz tracing

---

## Quick Reference

**Directory Structure**:
```
.claude/hooks/          # 4 auto-run scripts
.claude/state/          # current_task.json
sessions/               # Task system (91 files)
  ├── protocols/        # 4 workflow procedures
  ├── knowledge/        # Reference documentation
  ├── templates/        # 5 task templates
  └── tasks/           # Active + 74 completed
services/*/             # 18 microservices + CLAUDE.md
shared/                 # Cross-service libraries
```

---

**Version**: 5.1 (SpecKit Integration)
**Philosophy**: Spec-driven, plugin-first, compounding quality
**Integration**: Unifies 4 systems (SpecKit, plugins, sessions, compounding)
**Context**: Optimized with MCP on-demand (98.6% reduction) ✅
**Updated**: 2025-10-16 (Modernized for CC 2.0.19 + SpecKit)
