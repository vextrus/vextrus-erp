import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloFederationDriver } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

// Entities
import { AuditLog } from './entities/audit-log.entity';
import { AuditRule } from './entities/audit-rule.entity';
import { RetentionPolicy } from './entities/retention-policy.entity';

// Controllers
import { AuditController } from './controllers/audit.controller';
import { SearchController } from './controllers/search.controller';
import { ComplianceController } from './controllers/compliance.controller';
import { RetentionController } from './controllers/retention.controller';
import { HealthController } from './health/health.controller';

// Services
import { AuditService } from './services/audit.service';
import { ElasticsearchService } from './services/elasticsearch.service';
import { ComplianceService } from './services/compliance.service';
import { RetentionService } from './services/retention.service';

// Consumers
import { AuditEventConsumer } from './consumers/audit-event.consumer';

// Resolvers
import { AuditLogResolver } from './resolvers/audit-log.resolver';

// Modules
import { MetricsModule } from './modules/metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: {
        federation: 2,
      },
      context: ({ req }) => ({ req }),
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
        csrfPrevention: false, // Required for Apollo Sandbox
      introspection: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USER', 'postgres'),
        password: configService.get('DATABASE_PASSWORD', 'postgres'),
        database: configService.get('DATABASE_NAME', 'audit'),
        entities: [AuditLog, AuditRule, RetentionPolicy],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([AuditLog, AuditRule, RetentionPolicy]),
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        node: configService.get('ELASTICSEARCH_NODE', 'http://localhost:9200'),
        auth: {
          username: configService.get('ELASTICSEARCH_USERNAME', 'elastic'),
          password: configService.get('ELASTICSEARCH_PASSWORD', 'changeme'),
        },
      }),
      inject: [ConfigService],
    }),
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_CLIENT',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'audit-service',
              brokers: configService.get('KAFKA_BROKERS', 'localhost:9092').split(','),
            },
            consumer: {
              groupId: 'audit-consumer-group',
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    ScheduleModule.forRoot(),
    MetricsModule,
  ],
  controllers: [
    AuditController,
    SearchController,
    ComplianceController,
    RetentionController,
    HealthController,
  ],
  providers: [
    AuditService,
    ElasticsearchService,
    ComplianceService,
    RetentionService,
    AuditEventConsumer,
    AuditLogResolver,
  ],
  exports: [
    AuditService,
    ElasticsearchService,
    ComplianceService,
    RetentionService,
  ],
})
export class AppModule {}