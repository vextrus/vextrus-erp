import { Injectable } from '@nestjs/common';
import { GqlOptionsFactory } from '@nestjs/graphql';
import { ApolloFederationDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ConfigService } from '@nestjs/config';
import { GraphQLFormattedError } from 'graphql';

@Injectable()
export class GraphQLFederationConfig implements GqlOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createGqlOptions(): ApolloFederationDriverConfig {
    return {
      autoSchemaFile: {
        federation: 2,
        path: 'src/schema.gql',
      },
      sortSchema: true,
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      csrfPrevention: false, // Required for Apollo Sandbox
      introspection: this.configService.get<string>('NODE_ENV') !== 'production',
      context: ({ req }) => {
        const tenantId = req.headers['x-tenant-id'];
        const userId = req.headers['x-user-id'];
        const authorization = req.headers['authorization'];

        return {
          tenantId,
          userId,
          authorization,
          req,
        };
      },
      formatError: (error: GraphQLFormattedError) => {
        return {
          message: error.message,
          path: error.path,
          extensions: {
            code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
            timestamp: new Date().toISOString(),
          },
        };
      },
    };
  }
}
