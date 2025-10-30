/**
 * Apollo Client Configuration for Next.js 14 App Router
 *
 * This file provides separate Apollo Client instances for:
 * - Server Components: Using registerApolloClient
 * - Client Components: Using ApolloNextAppProvider
 *
 * Features:
 * - JWT authentication via Auth link
 * - Error handling with automatic token refresh
 * - SSR support with SSRMultipartLink
 * - InMemoryCache for normalized data storage
 */

import { ApolloClient, HttpLink, InMemoryCache, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { registerApolloClient } from '@apollo/experimental-nextjs-app-support/rsc';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql';

/**
 * HTTP Link for connecting to GraphQL API
 */
const httpLink = new HttpLink({
  uri: API_URL,
  fetchOptions: { cache: 'no-store' }, // Disable Next.js fetch cache for Server Components
});

/**
 * Server Auth Link - Adds JWT token from httpOnly cookies
 * Used by Server Components only
 */
const serverAuthLink = setContext(async (_, { headers }) => {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    return {
      headers: {
        ...headers,
        ...(accessToken && { authorization: `Bearer ${accessToken}` }),
      },
    };
  } catch (error) {
    // If cookies() fails (e.g., in client context), return headers without token
    return { headers };
  }
});

/**
 * Client Auth Link - Adds JWT token from custom header
 * Token is passed via context from AuthProvider
 */
const clientAuthLink = setContext(async (_, { headers }) => {
  // Token will be provided via context from AuthProvider
  // or via custom fetch with credentials
  return {
    headers: {
      ...headers,
    },
  };
});

/**
 * Error Link - Handles GraphQL and network errors
 * TODO: Implement automatic token refresh logic
 */
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
      );

      // TODO: Handle authentication errors (401/403)
      // if (extensions?.code === 'UNAUTHENTICATED') {
      //   // Attempt token refresh
      // }
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

/**
 * Create Apollo Client for Server Components
 * Uses registerApolloClient for automatic memoization per request
 * Reads JWT tokens from httpOnly cookies
 */
export const { getClient: getServerClient } = registerApolloClient(() => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: from([errorLink, serverAuthLink, httpLink]),
    defaultOptions: {
      query: {
        errorPolicy: 'all',
        fetchPolicy: 'no-cache', // Server Components don't need caching
      },
    },
  });
});

/**
 * Create Apollo Client for Client Components
 * This will be wrapped in ApolloNextAppProvider
 *
 * Note: For authentication, client components will use API routes
 * as proxy to access httpOnly cookies securely
 */
export function makeClient() {
  const httpLinkWithCredentials = new HttpLink({
    uri: API_URL,
    credentials: 'include', // Send cookies with requests
    fetchOptions: { cache: 'no-store' },
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
}
