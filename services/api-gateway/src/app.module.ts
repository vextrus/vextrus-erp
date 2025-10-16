import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { IntrospectAndCompose, RemoteGraphQLDataSource } from '@apollo/gateway';
import configuration from './config/configuration';
import { AuthContext } from './middleware/auth-context';

import { KafkaModule } from './modules/kafka/kafka.module';
import { RedisModule } from './modules/redis/redis.module';
import { HealthModule } from './modules/health/health.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    AuthModule,
    KafkaModule,
    RedisModule,
    HealthModule,
    MetricsModule,
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    GraphQLModule.forRootAsync<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      useFactory: async (configService: ConfigService) => {
        const subgraphs = configService.get('services.subgraphs');
        console.log('🔍 Configured subgraphs:', JSON.stringify(subgraphs, null, 2));
        console.log('📊 Total subgraphs:', subgraphs?.length || 0);

        return {
          server: {
            context: ({ req }) => {
              // Extract auth token and tenant info from headers
              const token = req.headers.authorization?.replace('Bearer ', '');
              const tenantId = req.headers['x-tenant-id'];

              return {
                token,
                tenantId,
                headers: req.headers,
              };
            },
            cors: {
              origin: configService.get<string>('cors.origin')?.split(',') || '*',
              credentials: true,
            },
            playground: false,
            plugins: [ApolloServerPluginLandingPageLocalDefault()],
            csrfPrevention: false, // Required for Apollo Sandbox
            introspection: configService.get<boolean>('graphql.introspection'),
          },
          gateway: {
            supergraphSdl: new IntrospectAndCompose({
              subgraphs,
              pollIntervalInMs: configService.get<number>('services.pollInterval'),
              introspectionHeaders: {
                'x-tenant-id': 'default',
              },
            }),
          buildService({ url }) {
            return new RemoteGraphQLDataSource({
              url,
              willSendRequest({ request, context }) {
                // Forward auth token and tenant info to subgraphs
                if (context.token) {
                  request.http.headers.set('authorization', `Bearer ${context.token}`);
                }
                if (context.tenantId) {
                  request.http.headers.set('x-tenant-id', context.tenantId);
                }
                // Forward trace headers for distributed tracing
                if (context.headers && context.headers['x-trace-id']) {
                  request.http.headers.set('x-trace-id', context.headers['x-trace-id']);
                }
              },
            });
          },
        },
      };
      },
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}