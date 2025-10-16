import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { join } from 'path';
import { MetricsModule } from './modules/metrics/metrics.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { TenantConfigModule } from './tenant-config/tenant-config.module';
import { ProvidersModule } from './providers/providers.module';
import { HealthModule } from './modules/health/health.module';
import { ConfigurationResolver, FeatureFlagResolver } from './resolvers/configuration.resolver';
import { ConfigurationService } from './services/configuration.service';
import { Configuration } from './entities/configuration.entity';
import { FeatureFlag } from './entities/feature-flag.entity';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    GraphQLModule.forRootAsync<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        autoSchemaFile: {
          federation: 2,
          path: join(process.cwd(), 'src/schema.gql'),
        },
        sortSchema: true,
        playground: false,
        plugins: [ApolloServerPluginLandingPageLocalDefault()],
        csrfPrevention: false, // Required for Apollo Sandbox
        context: ({ req }) => ({
          req,
          headers: req.headers,
          tenantId: req.headers['x-tenant-id'] || req.headers['tenant-id'],
        }),
        introspection: true,
        buildSchemaOptions: {
          orphanedTypes: [],
          directives: [],
        },
      }),
      inject: [ConfigService],
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
    TypeOrmModule.forFeature([Configuration, FeatureFlag]),
    TerminusModule,
    ProvidersModule,
    FeatureFlagsModule,
    TenantConfigModule,
    HealthModule,
    MetricsModule,
  ],
  providers: [
    ConfigurationService,
    ConfigurationResolver,
    FeatureFlagResolver,
  ],
})
export class AppModule {}