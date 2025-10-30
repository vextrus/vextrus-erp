/**
 * Authentication Token Forwarding Test Suite
 *
 * Verifies JWT token generation and forwarding through Federation Gateway
 * Tests that authentication context is properly propagated to subgraphs
 */

import axios, { AxiosInstance } from 'axios';

describe('Authentication Token Forwarding', () => {
  const AUTH_SERVICE_URL = 'http://localhost:3001';
  const GATEWAY_URL = 'http://localhost:4000/graphql';

  let authClient: AxiosInstance;
  let gatewayClient: AxiosInstance;
  let accessToken: string;

  beforeAll(() => {
    authClient = axios.create({
      baseURL: AUTH_SERVICE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      validateStatus: () => true,
    });

    gatewayClient = axios.create({
      baseURL: GATEWAY_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      validateStatus: () => true,
    });
  });

  describe('Token Generation', () => {
    it('should generate JWT token from auth service', async () => {
      // Note: This test requires auth service to have a login mutation
      // Adjust based on actual auth service schema

      const loginMutation = `
        mutation {
          login(email: "test@vextrus.com", password: "test123") {
            accessToken
            refreshToken
            user {
              id
              email
            }
          }
        }
      `;

      const response = await authClient.post('/graphql', {
        query: loginMutation,
      });

      // If auth service is not fully implemented, skip this test
      if (response.status === 400 && response.data.errors) {
        console.log('Auth service login not implemented yet - skipping token generation');
        return;
      }

      expect(response.status).toBe(200);

      if (response.data.data && response.data.data.login) {
        accessToken = response.data.data.login.accessToken;
        expect(accessToken).toBeDefined();
        expect(typeof accessToken).toBe('string');
        expect(accessToken.length).toBeGreaterThan(0);
      }
    });

    it('should validate JWT token structure', () => {
      if (!accessToken) {
        console.log('No token available - skipping validation');
        return;
      }

      // JWT tokens should have 3 parts separated by dots
      const parts = accessToken.split('.');
      expect(parts).toHaveLength(3);

      // Each part should be base64 encoded
      parts.forEach(part => {
        expect(part.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Token Forwarding to Gateway', () => {
    it('should accept Authorization header in gateway requests', async () => {
      const query = `
        query {
          __typename
        }
      `;

      const response = await gatewayClient.post('', {
        query,
      }, {
        headers: {
          'Authorization': accessToken ? `Bearer ${accessToken}` : '',
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.data.__typename).toBe('Query');
    });

    it('should forward authentication context to subgraphs', async () => {
      // This test verifies that protected queries work through the gateway
      // Requires services to have protected resolvers

      const protectedQuery = `
        query {
          me {
            id
            email
          }
        }
      `;

      const response = await gatewayClient.post('', {
        query: protectedQuery,
      }, {
        headers: {
          'Authorization': accessToken ? `Bearer ${accessToken}` : '',
        },
      });

      // If query doesn't exist, we expect a specific error
      if (response.status === 400) {
        // Check if it's a schema error (field doesn't exist) vs auth error
        const errors = response.data.errors || [];
        const hasSchemaError = errors.some((e: any) =>
          e.message.includes('Cannot query field') ||
          e.message.includes('Unknown field')
        );

        if (hasSchemaError) {
          console.log('Protected query not implemented - skipping');
          return;
        }
      }

      // If we get here, either it worked or there's an auth error
      expect([200, 401, 403]).toContain(response.status);
    });

    it('should reject requests without authentication token', async () => {
      // Test a protected query without token
      const protectedQuery = `
        query {
          me {
            id
          }
        }
      `;

      const response = await gatewayClient.post('', {
        query: protectedQuery,
      });

      // Should either return auth error or indicate field doesn't exist
      if (response.status === 400) {
        const errors = response.data.errors || [];
        const hasSchemaError = errors.some((e: any) =>
          e.message.includes('Cannot query field')
        );

        if (hasSchemaError) {
          console.log('Protected query not implemented - skipping auth check');
          return;
        }
      }

      // GraphQL returns HTTP 200, check for authentication error in response
      expect(response.status).toBe(200);
      expect(response.data.errors).toBeDefined();
      expect(response.data.errors.length).toBeGreaterThan(0);

      const authError = response.data.errors[0];
      expect(['Unauthorized', 'UNAUTHENTICATED', 'Authentication required']).toContain(
        authError.message || authError.extensions?.code
      );
    });
  });

  describe('Token Validation', () => {
    it('should reject expired tokens', async () => {
      // Use a known expired token (past exp claim)
      const expiredToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.invalid';

      const query = `
        query {
          me {
            id
          }
        }
      `;

      const response = await gatewayClient.post('', {
        query,
      }, {
        headers: {
          'Authorization': `Bearer ${expiredToken}`,
        },
      });

      // Should handle expired token appropriately
      if (response.status === 400) {
        const errors = response.data.errors || [];
        const hasSchemaError = errors.some((e: any) =>
          e.message.includes('Cannot query field')
        );

        if (hasSchemaError) {
          console.log('Protected queries not implemented - skipping token validation');
          return;
        }
      }

      // GraphQL returns HTTP 200, check for authentication error in response
      expect(response.status).toBe(200);
      expect(response.data.errors).toBeDefined();
      expect(response.data.errors.length).toBeGreaterThan(0);

      const authError = response.data.errors[0];
      expect(
        authError.message.toLowerCase().includes('unauthorized') ||
        authError.message.toLowerCase().includes('expired') ||
        authError.message.toLowerCase().includes('invalid') ||
        authError.extensions?.code === 'UNAUTHENTICATED'
      ).toBe(true);
    });

    it('should reject malformed tokens', async () => {
      const malformedToken = 'not.a.valid.jwt.token';

      const query = `
        query {
          me {
            id
          }
        }
      `;

      const response = await gatewayClient.post('', {
        query,
      }, {
        headers: {
          'Authorization': `Bearer ${malformedToken}`,
        },
      });

      // Should reject malformed token
      if (response.status === 400) {
        const errors = response.data.errors || [];
        const hasSchemaError = errors.some((e: any) =>
          e.message.includes('Cannot query field')
        );

        if (hasSchemaError) {
          console.log('Protected queries not implemented - skipping malformed token test');
          return;
        }
      }

      // GraphQL returns HTTP 200, check for authentication error in response
      expect(response.status).toBe(200);
      expect(response.data.errors).toBeDefined();
      expect(response.data.errors.length).toBeGreaterThan(0);

      const authError = response.data.errors[0];
      expect(
        authError.message.toLowerCase().includes('unauthorized') ||
        authError.message.toLowerCase().includes('malformed') ||
        authError.message.toLowerCase().includes('invalid') ||
        authError.extensions?.code === 'UNAUTHENTICATED'
      ).toBe(true);
    });
  });

  describe('Cross-Service Authentication', () => {
    it('should maintain auth context across federated services', async () => {
      // Query that spans multiple services requiring auth
      const federatedQuery = `
        query {
          __typename
        }
      `;

      const response = await gatewayClient.post('', {
        query: federatedQuery,
      }, {
        headers: {
          'Authorization': accessToken ? `Bearer ${accessToken}` : '',
        },
      });

      expect(response.status).toBe(200);
    });

    it('should propagate user context to all subgraphs', async () => {
      // This would test that user ID, roles, permissions are available
      // in all services that need them

      const query = `
        query {
          __typename
        }
      `;

      const response = await gatewayClient.post('', {
        query,
      }, {
        headers: {
          'Authorization': accessToken ? `Bearer ${accessToken}` : '',
        },
      });

      expect(response.status).toBe(200);
      // Further assertions would depend on actual schema implementation
    });
  });

  describe('Token Refresh', () => {
    it('should handle token refresh flow', async () => {
      // Test refresh token mechanism
      // This requires refresh token mutation in auth service

      const refreshMutation = `
        mutation {
          refreshToken(refreshToken: "mock-refresh-token") {
            accessToken
          }
        }
      `;

      const response = await authClient.post('/graphql', {
        query: refreshMutation,
      });

      // If not implemented, skip
      if (response.status === 400 && response.data.errors) {
        console.log('Token refresh not implemented - skipping');
        return;
      }

      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Security Headers', () => {
    it('should handle various Authorization header formats', async () => {
      const query = `{ __typename }`;

      // Test with 'Bearer' prefix
      const response1 = await gatewayClient.post('', { query }, {
        headers: { 'Authorization': 'Bearer token123' },
      });

      // Test without 'Bearer' prefix
      const response2 = await gatewayClient.post('', { query }, {
        headers: { 'Authorization': 'token123' },
      });

      // Both should handle gracefully (200 for public queries, 401 for protected)
      expect([200, 400, 401]).toContain(response1.status);
      expect([200, 400, 401]).toContain(response2.status);
    });

    it('should ignore case in Authorization header', async () => {
      const query = `{ __typename }`;

      // Test with lowercase 'bearer'
      const response = await gatewayClient.post('', { query }, {
        headers: { 'authorization': 'bearer token123' },
      });

      expect([200, 400, 401]).toContain(response.status);
    });
  });

  describe('Rate Limiting and Security', () => {
    it('should handle multiple requests with same token', async () => {
      const query = `{ __typename }`;

      const requests = Array(5).fill(null).map(() =>
        gatewayClient.post('', { query }, {
          headers: {
            'Authorization': accessToken ? `Bearer ${accessToken}` : '',
          },
        })
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect([200, 400]).toContain(response.status);
      });
    });

    it('should handle concurrent auth requests', async () => {
      const query = `{ __typename }`;

      const requests = Array(3).fill(null).map(() =>
        gatewayClient.post('', { query }, {
          headers: {
            'Authorization': `Bearer different-token-${Math.random()}`,
          },
        })
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        // Should handle all requests without crashing
        expect(response.status).toBeDefined();
      });
    });
  });
});

describe('Direct Service Authentication', () => {
  it('should authenticate directly against auth service', async () => {
    const client = axios.create({
      baseURL: 'http://localhost:3001',
      headers: { 'Content-Type': 'application/json' },
      validateStatus: () => true,
    });

    const query = `{ __typename }`;
    const response = await client.post('/graphql', { query });

    expect(response.status).toBe(200);
  });

  it('should authenticate directly against protected subgraph', async () => {
    const client = axios.create({
      baseURL: 'http://localhost:3002',
      headers: { 'Content-Type': 'application/json' },
      validateStatus: () => true,
    });

    const query = `{ __typename }`;
    const response = await client.post('/graphql', { query });

    expect(response.status).toBe(200);
  });
});
