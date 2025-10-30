# Database Migration Workflow

## Overview

The Vextrus ERP system uses TypeORM migrations to manage database schema changes across multiple services. Each service maintains its own migration history while sharing the same database.

## Migration Architecture

### Service-Specific Migrations
- **Auth Service**: Uses `migrations` table for tracking
- **Organization Service**: Uses `migrations_organization` table for tracking
- Each service has its own `data-source.ts` configuration
- Migrations are stored in `src/database/migrations/` for each service

### Shared Database
All services connect to the same PostgreSQL database (`vextrus_erp`) but maintain separate migration tracking tables to prevent conflicts.

## Creating Migrations

### Manual Migration Creation
```bash
# For Auth Service
cd services/auth
npm run migration:create -- src/database/migrations/YourMigrationName

# For Organization Service
cd services/organization
npm run migration:create -- src/database/migrations/YourMigrationName
```

### Generate Migration from Entity Changes
```bash
# For Auth Service
cd services/auth
npm run migration:generate -- src/database/migrations/YourMigrationName

# For Organization Service
cd services/organization
npm run migration:generate -- src/database/migrations/YourMigrationName
```

## Running Migrations

### Development Environment
```bash
# Run all pending migrations for Auth Service
cd services/auth
npm run migration:run

# Run all pending migrations for Organization Service
cd services/organization
npm run migration:run
```

### Production Environment
```bash
# Using Docker Compose
docker-compose exec auth npm run migration:run
docker-compose exec organization npm run migration:run
```

## Reverting Migrations

### Revert Last Migration
```bash
# For Auth Service
cd services/auth
npm run migration:revert

# For Organization Service
cd services/organization
npm run migration:revert
```

## Checking Migration Status

### Show All Migrations
```bash
# For Auth Service
cd services/auth
npm run migration:show

# For Organization Service
cd services/organization
npm run migration:show
```

## Best Practices

### 1. Naming Conventions
- Use descriptive names: `CreateUserTable`, `AddIndexToOrganizationSlug`
- Include ticket/issue number if applicable: `VEXT-123-AddTenantIdToUsers`

### 2. Migration Content
- Keep migrations focused on a single change
- Always include both `up` and `down` methods
- Test rollback functionality

### 3. Data Migrations
- Separate schema changes from data migrations
- Use transactions for data consistency
- Consider performance impact on large tables

### 4. Multi-Tenant Considerations
- Always include tenant_id in new tables
- Add Row-Level Security policies when creating tables
- Update audit triggers for new tables

Example migration with RLS:
```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
    // Create table
    await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Enable RLS
    await queryRunner.query(`ALTER TABLE projects ENABLE ROW LEVEL SECURITY`);
    
    // Create RLS policy
    await queryRunner.query(`
        CREATE POLICY tenant_isolation_select ON projects
        FOR SELECT
        USING (tenant_id = get_current_tenant_id())
    `);
    
    // Add audit trigger
    await queryRunner.query(`
        CREATE TRIGGER projects_audit_trigger
        AFTER INSERT OR UPDATE OR DELETE ON projects
        FOR EACH ROW EXECUTE FUNCTION create_audit_entry()
    `);
}
```

### 5. Testing Migrations
- Test migrations in development first
- Verify both `up` and `down` methods work
- Check migration performance on representative data volumes
- Ensure migrations are idempotent when possible

## Common Issues and Solutions

### Issue: TypeScript Compilation Errors
**Solution**: Ensure TypeORM and TypeScript versions are compatible
```bash
npm install --save-dev ts-node typescript
```

### Issue: __dirname is not defined
**Solution**: Use relative paths in data-source.ts instead of __dirname
```typescript
entities: ['src/**/*.entity{.ts,.js}'],
migrations: ['src/database/migrations/*{.ts,.js}'],
```

### Issue: Migration Not Found
**Solution**: Check file path and naming convention
- Migrations should be in `src/database/migrations/`
- File name format: `{timestamp}-{MigrationName}.ts`

### Issue: Connection Refused
**Solution**: Verify database connection settings
```bash
# Check environment variables
echo $DATABASE_HOST
echo $DATABASE_PORT
echo $DATABASE_USERNAME
echo $DATABASE_NAME

# Verify PostgreSQL is running
docker-compose ps postgres
```

## CI/CD Integration

### GitHub Actions Workflow
```yaml
- name: Run Auth Service Migrations
  run: |
    cd services/auth
    npm run migration:run
  env:
    DATABASE_HOST: ${{ secrets.DATABASE_HOST }}
    DATABASE_PORT: ${{ secrets.DATABASE_PORT }}
    DATABASE_USERNAME: ${{ secrets.DATABASE_USERNAME }}
    DATABASE_PASSWORD: ${{ secrets.DATABASE_PASSWORD }}
    DATABASE_NAME: ${{ secrets.DATABASE_NAME }}

- name: Run Organization Service Migrations
  run: |
    cd services/organization
    npm run migration:run
  env:
    DATABASE_HOST: ${{ secrets.DATABASE_HOST }}
    DATABASE_PORT: ${{ secrets.DATABASE_PORT }}
    DATABASE_USERNAME: ${{ secrets.DATABASE_USERNAME }}
    DATABASE_PASSWORD: ${{ secrets.DATABASE_PASSWORD }}
    DATABASE_NAME: ${{ secrets.DATABASE_NAME }}
```

## Migration Scripts Reference

All services include the following npm scripts:

| Script | Description |
|--------|------------|
| `typeorm` | Base TypeORM CLI command |
| `migration:create` | Create a new empty migration |
| `migration:generate` | Generate migration from entity changes |
| `migration:run` | Execute all pending migrations |
| `migration:revert` | Revert the last executed migration |
| `migration:show` | Display all migrations and their status |

## Environment Variables

Required environment variables for migrations:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=vextrus
DATABASE_PASSWORD=vextrus_dev_2024
DATABASE_NAME=vextrus_erp
DATABASE_SSL=false
NODE_ENV=development
```

## Related Documentation
- [PostgreSQL Multi-Tenancy Setup](../infrastructure/docker/postgres/migrations/001_multi_tenancy_setup.sql)
- [Audit Logging Infrastructure](../infrastructure/docker/postgres/migrations/002_audit_logging.sql)
- [TypeORM Documentation](https://typeorm.io/migrations)