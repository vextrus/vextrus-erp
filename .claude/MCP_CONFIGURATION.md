# MCP Server Configuration for Vextrus Project

## Project Location
This project has been migrated to: `C:\Users\riz\vextrus-app`

## MCP Servers Configured

### 1. Playwright
- **Purpose**: Browser automation and testing
- **Command**: Uses npx to run @playwright/mcp
- **Config**: Runs Chromium in non-headless mode

### 2. Brave Search
- **Purpose**: Web search capabilities
- **API Key**: BSAN-x6l1bRzrW5CokyV_URi33fbtnk

### 3. Context7
- **Purpose**: Library documentation retrieval
- **API Key**: ctx7sk-a89018f2-9934-4b30-b384-23a7e6883071

### 4. Consult7
- **Purpose**: AI-powered code consultation
- **API Key**: AIzaSyDmVuWC7_gWvK7IQsUbLNPjMU4QnywnkE8

### 5. Serena
- **Purpose**: Semantic code search and analysis
- **Context**: ide-assistant
- **Installation**: Uses uv tool from GitHub

### 6. Filesystem
- **Purpose**: Direct file system access
- **Path**: C:/Users/riz/vextrus-app

### 7. GitHub
- **Purpose**: GitHub repository operations
- **Note**: GitHub token needs to be added if using

### 8. Memory
- **Purpose**: Persistent context management
- **Type**: Knowledge graph storage

### 9. Puppeteer
- **Purpose**: Alternative browser automation
- **Provider**: Cloudflare MCP server

### 10. Sequential Thinking
- **Purpose**: Complex problem breakdown
- **Type**: Reasoning enhancement

## Configuration Files

### Main MCP Configuration
- Location: `C:\Users\riz\vextrus-app\.mcp.json`

### Claude Settings (from Desktop/Vextrus)
- Copied to: `C:\Users\riz\vextrus-app\.claude\global-settings\`
- Files:
  - claude-code-mcp-config.json
  - claude-mcp-settings.json
  - claude-sentry-config.json

## Environment Variables
The following need to be set or verified:
- DATABASE_URL
- REDIS_URL
- NODE_ENV
- JWT_SECRET
- API keys for various services

## Usage Instructions

1. **Starting a session**: The MCP servers will automatically start when Claude Code is launched with this configuration.

2. **Serena Usage**: For code search and analysis
   ```
   serena.find_symbol()
   serena.search_for_pattern()
   ```

3. **Playwright Testing**: For browser automation
   ```
   playwright.browser_navigate()
   playwright.browser_snapshot()
   ```

4. **Filesystem Access**: Direct file operations
   ```
   filesystem.read_file()
   filesystem.write_file()
   ```

## Troubleshooting

### If MCP servers don't start:
1. Ensure Python and Node.js are installed
2. Check that uv tool is available for Python packages
3. Verify all API keys are valid
4. Check Windows PATH includes npm and python

### Common Issues:
- **Serena not working**: Install uv tool: `pip install uv`
- **Playwright issues**: Run `npx playwright install`
- **Permission errors**: Run as administrator if needed

## Project Structure
```
C:\Users\riz\vextrus-app\
├── .claude\              # Claude configuration and sessions
├── .mcp.json            # MCP server configuration
├── src\                 # Source code
├── prisma\              # Database schema
├── public\              # Static files
└── package.json         # Node dependencies
```

## Next Steps
1. Verify all MCP servers are working
2. Test database connection
3. Run npm install in the new directory
4. Start development server with npm run dev