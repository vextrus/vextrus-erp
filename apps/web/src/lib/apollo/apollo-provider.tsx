/**
 * Apollo Provider for Client Components
 * Uses standard ApolloProvider with cookie-based authentication
 */

'use client';

import { useMemo } from 'react';
import { ApolloClient, ApolloProvider, InMemoryCache, HttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql';

/**
 * Client Auth Link - Adds JWT token from custom header
 * Token is passed via context from AuthProvider
 */
const clientAuthLink = setContext(async (_, { headers }) => {
  return {
    headers: {
      ...headers,
    },
  };
});

/**
 * Error Link - Handles GraphQL and network errors
 */
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
      );
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

export function ApolloWrapper({ children }: React.PropsWithChildren) {
  const client = useMemo(() => {
    const httpLinkWithCredentials = new HttpLink({
      uri: API_URL,
      credentials: 'include', // Send cookies with requests
      fetchOptions: {
        cache: 'no-store',
        mode: 'cors' as RequestMode, // Explicitly enable CORS mode
      },
    });

    return new ApolloClient({
      cache: new InMemoryCache({
        typePolicies: {
          Query: {
            fields: {
              // TODO: Add custom merge policies for paginated queries
            },
          },
        },
      }),
      link: from([errorLink, clientAuthLink, httpLinkWithCredentials]),
      defaultOptions: {
        query: {
          errorPolicy: 'all',
          fetchPolicy: 'cache-first', // Client Components use cache
        },
        mutate: {
          errorPolicy: 'all',
        },
        watchQuery: {
          errorPolicy: 'all',
          fetchPolicy: 'cache-and-network',
        },
      },
    });
  }, []);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
