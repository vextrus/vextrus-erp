const { Client } = require('pg');

async function resetAuthTables() {
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

    // Drop all auth schema tables in correct order (handle foreign key constraints)
    const dropQueries = [
      'DROP TABLE IF EXISTS auth.role_permissions CASCADE',
      'DROP TABLE IF EXISTS auth.user_roles CASCADE',
      'DROP TABLE IF EXISTS auth.permissions CASCADE',
      'DROP TABLE IF EXISTS auth.roles CASCADE',
      'DROP TABLE IF EXISTS auth.users CASCADE',
      'DROP TABLE IF EXISTS public.event_store CASCADE',
      'DROP TABLE IF EXISTS public.migrations CASCADE'
    ];

    for (const query of dropQueries) {
      try {
        await client.query(query);
        console.log(`Executed: ${query}`);
      } catch (err) {
        console.log(`Warning: ${err.message}`);
      }
    }

    console.log('\n✅ Database tables reset successfully');
    console.log('The auth service will recreate tables on next startup');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the reset
resetAuthTables().then(() => {
  console.log('\nScript completed successfully');
  process.exit(0);
}).catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});