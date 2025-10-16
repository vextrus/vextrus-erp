# MCP Server Reference Guide
**Vextrus ERP - Context-Optimized MCP Configuration**

## Quick Reference

### Status Overview
- **Total Servers**: 17
- **Enabled by Default**: 6 (Core)
- **Disabled by Default**: 11 (Specialized)
- **Context Usage**: ~16-18k tokens (8-9%)

---

## 📊 Server Status Table

| Server | Status | Category | Tokens | Use Case |
|--------|--------|----------|--------|----------|
| **filesystem** | ✅ Enabled | Core | ~1.5k | File operations, CRUD on codebase |
| **postgres** | ✅ Enabled | Core | ~1.2k | Database queries, schema inspection |
| **sequential-thinking** | ✅ Enabled | Core | ~1.5k | Deep reasoning, complex problem solving |
| **context7** | ✅ Enabled | Core | ~1.8k | Documentation lookup, library reference |
| **consult7** | ✅ Enabled | Core | ~1.3k | AI-powered file analysis, code search |
| **docker** | ✅ Enabled | Core | ~1.0k | Container management, Docker Compose |
| **playwright** | ⚪ Disabled | Testing | ~2.5k | Browser automation, E2E tests |
| **brave-search** | ⚪ Disabled | Research | ~1.2k | Web search, real-time information |
| **serena** | ⚪ Disabled | IDE | ~3.0k | IDE-specific assistance, code navigation |
| **github** | ⚪ Disabled | Git | ~2.0k | GitHub operations, PR management |
| **memory** | ⚪ Disabled | Persistence | ~1.0k | Long-term memory, conversation context |
| **prisma-local** | ⚪ Disabled | ORM | ~1.8k | Prisma schema management, migrations |
| **prisma-remote** | ⚪ Disabled | ORM | ~1.5k | Remote Prisma API access |
| **sqlite** | ⚪ Disabled | Database | ~1.2k | SQLite database operations |
| **brightdata** | ⚪ Disabled | Scraping | ~1.5k | Web scraping, data collection |
| **notion** | ⚪ Disabled | Integration | ~1.8k | Notion database, documentation sync |
| **reddit** | ⚪ Disabled | Research | ~1.5k | Reddit API, community research |

---

## 🎯 Enable/Disable Commands

### Quick Toggle (Via @mention)
Type `@servername` to toggle any server on/off:
```
@playwright          # Toggle Playwright on/off
@brave-search        # Toggle Brave Search on/off
@github              # Toggle GitHub on/off
```

### View Status (Via /mcp)
```
/mcp                 # View all servers with status
                     # Click to enable/disable directly in UI
```

### Manual Configuration
Edit `.mcp.json` and add/remove `"disabled": true`:
```json
{
  "playwright": {
    "disabled": true,   // ← Add this to disable
    "type": "stdio",
    ...
  }
}
```

---

## 📁 Server Categories

### Core Servers (Always Enabled)
**Purpose**: Essential for daily development work
**Context Impact**: ~16-18k tokens

1. **filesystem** - File system operations
   - Read/write files
   - Directory navigation
   - File search and manipulation

2. **postgres** - PostgreSQL database access
   - Query execution
   - Schema inspection
   - Multi-tenant database operations

3. **sequential-thinking** - Deep reasoning
   - Complex problem analysis
   - Step-by-step planning
   - Multi-faceted decision making

4. **context7** - Documentation lookup
   - Library documentation
   - API reference
   - Best practices research

5. **consult7** - AI-powered code analysis
   - Semantic code search
   - File content analysis
   - Pattern recognition

6. **docker** - Container management
   - Docker Compose operations
   - Container logs and inspection
   - Service orchestration

### Testing & Automation
**Enable when**: Running E2E tests, browser automation

- **playwright** (~2.5k tokens)
  - Browser automation (Chromium, Firefox, WebKit)
  - E2E test execution
  - Visual regression testing
  - Screenshot/PDF generation

  **Enable for**:
  - Testing invoice UI flows
  - Validating GraphQL Sandbox
  - Testing authentication flows
  - Running integration tests

### Research & Information
**Enable when**: Researching technologies, market analysis

- **brave-search** (~1.2k tokens)
  - Web search with privacy
  - Real-time information lookup
  - Technology research

  **Enable for**:
  - Researching Bangladesh regulations
  - Finding NBR compliance updates
  - Technology stack decisions
  - Market research

- **reddit** (~1.5k tokens)
  - Reddit API access
  - Community discussions
  - User feedback analysis

  **Enable for**:
  - Understanding user pain points
  - Bangladesh ERP community insights
  - Technology trend analysis

### Git & Version Control
**Enable when**: Managing Git operations, PRs, issues

- **github** (~2.0k tokens)
  - Repository operations
  - Pull request management
  - Issue tracking
  - GitHub Actions integration

  **Enable for**:
  - Creating feature branches
  - Managing pull requests
  - Reviewing code changes
  - Release management

### IDE Integration
**Enable when**: Deep IDE-specific operations needed

- **serena** (~3.0k tokens)
  - Code navigation
  - Symbol search
  - Refactoring assistance
  - IDE-specific features

  **Enable for**:
  - Large-scale refactoring
  - Symbol renaming across files
  - Advanced code navigation
  - IDE-specific workflows

### Database & ORM
**Enable when**: Working with Prisma or SQLite

- **prisma-local** (~1.8k tokens)
  - Prisma schema management
  - Migration generation
  - Local Prisma operations

- **prisma-remote** (~1.5k tokens)
  - Remote Prisma API
  - Cloud Prisma operations

- **sqlite** (~1.2k tokens)
  - SQLite database operations
  - Local database management
  - Testing with SQLite

  **Enable for**:
  - Creating Prisma migrations
  - Testing with SQLite
  - Local development database
  - ORM schema changes

### Integration & Persistence
**Enable when**: Specific integrations needed

- **memory** (~1.0k tokens)
  - Long-term conversation memory
  - Context persistence across sessions
  - Remembering user preferences

  **Enable for**:
  - Multi-session projects
  - Persistent context retention
  - Learning user patterns

- **notion** (~1.8k tokens)
  - Notion API access
  - Documentation sync
  - Knowledge base integration

  **Enable for**:
  - Syncing documentation to Notion
  - Project management integration
  - Team knowledge base updates

- **brightdata** (~1.5k tokens)
  - Web scraping
  - Data collection
  - Competitive analysis

  **Enable for**:
  - Market data collection
  - Competitive analysis
  - Web data extraction

---

## 🚀 Common Task Scenarios

### Scenario 1: Backend Development (Current Default)
**Enabled**: filesystem, postgres, sequential-thinking, context7, consult7, docker
**Context**: ~16-18k tokens
**Use**: Normal backend development, database work, Docker operations

```bash
# No changes needed - this is the default configuration
```

### Scenario 2: Frontend Integration Testing
**Add**: @playwright
**Context**: ~18-20k tokens

```bash
# Enable Playwright for E2E testing
@playwright

# Your workflow:
# 1. Implement GraphQL queries in frontend
# 2. Write Playwright tests for invoice flows
# 3. Run tests via Apollo Sandbox
# 4. Validate authentication
```

### Scenario 3: Research & Planning
**Add**: @brave-search, @context7 (already enabled)
**Context**: ~18-20k tokens

```bash
# Enable web search for research
@brave-search

# Your workflow:
# 1. Research Bangladesh NBR regulations
# 2. Look up VAT compliance updates
# 3. Find best practices for ERP systems
# 4. Research technology decisions
```

### Scenario 4: GitHub Workflow Management
**Add**: @github
**Context**: ~18-20k tokens

```bash
# Enable GitHub operations
@github

# Your workflow:
# 1. Create feature branch
# 2. Make commits
# 3. Create pull request
# 4. Manage reviews and merges
```

### Scenario 5: Database Schema Design
**Add**: @prisma-local, @sqlite
**Context**: ~20-22k tokens

```bash
# Enable Prisma and SQLite
@prisma-local
@sqlite

# Your workflow:
# 1. Design Prisma schema
# 2. Generate migrations
# 3. Test with SQLite locally
# 4. Apply to PostgreSQL production
```

### Scenario 6: Full Integration (Heavy Context)
**Add**: @playwright, @github, @memory
**Context**: ~24-26k tokens
**Use**: Complex multi-phase projects needing multiple tools

```bash
# Enable all integration tools
@playwright
@github
@memory

# Your workflow:
# 1. Full development cycle from code to deployment
# 2. Testing, version control, and persistence
# 3. Memory retains context across sessions
```

### Scenario 7: Web Scraping & Data Collection
**Add**: @brightdata, @sqlite
**Context**: ~19-21k tokens

```bash
# Enable scraping and local database
@brightdata
@sqlite

# Your workflow:
# 1. Scrape competitor pricing data
# 2. Store in SQLite for analysis
# 3. Generate reports
# 4. Make business decisions
```

### Scenario 8: Documentation Sync
**Add**: @notion, @github
**Context**: ~20-22k tokens

```bash
# Enable documentation tools
@notion
@github

# Your workflow:
# 1. Write documentation in codebase
# 2. Sync to Notion knowledge base
# 3. Create GitHub wiki pages
# 4. Maintain consistency across platforms
```

---

## 💡 Context Optimization Tips

### 1. Enable Only What You Need
- Start with core servers (default)
- Enable specialized servers for specific tasks
- Disable after task completion

### 2. Task-Based Toggling
```bash
# Before starting E2E tests
@playwright

# After tests complete
@playwright         # Toggle off to save context
```

### 3. Session Planning
- **Morning**: Planning/Research → Enable brave-search, memory
- **Midday**: Development → Default core servers
- **Afternoon**: Testing → Enable playwright, github

### 4. Monitor Context Usage
```bash
/context            # Check current context usage
                    # Aim to stay under 80k tokens (40%)
```

### 5. Strategic Grouping
Group servers by workflow phase:
- **Phase 1**: Research (brave-search, context7)
- **Phase 2**: Development (core servers)
- **Phase 3**: Testing (playwright, github)
- **Phase 4**: Documentation (notion, memory)

---

## 🔧 Advanced Configuration

### Permanent Customization
Edit `.mcp.json` to change default states:

```json
{
  "mcpServers": {
    "playwright": {
      "disabled": false,  // ← Change to false to enable by default
      "type": "stdio",
      ...
    }
  }
}
```

### Environment-Specific Configs
Create multiple config files:
```bash
.mcp.json               # Default (core servers)
.mcp.testing.json       # Testing (+ playwright, github)
.mcp.research.json      # Research (+ brave-search, reddit)
```

Load specific config:
```bash
claude --mcp-config .mcp.testing.json
```

### Server Health Check
```bash
/mcp                    # View all servers
                        # Check which are running
                        # See any connection errors
```

---

## 📈 Context Impact Analysis

### Current Setup (Core Enabled)
- **6 servers enabled**: 16-18k tokens (~8-9%)
- **11 servers disabled**: 0 tokens
- **Free space**: ~182k tokens (91%)
- **Auto-compact trigger**: 160k tokens (80%)

### Full Stack (All Enabled)
- **17 servers enabled**: 35-40k tokens (~18-20%)
- **Free space**: ~160k tokens (80%)
- **Auto-compact trigger**: 160k tokens (80%)

### Recommendation
- Keep 6 core servers always enabled
- Add 1-3 specialized servers as needed
- Total context: 20-25k tokens (10-12%)
- Leaves 175k tokens (87%) for code and conversation

---

## 🎓 Best Practices

### 1. Start Minimal
Begin each session with core servers only. Enable others as needed.

### 2. Toggle After Use
When you finish a specific task (testing, research), toggle off specialized servers.

### 3. Use /context Regularly
Monitor your context usage with `/context` to stay under 80%.

### 4. Task Isolation
Keep tasks focused. If switching contexts, toggle servers accordingly.

### 5. Session Resumption
When using `--continue` or `--resume`, check which servers are enabled and adjust.

### 6. Documentation
Document your workflow-server mappings in team documentation.

---

## 🆘 Troubleshooting

### Server Won't Enable
```bash
# Check server health
/mcp

# Look for error messages
# Common issues:
# - Missing API keys
# - Network connectivity
# - Binary not installed
```

### High Context Usage
```bash
# Check context breakdown
/context

# If MCP tools > 25k tokens:
# 1. Identify unnecessary servers in /mcp
# 2. Toggle off specialized servers not in use
# 3. Restart Claude Code to reload
```

### Server Keeps Disabling
```bash
# Check .mcp.json for "disabled": true
# Remove the flag to keep enabled by default

# Or use @mention to toggle on each session
```

### Permission Errors
```bash
# Some servers need permissions:
# - filesystem: File access
# - postgres: Database credentials
# - github: GitHub token
# - notion: Notion API key

# Check environment variables and API keys
```

---

## 📚 Quick Command Reference

| Command | Action |
|---------|--------|
| `@servername` | Toggle server on/off |
| `/mcp` | View all servers with status |
| `/context` | Check context usage |
| `/help` | View all available commands |
| `/permissions` | Manage tool permissions |

---

## 🎯 Context Budget Guidelines

**Target Context Distribution:**
- System Prompt: 15k tokens (7%)
- MCP Tools: 20k tokens (10%)
- Messages: 100k tokens (50%)
- Free Space: 65k tokens (33%)

**Current Actual Distribution:**
- System Prompt: 14.6k tokens (7.3%)
- System Tools: 13.0k tokens (6.5%)
- MCP Tools: 16.6k tokens (8.3%)
- Custom Agents: 501 tokens (0.3%)
- Memory Files: 3.8k tokens (1.9%)
- Messages: 42.9k tokens (21.5%)
- Free Space: 64k tokens (31.8%)
- Auto-compact Buffer: 45.0k tokens (22.5%)

**Status**: ✅ Well-optimized! Currently at 68% usage with comfortable margins.

---

## 📝 Notes

### Backup Files
- `.mcp.json.minimal-backup` - Your previous minimal configuration (6 servers)
- `.mcp.json.backup-full` - Original full configuration (16 servers)
- `.mcp.json` - Current configuration (17 servers, 6 enabled by default)

### Restore Options
```bash
# Restore minimal (6 servers)
cp .mcp.json.minimal-backup .mcp.json

# Restore original full (16 servers)
cp .mcp.json.backup-full .mcp.json

# Current is already optimal (17 servers, smart defaults)
```

---

## 🚀 Next Steps

1. **Restart Claude Code** to load new configuration
2. **Run /mcp** to verify server states
3. **Test toggle** with `@playwright` (enable/disable)
4. **Monitor context** with `/context`
5. **Develop workflow** patterns for your tasks

---

**Last Updated**: 2025-10-15
**Configuration Version**: 2.0 (Full Config with Smart Defaults)
**Claude Code Version**: 2.0.10+ (MCP enable/disable support)
