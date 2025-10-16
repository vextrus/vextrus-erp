import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo';
import * as redisStore from 'cache-manager-redis-store';

import configuration from './config/configuration';
import { GraphQLFederationConfig } from './config/graphql-federation.config';

// Entities
import { Customer } from './entities/customer.entity';
import { Vendor } from './entities/vendor.entity';
import { Product } from './entities/product.entity';

// Services
import { EventPublisherService } from './services/event-publisher.service';
import { CacheService } from './services/cache.service';

// Controllers
import { CustomerController } from './controllers/customer.controller';
import { VendorController } from './controllers/vendor.controller';
import { ProductController } from './controllers/product.controller';

// Modules
import { HealthModule } from './modules/health/health.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { KafkaModule } from './modules/kafka/kafka.module';

// GraphQL Resolvers
import { CustomerResolver } from './graphql/customer.resolver';
import { VendorResolver } from './graphql/vendor.resolver';
import { ProductResolver } from './graphql/product.resolver';

// Repositories
import { CustomerRepository } from './repositories/customer.repository';
import { VendorRepository } from './repositories/vendor.repository';
import { ProductRepository } from './repositories/product.repository';

// Services
import { CustomerService } from './services/customer.service';
import { VendorService } from './services/vendor.service';
import { ProductService } from './services/product.service';

// Validators
import { BangladeshValidator } from './validators/bangladesh.validator';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [Customer, Vendor, Product],
        synchronize: configService.get('database.synchronize'),
        logging: configService.get('database.logging'),
        autoLoadEntities: true,
        migrations: configService.get('database.migrations'),
        migrationsRun: configService.get('database.migrationsRun'),
      }),
      inject: [ConfigService],
    }),

    // TypeORM Entities
    TypeOrmModule.forFeature([Customer, Vendor, Product]),

    // GraphQL Federation (MUST be before CacheModule to avoid DI conflicts)
    GraphQLModule.forRootAsync<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      imports: [ConfigModule],
      useClass: GraphQLFederationConfig,
    }),

    // Cache
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        store: redisStore as any,
        host: configService.get('redis.host', 'localhost'),
        port: configService.get('redis.port', 6379),
        password: configService.get('redis.password'),
        db: configService.get('redis.db', 0),
        ttl: configService.get('cache.ttl', 300),
        max: configService.get('cache.max', 1000),
      }),
      inject: [ConfigService],
    }),

    // Modules
    HealthModule,
    MetricsModule,
    KafkaModule,
  ],
  controllers: [
    CustomerController,
    VendorController,
    ProductController,
  ],
  providers: [
    // Repositories
    CustomerRepository,
    VendorRepository,
    ProductRepository,

    // Services
    EventPublisherService,
    CacheService,
    CustomerService,
    VendorService,
    ProductService,

    // Validators
    BangladeshValidator,

    // GraphQL Resolvers
    CustomerResolver,
    VendorResolver,
    ProductResolver,
  ],
  exports: [
    EventPublisherService,
    CacheService,
    CustomerService,
    VendorService,
    ProductService,
  ],
})
export class AppModule {}