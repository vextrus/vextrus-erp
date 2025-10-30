const { Client } = require('pg');

async function fixAuthDatabase() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'vextrus',
    password: 'vextrus_dev_2024',
    database: 'vextrus_erp'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if roles table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'auth' 
        AND table_name = 'roles'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('Roles table does not exist, will be created by TypeORM');
      await client.end();
      return;
    }

    // Check if roles table has data
    const rolesResult = await client.query('SELECT COUNT(*) FROM auth.roles');
    const rolesCount = parseInt(rolesResult.rows[0].count);
    console.log(`Found ${rolesCount} roles in database`);

    // Check which columns exist
    const columnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'auth' 
      AND table_name = 'roles';
    `);
    const existingColumns = columnsResult.rows.map(row => row.column_name);
    console.log('Existing columns:', existingColumns);

    // Add missing columns with temporary defaults
    const columnsToAdd = [
      { name: 'nameEn', type: 'VARCHAR(100)', default: "'English Name'" },
      { name: 'nameBn', type: 'VARCHAR(100)', default: "'Bengali Name'" },
      { name: 'descriptionBn', type: 'TEXT', default: null },
      { name: 'parentRoleId', type: 'UUID', default: null },
      { name: 'level', type: 'INTEGER', default: 0 },
      { name: 'permissions', type: 'JSONB', default: "'[]'::jsonb" },
      { name: 'isActive', type: 'BOOLEAN', default: true },
      { name: 'isSystem', type: 'BOOLEAN', default: false },
      { name: 'isDefault', type: 'BOOLEAN', default: false },
      { name: 'priority', type: 'INTEGER', default: 0 },
      { name: 'metadata', type: 'JSONB', default: null },
      { name: 'createdBy', type: 'UUID', default: null },
      { name: 'updatedBy', type: 'UUID', default: null },
      { name: 'deletedAt', type: 'TIMESTAMPTZ', default: null },
      { name: 'version', type: 'INTEGER', default: 1 }
    ];

    for (const col of columnsToAdd) {
      if (!existingColumns.includes(col.name.toLowerCase())) {
        const defaultClause = col.default !== null ? ` DEFAULT ${col.default}` : '';
        const query = `ALTER TABLE auth.roles ADD COLUMN "${col.name}" ${col.type}${defaultClause}`;
        try {
          await client.query(query);
          console.log(`Added column: ${col.name}`);
        } catch (err) {
          console.log(`Error adding ${col.name}: ${err.message}`);
        }
      }
    }

    // Update any NULL values in required fields
    if (rolesCount > 0) {
      await client.query(`UPDATE auth.roles SET "nameEn" = COALESCE("nameEn", "name", 'Default Role') WHERE "nameEn" IS NULL`);
      await client.query(`UPDATE auth.roles SET "nameBn" = COALESCE("nameBn", "name", 'Default Role') WHERE "nameBn" IS NULL`);
      console.log('Updated NULL values in existing records');
    }

    // Now make required columns NOT NULL
    const requiredColumns = ['nameEn', 'nameBn'];
    for (const col of requiredColumns) {
      try {
        await client.query(`ALTER TABLE auth.roles ALTER COLUMN "${col}" SET NOT NULL`);
        console.log(`Made ${col} NOT NULL`);
      } catch (err) {
        console.log(`${col} might already be NOT NULL`);
      }
    }

    console.log('Database fix completed successfully');
    
  } catch (error) {
    console.error('Error fixing database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the fix
fixAuthDatabase().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});