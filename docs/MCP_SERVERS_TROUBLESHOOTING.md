# MCP Servers Troubleshooting Guide

## Issue: MCP Servers Not Available as Tools

### Problem Description
MCP servers are configured in `.mcp.json` and enabled in `.claude/settings.local.json`, but they don't appear as available tools in Claude's interface.

### Root Cause
MCP (Model Context Protocol) servers require configuration in Claude's global configuration directory, not just in the project directory. The `.mcp.json` file in the project root is not sufficient for Claude Code to recognize and load the MCP servers.

### Solution
Create `claude_mcp_config.json` in Claude's AppData directory:
- **Location**: `C:/Users/{username}/AppData/Roaming/Claude/claude_mcp_config.json`
- **Content**: Copy the entire configuration from project's `.mcp.json`
- **Restart**: Restart Claude Code after creating the configuration file

### Configuration Status
✅ **Configured in `.mcp.json`:**
- playwright
- brave-search
- context7
- consult7
- serena
- filesystem
- github
- memory
- sequential-thinking
- prisma-local
- prisma-remote
- postgres
- sqlite
- brightdata
- notion
- reddit

✅ **Enabled in `.claude/settings.local.json`:**
- `enableAllProjectMcpServers: true`
- All servers listed in `enabledMcpjsonServers`
- Detailed configuration for each server

❌ **Not Available:**
- MCP servers don't appear as callable tools
- No MCP bridge initialization
- No active connection to MCP servers

## Workaround Solutions

### 1. Direct Command Execution
Use Bash to interact with MCP servers through their CLIs:

```bash
# Example: Using Brave Search through CLI
npx @modelcontextprotocol/server-brave-search --query "NestJS best practices 2025"

# Example: Using filesystem server
npx @modelcontextprotocol/server-filesystem --path "C:/Users/riz/vextrus-erp"

# Example: Using GitHub server
npx @modelcontextprotocol/server-github --repo "vextrus-erp"
```

### 2. Alternative Tools
Use Claude's built-in tools as alternatives:

| MCP Server | Alternative Tool | Usage |
|------------|------------------|-------|
| filesystem | Read, Write, Edit, Glob | Direct file operations |
| brave-search | WebSearch | Web searching capability |
| github | Bash (git commands) | Repository management |
| sqlite | Bash (sqlite3) | Database operations |
| memory | Write to `.serena/memory/` | Manual memory storage |

### 3. Manual MCP Server Startup
Start MCP servers manually in separate terminals:

```bash
# Terminal 1: Start Context7
npx @upstash/context7-mcp --api-key ctx7sk-a89018f2-9934-4b30-b384-23a7e6883071

# Terminal 2: Start Brave Search
npx @modelcontextprotocol/server-brave-search
```

## Development Workflow Without MCP

### For Research:
1. Use WebSearch tool for web searches
2. Use Read/Write for documentation storage
3. Use Bash for git operations

### For Context Management:
1. Store context in markdown files in `.serena/memory/`
2. Use session files in `sessions/` directory
3. Maintain state in `.claude/state/`

### For Database Operations:
1. Use Bash with sqlite3 CLI
2. Use Bash with psql for PostgreSQL
3. Write SQL scripts and execute with Bash

## Future Solution

### MCP Bridge Implementation
To properly enable MCP servers, we need:

1. **MCP Bridge Service** (`mcp-bridge.js`):
```javascript
const { MCPBridge } = require('@modelcontextprotocol/bridge');
const config = require('./.mcp.json');

class MCPServerManager {
  constructor() {
    this.servers = new Map();
  }
  
  async initializeServers() {
    for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
      const server = await this.startServer(name, serverConfig);
      this.servers.set(name, server);
    }
  }
  
  async startServer(name, config) {
    // Start MCP server process
    // Connect through stdio/websocket
    // Register with Claude tool system
  }
}
```

2. **Tool Registration Hook** (`.claude/hooks/mcp-tools.js`):
```javascript
// Register MCP servers as Claude tools
const registerMCPTools = () => {
  const tools = [];
  for (const server of mcpServers) {
    tools.push({
      name: `mcp_${server.name}`,
      description: server.description,
      parameters: server.schema,
      handler: server.execute
    });
  }
  return tools;
};
```

## Current Limitations

1. **No Direct MCP Access**: Cannot call MCP servers as tools
2. **No State Persistence**: Context7 and Memory servers can't persist state
3. **No Real-time Integration**: Can't leverage live data from BrightData/Reddit
4. **Limited Search**: Can't use Brave Search's advanced features

## Recommendations

1. **Continue with Built-in Tools**: Use WebSearch, Read, Write, etc.
2. **Manual Documentation**: Store important context in markdown files
3. **Script Automation**: Create bash scripts for common MCP operations
4. **Wait for Updates**: MCP integration may be improved in future Claude Code versions

---

**Last Updated**: December 2024
**Issue Status**: Known Limitation
**Workaround Available**: Yes