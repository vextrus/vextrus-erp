# Package Publishing Infrastructure

## Overview
This document describes the professional package publishing infrastructure for Vextrus ERP's shared libraries.

## Infrastructure Components

### 1. Private Registry (Verdaccio)
- **Location**: `http://localhost:4873`
- **Config**: `infrastructure/verdaccio/config.yaml`
- **Default Users**:
  - admin/admin123
  - developer/dev123
- **Packages**: All @vextrus/* packages

### 2. Package Bundling (tsup)
Each package uses tsup for modern bundling:
- Dual ESM/CJS output
- TypeScript declarations
- Source maps
- Tree-shaking enabled
- Optimized for Node.js 20+

### 3. Version Management (Changesets)
- **Config**: `.changeset/config.json`
- **Fixed versioning**: All @vextrus packages version together
- **Restricted access**: Private registry only
- **Changelog**: GitHub-based changelog generation

### 4. CI/CD (GitHub Actions)
- **Workflow**: `.github/workflows/release-packages.yml`
- **Triggers**: Push to main on shared/* paths
- **Process**:
  1. Build all packages
  2. Run tests
  3. Start Verdaccio
  4. Create release PR or publish
  5. Generate documentation

### 5. Documentation (TypeDoc)
- **Config**: `typedoc.json`
- **Output**: `docs/api/`
- **Features**:
  - Bengali documentation support
  - Markdown output
  - Source links
  - Category organization

## Testing Status

### ✅ Successfully Tested (2025-09-08)
- **End-to-end workflow**: All packages built, published, and installed successfully
- **Version management**: Changesets successfully bumped versions from 1.0.0 → 1.0.1
- **Registry authentication**: Fixed E401 errors with base64 auth tokens
- **Build configuration**: Resolved tsup TypeScript compilation issues
- **Integration testing**: Created test project and verified all packages work together

### Known Issues & Resolutions
- **Verdaccio E401**: Use base64 auth token in .npmrc instead of username/password
- **tsup DTS errors**: Disable incremental/composite compilation in tsup.config.ts
- **Circular dependencies**: Fixed workspace:* references with specific versions
- **Missing decorators**: Removed non-existent Injectable imports

## Available Packages

### @vextrus/kernel (v1.0.1)
Domain-Driven Design primitives:
- AggregateRoot
- Entity
- ValueObject
- Specification
- Repository interfaces

### @vextrus/contracts (v1.0.1)
Service contracts and interfaces:
- Authentication contracts
- Event contracts
- Error contracts
- Subpath exports for each domain

### @vextrus/utils (v1.0.1)
Utility functions and observability:
- OpenTelemetry integration
- Tracing decorators
- Context propagation
- Bengali localization utilities

### @vextrus/distributed-transactions (v1.0.1)
Transaction patterns:
- Event sourcing
- Saga orchestration
- Outbox pattern
- Idempotency middleware

## Quick Start Commands

### Start Infrastructure
```bash
# Start Verdaccio registry
npm run verdaccio:start

# Check registry status
npm run verdaccio:logs
```

### Build & Publish
```bash
# Build all packages
npm run build:packages

# Login to registry
npm run registry:login

# Publish to local registry
npm run publish:local
```

### Version Management
```bash
# Create a changeset
npm run changeset

# Version packages
npm run version

# Release (build + publish)
npm run release
```

### Documentation
```bash
# Generate API docs
npm run docs:generate

# Serve docs locally
npm run docs:serve
```

## Development Workflow

### 1. Making Changes
```bash
# Make your changes in shared/*
cd shared/kernel
npm run dev  # Watch mode with tsup
```

### 2. Testing Changes
```bash
# Run tests
npm test

# Build to verify
npm run build
```

### 3. Creating a Changeset
```bash
# Create changeset for your changes
npm run changeset
# Select packages affected
# Choose version bump type
# Write changelog entry
```

### 4. Publishing Locally
```bash
# Start Verdaccio
docker-compose up -d verdaccio

# Build and publish
npm run publish:local
```

### 5. Using in Services
```json
// In service package.json
{
  "dependencies": {
    "@vextrus/kernel": "^1.0.0",
    "@vextrus/contracts": "^1.0.0",
    "@vextrus/utils": "^1.0.0"
  }
}
```

```bash
# Install from private registry
npm install --registry http://localhost:4873/
```

## Production Deployment

### Registry Options
1. **Self-hosted Verdaccio**: Deploy Verdaccio to production server
2. **NPM Enterprise**: Use npm's enterprise registry
3. **GitHub Packages**: Use GitHub's package registry
4. **Artifactory**: JFrog Artifactory for enterprise

### Security Considerations
- Use strong authentication in production
- Enable HTTPS for registry
- Implement access controls
- Audit package publishes
- Sign packages with GPG

## Troubleshooting

### Verdaccio Issues
```bash
# Check logs
docker-compose logs verdaccio

# Restart service
docker-compose restart verdaccio

# Clear storage
docker-compose down
docker volume rm vextrus-erp_verdaccio_data
docker-compose up -d verdaccio
```

### Build Issues
```bash
# Clean all builds
npm run clean

# Rebuild from scratch
npm run build:packages
```

### Publishing Issues
```bash
# Check authentication
npm run registry:whoami

# Re-login
npm run registry:login

# Check registry URL
npm config get registry
```

## Bengali Documentation Support

TypeDoc is configured to support Bengali documentation:
- Use `@bengali` tag for Bengali descriptions
- Example:
```typescript
/**
 * Calculate total amount
 * @bengali মোট পরিমাণ গণনা করুন
 */
```

## Best Practices

### Package Development
1. Keep packages focused and single-purpose
2. Use semantic versioning properly
3. Write comprehensive tests
4. Document public APIs thoroughly
5. Maintain backward compatibility

### Publishing
1. Always create changesets for changes
2. Review generated changelogs
3. Test packages locally before publishing
4. Use fixed versioning for related packages
5. Tag releases in git

### Registry Management
1. Regular backup of registry data
2. Monitor registry disk usage
3. Implement retention policies
4. Audit access logs
5. Keep registry software updated

## Next Steps

1. **Configure Production Registry**: Choose and set up production registry solution
2. **Add Package Signing**: Implement GPG signing for packages
3. **Set Up Monitoring**: Add registry monitoring and alerts
4. **Create Package Templates**: Standardize new package creation
5. **Implement Vulnerability Scanning**: Add security scanning to CI/CD

## Support

For issues or questions:
- Check logs: `npm run verdaccio:logs`
- Review configs: `infrastructure/verdaccio/config.yaml`
- GitHub Issues: [vextrus/vextrus-erp/issues](https://github.com/vextrus/vextrus-erp/issues)