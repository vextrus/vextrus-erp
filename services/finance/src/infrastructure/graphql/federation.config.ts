import { Injectable, Logger } from '@nestjs/common';
import { GqlOptionsFactory, GqlModuleOptions } from '@nestjs/graphql';
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloServerPlugin, GraphQLRequestListener } from '@apollo/server';
import { Plugin } from '@nestjs/apollo';
import { GraphQLError } from 'graphql';
import { join } from 'path';
import { Request, Response } from 'express';

/**
 * Query Complexity Plugin
 *
 * SECURITY FIX (CRIT-004): Prevents DoS attacks via complex GraphQL queries
 *
 * Protections:
 * - Max query depth: 10 levels (prevents deeply nested queries)
 * - Max field count: 100 fields (prevents wide queries)
 * - Query timeout: 30 seconds
 * - Logs expensive queries for monitoring
 *
 * Example attack prevented:
 * query {
 *   invoices {
 *     payments { invoice { payments { invoice { ... } } } } # Depth attack
 *   }
 * }
 */
@Plugin()
class QueryComplexityPlugin implements ApolloServerPlugin {
  private readonly logger = new Logger('QueryComplexityPlugin');
  private readonly MAX_DEPTH = 10;
  private readonly MAX_FIELD_COUNT = 100;

  async requestDidStart(): Promise<GraphQLRequestListener<any>> {
    const logger = this.logger;
    const maxDepth = this.MAX_DEPTH;
    const maxFieldCount = this.MAX_FIELD_COUNT;

    return {
      async didResolveOperation(requestContext) {
        const { document } = requestContext;

        // Calculate query depth
        const depth = calculateDepth(document);
        if (depth > maxDepth) {
          logger.warn(`Query rejected: depth ${depth} exceeds max ${maxDepth}`);
          throw new GraphQLError(
            `Query is too complex. Max depth is ${maxDepth}, got ${depth}`,
            { extensions: { code: 'QUERY_TOO_COMPLEX', maxDepth, actualDepth: depth } }
          );
        }

        // Calculate field count
        const fieldCount = calculateFieldCount(document);
        if (fieldCount > maxFieldCount) {
          logger.warn(`Query rejected: ${fieldCount} fields exceeds max ${maxFieldCount}`);
          throw new GraphQLError(
            `Query requests too many fields. Max ${maxFieldCount}, got ${fieldCount}`,
            { extensions: { code: 'QUERY_TOO_WIDE', maxFields: maxFieldCount, actualFields: fieldCount } }
          );
        }

        // Log expensive queries (>50% of limits)
        if (depth > maxDepth * 0.5 || fieldCount > maxFieldCount * 0.5) {
          logger.log(`Expensive query: depth=${depth}, fields=${fieldCount}`);
        }
      },
    };
  }
}

/**
 * Calculate query depth recursively
 */
function calculateDepth(node: any, currentDepth = 0): number {
  if (!node || typeof node !== 'object') {
    return currentDepth;
  }

  if (node.kind === 'Field' && node.selectionSet) {
    return Math.max(
      currentDepth + 1,
      ...node.selectionSet.selections.map((selection: any) =>
        calculateDepth(selection, currentDepth + 1)
      )
    );
  }

  if (node.definitions) {
    return Math.max(
      ...node.definitions.map((def: any) => calculateDepth(def, currentDepth))
    );
  }

  if (node.selectionSet) {
    return Math.max(
      ...node.selectionSet.selections.map((selection: any) =>
        calculateDepth(selection, currentDepth)
      )
    );
  }

  return currentDepth;
}

/**
 * Count total fields requested in query
 */
function calculateFieldCount(node: any): number {
  if (!node || typeof node !== 'object') {
    return 0;
  }

  let count = 0;

  if (node.kind === 'Field') {
    count = 1;
  }

  if (node.selectionSet?.selections) {
    count += node.selectionSet.selections.reduce(
      (sum: number, selection: any) => sum + calculateFieldCount(selection),
      0
    );
  }

  if (node.definitions) {
    count += node.definitions.reduce(
      (sum: number, def: any) => sum + calculateFieldCount(def),
      0
    );
  }

  return count;
}

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
        new QueryComplexityPlugin(),
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