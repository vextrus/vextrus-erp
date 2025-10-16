import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { MulterModule } from '@nestjs/platform-express';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
// Entities
import { File, FileVersion } from './entities/file.entity';
import { StoragePolicy } from './entities/storage-policy.entity';

// Controllers
import { FileController } from './controllers/file.controller';
import { FolderController } from './controllers/folder.controller';
import { PolicyController } from './controllers/policy.controller';
import { HealthController } from './health/health.controller';

// Services
import { StorageService } from './services/storage.service';
import { ThumbnailService } from './services/thumbnail.service';
import { PolicyService } from './services/policy.service';

// Providers
import { MinioProvider } from './providers/minio.provider';

// Resolvers
import { FileResolver } from './resolvers/file.resolver';

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
        database: configService.get('DATABASE_NAME', 'file_storage'),
        entities: [File, FileVersion, StoragePolicy],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([File, FileVersion, StoragePolicy]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'file-processing' },
      { name: 'thumbnail-generation' },
      { name: 'virus-scanning' },
      { name: 'policy-execution' },
    ),
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_CLIENT',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'file-storage-service',
              brokers: configService.get('KAFKA_BROKERS', 'localhost:9092').split(','),
            },
            consumer: {
              groupId: 'file-storage-group',
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    ScheduleModule.forRoot(),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        limits: {
          fileSize: configService.get('MAX_FILE_SIZE', 100 * 1024 * 1024), // 100MB default
          files: configService.get('MAX_FILES', 10),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    FileController,
    FolderController,
    PolicyController,
    HealthController,
  ],
  providers: [
    StorageService,
    ThumbnailService,
    PolicyService,
    MinioProvider,
    FileResolver,
  ],
  exports: [
    StorageService,
    ThumbnailService,
    PolicyService,
    MinioProvider,
  ],
})
export class AppModule {}