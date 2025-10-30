# Plugin & Agent Reference

**Quick reference for Vextrus ERP plugin system**

---

## Complete Guide

**See**: `sessions/knowledge/vextrus-erp/plugin-usage-guide.md` (~600 lines)

Comprehensive documentation for:
- 41 installed plugins
- 107 available agents
- Usage patterns by task type
- Common workflows
- Context management
- Tips & tricks

---

## Quick Reference

### Automated Quality Gates (Slash Commands)

```bash
/review                  # Code review (code-review-ai)
/security-scan          # Security analysis (security-scanning)
/test                   # Run tests (unit-testing)
/docs                   # Update documentation (documentation-generation)
```

### Most Common Agents (Use Task tool)

**Backend Development**:
- `backend-development:backend-architect` - API design, microservices
- `backend-development:graphql-architect` - GraphQL schema design
- `database-design:database-architect` - Database schema design
- `database-design:sql-pro` - Query optimization

**Quality & Testing**:
- `compounding-engineering:kieran-typescript-reviewer` - TypeScript quality
- `compounding-engineering:performance-oracle` - Performance analysis
- `compounding-engineering:security-sentinel` - Security audit
- `compounding-engineering:architecture-strategist` - Architecture review

**Debugging**:
- `debugging-toolkit:debugger` - General debugging
- `error-debugging:error-detective` - Log analysis, error patterns

**Documentation**:
- `documentation-generation:docs-architect` - Technical documentation
- `documentation-generation:mermaid-expert` - Diagrams

### Complete Agent Catalog

**See**: `sessions/knowledge/vextrus-erp/agent-catalog.md` (~900 lines)

All 107 agents documented with:
- Specialization areas
- When to use
- How to invoke
- Key capabilities

---

## Context Optimization

**MCP On-Demand**:
- Enable only when needed: `@postgres`, `@docker`, `@github`, `@serena`
- Default: sequential-thinking only (1.5k tokens)
- Savings: 98.6% context reduction (111k → 1.5k)

**See**: `sessions/knowledge/vextrus-erp/context-optimization-tips.md`

---

## Workflow Patterns

**See**: `sessions/knowledge/vextrus-erp/workflow-patterns.md` (~850 lines)

10 proven patterns including:
- Simple feature implementation
- Complex feature with compounding cycle
- Bug investigation & fix
- Database operations
- GraphQL API development
- Refactoring
- Security implementation
- Performance optimization
- New microservice creation

---

## Quality Gates

**See**: `sessions/knowledge/vextrus-erp/quality-gates-checklist.md` (~800 lines)

Complete pre-PR checklist with:
- Required automated gates
- Optional advanced reviews
- Domain-specific validations
- Compounding codify phase

---

**Last Updated**: 2025-10-16
**For Details**: See comprehensive guides in `sessions/knowledge/vextrus-erp/`
