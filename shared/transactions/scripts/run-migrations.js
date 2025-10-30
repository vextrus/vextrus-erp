const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'vextrus_erp',
  user: process.env.DB_USER || 'vextrus',
  password: process.env.DB_PASSWORD || 'vextrus_dev_2024',
};

async function runMigrations() {
  const pool = new Pool(config);
  
  try {
    console.log('🚀 Starting database migrations...');
    
    // Read migration files
    const migrationsDir = path.join(__dirname, '..', 'src', 'database', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`📁 Found ${migrationFiles.length} migration files`);
    
    for (const file of migrationFiles) {
      console.log(`\n📝 Running migration: ${file}`);
      
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        await pool.query(sql);
        console.log(`✅ Successfully ran migration: ${file}`);
      } catch (error) {
        console.error(`❌ Failed to run migration ${file}:`, error.message);
        throw error;
      }
    }
    
    console.log('\n🎉 All migrations completed successfully!');
    
    // Verify tables were created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('event_store', 'saga_states', 'outbox_events', 'idempotency_keys', 'snapshots')
      ORDER BY table_name;
    `);
    
    console.log('\n📊 Created tables:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations()
  .then(() => {
    console.log('\n✨ Database setup complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });