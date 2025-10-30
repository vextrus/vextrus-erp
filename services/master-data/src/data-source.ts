import { DataSource } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { Vendor } from './entities/vendor.entity';
import { Product } from './entities/product.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'vextrus',
  password: process.env.DATABASE_PASSWORD || 'vextrus_dev_2024',
  database: process.env.DATABASE_NAME || 'vextrus_erp',
  synchronize: process.env.NODE_ENV === 'development' || true,
  logging: process.env.NODE_ENV === 'development',
  entities: [Customer, Vendor, Product],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: [],
});