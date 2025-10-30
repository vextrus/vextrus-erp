const { Client } = require('pg');

async function createTestDatabase() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'vextrus',
    password: 'vextrus_dev_2024'
  });

  try {
    await client.connect();
    
    // Check if database exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'vextrus_test'"
    );
    
    if (result.rows.length === 0) {
      console.log('Creating test database vextrus_test...');
      await client.query('CREATE DATABASE vextrus_test');
      console.log('Test database created successfully');
    } else {
      console.log('Test database vextrus_test already exists');
    }
  } catch (error) {
    console.error('Error creating test database:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
  
  // Now run migrations on the test database
  const testClient = new Client({
    host: 'localhost',
    port: 5432,
    database: 'vextrus_test',
    user: 'vextrus',
    password: 'vextrus_dev_2024'
  });
  
  try {
    await testClient.connect();
    console.log('Running migrations on test database...');
    
    const fs = require('fs');
    const path = require('path');
    const migrationsDir = path.join(__dirname, '..', 'src', 'database', 'migrations');
    const migrationFile = path.join(migrationsDir, '001_create_event_store.sql');
    
    if (fs.existsSync(migrationFile)) {
      const sql = fs.readFileSync(migrationFile, 'utf8');
      await testClient.query(sql);
      console.log('Migrations completed successfully');
    }
  } catch (error) {
    console.error('Error running migrations:', error.message);
  } finally {
    await testClient.end();
  }
}

createTestDatabase();