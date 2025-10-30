# Phase 3: Plugin Installation Guide

**Date**: 2025-10-16
**Task**: h-execute-comprehensive-workflow-upgrade-2025
**Branch**: feature/workflow-upgrade-2025

---

## Overview

This guide provides step-by-step instructions for installing 35-45 marketplace plugins to complete the workflow upgrade. All commands are **slash commands** that you execute in your Claude Code CLI.

**Estimated Time**: 1 hour (execute commands, verify installation)

---

## Installation Strategy

**Approach**: Install plugins in priority order, testing at each major milestone.

**Available Marketplaces**: 2 verified (289 total plugins)
- `wshobson/agents` - 63 focused plugins
- `jeremylongshore/claude-code-plugins-plus` - 226 plugins

**Priorities**:
1. **Orchestration** (5 plugins) - Foundation for agent coordination
2. **Development** (8 plugins) - Core language and framework support
3. **Quality & Testing** (6 plugins) - Code quality and testing
4. **Security** (3 plugins) - Security scanning and compliance
5. **Infrastructure** (4 plugins) - DevOps and deployment
6. **Debugging** (5 plugins) - Troubleshooting and performance
7. **Documentation** (5 plugins) - Documentation and collaboration
8. **Specialized** (Optional) - AI/ML for future features

**Plugin Syntax**: When installing from specific marketplace, use `@marketplace-name`:
- From wshobson: `/plugin install plugin-name` or `/plugin install plugin-name@agents`
- From jeremylongshore: `/plugin install plugin-name@claude-code-plugins-plus`

---

## Step 1: Add Plugin Marketplaces

**✅ CORRECTED - 2 Verified Marketplaces**

```bash
# Primary marketplace (63 focused plugins)
/plugin marketplace add wshobson/agents
```
Wait for confirmation, then:

```bash
# Largest marketplace (226 plugins) - CORRECTED NAME
/plugin marketplace add jeremylongshore/claude-code-plugins-plus
```

**Expected Result**: Both marketplaces added successfully

**Verification**:
```bash
/plugin marketplace list
```

Should show:
- `wshobson/agents` (63 plugins)
- `jeremylongshore/claude-code-plugins-plus` (226 plugins)

**Total Available**: 289 plugins across 2 marketplaces (far exceeds our 35-45 target)

**Note**: VoltAgent/awesome-claude-code-subagents is NOT a marketplace - it's a reference collection requiring manual integration into `.claude/agents/`, which conflicts with our lean structure.

---

## Step 2: Install Core Orchestration (5 plugins)

**Priority**: HIGHEST - These enable agent coordination and workflow automation

**Commands** (from wshobson/agents):
```bash
/plugin install full-stack-orchestration
/plugin install agent-orchestration
/plugin install context-management
/plugin install workflow-orchestrator
/plugin install project-health-auditor
```

**Note**: If plugin not found in default marketplace, try specifying: `@agents` or `@claude-code-plugins-plus`

**Why These Matter**:
- `full-stack-orchestration` - Coordinate frontend/backend development
- `agent-orchestration` - Multi-agent task coordination
- `context-management` - Manage context window efficiently
- `workflow-orchestrator` - Automate multi-step workflows
- `project-health-auditor` - Monitor project health metrics

**Verification**:
```bash
/plugin
```
Should show 5 plugins installed.

---

## Step 3: Install Development Plugins (8 plugins)

**Priority**: HIGH - Core language and framework support

**Commands**:
```bash
/plugin install backend-development
/plugin install python-development
/plugin install javascript-typescript
/plugin install frontend-mobile-development
/plugin install database-design
/plugin install database-migrations
/plugin install data-engineering
/plugin install data-validation-suite
```

**Why These Matter**:
- `backend-development` - NestJS, GraphQL, microservices support
- `python-development` - Python tooling (for scripts, hooks)
- `javascript-typescript` - Core TypeScript/JavaScript support
- `frontend-mobile-development` - Next.js for future frontend work
- `database-design` - PostgreSQL schema design
- `database-migrations` - Zero-downtime migrations
- `data-engineering` - ETL, data pipelines
- `data-validation-suite` - Input validation, data integrity

**Verification**:
```bash
/plugin
```
Should show 13 plugins total (5 + 8).

---

## Step 4: Install Quality & Testing (6 plugins)

**Priority**: HIGH - Production-ready code quality

**Commands**:
```bash
/plugin install unit-testing
/plugin install tdd-workflows
/plugin install performance-testing-review
/plugin install code-review-ai
/plugin install comprehensive-review
/plugin install code-refactoring
```

**Why These Matter**:
- `unit-testing` - Jest, testing frameworks
- `tdd-workflows` - Test-driven development workflows
- `performance-testing-review` - Performance benchmarking
- `code-review-ai` - Automated code review
- `comprehensive-review` - Deep code analysis
- `code-refactoring` - Safe refactoring patterns

**Verification**:
```bash
/plugin
```
Should show 19 plugins total (13 + 6).

---

## Step 5: Install Security (3 plugins)

**Priority**: CRITICAL - Bangladesh ERP compliance and security

**Commands**:
```bash
/plugin install security-scanning
/plugin install backend-api-security
/plugin install security-compliance
```

**Alternative** (if available - installs 10 plugins in one pack):
```bash
/plugin install security-pro-pack
```

**Why These Matter**:
- `security-scanning` - Vulnerability scanning, dependency checks
- `backend-api-security` - API authentication, authorization
- `security-compliance` - Compliance checks (NBR, RAJUK for Bangladesh)

**Verification**:
```bash
/plugin
```
Should show 22 plugins total (19 + 3) or 29 if using pro pack.

---

## Step 6: Install Infrastructure (4 plugins)

**Priority**: MEDIUM-HIGH - DevOps and deployment

**Commands**:
```bash
/plugin install deployment-strategies
/plugin install cicd-automation
/plugin install cloud-infrastructure
/plugin install observability-monitoring
```

**Alternative** (if available - installs 25 plugins in one pack):
```bash
/plugin install devops-automation-pack
```

**Why These Matter**:
- `deployment-strategies` - Docker, Kubernetes deployment
- `cicd-automation` - GitHub Actions, CI/CD pipelines
- `cloud-infrastructure` - AWS, Azure, GCP (future)
- `observability-monitoring` - Prometheus, Grafana integration

**Verification**:
```bash
/plugin
```
Should show 26 plugins total (22 + 4) or 47 if using automation pack.

---

## Step 7: Install Debugging (5 plugins)

**Priority**: MEDIUM - Troubleshooting and performance

**Commands**:
```bash
/plugin install debugging-toolkit
/plugin install error-debugging
/plugin install distributed-debugging
/plugin install application-performance
/plugin install database-cloud-optimization
```

**Why These Matter**:
- `debugging-toolkit` - General debugging utilities
- `error-debugging` - Error analysis, stack trace interpretation
- `distributed-debugging` - Microservices debugging (critical for Vextrus)
- `application-performance` - Performance profiling
- `database-cloud-optimization` - Query optimization, caching

**Verification**:
```bash
/plugin
```
Should show 31 plugins total (26 + 5).

---

## Step 8: Install Documentation (5 plugins)

**Priority**: MEDIUM - Documentation and collaboration

**Commands**:
```bash
/plugin install code-documentation
/plugin install documentation-generation
/plugin install team-collaboration
/plugin install git-pr-workflows
/plugin install git-commit-smart
```

**Why These Matter**:
- `code-documentation` - Generate inline documentation
- `documentation-generation` - Auto-generate API docs
- `team-collaboration` - Team workflow coordination
- `git-pr-workflows` - Pull request automation
- `git-commit-smart` - Intelligent commit messages

**Verification**:
```bash
/plugin
```
Should show 36 plugins total (31 + 5).

**Target Reached**: ✅ 36 plugins (within 35-45 target range)

---

## Step 9: Optional Specialized Plugins

**Priority**: LOW - Future AI/ML integration

**Commands** (optional):
```bash
/plugin install llm-application-dev
/plugin install machine-learning-ops
```

**Alternative** (if available - installs 12 plugins in one pack):
```bash
/plugin install ai-ml-engineering-pack
```

**Why These Matter**:
- Future Vextrus vision includes AI/ML integration
- Can be installed later when needed

---

## Final Verification

### Check Marketplaces

```bash
/plugin marketplace list
```

**Expected Result**:
- wshobson/agents ✅
- jeremylongshore/claude-code-plugins-plus ✅

### Check Plugin Count

```bash
/plugin
```

**Expected Result**: 36-48 plugins installed (depending on packs vs individual)

**Target**: ✅ 35-45 plugins (SUCCESS if within range)

### Check Available Commands

```bash
/help
```

**Expected Result**: 100+ slash commands from installed plugins

### Test a Few Plugins

```bash
# Test explore functionality (built-in with Claude Code)
/explore services/finance

# Test plugin commands (if installed)
/review          # Code review
/commit          # Smart commit messages
/test            # Test generation
```

---

## Troubleshooting

### Plugin Installation Fails

**Error**: "Plugin not found"
- Check marketplace is added: `/plugin marketplace list`
- Try alternative plugin name or search marketplace

**Error**: "Plugin already installed"
- Skip to next plugin
- Verify with `/plugin`

**Error**: "Marketplace unreachable"
- Check internet connection
- Try again in a few minutes
- Skip marketplace, use others

### Too Many Plugins (Context Overhead)

**Symptoms**: Slow startup, context warnings
- Disable unused plugins: `/plugin disable <name>`
- Enable on-demand as needed: `/plugin enable <name>`

### Plugin Conflicts

**Symptoms**: Errors when using certain commands
- Disable one plugin: `/plugin disable <name>`
- Test if error resolves
- Report to marketplace if needed

---

## Success Criteria

After completing all steps, verify:

- ✅ 2 verified marketplaces added (wshobson/agents, jeremylongshore/claude-code-plugins-plus)
- ✅ 35-45 plugins installed
- ✅ No installation errors
- ✅ `/help` shows 100+ commands
- ✅ Key plugins tested (review, commit, test generation)
- ✅ Claude Code session starts without errors
- ✅ 289 total plugins available across both marketplaces

---

## What's Next

After successfully installing plugins:

1. **Phase 4**: ✅ COMPLETE - CLAUDE.md v3.0 created (515 lines, <500 line target exceeded slightly)
2. **Phase 5**: Test new workflow (session start, plugin functionality, full workflow)
3. **Resume Work**: Continue with `h-implement-finance-backend-business-logic` task using new plugin-driven workflow

---

## Plugin Installation Checklist

Mark as you complete each section:

- [x] Step 1: Add 2 verified marketplaces (wshobson/agents, jeremylongshore/claude-code-plugins-plus)
- [ ] Step 2: Install 5 orchestration plugins
- [ ] Step 3: Install 8 development plugins
- [ ] Step 4: Install 6 quality & testing plugins
- [ ] Step 5: Install 3 security plugins
- [ ] Step 6: Install 4 infrastructure plugins
- [ ] Step 7: Install 5 debugging plugins
- [ ] Step 8: Install 5 documentation plugins
- [ ] Step 9: (Optional) Install 2 specialized plugins
- [ ] Final verification: Count plugins, test commands

**Total Time**: ~30-60 minutes (depending on internet speed and manual execution)

---

## Quick Reference Card

### Most Used Commands During Installation

```bash
# Add marketplace
/plugin marketplace add <owner/repo>

# Install plugin
/plugin install <plugin-name>

# List installed plugins
/plugin

# List available commands
/help

# Disable plugin (if needed)
/plugin disable <plugin-name>

# Enable plugin (if needed)
/plugin enable <plugin-name>
```

### Expected Final State

- **Marketplaces**: 2 verified added (289 plugins available)
  - wshobson/agents (63 plugins)
  - jeremylongshore/claude-code-plugins-plus (226 plugins)
- **Plugins**: 36-48 installed
- **Commands**: 100+ available via `/help`
- **Startup**: No errors, clean session start
- **Ready**: For Phase 5 testing and production work

---

**Document Status**: Complete
**Created**: 2025-10-16
**For Task**: h-execute-comprehensive-workflow-upgrade-2025
**Philosophy**: Quality over speed, systematic execution, step by step to production-ready workflow
