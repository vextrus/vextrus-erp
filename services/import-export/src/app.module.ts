import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ClientsModule, Transport } from '@nestjs/microservices';
// import { PrometheusModule } from '@willsoto/nestjs-prometheus';

import { HealthModule } from './health/health.module';
import { ImportJob } from './entities/import-job.entity';
import { ExportJob } from './entities/export-job.entity';
import { DataMapping } from './entities/data-mapping.entity';
import { ImportController } from './controllers/import.controller';
import { ExportController } from './controllers/export.controller';
import { MappingController } from './controllers/mapping.controller';
import { ImportService } from './services/import.service';
import { ExportService } from './services/export.service';
import { ImportExportService } from './services/import-export.service';
import { ImportJobResolver, ExportJobResolver } from './resolvers/import-export.resolver';
import { DataMapperService } from './services/data-mapper.service';
import { ValidationService } from './services/validation.service';
import { ImportProcessor } from './processors/import.processor';
import { ExportProcessor } from './processors/export.processor';

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
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USERNAME', 'postgres'),
        password: configService.get('DATABASE_PASSWORD', 'postgres'),
        database: configService.get('DATABASE_NAME', 'import_export_db'),
        entities: [ImportJob, ExportJob, DataMapping],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('DATABASE_LOGGING', false),
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([ImportJob, ExportJob, DataMapping]),
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
    BullModule.registerQueue(
      { name: 'import-jobs' },
      { name: 'export-jobs' },
    ),
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_CLIENT',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'import-export',
              brokers: configService.get('KAFKA_BROKERS', 'localhost:9092').split(','),
            },
            consumer: {
              groupId: 'import-export-consumer',
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
  controllers: [ImportController, ExportController, MappingController],
  providers: [
    ImportService,
    ExportService,
    ImportExportService,
    ImportJobResolver,
    ExportJobResolver,
    DataMapperService,
    ValidationService,
    ImportProcessor,
    ExportProcessor,
  ],
})
export class AppModule {}