import { ApolloClient, InMemoryCache, HttpLink, split, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { onError } from '@apollo/client/link/error'
import { createClient } from 'graphql-ws'

// HTTP connection to the API Gateway
const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql',
  credentials: 'include',
})

// WebSocket connection for subscriptions
const wsLink =
  typeof window !== 'undefined'
    ? new GraphQLWsLink(
        createClient({
          url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/graphql',
          connectionParams: () => {
            const token = localStorage.getItem('authToken')
            const tenantId = localStorage.getItem('tenantId')
            return {
              authorization: token ? `Bearer ${token}` : '',
              'x-tenant-id': tenantId,
            }
          },
        })
      )
    : null

// Auth link to add headers
const authLink = setContext((_, { headers }) => {
  if (typeof window === 'undefined') return { headers }

  const token = localStorage.getItem('authToken')
  const tenantId = localStorage.getItem('tenantId')

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'x-tenant-id': tenantId || '',
      'x-correlation-id': generateCorrelationId(),
    },
  }
})

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
        extensions
      )

      // Handle authentication errors
      if (extensions?.code === 'UNAUTHENTICATED') {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken')
          window.location.href = '/login'
        }
      }
    })
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`)
  }
})

// Split based on operation type
const splitLink =
  typeof window !== 'undefined' && wsLink
    ? split(
        ({ query }) => {
          const definition = getMainDefinition(query)
          return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
          )
        },
        wsLink,
        from([errorLink, authLink, httpLink])
      )
    : from([errorLink, authLink, httpLink])

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Merge strategy for paginated queries
          invoices: {
            keyArgs: ['filters'],
            merge(existing = [], incoming, { args }) {
              // If it's a fresh query (offset 0), replace existing data
              if (args?.offset === 0) {
                return incoming
              }
              // Otherwise, append new data
              return [...existing, ...incoming]
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
  ssrMode: typeof window === 'undefined',
})

/**
 * Generate a unique correlation ID for request tracing
 */
function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}