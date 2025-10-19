---
name: Database Migrations
description: When creating database migrations, schema changes, or data migrations, activate this skill to enforce TypeORM zero-downtime patterns. Use when user says "migration", "schema change", "alter table", "database", "typeorm", or when modifying entity files.
---

# Database Migrations Skill

## Purpose
Enforce safe, reversible, zero-downtime database migrations for Vextrus ERP

## Activation Triggers
- User says: "migration", "schema change", "alter table", "add column", "database", "typeorm"
- Working in: `services/*/src/migrations/`
- Modifying: Entity files (`*.entity.ts`)
- Creating: New tables, indexes, constraints

## Zero-Downtime Migration Strategy

### Pattern 1: Schema-Based Multi-Tenancy
- Separate PostgreSQL schemas per tenant
- Migration applies to all tenant schemas
- Tenant context isolation maintained

### Pattern 2: Event Sourcing + Read Model
- EventStore: Immutable events (no migrations)
- PostgreSQL: Read model projections (can rebuild)
- Strategy: New projection while old serves queries

### Pattern 3: Multi-Step Breaking Changes
1. Add new column (nullable)
2. Backfill data
3. Make non-nullable
4. Drop old column (separate migration)

## Migration File Structure

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class DescriptiveAction1234567890123 implements MigrationInterface {
  name = 'DescriptiveAction1234567890123';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Forward migration
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback migration
  }
}
```

## Critical Rules

1. **Always Reversible**: Every migration must have working `down()` method
2. **No Synchronize in Production**: `DATABASE_SYNCHRONIZE=false` always
3. **Test on Staging First**: Fresh database + rollback procedure
4. **Index Strategy**: Create index before dropping old one
5. **Multi-Tenant Safe**: Apply to all tenant schemas

## Index Creation Pattern

```typescript
// Good: Create new index first, then drop old
await queryRunner.query(`CREATE INDEX idx_invoices_customer_new ON invoices (customer_id, created_at)`);
// Test queries use new index
await queryRunner.query(`DROP INDEX idx_invoices_customer_old`);

// Bad: Drop first (query degradation window)
await queryRunner.query(`DROP INDEX idx_invoices_customer_old`);
await queryRunner.query(`CREATE INDEX idx_invoices_customer_new ...`);
```

## Data Migration Pattern

```typescript
// Separate data migration from schema migration
export class MigrateCustomerData1234567890124 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Batch processing for large datasets
    const batchSize = 1000;
    let offset = 0;

    while (true) {
      const result = await queryRunner.query(`
        UPDATE customers
        SET new_field = old_field
        WHERE id IN (
          SELECT id FROM customers
          WHERE new_field IS NULL
          LIMIT ${batchSize}
        )
      `);

      if (result.affectedRows === 0) break;
      offset += batchSize;
    }
  }
}
```

## Rollback Procedures

### Event Sourcing Services (Finance)
- Events immutable, never rolled back
- Rollback: Replay events, rebuild read model
- Projection can be dropped and recreated

### Standard Services
- Execute migration `down()` method
- Verify data integrity after rollback
- Test rollback procedure in staging

## Multi-Tenant Migration

```typescript
// Apply migration to all tenant schemas
export class MultiTenantMigration implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tenants = await queryRunner.query(`
      SELECT schema_name FROM information_schema.schemata
      WHERE schema_name LIKE 'tenant_%'
    `);

    for (const tenant of tenants) {
      await queryRunner.query(`SET search_path TO ${tenant.schema_name}`);
      // Apply migration in tenant schema
      await queryRunner.query(`ALTER TABLE invoices ADD COLUMN status VARCHAR(50)`);
    }

    await queryRunner.query(`SET search_path TO public`);
  }
}
```

## Configuration Pattern

```env
# Production settings
DATABASE_SYNCHRONIZE=false  # CRITICAL: Never true in production
DATABASE_LOGGING=false
DATABASE_MIGRATIONS=src/migrations/*.ts
DATABASE_MIGRATIONS_RUN=true  # Auto-run on startup
```

## Migration Checklist

Before creating migration:
- [ ] Read existing entity definitions
- [ ] Check for breaking changes (column drops, type changes)
- [ ] Plan multi-step approach if breaking
- [ ] Consider index creation order

After creating migration:
- [ ] Test on fresh database
- [ ] Test rollback procedure
- [ ] Verify data integrity
- [ ] Check query performance with new indexes
- [ ] Test across all tenant schemas
- [ ] Disable synchronize if enabled

## Plan Mode Integration

In plan mode:
1. User requests schema change
2. Skill analyzes breaking vs non-breaking
3. Presents multi-step plan if needed
4. User approves approach
5. Execute migration creation

## Integration with Execute First

- Execute First: Creates migration files
- Database Migrations: Ensures safety patterns
- Security First: Validates data access in migrations
- Multi-Tenancy: Ensures tenant isolation maintained

## Common Mistakes to Avoid

❌ **Don't**:
- Drop columns without multi-step migration
- Use `DATABASE_SYNCHRONIZE=true` in production
- Skip `down()` method implementation
- Forget to test rollback
- Apply destructive operations directly

✅ **Do**:
- Always create reversible migrations
- Test on staging with production-like data
- Use batch processing for data migrations
- Create indexes before dropping old ones
- Document breaking changes

## Resources

- **Advanced Patterns**: `resources/migration-patterns.md` (column type changes, partitioning, enum handling, concurrent indexes)
- **TypeORM Migrations**: https://typeorm.io/migrations
- **Zero-Downtime Deployments**: https://github.com/rails/strong_migrations
- **Multi-Tenant Migrations**: services/organization/CLAUDE.md
- **Event Sourcing Migrations**: services/finance/CLAUDE.md
- **Migration Safety Guide**: sessions/knowledge/vextrus-erp/guides/migration-safety-guide.md

## Override

User can bypass with:
- "skip migration safety checks"
- "I'll handle rollback manually"

Default: **ENFORCE ZERO-DOWNTIME PATTERNS**
