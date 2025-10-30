import { Injectable } from '@nestjs/common';
import { GqlOptionsFactory } from '@nestjs/graphql';
import { ApolloFederationDriverConfig } from '@nestjs/apollo';
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
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      introspection: true,
      csrfPrevention: false, // Disable CSRF for Apollo Sandbox landing page
      context: ({ req }: { req: Request }) => ({
        req,
        headers: req.headers,
        user: req.user, // Add user from Passport authentication
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
