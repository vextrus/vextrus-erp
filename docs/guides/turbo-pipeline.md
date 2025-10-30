# Turbo Build Pipeline Guide

## Overview

Turborepo provides an intelligent build system for the Vextrus ERP monorepo, offering task orchestration, caching, and parallel execution. This guide covers configuration, usage, and optimization of the Turbo pipeline.

## Core Concepts

### Task Pipeline

Turbo manages tasks across the monorepo with dependency awareness:

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "*.tsbuildinfo"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

### Dependency Types

- `^` - Topological dependencies (upstream packages)
- `[]` - No dependencies (can run immediately)
- `["build"]` - Same-package task dependency

## Configuration

### turbo.json Structure

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "*.tsbuildinfo"],
      "cache": true
    },
    "build:shared": {
      "dependsOn": [],
      "outputs": ["shared/*/dist/**"],
      "cache": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "cache": true
    },
    "test:unit": {
      "dependsOn": [],
      "outputs": [],
      "cache": true
    },
    "lint": {
      "dependsOn": [],
      "outputs": [],
      "cache": true
    },
    "typecheck": {
      "dependsOn": ["build"],
      "outputs": ["*.tsbuildinfo"],
      "cache": true
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "clean": {
      "dependsOn": [],
      "cache": false
    }
  }
}
```

### Package-Specific Configuration

Override global pipeline in package.json:

```json
{
  "name": "@vextrus/kernel",
  "turbo": {
    "extends": ["//"],
    "pipeline": {
      "build": {
        "outputs": ["dist/**", "types/**"]
      }
    }
  }
}
```

## Common Commands

### Building

```bash
# Build everything
turbo build

# Build specific package
turbo build --filter=@vextrus/kernel

# Build package and dependencies
turbo build --filter=services/auth...

# Build package and dependents
turbo build --filter=...services/auth

# Build only changed packages
turbo build --filter=[HEAD^]
```

### Testing

```bash
# Run all tests
turbo test

# Test specific service
turbo test --filter=services/auth

# Test with coverage
turbo test:coverage

# Test in watch mode
turbo test:watch --filter=services/auth
```

### Development

```bash
# Start all dev servers
turbo dev

# Start specific service
turbo dev --filter=services/auth

# Start multiple services
turbo dev --filter=services/auth --filter=apps/web

# Start service with dependencies
turbo dev --filter=services/auth...
```

## Filtering

### Filter Syntax

```bash
# Exact match
--filter=services/auth

# Pattern match
--filter=services/*

# With dependencies
--filter=services/auth...

# With dependents
--filter=...@vextrus/kernel

# Changed files
--filter=[HEAD^]

# By location
--filter=./services/auth

# Multiple filters
--filter=services/auth --filter=@vextrus/kernel
```

### Advanced Filtering

```bash
# All services
turbo build --filter=services/*

# All shared libraries
turbo build --filter=@vextrus/*

# Affected by git changes
turbo build --filter=[origin/main]

# Exclude packages
turbo build --filter=!services/legacy

# Complex patterns
turbo build --filter=services/* --filter=!services/deprecated
```

## Caching

### Local Caching

Turbo caches task outputs locally:

```bash
# Normal build (uses cache)
turbo build

# Force rebuild (skip cache)
turbo build --force

# Clear cache
turbo daemon clean

# Disable cache for specific run
turbo build --no-cache
```

### Cache Configuration

```json
{
  "pipeline": {
    "build": {
      "cache": true,
      "outputs": ["dist/**"],
      "inputs": ["src/**", "package.json", "tsconfig.json"]
    }
  }
}
```

### Remote Caching

Enable shared cache across team:

```bash
# Login to Vercel
turbo login

# Link repository
turbo link

# Use remote cache
turbo build --team --token=$TURBO_TOKEN
```

## Optimization Strategies

### 1. Parallel Execution

Maximize parallelization:

```json
{
  "pipeline": {
    "lint": {
      "dependsOn": []  // Can run immediately
    },
    "test:unit": {
      "dependsOn": []  // Can run in parallel with lint
    }
  }
}
```

### 2. Smart Outputs

Define precise outputs for better caching:

```json
{
  "pipeline": {
    "build": {
      "outputs": [
        "dist/**",
        "!dist/**/*.map",  // Exclude source maps
        "types/**"
      ]
    }
  }
}
```

### 3. Input Hashing

Control what affects cache:

```json
{
  "globalDependencies": [
    "tsconfig.base.json"
  ],
  "pipeline": {
    "build": {
      "inputs": [
        "src/**",
        "!src/**/*.test.ts"  // Exclude test files
      ]
    }
  }
}
```

### 4. Persistent Tasks

Keep dev servers running:

```json
{
  "pipeline": {
    "dev": {
      "persistent": true,
      "cache": false
    }
  }
}
```

## Environment Variables

### Global Environment

```json
{
  "globalEnv": [
    "NODE_ENV",
    "CI"
  ],
  "pipeline": {
    "build": {
      "env": [
        "API_KEY"
      ]
    }
  }
}
```

### Passthrough Environment

```json
{
  "globalPassThroughEnv": [
    "GITHUB_TOKEN",
    "NPM_TOKEN"
  ]
}
```

## CI/CD Integration

### GitHub Actions

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 2

      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup Turbo Cache
        uses: actions/cache@v3
        with:
          path: .turbo
          key: turbo-${{ github.sha }}
          restore-keys: |
            turbo-

      - name: Build
        run: turbo build --filter=[HEAD^]

      - name: Test
        run: turbo test --filter=[HEAD^]
```

### Docker Integration

```dockerfile
# Use turbo prune for minimal Docker images
FROM node:20-alpine AS builder
RUN npm install -g turbo
WORKDIR /app
COPY . .
RUN turbo prune --scope=services/auth --docker

# Build the app
FROM node:20-alpine AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm ci

COPY --from=builder /app/out/full/ .
RUN turbo build --filter=services/auth

# Production image
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=installer /app/services/auth/dist ./dist
COPY --from=installer /app/services/auth/package.json .
RUN npm ci --production
CMD ["node", "dist/main.js"]
```

## Debugging

### Verbose Output

```bash
# Show all tasks
turbo build --dry-run

# Verbose logging
turbo build --log-level=debug

# Show task graph
turbo build --graph

# Output graph to file
turbo build --graph=graph.html
```

### Common Issues

#### Cache Misses

```bash
# Check why cache missed
turbo build --log-level=debug | grep "cache miss"

# Force specific package rebuild
turbo build --filter=@vextrus/kernel --force
```

#### Dependency Issues

```bash
# Verify dependency graph
turbo build --dry-run --graph

# Check specific package dependencies
npm ls @vextrus/kernel
```

## Performance Monitoring

### Task Timing

```bash
# Show task execution times
turbo build --profile=profile.json

# Analyze profile
cat profile.json | jq '.tasks | sort_by(.duration)'
```

### Cache Statistics

```bash
# Show cache hit rate
turbo build --summarize

# Monitor cache size
du -sh .turbo
```

## Best Practices

### 1. Task Granularity

Keep tasks focused:

```json
{
  "pipeline": {
    "lint:eslint": { "dependsOn": [] },
    "lint:prettier": { "dependsOn": [] },
    "lint": { "dependsOn": ["lint:eslint", "lint:prettier"] }
  }
}
```

### 2. Output Management

Clean outputs before builds:

```json
{
  "scripts": {
    "clean": "turbo clean && rm -rf node_modules",
    "build:clean": "npm run clean && turbo build"
  }
}
```

### 3. Development Workflow

Optimize for development speed:

```json
{
  "pipeline": {
    "dev": {
      "dependsOn": ["^build:shared"],  // Only build shared libs
      "persistent": true
    }
  }
}
```

### 4. CI Optimization

```yaml
# Only test/build affected packages
- name: Get changed files
  id: changed-files
  uses: tj-actions/changed-files@v35

- name: Build affected
  if: steps.changed-files.outputs.any_changed == 'true'
  run: turbo build --filter=[HEAD^]
```

## Troubleshooting

### Reset Everything

```bash
# Clear all caches and rebuild
npm run clean
rm -rf .turbo
rm -rf node_modules
npm install
turbo build --force
```

### Debug Task Dependencies

```bash
# See what would run
turbo build --dry-run

# See dependency graph
turbo build --graph=graph.html
open graph.html
```

### Fix Cache Issues

```bash
# Clear daemon cache
turbo daemon clean

# Restart daemon
turbo daemon restart

# Disable daemon
turbo build --no-daemon
```

## Migration Guide

### From npm Scripts

Before:
```json
{
  "scripts": {
    "build:kernel": "cd shared/kernel && npm run build",
    "build:contracts": "cd shared/contracts && npm run build",
    "build:all": "npm run build:kernel && npm run build:contracts"
  }
}
```

After:
```json
{
  "scripts": {
    "build": "turbo build"
  }
}
```

### From Lerna

Before:
```bash
lerna run build --scope=@vextrus/kernel
```

After:
```bash
turbo build --filter=@vextrus/kernel
```

## Advanced Configuration

### Custom Task Runners

```json
{
  "pipeline": {
    "generate": {
      "dependsOn": [],
      "outputs": ["generated/**"],
      "cache": false
    }
  }
}
```

### Conditional Tasks

```json
{
  "pipeline": {
    "build:production": {
      "dependsOn": ["^build:production", "test"],
      "env": ["NODE_ENV"],
      "outputs": ["dist/**"]
    }
  }
}
```

## Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Turbo Examples](https://github.com/vercel/turbo/tree/main/examples)
- [Migration Guides](https://turbo.build/repo/docs/guides/migrate-from-lerna)
- [API Reference](https://turbo.build/repo/docs/reference/configuration)