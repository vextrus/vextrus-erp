# Skills Archive - V4.0

**Archived**: 2025-10-24
**Reason**: Claude Code 2.0.26 bug - skills not triggering (GitHub issue #9954)

## Original V4.0 Skills (4 total)

1. **haiku-explorer** - Fast codebase exploration
2. **vextrus-domain-expert** - Bangladesh Construction & Real Estate compliance
3. **production-ready-workflow** - Checkpoint-driven development
4. **graphql-event-sourcing** - Core architecture patterns

## Why Archived?

Skills have proper YAML frontmatter and configuration, but Claude Code 2.0.26 has a confirmed bug where built-in skills are not registering or activating. Even with explicit triggers ("where", "find", "Bangladesh", "VAT", "checkpoint", "GraphQL"), skills remain inactive.

## V5.0 Alternative

Until the skills bug is fixed, V5.0 uses:

### Slash Commands (Explicit Activation)
- `/checkpoint` - Enforced checkpoint creation with mandatory reviews
- `/review [files]` - Run kieran-typescript-reviewer agent
- `/commit` - Guided commit workflow with quality gates

### Agent Cards (Quick Reference)
- `.claude/agent-cards/` - One-page summaries for common agents
- Direct invocation: "Run kieran-typescript-reviewer agent on [files]"

### VEXTRUS-PATTERNS.md (Comprehensive Patterns)
- 17 sections covering all technical patterns
- Referenced as needed (not always loaded)

## Restoration Plan

When Claude Code fixes the skills bug:
1. Move `.claude/skills-archive-v4/skills/` back to `.claude/skills/`
2. Update skill versions to 5.0
3. Test activation with trigger words
4. Deprecate redundant slash commands

## Context Impact

- V4.0 (with skills): ~400 tokens (0.2%)
- V5.0 (archived): 0 tokens
- **Savings**: Minimal, but skills weren't working anyway

---

**Status**: Archived pending Claude Code bug fix
**Alternative**: Slash Commands + Agent Cards + VEXTRUS-PATTERNS.md
**Version**: V5.0
