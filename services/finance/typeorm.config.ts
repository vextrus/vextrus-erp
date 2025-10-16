import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

/**
 * TypeORM Configuration for Migrations
 *
 * This configuration is used for generating and running database migrations.
 * It's separate from the runtime TypeORM configuration in AppModule.
 *
 * Usage:
 * - npm run migration:generate -- -n MigrationName
 * - npm run migration:run
 * - npm run migration:revert
 *
 * Environment Variables:
 * - DATABASE_HOST: PostgreSQL host (default: localhost)
 * - DATABASE_PORT: PostgreSQL port (default: 5432)
 * - DATABASE_USERNAME: Database username (default: vextrus)
 * - DATABASE_PASSWORD: Database password (default: vextrus_dev_2024)
 * - DATABASE_NAME: Database name (default: vextrus_finance)
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'vextrus',
  password: process.env.DATABASE_PASSWORD || 'vextrus_dev_2024',
  database: process.env.DATABASE_NAME || 'vextrus_finance',

  // Entity paths for TypeORM CLI
  entities: ['src/**/entities/*.entity.ts'],

  // Migration paths
  migrations: ['src/infrastructure/persistence/migrations/*.ts'],

  // Subscribers (optional)
  subscribers: [],

  // Logging
  logging: process.env.NODE_ENV === 'development',

  // Synchronize disabled for migrations
  synchronize: false,
});
