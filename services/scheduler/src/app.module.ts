import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MetricsModule } from './modules/metrics/metrics.module';
import { HealthModule } from './health/health.module';
import { JobSchedule } from './entities/job-schedule.entity';
import { JobExecution } from './entities/job-execution.entity';
import { SchedulerController } from './controllers/scheduler.controller';
import { JobsController } from './controllers/jobs.controller';
import { SchedulerService } from './services/scheduler.service';
import { JobExecutorService } from './services/job-executor.service';
import { CronJobService } from './services/cron-job.service';
import { JobProcessor } from './processors/job.processor';
import { JobScheduleResolver } from './resolvers/job-schedule.resolver';
// import { PrometheusModule } from '@willsoto/nestjs-prometheus'; // TODO: Install if needed

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
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
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    MetricsModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USER', 'postgres'),
        password: configService.get('DATABASE_PASSWORD', 'postgres'),
        database: configService.get('DATABASE_NAME', 'scheduler_db'),
        entities: [JobSchedule, JobExecution],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('DATABASE_LOGGING', false),
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([JobSchedule, JobExecution]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'scheduled-jobs',
    }),
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_CLIENT',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'scheduler',
              brokers: configService.get('KAFKA_BROKERS', 'localhost:9092').split(','),
            },
            consumer: {
              groupId: 'scheduler-consumer',
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    // PrometheusModule.register({
    //   defaultMetrics: {
    //     enabled: true,
    //   },
    //   path: '/metrics',
    // }),
    HealthModule,
  ],
  controllers: [SchedulerController, JobsController],
  providers: [
    SchedulerService,
    JobScheduleResolver,
    JobExecutorService,
    CronJobService,
    JobProcessor,
  ],
})
export class AppModule {}