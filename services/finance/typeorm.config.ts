import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: ['.env.local', '.env'] });

/**
 * TypeORM DataSource configuration for migrations
 *
 * This configuration is used by the TypeORM CLI for migration operations.
 * It must match the configuration in app.module.ts for production consistency.
 *
 * Usage:
 *   npm run migration:generate -- src/infrastructure/persistence/typeorm/migrations/MigrationName
 *   npm run migration:run
 *   npm run migration:revert
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'vextrus',
  password: process.env.DATABASE_PASSWORD || 'vextrus_dev_2024',
  database: process.env.DATABASE_NAME || 'vextrus_finance',

  // Entity locations
  entities: [
    join(__dirname, 'src/infrastructure/persistence/typeorm/entities/**/*.entity.ts'),
    join(__dirname, 'src/infrastructure/persistence/typeorm/entities/**/*.entity.js'),
  ],

  // Migration locations
  migrations: [
    join(__dirname, 'src/infrastructure/persistence/typeorm/migrations/**/*.ts'),
    join(__dirname, 'src/infrastructure/persistence/typeorm/migrations/**/*.js'),
  ],

  // Subscribers (if any)
  subscribers: [],

  // IMPORTANT: Must be false for production
  // Migrations handle schema changes, not synchronize
  synchronize: false,

  // Enable logging for migration operations
  logging: true,

  // Migration table name
  migrationsTableName: 'typeorm_migrations',

  // Run migrations automatically on startup (set to false for manual control)
  migrationsRun: false,
});
