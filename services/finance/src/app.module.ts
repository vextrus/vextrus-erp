import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { ApolloFederationDriver } from '@nestjs/apollo';

// Infrastructure modules
import { EventStoreModule } from '@infrastructure/persistence/event-store/event-store.module';
import { KafkaModule } from '@infrastructure/messaging/kafka/kafka.module';
import { TelemetryModule } from '@infrastructure/telemetry/telemetry.module';
import { GraphQLFederationConfig } from '@infrastructure/graphql/federation.config';
import { TenantMiddleware } from '@infrastructure/middleware/tenant.middleware';
import { TenantContextService } from '@infrastructure/context/tenant-context.service';
import { AuthModule } from '@infrastructure/auth/auth.module';

// Presentation layer
import { HealthController } from '@presentation/health/health.controller';
import { FinanceGraphQLModule } from '@presentation/graphql/finance-graphql.module';

// Guards
import { JwtAuthGuard } from '@infrastructure/guards/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,  // NO FALLBACK - Required via environment variable
      database: process.env.DATABASE_NAME,
      autoLoadEntities: true,
      synchronize: false, // NEVER auto-sync schema (use migrations instead)
      logging: process.env.NODE_ENV === 'development',
      extra: {
        connectionTimeoutMillis: 5000,
        max: 20,  // Connection pool size
        ssl: process.env.NODE_ENV === 'production' ? {
          rejectUnauthorized: true
        } : false
      }
    }),

    // GraphQL Federation
    GraphQLModule.forRootAsync({
      driver: ApolloFederationDriver,
      imports: [ConfigModule],
      useClass: GraphQLFederationConfig,
    }),

    // Infrastructure modules
    EventStoreModule,
    KafkaModule,
    TelemetryModule.forRoot(),
    AuthModule,

    // Presentation layer
    FinanceGraphQLModule,

    // Health checks
    TerminusModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [HealthController],
  providers: [
    TenantContextService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.ALL },
        { path: 'health/ready', method: RequestMethod.ALL },
        { path: 'health/live', method: RequestMethod.ALL },
        { path: 'graphql', method: RequestMethod.ALL }, // Apollo Sandbox UI (GET) and introspection (POST without tenant)
      )
      .forRoutes('*');
  }
}