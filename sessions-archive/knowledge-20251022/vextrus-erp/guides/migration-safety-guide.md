# Migration Safety Guide

**Source**: Database Migrations Skill
**Purpose**: Safe, zero-downtime database migrations for Vextrus ERP

---

## Critical Rules

### 1. Always Reversible
Every migration MUST have a working `down()` method:

```typescript
export class AddInvoiceStatus1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE invoices ADD COLUMN status VARCHAR(50)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE invoices DROP COLUMN status`);
  }
}
```

### 2. Never Synchronize in Production
```env
# MUST be false in production
DATABASE_SYNCHRONIZE=false
```

TypeORM synchronize overwrites schema - **NEVER** use in production.

### 3. Test on Staging First
- Apply migration to fresh staging database
- Test all queries work
- Test rollback procedure
- Only then apply to production

### 4. Index Strategy
Create new index BEFORE dropping old:

```typescript
// ✅ Good: No query degradation
await queryRunner.query(`CREATE INDEX idx_invoices_customer_new ON invoices (customer_id, created_at)`);
// Test queries use new index
await queryRunner.query(`DROP INDEX idx_invoices_customer_old`);

// ❌ Bad: Queries slow between drop and create
await queryRunner.query(`DROP INDEX idx_invoices_customer_old`);
await queryRunner.query(`CREATE INDEX idx_invoices_customer_new ...`);
```

### 5. Multi-Tenant Safe
Apply migration to ALL tenant schemas:

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  // Get all tenant schemas
  const tenants = await queryRunner.query(`
    SELECT schema_name FROM information_schema.schemata
    WHERE schema_name LIKE 'tenant_%'
  `);

  // Apply to each tenant
  for (const tenant of tenants) {
    await queryRunner.query(`SET search_path TO ${tenant.schema_name}`);
    await queryRunner.query(`ALTER TABLE invoices ADD COLUMN status VARCHAR(50)`);
  }

  // Reset to public schema
  await queryRunner.query(`SET search_path TO public`);
}
```

---

## Zero-Downtime Patterns

### Pattern 1: Add Nullable Column
**Safe**: Add column as nullable first

```typescript
// Step 1: Add nullable column
await queryRunner.query(`
  ALTER TABLE invoices
  ADD COLUMN payment_method VARCHAR(50)
`);
```

### Pattern 2: Backfill Data
**Separate Migration**: Backfill in batches

```typescript
export class BackfillPaymentMethod1234567890124 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 1000;

    while (true) {
      const result = await queryRunner.query(`
        UPDATE invoices
        SET payment_method = 'bank_transfer'
        WHERE id IN (
          SELECT id FROM invoices
          WHERE payment_method IS NULL
          LIMIT ${batchSize}
        )
      `);

      if (result.affectedRows === 0) break;
    }
  }
}
```

### Pattern 3: Make Non-Nullable
**After Backfill**: Now safe to make NOT NULL

```typescript
await queryRunner.query(`
  ALTER TABLE invoices
  ALTER COLUMN payment_method SET NOT NULL
`);
```

### Pattern 4: Drop Old Column
**Final Step**: Separate migration to drop old column

```typescript
await queryRunner.query(`
  ALTER TABLE invoices
  DROP COLUMN old_field
`);
```

---

## Multi-Step Breaking Changes

**Scenario**: Rename column from `amount` to `total`

### ❌ Don't: Single-step rename (breaks old code)
```typescript
await queryRunner.query(`ALTER TABLE invoices RENAME COLUMN amount TO total`);
```

### ✅ Do: Multi-step migration

**Step 1: Add new column**
```typescript
await queryRunner.query(`ALTER TABLE invoices ADD COLUMN total DECIMAL`);
```

**Step 2: Backfill data**
```typescript
await queryRunner.query(`UPDATE invoices SET total = amount WHERE total IS NULL`);
```

**Step 3: Deploy code supporting both columns**
```typescript
// Code reads from total, writes to both
const invoice = {
  total: data.total,
  amount: data.total, // Backwards compatibility
};
```

**Step 4: Make non-nullable**
```typescript
await queryRunner.query(`ALTER TABLE invoices ALTER COLUMN total SET NOT NULL`);
```

**Step 5: Deploy code using only new column**
```typescript
// Code only uses total
const invoice = { total: data.total };
```

**Step 6: Drop old column**
```typescript
await queryRunner.query(`ALTER TABLE invoices DROP COLUMN amount`);
```

---

## Event Sourcing + Read Model Pattern

**Event Store**: No migrations (events immutable)
**Read Models**: Can rebuild from events

```typescript
// Strategy: Create new projection while old serves queries
export class RebuildInvoiceProjection implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create new table
    await queryRunner.query(`CREATE TABLE invoice_projections_v2 (...)`);

    // 2. Rebuild from events (in background job, not migration)
    // await this.eventStore.replayAllStreams('invoice-*', new InvoiceProjectionV2Handler());

    // 3. Switch traffic (after verification)
    // Rename: invoice_projections → invoice_projections_old
    // Rename: invoice_projections_v2 → invoice_projections
  }
}
```

---

## Testing Migrations

### Before Production

```bash
# 1. Apply migration to fresh staging DB
npm run migration:run

# 2. Test all queries work
npm run test:e2e

# 3. Test rollback
npm run migration:revert

# 4. Test re-apply
npm run migration:run

# 5. Verify data integrity
npm run migration:verify
```

### Test Checklist

- [ ] Migration applies successfully
- [ ] Migration rolls back successfully
- [ ] Re-applying after rollback works
- [ ] All queries return expected data
- [ ] Indexes exist on all expected columns
- [ ] Performance not degraded
- [ ] Multi-tenant schemas all updated

---

## Rollback Procedure

### When to Rollback

- Migration fails halfway
- Query performance degraded
- Data integrity issues
- Application errors after migration

### How to Rollback

```bash
# 1. Rollback last migration
npm run migration:revert

# 2. Verify application works
npm run test:e2e

# 3. Fix migration code
# Edit migration file

# 4. Re-apply
npm run migration:run
```

---

## Common Mistakes

### ❌ Don't

1. **Drop column directly** → Breaks running code
2. **Rename column directly** → Breaks running code
3. **Add NOT NULL column** → Fails if table has data
4. **Drop index first** → Query degradation
5. **Forget tenant schemas** → Data inconsistency
6. **Skip rollback testing** → Production stuck if migration fails

### ✅ Do

1. **Add nullable, then backfill** → Safe two-step
2. **Dual-write period** → Old + new columns
3. **Create index first** → No performance impact
4. **Test on staging** → Catch issues early
5. **Batch large updates** → Avoid lock timeouts
6. **Always have rollback plan** → Recovery ready

---

## Production Deployment Checklist

Before running migrations in production:

- [ ] Tested on staging with production-like data
- [ ] Rollback tested and works
- [ ] Downtime window scheduled (if needed)
- [ ] Backup created
- [ ] Multi-tenant schemas identified
- [ ] Team notified
- [ ] Monitoring ready
- [ ] Rollback procedure documented

---

## Emergency Rollback Plan

```bash
# 1. Stop application
kubectl scale deployment finance-service --replicas=0

# 2. Rollback migration
npm run migration:revert

# 3. Verify rollback
npm run migration:show

# 4. Restart application
kubectl scale deployment finance-service --replicas=3

# 5. Monitor logs
kubectl logs -f deployment/finance-service
```

---

**See Also**:
- `.claude/skills/database-migrations/SKILL.md` - Full migration patterns
- `.claude/skills/multi-tenancy/SKILL.md` - Multi-tenant migration details
- `services/finance/src/migrations/` - Production migration examples
