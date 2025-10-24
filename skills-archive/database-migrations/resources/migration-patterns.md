# Advanced Migration Patterns

**Purpose**: Detailed examples and advanced patterns for TypeORM zero-downtime migrations in Vextrus ERP.

---

## Pattern 1: Column Type Change (Zero Downtime)

**Problem**: Changing column type from `VARCHAR(50)` to `VARCHAR(255)` can lock table

**Solution**: Multi-step migration

### Step 1: Add New Column
```typescript
export class AddCustomerEmailLong1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE customers
      ADD COLUMN email_new VARCHAR(255)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE customers DROP COLUMN email_new`);
  }
}
```

### Step 2: Backfill Data
```typescript
export class BackfillCustomerEmail1234567891 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 1000;

    while (true) {
      const result = await queryRunner.query(`
        UPDATE customers
        SET email_new = email
        WHERE email_new IS NULL
        AND id IN (
          SELECT id FROM customers
          WHERE email_new IS NULL
          LIMIT ${batchSize}
        )
      `);

      if (result[1] === 0) break; // PostgreSQL returns [result, rowCount]
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE customers SET email_new = NULL`);
  }
}
```

### Step 3: Application Dual-Write
```typescript
// In your entity/repository, write to both columns during transition
async updateEmail(customerId: string, email: string) {
  await this.repo.update(customerId, {
    email: email,      // Old column
    email_new: email   // New column
  });
}
```

### Step 4: Switch Reads to New Column
```typescript
// Deploy application code that reads from email_new
@Column({ name: 'email_new' })
email: string;
```

### Step 5: Drop Old Column
```typescript
export class DropCustomerEmailOld1234567892 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE customers DROP COLUMN email`);
    await queryRunner.query(`ALTER TABLE customers RENAME COLUMN email_new TO email`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE customers RENAME COLUMN email TO email_new`);
    await queryRunner.query(`ALTER TABLE customers ADD COLUMN email VARCHAR(50)`);
  }
}
```

---

## Pattern 2: Adding NOT NULL Constraint (Zero Downtime)

**Problem**: Adding NOT NULL constraint can fail if data exists or lock table

**Solution**: Multi-step with validation

### Step 1: Add Column (Nullable with Default)
```typescript
export class AddInvoiceStatus1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE invoices
      ADD COLUMN status VARCHAR(50) DEFAULT 'draft'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE invoices DROP COLUMN status`);
  }
}
```

### Step 2: Backfill Existing Rows
```typescript
export class BackfillInvoiceStatus1234567891 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Backfill based on business logic
    await queryRunner.query(`
      UPDATE invoices
      SET status = CASE
        WHEN paid_at IS NOT NULL THEN 'paid'
        WHEN sent_at IS NOT NULL THEN 'sent'
        ELSE 'draft'
      END
      WHERE status IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Optionally clear backfilled data
    await queryRunner.query(`UPDATE invoices SET status = 'draft'`);
  }
}
```

### Step 3: Add NOT NULL Constraint
```typescript
export class MakeInvoiceStatusRequired1234567892 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add CHECK constraint first (instant in PostgreSQL 12+)
    await queryRunner.query(`
      ALTER TABLE invoices
      ADD CONSTRAINT invoices_status_not_null
      CHECK (status IS NOT NULL) NOT VALID
    `);

    // Validate constraint (can run concurrently without locking)
    await queryRunner.query(`
      ALTER TABLE invoices
      VALIDATE CONSTRAINT invoices_status_not_null
    `);

    // Convert to NOT NULL (instant because constraint validated)
    await queryRunner.query(`
      ALTER TABLE invoices
      ALTER COLUMN status SET NOT NULL
    `);

    // Drop CHECK constraint (no longer needed)
    await queryRunner.query(`
      ALTER TABLE invoices
      DROP CONSTRAINT invoices_status_not_null
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE invoices
      ALTER COLUMN status DROP NOT NULL
    `);
  }
}
```

---

## Pattern 3: Complex Index Migration

**Problem**: Adding complex index on large table locks writes

**Solution**: Concurrent index creation (PostgreSQL)

```typescript
export class AddInvoicesComplexIndex1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create index concurrently (doesn't block writes)
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY idx_invoices_customer_status_date
      ON invoices (customer_id, status, created_at DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index concurrently
    await queryRunner.query(`
      DROP INDEX CONCURRENTLY IF EXISTS idx_invoices_customer_status_date
    `);
  }
}
```

**Important**: `CREATE INDEX CONCURRENTLY` cannot run inside a transaction. TypeORM wraps migrations in transactions by default.

**Workaround**:
```typescript
export class AddInvoicesComplexIndex1234567890 implements MigrationInterface {
  // Disable transaction for this migration
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY idx_invoices_customer_status_date
      ON invoices (customer_id, status, created_at DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX CONCURRENTLY IF EXISTS idx_invoices_customer_status_date
    `);
  }
}
```

---

## Pattern 4: Table Partitioning Migration

**Problem**: Large table needs partitioning without downtime

**Solution**: Create partitioned table, migrate data, switch

### Step 1: Create Partitioned Table
```typescript
export class CreateInvoicesPartitioned1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create partitioned table with same structure
    await queryRunner.query(`
      CREATE TABLE invoices_partitioned (
        LIKE invoices INCLUDING ALL
      ) PARTITION BY RANGE (created_at)
    `);

    // Create partitions for each month
    const currentYear = new Date().getFullYear();
    for (let month = 1; month <= 12; month++) {
      const monthStr = month.toString().padStart(2, '0');
      const nextMonth = (month % 12) + 1;
      const nextMonthStr = nextMonth.toString().padStart(2, '0');
      const nextYear = month === 12 ? currentYear + 1 : currentYear;

      await queryRunner.query(`
        CREATE TABLE invoices_${currentYear}_${monthStr}
        PARTITION OF invoices_partitioned
        FOR VALUES FROM ('${currentYear}-${monthStr}-01')
        TO ('${nextYear}-${nextMonthStr}-01')
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS invoices_partitioned CASCADE`);
  }
}
```

### Step 2: Migrate Data (Batch by Date Range)
```typescript
export class MigrateInvoicesToPartitioned1234567891 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 10000;
    let lastId = 0;

    while (true) {
      const result = await queryRunner.query(`
        INSERT INTO invoices_partitioned
        SELECT * FROM invoices
        WHERE id > $1
        ORDER BY id
        LIMIT $2
      `, [lastId, batchSize]);

      if (result[1] === 0) break;

      // Get last inserted ID
      const lastRow = await queryRunner.query(`
        SELECT id FROM invoices_partitioned
        ORDER BY id DESC
        LIMIT 1
      `);

      lastId = lastRow[0].id;

      // Small delay to avoid overwhelming database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`TRUNCATE TABLE invoices_partitioned`);
  }
}
```

### Step 3: Rename Tables (Quick Switch)
```typescript
export class SwitchToPartitionedInvoices1234567892 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename in quick succession (minimal downtime)
    await queryRunner.query(`ALTER TABLE invoices RENAME TO invoices_old`);
    await queryRunner.query(`ALTER TABLE invoices_partitioned RENAME TO invoices`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE invoices RENAME TO invoices_partitioned`);
    await queryRunner.query(`ALTER TABLE invoices_old RENAME TO invoices`);
  }
}
```

---

## Pattern 5: Event Sourcing Projection Rebuild

**Problem**: Projection schema needs to change, but events are immutable

**Solution**: Create new projection, rebuild from events, switch

```typescript
export class RebuildInvoiceProjection1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create new projection table with updated schema
    await queryRunner.query(`
      CREATE TABLE invoice_read_model_v2 (
        id UUID PRIMARY KEY,
        tenant_id UUID NOT NULL,
        customer_id UUID NOT NULL,
        invoice_number VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        total_amount DECIMAL(19, 4) NOT NULL,
        currency VARCHAR(3) NOT NULL,
        -- New fields
        tax_amount DECIMAL(19, 4),
        discount_amount DECIMAL(19, 4),
        net_amount DECIMAL(19, 4),
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL
      )
    `);

    // 2. Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_invoice_read_v2_tenant ON invoice_read_model_v2 (tenant_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_invoice_read_v2_customer ON invoice_read_model_v2 (customer_id)
    `);

    // 3. Projection rebuild happens via application code
    // (Read all events, replay through new projection handler)
    // Migration just creates the table structure
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS invoice_read_model_v2`);
  }
}
```

**Application code for rebuild**:
```typescript
async rebuildInvoiceProjection() {
  const events = await this.eventStore.readAllStreams({
    filter: { streamPrefix: 'invoice-' }
  });

  for (const event of events) {
    await this.invoiceProjectionV2Handler.handle(event);
  }

  // Switch application to use new projection
  // Rename tables if needed
}
```

---

## Pattern 6: Multi-Tenant Schema Migration

**Problem**: Apply migration to 100+ tenant schemas efficiently

**Solution**: Parallel execution with error handling

```typescript
export class AddPaymentStatusToAllTenants1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get all tenant schemas
    const tenants = await queryRunner.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name LIKE 'tenant_%'
    `);

    // Track failures
    const failures: { schema: string; error: string }[] = [];

    // Process in batches to avoid overwhelming database
    const batchSize = 10;
    for (let i = 0; i < tenants.length; i += batchSize) {
      const batch = tenants.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async ({ schema_name }) => {
          try {
            await queryRunner.query(`SET search_path TO ${schema_name}`);

            await queryRunner.query(`
              ALTER TABLE payments
              ADD COLUMN status VARCHAR(50) DEFAULT 'pending'
            `);

            // Add index
            await queryRunner.query(`
              CREATE INDEX idx_payments_status ON payments (status)
            `);

          } catch (error) {
            failures.push({
              schema: schema_name,
              error: error.message
            });
          }
        })
      );
    }

    // Reset to public schema
    await queryRunner.query(`SET search_path TO public`);

    // Log failures (or throw if critical)
    if (failures.length > 0) {
      console.error('Migration failed for schemas:', failures);
      throw new Error(`Migration failed for ${failures.length} tenant schemas`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tenants = await queryRunner.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name LIKE 'tenant_%'
    `);

    for (const { schema_name } of tenants) {
      await queryRunner.query(`SET search_path TO ${schema_name}`);
      await queryRunner.query(`ALTER TABLE payments DROP COLUMN IF EXISTS status`);
    }

    await queryRunner.query(`SET search_path TO public`);
  }
}
```

---

## Pattern 7: Foreign Key Addition Without Blocking

**Problem**: Adding FK constraint scans entire table and blocks writes

**Solution**: Add NOT VALID constraint, then validate

```typescript
export class AddInvoiceCustomerFk1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add FK constraint with NOT VALID (instant)
    await queryRunner.query(`
      ALTER TABLE invoices
      ADD CONSTRAINT fk_invoices_customer
      FOREIGN KEY (customer_id)
      REFERENCES customers (id)
      NOT VALID
    `);

    // Validate constraint (can run concurrently, doesn't block writes)
    await queryRunner.query(`
      ALTER TABLE invoices
      VALIDATE CONSTRAINT fk_invoices_customer
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE invoices
      DROP CONSTRAINT IF EXISTS fk_invoices_customer
    `);
  }
}
```

---

## Pattern 8: Enum Value Addition

**Problem**: Adding enum values in PostgreSQL requires migration

**Solution**: Use VARCHAR instead, or alter enum type

### Option 1: Alter Enum (PostgreSQL)
```typescript
export class AddInvoiceStatusValues1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new enum value (safe, doesn't lock table)
    await queryRunner.query(`
      ALTER TYPE invoice_status_enum ADD VALUE 'cancelled'
    `);

    await queryRunner.query(`
      ALTER TYPE invoice_status_enum ADD VALUE 'refunded'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Cannot remove enum values in PostgreSQL
    // Workaround: Recreate enum type (requires full table rewrite)
    // Usually better to keep enum values forever
    throw new Error('Cannot remove enum values in PostgreSQL');
  }
}
```

### Option 2: Convert to VARCHAR (Recommended for Flexibility)
```typescript
export class ConvertInvoiceStatusToVarchar1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Convert enum to varchar
    await queryRunner.query(`
      ALTER TABLE invoices
      ALTER COLUMN status TYPE VARCHAR(50)
    `);

    // Drop enum type
    await queryRunner.query(`
      DROP TYPE IF EXISTS invoice_status_enum
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate enum
    await queryRunner.query(`
      CREATE TYPE invoice_status_enum AS ENUM ('draft', 'sent', 'paid', 'cancelled', 'refunded')
    `);

    // Convert back to enum
    await queryRunner.query(`
      ALTER TABLE invoices
      ALTER COLUMN status TYPE invoice_status_enum USING status::invoice_status_enum
    `);
  }
}
```

---

## Resources

- **TypeORM Migrations**: https://typeorm.io/migrations
- **PostgreSQL ALTER TABLE**: https://www.postgresql.org/docs/current/sql-altertable.html
- **Strong Migrations (Ruby)**: https://github.com/ankane/strong_migrations (patterns apply to TypeORM)
- **Zero-Downtime Postgres**: https://www.citusdata.com/blog/2018/03/15/postgres-tips-zero-downtime-migrations/
