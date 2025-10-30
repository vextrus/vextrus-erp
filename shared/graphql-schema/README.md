# @vextrus-erp/graphql-schema

Shared GraphQL schema types for Vextrus ERP Federation architecture.

## Overview

This package provides common GraphQL types that are shared across all federated microservices in the Vextrus ERP system. The primary purpose is to eliminate duplication and ensure consistency in schema definitions.

## Installation

```bash
# In a service directory
pnpm add @vextrus-erp/graphql-schema
```

## Usage

### PageInfo (Pagination)

The `PageInfo` type is used for cursor-based pagination in connection types.

#### Before (Duplicated in each service)

```typescript
// services/audit/src/dto/audit-log-connection.dto.ts
import { ObjectType, Field, Directive } from '@nestjs/graphql';

@ObjectType()
@Directive('@shareable')
export class PageInfo {
  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;

  @Field({ nullable: true })
  startCursor?: string;

  @Field({ nullable: true })
  endCursor?: string;
}
```

#### After (Using shared package)

```typescript
// services/audit/src/dto/audit-log-connection.dto.ts
import { ObjectType, Field } from '@nestjs/graphql';
import { PageInfo } from '@vextrus-erp/graphql-schema';
import { AuditLog } from '../entities/audit-log.entity';

@ObjectType()
export class AuditLogEdge {
  @Field()
  cursor: string;

  @Field(() => AuditLog)
  node: AuditLog;
}

@ObjectType()
export class AuditLogConnection {
  @Field(() => [AuditLogEdge])
  edges: AuditLogEdge[];

  @Field(() => PageInfo)  // Using shared type
  pageInfo: PageInfo;

  @Field()
  totalCount: number;
}
```

### Benefits

1. **Single Source of Truth**: PageInfo is defined once, used everywhere
2. **Consistency**: All services use the exact same pagination structure
3. **Federation Compatible**: `@shareable` directive already applied
4. **Maintainability**: Changes to pagination logic happen in one place
5. **Type Safety**: TypeScript types exported for interfaces

## Services Using This Package

- ✅ audit
- ✅ configuration
- ✅ import-export
- ✅ notification
- 🔄 (Future) All services with cursor-based pagination

## Migration Guide

### Step 1: Install Package

```bash
cd services/<service-name>
pnpm add @vextrus-erp/graphql-schema
```

### Step 2: Update Connection DTOs

Replace local PageInfo definition with import:

```typescript
// Remove this
@ObjectType()
@Directive('@shareable')
export class PageInfo { ... }

// Add this
import { PageInfo } from '@vextrus-erp/graphql-schema';
```

### Step 3: Rebuild Service

```bash
pnpm build
docker-compose build <service-name> --no-cache
docker-compose up -d <service-name>
```

### Step 4: Verify

Check that GraphQL schema still works:

```bash
curl -X POST http://localhost:<port>/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __type(name: \"PageInfo\") { fields { name } } }"}'
```

## API Reference

### PageInfo

Cursor-based pagination information.

**Fields**:
- `hasNextPage: Boolean!` - More edges exist after this set
- `hasPreviousPage: Boolean!` - More edges exist before this set
- `startCursor: String` - Cursor of the first edge
- `endCursor: String` - Cursor of the last edge

**Federation**: Marked with `@shareable` directive

### Edge<T>

Generic interface for edges in connection types.

**Properties**:
- `cursor: string` - Position cursor
- `node: T` - The actual data node

### Connection<T>

Generic interface for connection types.

**Properties**:
- `edges: Edge<T>[]` - List of edges
- `pageInfo: PageInfo` - Pagination information
- `totalCount?: number` - Optional total count

## Development

### Build

```bash
pnpm build
```

### Watch Mode

```bash
pnpm build:watch
```

### Clean

```bash
pnpm clean
```

## Publishing

This package is published to the local Verdaccio registry:

```bash
pnpm publish
```

**Registry**: `http://localhost:4873/`

## Troubleshooting

### Import Error

If you see "Cannot find module '@vextrus-erp/graphql-schema'":

1. Ensure package is installed: `pnpm add @vextrus-erp/graphql-schema`
2. Check package.json dependencies
3. Run `pnpm install` in workspace root
4. Verify package is built: `cd shared/graphql-schema && pnpm build`

### Federation Schema Conflict

If you see "Non-shareable field" errors:

1. Verify you're using the shared PageInfo (not local copy)
2. Check that `@Directive('@shareable')` is present
3. Ensure all services using PageInfo import from this package
4. Rebuild and restart API Gateway

### Type Errors

If TypeScript can't find types:

1. Build the package: `cd shared/graphql-schema && pnpm build`
2. Check `dist/` directory exists
3. Verify `package.json` has `"types": "dist/index.d.ts"`
4. Restart your IDE/language server

## Roadmap

### Future Shared Types

- **FilterInput**: Common filtering patterns
- **SortInput**: Standard sorting options
- **DateTimeScalar**: Consistent date/time handling
- **ErrorTypes**: Standardized error responses
- **MetadataTypes**: Common metadata fields (createdAt, updatedAt, etc.)

### Planned Features

- [ ] Validation decorators for common patterns
- [ ] Helper functions for cursor encoding/decoding
- [ ] Pagination utilities (offset to cursor conversion)
- [ ] Schema documentation generation
- [ ] Testing utilities for connection types

## Contributing

### Adding New Shared Types

1. Create type file in `src/types/`
2. Export from `src/index.ts`
3. Update README documentation
4. Add usage examples
5. Update version in package.json
6. Publish to registry

### Guidelines

- All shared types must be federation-compatible
- Include `@shareable` directive where appropriate
- Provide comprehensive documentation
- Add JSDoc comments for all exports
- Include usage examples in README

## Related Documentation

- [Apollo Federation Best Practices](https://www.apollographql.com/docs/federation/best-practices/)
- [NestJS GraphQL Guide](https://docs.nestjs.com/graphql/quick-start)
- [Cursor-Based Pagination](https://relay.dev/graphql/connections.htm)

## License

Private - Vextrus ERP Internal Use Only
