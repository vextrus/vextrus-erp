# MCP Servers Guide

## Overview

Model Context Protocol (MCP) servers extend Claude's capabilities with specialized tools and resources. The Vextrus ERP project leverages multiple MCP servers for enhanced development workflows, database management, and external integrations.

## Configured MCP Servers

### Core Development Servers

#### 1. Filesystem Server
**Purpose**: File system operations within the project
```json
{
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:/Users/riz/vextrus-erp"]
  }
}
```

**Capabilities**:
- Read/write files
- Directory operations
- File search and navigation
- Media file handling

#### 2. GitHub Server
**Purpose**: GitHub repository management
```json
{
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": {
      "GITHUB_PERSONAL_ACCESS_TOKEN": "env:GITHUB_PERSONAL_ACCESS_TOKEN"
    }
  }
}
```

**Capabilities**:
- Repository management
- Pull requests and issues
- Code search
- Branch operations

#### 3. Serena Server
**Purpose**: Semantic code analysis and refactoring
```json
{
  "serena": {
    "command": "npx",
    "args": ["-y", "@cline/mcp-server-serena"]
  }
}
```

**Capabilities**:
- Symbol-based code navigation
- Semantic search
- Safe code refactoring
- Project memory management

### Database Servers

#### 4. SQLite Server
**Purpose**: Local database operations
```json
{
  "sqlite": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-sqlite", "--db-path", "local.db"]
  }
}
```

**Operations**:
- Query execution
- Schema management
- Data CRUD operations

#### 5. Prisma Servers
**Purpose**: Prisma ORM and database management

**Local Prisma**:
```json
{
  "prisma-local": {
    "command": "npx",
    "args": ["@bwsdev/mcp-prisma-server"]
  }
}
```

**Remote Prisma**:
```json
{
  "prisma-remote": {
    "command": "npx",
    "args": ["@bwsdev/mcp-prisma-server"],
    "env": {
      "WORKSPACE_API_KEY": "env:ACCELERATE_API_KEY"
    }
  }
}
```

**Capabilities**:
- Schema management
- Migration generation
- Database introspection
- Prisma Studio access

### Integration Servers

#### 6. Playwright Browser
**Purpose**: Browser automation and testing
```json
{
  "playwright": {
    "command": "npx",
    "args": ["-y", "@executeautomation/playwright-mcp-server"]
  }
}
```

**Capabilities**:
- Browser automation
- E2E testing
- Screenshot capture
- Web scraping

#### 7. Brave Search
**Purpose**: Web search integration
```json
{
  "brave-search": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-brave-search"],
    "env": {
      "BRAVE_API_KEY": "env:BRAVE_API_KEY"
    }
  }
}
```

#### 8. Brightdata Scraper
**Purpose**: Advanced web scraping
```json
{
  "brightdata": {
    "command": "npx",
    "args": ["-y", "mcp-server-brightdata"],
    "env": {
      "BRIGHTDATA_API_KEY": "env:BRIGHTDATA_API_KEY"
    }
  }
}
```

### Documentation Servers

#### 9. Context7
**Purpose**: Library documentation retrieval
```json
{
  "context7": {
    "command": "npx",
    "args": ["-y", "@context7/mcp-server"]
  }
}
```

**Use Cases**:
- Fetch library documentation
- Code examples
- API references

#### 10. Consult7
**Purpose**: AI consultation for code analysis
```json
{
  "consult7": {
    "command": "npx",
    "args": ["-y", "@consult7/mcp-server"],
    "env": {
      "GEMINI_API_KEY": "env:GEMINI_API_KEY"
    }
  }
}
```

### External Services

#### 11. Notion Server
**Purpose**: Notion workspace integration
```json
{
  "notion": {
    "command": "npx",
    "args": ["-y", "mcp-server-notion"],
    "env": {
      "NOTION_API_KEY": "env:NOTION_API_KEY"
    }
  }
}
```

#### 12. Reddit Server
**Purpose**: Reddit API integration
```json
{
  "reddit": {
    "command": "npx",
    "args": ["-y", "mcp-server-reddit"],
    "env": {
      "REDDIT_CLIENT_ID": "env:REDDIT_CLIENT_ID",
      "REDDIT_CLIENT_SECRET": "env:REDDIT_CLIENT_SECRET",
      "REDDIT_USERNAME": "env:REDDIT_USERNAME",
      "REDDIT_PASSWORD": "env:REDDIT_PASSWORD"
    }
  }
}
```

### Memory & State Servers

#### 13. Memory Server
**Purpose**: Knowledge graph and memory management
```json
{
  "memory": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-memory"]
  }
}
```

**Capabilities**:
- Entity relationship management
- Knowledge persistence
- Context retention

#### 14. Sequential Thinking
**Purpose**: Complex problem-solving workflows
```json
{
  "sequential-thinking": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
  }
}
```

## Usage Patterns

### File Operations

```typescript
// Using filesystem server
mcp__filesystem__read_file({ path: "/src/main.ts" })
mcp__filesystem__write_file({ 
  path: "/src/config.ts",
  content: "export const config = {};"
})
mcp__filesystem__list_directory({ path: "/src" })
```

### Code Analysis

```typescript
// Using Serena for semantic search
mcp__serena__find_symbol({ 
  name_path: "UserService",
  include_body: true 
})

mcp__serena__search_for_pattern({
  substring_pattern: "async.*login",
  restrict_search_to_code_files: true
})
```

### Database Operations

```typescript
// Prisma operations
mcp__prisma_local__migrate_dev({
  projectCWD: "/services/auth",
  name: "add_user_table"
})

// SQLite queries
mcp__sqlite__query({
  sql: "SELECT * FROM users WHERE active = ?",
  values: [true]
})
```

### GitHub Integration

```typescript
// GitHub operations
mcp__github__create_pull_request({
  owner: "vextrus",
  repo: "erp",
  title: "Feature: Add inventory module",
  head: "feature/inventory",
  base: "main"
})

mcp__github__search_code({
  q: "repo:vextrus/erp language:typescript interface"
})
```

## Configuration Best Practices

### 1. Environment Variables

Store sensitive keys in `.env`:
```env
# MCP Server Keys
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxx
BRAVE_API_KEY=BSA_xxxxxxxxxxxx
BRIGHTDATA_API_KEY=xxxxxxxxxxxx
NOTION_API_KEY=secret_xxxxxxxxxxxx
GEMINI_API_KEY=xxxxxxxxxxxx
ACCELERATE_API_KEY=xxxxxxxxxxxx
```

### 2. Server Selection

Choose appropriate servers for tasks:
- **File operations**: Use filesystem for local, GitHub for remote
- **Code analysis**: Serena for semantic, filesystem for basic
- **Documentation**: Context7 for libraries, Consult7 for analysis
- **Database**: Prisma for ORM, SQLite for local data

### 3. Performance Optimization

Minimize server calls:
```typescript
// ❌ Bad: Multiple calls
const file1 = await mcp__filesystem__read_file({ path: "file1.ts" });
const file2 = await mcp__filesystem__read_file({ path: "file2.ts" });
const file3 = await mcp__filesystem__read_file({ path: "file3.ts" });

// ✅ Good: Batch operations
const files = await mcp__filesystem__read_multiple_files({
  paths: ["file1.ts", "file2.ts", "file3.ts"]
});
```

### 4. Error Handling

Always handle server errors:
```typescript
try {
  const result = await mcp__github__create_issue({
    owner: "vextrus",
    repo: "erp",
    title: "Bug: Login fails"
  });
} catch (error) {
  console.error("Failed to create issue:", error);
  // Fallback or retry logic
}
```

## Advanced Usage

### Combining Servers

Chain multiple servers for complex workflows:

```typescript
// 1. Search code with Serena
const symbols = await mcp__serena__find_symbol({
  name_path: "UserController"
});

// 2. Read file content
const content = await mcp__filesystem__read_file({
  path: symbols[0].location.path
});

// 3. Analyze with Consult7
const analysis = await mcp__consult7__consultation({
  files: [symbols[0].location.path],
  query: "Find security vulnerabilities",
  model: "gemini-2.5-flash"
});

// 4. Create GitHub issue if needed
if (analysis.includes("vulnerability")) {
  await mcp__github__create_issue({
    owner: "vextrus",
    repo: "erp",
    title: "Security: Vulnerability in UserController",
    body: analysis
  });
}
```

### Custom Workflows

Create specialized workflows:

```typescript
// Documentation update workflow
async function updateDocumentation(serviceName: string) {
  // 1. Get library docs
  const docs = await mcp__context7__get_library_docs({
    context7CompatibleLibraryID: `/vextrus/${serviceName}`
  });
  
  // 2. Analyze current code
  const analysis = await mcp__serena__get_symbols_overview({
    relative_path: `services/${serviceName}/src`
  });
  
  // 3. Generate updated docs
  const updatedDocs = await mcp__consult7__consultation({
    files: [`services/${serviceName}/src/**/*.ts`],
    query: "Generate API documentation",
    model: "gemini-2.5-pro"
  });
  
  // 4. Write documentation
  await mcp__filesystem__write_file({
    path: `docs/api/${serviceName}.md`,
    content: updatedDocs
  });
  
  // 5. Create PR
  await mcp__github__create_pull_request({
    owner: "vextrus",
    repo: "erp",
    title: `docs: Update ${serviceName} API documentation`,
    head: `docs/${serviceName}`,
    base: "main"
  });
}
```

## Troubleshooting

### Common Issues

#### Server Not Starting
```bash
# Check npx availability
npx --version

# Install server manually
npm install -g @modelcontextprotocol/server-filesystem

# Check environment variables
echo $GITHUB_PERSONAL_ACCESS_TOKEN
```

#### Permission Errors
```bash
# Filesystem server needs proper permissions
chmod -R 755 /path/to/project

# Windows: Run as administrator or check folder permissions
```

#### API Rate Limits
```typescript
// Implement retry logic
async function retryableRequest(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
}
```

### Debug Mode

Enable verbose logging:
```json
{
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "--debug"],
    "env": {
      "DEBUG": "mcp:*"
    }
  }
}
```

## Security Considerations

### 1. API Key Management
- Never commit API keys
- Use environment variables
- Rotate keys regularly
- Limit key permissions

### 2. File System Access
- Restrict filesystem server to project directory
- Avoid operations on system files
- Validate file paths

### 3. Database Operations
- Use parameterized queries
- Limit database permissions
- Backup before migrations

### 4. External Services
- Validate webhook payloads
- Use HTTPS for all APIs
- Implement rate limiting
- Monitor API usage

## Performance Tips

### 1. Cache Results
```typescript
const cache = new Map();

async function getCachedSymbol(name: string) {
  if (cache.has(name)) {
    return cache.get(name);
  }
  const result = await mcp__serena__find_symbol({ name_path: name });
  cache.set(name, result);
  return result;
}
```

### 2. Batch Operations
```typescript
// Process files in batches
async function processFiles(paths: string[], batchSize = 10) {
  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    await Promise.all(batch.map(path => 
      mcp__filesystem__read_file({ path })
    ));
  }
}
```

### 3. Async Patterns
```typescript
// Parallel processing where possible
const [githubData, fileData, dbData] = await Promise.all([
  mcp__github__get_pull_request({ /* ... */ }),
  mcp__filesystem__read_file({ /* ... */ }),
  mcp__sqlite__query({ /* ... */ })
]);
```

## Resources

- [MCP Documentation](https://modelcontextprotocol.io/docs)
- [MCP Server Registry](https://github.com/modelcontextprotocol/servers)
- [Claude MCP Integration](https://docs.anthropic.com/mcp)
- [Server Development Guide](https://modelcontextprotocol.io/docs/server-development)