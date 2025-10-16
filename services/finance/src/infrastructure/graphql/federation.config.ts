import { Injectable } from '@nestjs/common';
import { GqlOptionsFactory, GqlModuleOptions } from '@nestjs/graphql';
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { join } from 'path';
import { Request, Response } from 'express';

@Injectable()
export class GraphQLFederationConfig implements GqlOptionsFactory {
  createGqlOptions(): ApolloFederationDriverConfig {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      driver: ApolloFederationDriver,
      autoSchemaFile: {
        federation: 2,
        path: join(process.cwd(), 'src/schema.gql'),
      },
      sortSchema: true,
      playground: false,
      plugins: [
        ApolloServerPluginLandingPageLocalDefault({
          embed: true,
          includeCookies: true,
        }),
      ],
      // Enable CSRF protection in production, disable in development for Apollo Sandbox
      csrfPrevention: isProduction ? {
        requestHeaders: ['x-apollo-operation-name', 'apollo-require-preflight'],
      } : false,
      // Disable introspection in production to prevent schema enumeration
      introspection: !isProduction,
      context: ({ req, res }: { req: Request; res: Response }) => ({
        req,
        res,
        tenantId: req.headers['x-tenant-id'],
        userId: req.user?.id,
        correlationId: req.headers['x-correlation-id'] || req.headers['x-request-id'],
        userRole: req.user?.role,
      }),
      buildSchemaOptions: {
        orphanedTypes: [],
      },
      formatError: (error) => {
        const graphQLFormattedError = {
          message: error.message,
          code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
          path: error.path,
          extensions: {
            ...error.extensions,
            timestamp: new Date().toISOString(),
          },
        };

        return graphQLFormattedError;
      },
      debug: process.env.NODE_ENV !== 'production',
      includeStacktraceInErrorResponses: process.env.NODE_ENV !== 'production',
    };
  }
}