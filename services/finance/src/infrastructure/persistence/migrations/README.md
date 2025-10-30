# Database Migrations

This directory contains TypeORM migrations for the Finance Service PostgreSQL database.

## Overview

The Finance Service uses TypeORM migrations for managing database schema changes in a version-controlled, repeatable manner. Migrations are essential for production deployments where `synchronize: true` is disabled.

## Migration Workflow

### Running Existing Migrations

```bash
# Run all pending migrations
npm run migration:run

# Show migration status
npm run migration:show

# Revert the last migration
npm run migration:revert
```

### Creating New Migrations

#### Option 1: Auto-generate from Entity Changes
```bash
# Modify your TypeORM entities first, then:
npm run migration:generate -- src/infrastructure/persistence/migrations/MigrationName
```

#### Option 2: Create Empty Migration Template
```bash
npm run migration:create -- src/infrastructure/persistence/migrations/MigrationName
```

### Migration Best Practices

1. **Naming Convention**: Use PascalCase with descriptive names
   - `CreateInvoiceReadModel` ✅
   - `AddMushakNumberIndex` ✅
   - `migration1` ❌

2. **Always Implement `down()`**: Every migration must be reversible
   ```typescript
   public async up(queryRunner: QueryRunner): Promise<void> {
     // Apply changes
   }

   public async down(queryRunner: QueryRunner): Promise<void> {
     // Revert changes (reverse order)
   }
   ```

3. **Test Locally**: Always test both `up` and `down` before committing
   ```bash
   npm run migration:run    # Apply
   npm run migration:revert # Rollback
   npm run migration:run    # Re-apply
   ```

4. **Multi-Tenancy Awareness**: Ensure migrations respect tenant isolation
   - Use tenant-scoped indexes
   - Include tenantId in composite unique constraints
   - Test with multiple tenant schemas

5. **Bangladesh Compliance**: Include proper constraints for compliance fields
   - TIN: 10 characters
   - BIN: 9 characters
   - Mushak Number format validation
   - Fiscal year format (YYYY-YYYY)

## Existing Migrations

### 1736880000000-CreateInvoiceReadModel.ts
- **Purpose**: Creates invoices table for CQRS read model
- **Features**:
  - Multi-tenant isolation with composite unique index
  - JSONB storage for flexible line items
  - Decimal precision for financial amounts
  - Bangladesh compliance fields (TIN/BIN, Mushak, Challan)
  - Comprehensive indexes for query performance
- **Indexes**:
  - `IDX_invoices_tenant_invoice_number` (unique)
  - `IDX_invoices_tenant_id`
  - `IDX_invoices_tenant_customer`
  - `IDX_invoices_tenant_vendor`
  - `IDX_invoices_tenant_status`
  - `IDX_invoices_tenant_fiscal_year`
  - `IDX_invoices_tenant_date`
  - `IDX_invoices_mushak_number`

## Production Deployment

### Pre-Deployment Checklist

- [ ] All migrations tested in development
- [ ] Migrations tested with production-like data volume
- [ ] Down migrations tested for rollback scenarios
- [ ] Database backup created
- [ ] Maintenance window scheduled (if needed)
- [ ] Migration execution plan documented

### Deployment Process

1. **Backup Database**
   ```bash
   pg_dump -h localhost -U vextrus vextrus_finance > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Run Migrations**
   ```bash
   NODE_ENV=production npm run migration:run
   ```

3. **Verify Migration Success**
   ```bash
   npm run migration:show
   ```

4. **Rollback (if needed)**
   ```bash
   npm run migration:revert
   ```

### Zero-Downtime Migrations

For large tables, use these strategies:

1. **Add Column**: Add nullable column, populate data, make non-nullable
2. **Remove Column**: Make nullable, deploy app, then remove column
3. **Rename Column**: Add new column, sync data, remove old column
4. **Change Type**: Add new column, migrate data, swap columns

## Troubleshooting

### Migration Already Executed
```bash
# Check migration status
npm run migration:show

# Force revert specific migration (use with caution)
npm run migration:revert
```

### Migration Failed Mid-Execution
```bash
# Check database state
psql -h localhost -U vextrus vextrus_finance -c "SELECT * FROM migrations;"

# Manually fix issues, then retry
npm run migration:run
```

### Schema Sync Issues
```bash
# In development, you can use synchronize
# In production, ALWAYS use migrations

# Generate migration from current entity state
npm run migration:generate -- src/infrastructure/persistence/migrations/FixSchema
```

## Environment Configuration

Migrations use environment variables from `.env`:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=vextrus
DATABASE_PASSWORD=vextrus_dev_2024
DATABASE_NAME=vextrus_finance
```

## Related Documentation

- TypeORM Configuration: `typeorm.config.ts`
- Entity Definitions: `src/infrastructure/persistence/typeorm/entities/`
- CQRS Read Model: `CLAUDE.md` - "CQRS with Event Sourcing" section
