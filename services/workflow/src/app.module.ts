import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { join } from 'path';
import { WorkflowModule } from './workflow.module';
import configuration from './config/configuration';
import { HealthModule } from './modules/health/health.module';
import { KafkaModule } from './modules/kafka/kafka.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { Process } from './entities/process.entity';
import { Task } from './entities/task.entity';
import { Assignment } from './entities/assignment.entity';
import { Transition } from './entities/transition.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),

    // Database (MUST be before GraphQL)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [Process, Task, Assignment, Transition],
        synchronize: configService.get('database.synchronize'),
        logging: configService.get('database.logging'),
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),

    TypeOrmModule.forFeature([Process, Task, Assignment, Transition]),

    // GraphQL Federation (AFTER TypeORM)
    GraphQLModule.forRootAsync<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        autoSchemaFile: {
          federation: 2,
          path: join(process.cwd(), 'src/schema.gql'),
        },
        sortSchema: true,
        introspection: true,
      playground: false,
        plugins: [ApolloServerPluginLandingPageLocalDefault()],
        csrfPrevention: false, // Required for Apollo Sandbox
        context: ({ req }) => ({
          headers: req.headers,
          tenantId: req.headers['x-tenant-id'] || req.headers['tenant-id'],
        }),
        buildSchemaOptions: {
          directives: [],
        },
      }),
      inject: [ConfigService],
    }),

    // Application modules
    KafkaModule,
    HealthModule,
    MetricsModule,
    WorkflowModule,
  ],
})
export class AppModule {}