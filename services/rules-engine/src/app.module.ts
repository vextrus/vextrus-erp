import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo';
import { RulesModule } from './rules.module';
import configuration from './config/configuration';
import { GraphQLFederationConfig } from './config/graphql-federation.config';
import { HealthModule } from './modules/health/health.module';
import { KafkaModule } from './modules/kafka/kafka.module';
import { MetricsModule } from './modules/metrics/metrics.module';

// Entities
import { Rule } from './entities/rule.entity';
import { Action } from './entities/action.entity';
import { Condition } from './entities/condition.entity';
import { Evaluation } from './entities/evaluation.entity';

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
        entities: [Rule, Action, Condition, Evaluation],
        synchronize: configService.get('database.synchronize'),
        logging: configService.get('database.logging'),
        autoLoadEntities: true,
        migrations: configService.get('database.migrations'),
        migrationsRun: configService.get('database.migrationsRun'),
      }),
      inject: [ConfigService],
    }),

    // TypeORM Entities
    TypeOrmModule.forFeature([Rule, Action, Condition, Evaluation]),

    // GraphQL Federation (MUST be after TypeORM to avoid DI conflicts)
    GraphQLModule.forRootAsync<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      imports: [ConfigModule],
      useClass: GraphQLFederationConfig,
    }),

    // Modules
    HealthModule,
    MetricsModule,
    KafkaModule,
    RulesModule,
  ],
})
export class AppModule {}