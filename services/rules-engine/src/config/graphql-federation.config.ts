import { Injectable } from '@nestjs/common';
import { GqlOptionsFactory } from '@nestjs/graphql';
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { join } from 'path';
import { Request } from 'express';

@Injectable()
export class GraphQLFederationConfig implements GqlOptionsFactory {
  createGqlOptions(): ApolloFederationDriverConfig {
    return {
      autoSchemaFile: {
        federation: 2,
        path: join(process.cwd(), 'src/schema.gql'),
      },
      sortSchema: true,
      introspection: true,
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      csrfPrevention: false, // Required for Apollo Sandbox
      context: ({ req }: { req: Request }) => ({
        req,
        headers: req.headers,
        tenantId: req.headers['x-tenant-id'] || req.headers['tenant-id'],
      }),
      buildSchemaOptions: {
        orphanedTypes: [],
      },
      formatError: (error) => ({
        message: error.message,
        code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
        path: error.path,
        extensions: {
          ...error.extensions,
          timestamp: new Date().toISOString(),
        },
      }),
      debug: process.env.NODE_ENV !== 'production',
      includeStacktraceInErrorResponses: process.env.NODE_ENV !== 'production',
    };
  }
}
