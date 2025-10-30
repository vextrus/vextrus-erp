import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

// Load environment variables
config();

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DATABASE_HOST', 'localhost'),
  port: configService.get('DATABASE_PORT', 5432),
  username: configService.get('DATABASE_USERNAME', 'vextrus'),
  password: configService.get('DATABASE_PASSWORD', 'vextrus_dev_2024'),
  database: configService.get('DATABASE_NAME', 'vextrus_erp'),
  synchronize: false,
  logging: configService.get('NODE_ENV') === 'development',
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations_organization',
  ssl: configService.get('DATABASE_SSL') === 'true'
    ? { rejectUnauthorized: false }
    : false,
});