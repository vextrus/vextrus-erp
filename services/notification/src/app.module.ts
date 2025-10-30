import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { TerminusModule } from '@nestjs/terminus';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloFederationDriver } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

import { MetricsModule } from './modules/metrics/metrics.module';

import { NotificationModule } from './modules/notification/notification.module';
import { ChannelsModule } from './channels/channels.module';
import { QueuesModule } from './queues/queues.module';
import { HealthModule } from './modules/health/health.module';
import { NotificationResolver } from './resolvers/notification.resolver';
import { NotificationService } from './services/notification.service';
import { Notification } from './entities/notification.entity';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
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
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
          password: configService.get('redis.password'),
        },
      }),
      inject: [ConfigService],
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get('smtp.host'),
          port: configService.get('smtp.port'),
          secure: configService.get('smtp.secure'),
          auth: {
            user: configService.get('smtp.user'),
            pass: configService.get('smtp.password'),
          },
        },
        defaults: {
          from: configService.get('smtp.from'),
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Notification]),
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_CLIENT',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'notification-service',
              brokers: configService.get('kafka.brokers', ['localhost:9092']),
            },
            consumer: {
              groupId: 'notification-consumer-group',
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    TerminusModule,
    NotificationModule,
    ChannelsModule,
    QueuesModule,
    HealthModule,
  ],
  providers: [
    NotificationResolver,
    NotificationService,
  ],
  exports: [
    NotificationService,
  ],
})
export class AppModule {}