import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo';
import { HealthModule } from './modules/health/health.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { KafkaModule } from './modules/kafka/kafka.module';
import { Organization } from './entities/organization.entity';
import { Division } from './entities/division.entity';
import { Tenant } from './entities/tenant.entity';
import { OrganizationModule } from './organization.module';
import { GraphQLFederationConfig } from './config/graphql-federation.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USERNAME || 'vextrus',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'vextrus_organization',
      entities: [Organization, Division, Tenant],
      synchronize: process.env.NODE_ENV === 'development',
      logging: process.env.NODE_ENV === 'development',
    }),
    TypeOrmModule.forFeature([Organization, Division, Tenant]),
    GraphQLModule.forRootAsync<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      imports: [ConfigModule],
      useClass: GraphQLFederationConfig,
    }),
    HealthModule,
    MetricsModule,
    KafkaModule,
    OrganizationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}