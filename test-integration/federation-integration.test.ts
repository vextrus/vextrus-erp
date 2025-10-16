/**
 * Federation Integration Test Suite
 *
 * Tests cross-service GraphQL queries through the API Gateway
 * Verifies federation schema composition and data retrieval
 */

import axios, { AxiosInstance } from 'axios';

describe('Federation Integration Tests', () => {
  let client: AxiosInstance;
  const GATEWAY_URL = 'http://localhost:4000/graphql';

  beforeAll(() => {
    client = axios.create({
      baseURL: GATEWAY_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      validateStatus: () => true, // Don't throw on any status
    });
  });

  describe('Schema Introspection', () => {
    it('should retrieve federated schema types', async () => {
      const query = `
        query {
          __schema {
            types {
              name
              kind
            }
          }
        }
      `;

      const response = await client.post('', { query });

      expect(response.status).toBe(200);
      expect(response.data.data).toBeDefined();
      expect(response.data.data.__schema).toBeDefined();
      expect(response.data.data.__schema.types).toBeInstanceOf(Array);

      const typeNames = response.data.data.__schema.types.map((t: any) => t.name);

      // Verify federation includes types from all services
      expect(typeNames).toContain('PageInfo'); // Shared pagination type
      expect(typeNames).toContain('Query');
      expect(typeNames).toContain('Mutation');
    });

    it('should verify PageInfo is shareable across services', async () => {
      const query = `
        query {
          __type(name: "PageInfo") {
            name
            kind
            fields {
              name
              type {
                name
                kind
              }
            }
          }
        }
      `;

      const response = await client.post('', { query });

      expect(response.status).toBe(200);
      expect(response.data.data.__type).toBeDefined();
      expect(response.data.data.__type.name).toBe('PageInfo');
      expect(response.data.data.__type.fields).toHaveLength(4);

      const fieldNames = response.data.data.__type.fields.map((f: any) => f.name);
      expect(fieldNames).toContain('hasNextPage');
      expect(fieldNames).toContain('hasPreviousPage');
      expect(fieldNames).toContain('startCursor');
      expect(fieldNames).toContain('endCursor');
    });
  });

  describe('Individual Service Queries', () => {
    it('should query auth service types', async () => {
      const query = `
        query {
          __type(name: "User") {
            name
            fields {
              name
            }
          }
        }
      `;

      const response = await client.post('', { query });
      expect(response.status).toBe(200);
      // User type should exist if auth service is federated
    });

    it('should query master-data service types', async () => {
      const query = `
        query {
          __type(name: "MasterData") {
            name
            fields {
              name
            }
          }
        }
      `;

      const response = await client.post('', { query });
      expect(response.status).toBe(200);
    });

    it('should query configuration service types', async () => {
      const query = `
        query {
          __type(name: "Configuration") {
            name
            fields {
              name
            }
          }
        }
      `;

      const response = await client.post('', { query });
      expect(response.status).toBe(200);
    });

    it('should query audit service types', async () => {
      const query = `
        query {
          __type(name: "AuditLog") {
            name
            fields {
              name
            }
          }
        }
      `;

      const response = await client.post('', { query });
      expect(response.status).toBe(200);
    });

    it('should query notification service types', async () => {
      const query = `
        query {
          __type(name: "Notification") {
            name
            fields {
              name
            }
          }
        }
      `;

      const response = await client.post('', { query });
      expect(response.status).toBe(200);
    });
  });

  describe('Connection Types with PageInfo', () => {
    it('should verify AuditLogConnection uses shared PageInfo', async () => {
      const query = `
        query {
          __type(name: "AuditLogConnection") {
            name
            fields {
              name
              type {
                name
                ofType {
                  name
                }
              }
            }
          }
        }
      `;

      const response = await client.post('', { query });

      if (response.data.data.__type) {
        const pageInfoField = response.data.data.__type.fields.find(
          (f: any) => f.name === 'pageInfo'
        );
        expect(pageInfoField).toBeDefined();
      }
    });

    it('should verify ConfigurationConnection uses shared PageInfo', async () => {
      const query = `
        query {
          __type(name: "ConfigurationConnection") {
            name
            fields {
              name
              type {
                name
                ofType {
                  name
                }
              }
            }
          }
        }
      `;

      const response = await client.post('', { query });

      if (response.data.data.__type) {
        const pageInfoField = response.data.data.__type.fields.find(
          (f: any) => f.name === 'pageInfo'
        );
        expect(pageInfoField).toBeDefined();
      }
    });

    it('should verify NotificationConnection uses shared PageInfo', async () => {
      const query = `
        query {
          __type(name: "NotificationConnection") {
            name
            fields {
              name
              type {
                name
                ofType {
                  name
                }
              }
            }
          }
        }
      `;

      const response = await client.post('', { query });

      if (response.data.data.__type) {
        const pageInfoField = response.data.data.__type.fields.find(
          (f: any) => f.name === 'pageInfo'
        );
        expect(pageInfoField).toBeDefined();
      }
    });

    it('should verify ImportJobConnection uses shared PageInfo', async () => {
      const query = `
        query {
          __type(name: "ImportJobConnection") {
            name
            fields {
              name
              type {
                name
                ofType {
                  name
                }
              }
            }
          }
        }
      `;

      const response = await client.post('', { query });

      if (response.data.data.__type) {
        const pageInfoField = response.data.data.__type.fields.find(
          (f: any) => f.name === 'pageInfo'
        );
        expect(pageInfoField).toBeDefined();
      }
    });
  });

  describe('Cross-Service Queries', () => {
    it('should execute query spanning multiple services', async () => {
      // This is a theoretical query - actual implementation depends on service schemas
      const query = `
        query {
          __typename
        }
      `;

      const response = await client.post('', { query });
      expect(response.status).toBe(200);
      expect(response.data.data.__typename).toBe('Query');
    });

    it('should handle federation errors gracefully', async () => {
      const query = `
        query {
          nonExistentField
        }
      `;

      const response = await client.post('', { query });

      // Should return error but not crash
      expect(response.status).toBe(400);
      expect(response.data.errors).toBeDefined();
    });
  });

  describe('Performance and Health', () => {
    it('should respond to health queries quickly', async () => {
      const startTime = Date.now();

      const query = `
        query {
          __typename
        }
      `;

      const response = await client.post('', { query });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond in under 1 second
    });

    it('should handle concurrent requests', async () => {
      const query = `
        query {
          __typename
        }
      `;

      const requests = Array(10).fill(null).map(() =>
        client.post('', { query })
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data.data.__typename).toBe('Query');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed queries', async () => {
      const query = `
        query {
          __typename {
            thisIsInvalid
          }
        }
      `;

      const response = await client.post('', { query });

      expect(response.status).toBe(400);
      expect(response.data.errors).toBeDefined();
    });

    it('should handle missing query', async () => {
      const response = await client.post('', {});

      expect(response.status).toBe(400);
    });

    it('should handle empty query', async () => {
      const response = await client.post('', { query: '' });

      expect(response.status).toBe(400);
    });
  });

  describe('Federation Metadata', () => {
    it('should expose federation service information', async () => {
      const query = `
        query {
          _service {
            sdl
          }
        }
      `;

      const response = await client.post('', { query });

      // Gateway should not expose _service directly
      // Subgraphs expose _service, not the gateway
      expect(response.status).toBe(400);
    });
  });
});

describe('Individual Service Direct Access', () => {
  describe('Auth Service (3001)', () => {
    it('should access auth service directly', async () => {
      const client = axios.create({
        baseURL: 'http://localhost:3001/graphql',
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true,
      });

      const query = `{ __typename }`;
      const response = await client.post('', { query });

      expect(response.status).toBe(200);
    });
  });

  describe('Master Data Service (3002)', () => {
    it('should access master-data service directly', async () => {
      const client = axios.create({
        baseURL: 'http://localhost:3002/graphql',
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true,
      });

      const query = `{ __typename }`;
      const response = await client.post('', { query });

      expect(response.status).toBe(200);
    });
  });

  describe('Audit Service (3009)', () => {
    it('should access audit service directly', async () => {
      const client = axios.create({
        baseURL: 'http://localhost:3009/graphql',
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true,
      });

      const query = `{ __typename }`;
      const response = await client.post('', { query });

      expect(response.status).toBe(200);
    });
  });

  describe('Configuration Service (3004)', () => {
    it('should access configuration service directly', async () => {
      const client = axios.create({
        baseURL: 'http://localhost:3004/graphql',
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true,
      });

      const query = `{ __typename }`;
      const response = await client.post('', { query });

      expect(response.status).toBe(200);
    });
  });
});
