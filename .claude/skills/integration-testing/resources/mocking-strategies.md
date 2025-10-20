# Mocking Strategies

**Purpose**: Best practices for mocking external services in NestJS integration tests.

---

## Mocking Principles

### When to Mock

**Always Mock:**
- External APIs (Master Data, third-party services)
- Event Store (EventStoreDB)
- Message brokers (Kafka, RabbitMQ)
- File storage (S3, MinIO)
- Email/SMS services

**Use Real:**
- Database (PostgreSQL with testcontainers or test instance)
- Redis (if using testcontainers)
- Internal NestJS modules and services

### Why Mock External Services?

1. **Speed**: No network latency, instant responses
2. **Reliability**: No external service downtime
3. **Isolation**: Test your code, not third-party code
4. **Control**: Simulate errors, edge cases, timeouts
5. **Determinism**: Consistent test results

---

## NestJS Mock Provider Pattern

### Basic Mock

```typescript
const mockMasterDataClient = {
  getVendor: jest.fn().mockResolvedValue({
    id: 'vendor-1',
    name: 'Test Vendor Ltd.',
    tin: '1234567890',
    address: {
      division: 'Dhaka',
      district: 'Dhaka',
      thana: 'Gulshan',
    },
  }),

  getCustomer: jest.fn().mockResolvedValue({
    id: 'customer-1',
    name: 'Test Customer',
    bin: '123456789',
  }),
};

const module = await Test.createTestingModule({
  imports: [AppModule],
})
.overrideProvider(MasterDataClient)
.useValue(mockMasterDataClient)
.compile();
```

### Mock with Multiple Responses

```typescript
const mockMasterDataClient = {
  getVendor: jest.fn()
    .mockResolvedValueOnce({
      id: 'vendor-1',
      name: 'First Vendor',
    })
    .mockResolvedValueOnce({
      id: 'vendor-2',
      name: 'Second Vendor',
    })
    .mockRejectedValueOnce(new Error('Network timeout')),
};

// First call: returns vendor-1
// Second call: returns vendor-2
// Third call: throws error
```

### Mock Implementation Function

```typescript
const mockMasterDataClient = {
  getVendor: jest.fn().mockImplementation((vendorId: string) => {
    if (vendorId === 'vendor-1') {
      return Promise.resolve({ id: vendorId, name: 'Vendor 1' });
    } else if (vendorId === 'invalid') {
      return Promise.reject(new Error('Vendor not found'));
    }
    return Promise.resolve({ id: vendorId, name: 'Default Vendor' });
  }),
};
```

---

## EventStore Mocking

### Mock EventStoreDB Client

```typescript
const mockEventStore = {
  appendToStream: jest.fn().mockResolvedValue({
    success: true,
    nextExpectedStreamRevision: BigInt(1),
  }),

  readStream: jest.fn().mockResolvedValue([
    {
      event: {
        type: 'InvoiceCreated',
        data: Buffer.from(JSON.stringify({
          invoiceId: 'invoice-1',
          amount: 1000,
        })),
        metadata: Buffer.from(JSON.stringify({
          userId: 'user-1',
          timestamp: new Date().toISOString(),
        })),
      },
    },
    {
      event: {
        type: 'InvoiceApproved',
        data: Buffer.from(JSON.stringify({
          invoiceId: 'invoice-1',
          approvedBy: 'user-2',
        })),
        metadata: Buffer.from('{}'),
      },
    },
  ]),

  subscribeToStream: jest.fn(),
};

const module = await Test.createTestingModule({
  imports: [AppModule],
})
.overrideProvider(EventStoreDBClient)
.useValue(mockEventStore)
.compile();
```

### Verify Event Appended

```typescript
it('should append event to stream', async () => {
  await commandBus.execute(new CreateInvoiceCommand(...));

  expect(mockEventStore.appendToStream).toHaveBeenCalledWith(
    expect.stringMatching(/invoice-.*/),
    expect.arrayContaining([
      expect.objectContaining({
        type: 'InvoiceCreated',
        data: expect.any(Object),
      }),
    ]),
  );
});
```

---

## HTTP Service Mocking

### Mock HttpService (Axios)

```typescript
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';

const mockHttpService = {
  post: jest.fn().mockReturnValue(
    of({
      data: { success: true, vendorId: 'vendor-1' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    })
  ),

  get: jest.fn().mockReturnValue(
    of({
      data: { id: 'vendor-1', name: 'Test Vendor' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    })
  ),
};

// Simulate error
mockHttpService.get.mockReturnValue(
  throwError(() => new Error('Network timeout'))
);

// Override in module
.overrideProvider(HttpService)
.useValue(mockHttpService)
```

### Verify HTTP Call

```typescript
it('should call Master Data API', async () => {
  await service.getVendor('vendor-1');

  expect(mockHttpService.get).toHaveBeenCalledWith(
    'http://master-data/vendors/vendor-1',
    expect.objectContaining({
      headers: expect.objectContaining({
        'X-Tenant-ID': 'tenant-1',
      }),
    }),
  );
});
```

---

## Kafka/Message Broker Mocking

### Mock Kafka Producer

```typescript
const mockKafkaProducer = {
  send: jest.fn().mockResolvedValue({
    partition: 0,
    offset: '123',
  }),
};

const mockKafkaClient = {
  producer: jest.fn().mockReturnValue(mockKafkaProducer),
  consumer: jest.fn().mockReturnValue({
    subscribe: jest.fn(),
    run: jest.fn(),
  }),
};

.overrideProvider('KAFKA_CLIENT')
.useValue(mockKafkaClient)
```

### Verify Message Published

```typescript
it('should publish invoice created event to Kafka', async () => {
  await eventHandler.handle(new InvoiceCreatedEvent(...));

  expect(mockKafkaProducer.send).toHaveBeenCalledWith({
    topic: 'invoice.events',
    messages: [
      {
        key: expect.any(String),
        value: expect.stringContaining('InvoiceCreated'),
      },
    ],
  });
});
```

---

## GraphQL Client Mocking

### Mock Apollo Client

```typescript
const mockApolloClient = {
  query: jest.fn().mockResolvedValue({
    data: {
      vendor: {
        id: 'vendor-1',
        name: 'Test Vendor',
      },
    },
  }),

  mutate: jest.fn().mockResolvedValue({
    data: {
      createInvoice: {
        id: 'invoice-1',
        invoiceNumber: 'INV-001',
      },
    },
  }),
};

.overrideProvider('APOLLO_CLIENT')
.useValue(mockApolloClient)
```

---

## Database Mocking (Avoid)

### ❌ Don't Mock Repository

```typescript
// BAD: Don't mock TypeORM repositories
const mockRepository = {
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
};

.overrideProvider(InvoiceRepository)
.useValue(mockRepository)
```

### ✅ Use Real Database

```typescript
// GOOD: Use real database with testcontainers or test instance
TypeOrmModule.forRoot({
  type: 'postgres',
  host: 'localhost',
  database: 'finance_test',
  synchronize: true,
  dropSchema: true,
}),
```

**Why?**
- Testing repository logic is critical
- ORM behavior differs from mocks
- Transaction handling, cascades, constraints
- Easy with testcontainers

---

## Error Simulation

### Network Timeout

```typescript
mockMasterDataClient.getVendor
  .mockRejectedValue(new Error('ETIMEDOUT'));

it('should handle timeout gracefully', async () => {
  await expect(
    service.getVendor('vendor-1')
  ).rejects.toThrow('Master Data service unavailable');
});
```

### Rate Limiting

```typescript
mockMasterDataClient.getVendor
  .mockRejectedValue({
    response: {
      status: 429,
      data: { message: 'Too many requests' },
    },
  });
```

### Invalid Response

```typescript
mockMasterDataClient.getVendor
  .mockResolvedValue({
    id: 'vendor-1',
    name: null, // Invalid
    tin: undefined, // Invalid
  });

it('should validate external service response', async () => {
  await expect(
    service.getVendor('vendor-1')
  ).rejects.toThrow('Invalid vendor data');
});
```

---

## Spy vs Mock

### Spy (Partial Mock)

```typescript
// Keep original implementation, spy on calls
const realService = new MasterDataClient();
const spy = jest.spyOn(realService, 'getVendor');

spy.mockResolvedValueOnce({ id: 'vendor-1', name: 'Test' });

// Later
expect(spy).toHaveBeenCalledWith('vendor-1');
spy.mockRestore(); // Restore original
```

### Mock (Full Replacement)

```typescript
// Replace entire service
const mockService = {
  getVendor: jest.fn().mockResolvedValue({...}),
  getCustomer: jest.fn().mockResolvedValue({...}),
};

.overrideProvider(MasterDataClient)
.useValue(mockService)
```

**When to Use:**
- **Spy**: Testing internal services with some mocked methods
- **Mock**: External services, third-party APIs

---

## Mock Reset Strategies

### Reset Between Tests

```typescript
beforeEach(() => {
  jest.clearAllMocks(); // Clear call history
});

// Or more thorough
beforeEach(() => {
  jest.resetAllMocks(); // Reset implementation + history
});
```

### Restore Original

```typescript
afterAll(() => {
  jest.restoreAllMocks(); // Restore original implementations
});
```

---

## Advanced Patterns

### Mock Factory

```typescript
// test/mocks/master-data.mock.ts
export function createMockMasterDataClient() {
  return {
    getVendor: jest.fn().mockResolvedValue({
      id: 'vendor-default',
      name: 'Default Vendor',
      tin: '1234567890',
    }),

    getCustomer: jest.fn().mockResolvedValue({
      id: 'customer-default',
      name: 'Default Customer',
      bin: '123456789',
    }),
  };
}

// Use in tests
const mockClient = createMockMasterDataClient();

mockClient.getVendor.mockResolvedValueOnce({
  id: 'vendor-1',
  name: 'Specific Vendor',
});
```

### Mock Builder

```typescript
class MockMasterDataClientBuilder {
  private mocks = {
    getVendor: jest.fn(),
    getCustomer: jest.fn(),
  };

  withVendor(vendorId: string, data: VendorDto) {
    this.mocks.getVendor.mockImplementation((id) => {
      if (id === vendorId) {
        return Promise.resolve(data);
      }
      return Promise.reject(new Error('Vendor not found'));
    });
    return this;
  }

  withNetworkError() {
    this.mocks.getVendor.mockRejectedValue(new Error('Network error'));
    return this;
  }

  build() {
    return this.mocks;
  }
}

// Usage
const mockClient = new MockMasterDataClientBuilder()
  .withVendor('vendor-1', { id: 'vendor-1', name: 'Test' })
  .build();
```

---

## Vextrus ERP Mocking Patterns (from codebase)

### Master Data Client

```typescript
const mockMasterDataClient = {
  getVendor: jest.fn().mockResolvedValue({
    id: VENDOR_ID,
    name: 'Acme Corporation',
    tin: '1234567890',
    address: {
      division: 'Dhaka',
      district: 'Dhaka',
      thana: 'Gulshan',
      streetAddress: '123 Test Street',
      postalCode: '1212',
    },
  }),

  getCustomer: jest.fn().mockResolvedValue({
    id: CUSTOMER_ID,
    name: 'Beta Industries',
    bin: '123456789',
    address: {...},
  }),
};
```

### EventStore Mock (Finance Service)

```typescript
const mockEventStore = {
  appendToStream: jest.fn().mockResolvedValue({
    success: true,
    nextExpectedStreamRevision: BigInt(1),
  }),

  readStream: jest.fn().mockResolvedValue([]),
};
```

### JWT Token Generator

```typescript
function generateTestJWT(payload: {
  sub: string;
  tenantId: string;
  organizationId: string;
  roles?: string[];
}): string {
  return jwt.sign(
    {
      sub: payload.sub,
      userId: payload.sub,
      tenantId: payload.tenantId,
      organizationId: payload.organizationId,
      roles: payload.roles || ['finance_manager'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    process.env.JWT_SECRET || 'test-secret',
  );
}
```

---

## Best Practices

1. **Mock External Only**: Use real database, mock APIs
2. **Clear Between Tests**: `jest.clearAllMocks()` in `beforeEach`
3. **Verify Calls**: Use `expect(mock).toHaveBeenCalledWith(...)`
4. **Simulate Errors**: Test timeout, rate limit, invalid data
5. **Use Factories**: Centralize mock creation
6. **Type Safety**: Use TypeScript interfaces for mocks
7. **Realistic Data**: Match production data structure
8. **Test Error Paths**: Mock failures to test error handling

---

## Common Pitfalls

❌ **Mocking Too Much**
```typescript
// Don't mock everything
.overrideProvider(Repository)
.overrideProvider(QueryBus)
.overrideProvider(CommandBus)
```

✅ **Mock Only External**
```typescript
// Mock only external services
.overrideProvider(MasterDataClient)
.overrideProvider(EventStoreDBClient)
```

❌ **Not Clearing Mocks**
```typescript
// Mock state leaks between tests
```

✅ **Clear Between Tests**
```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

❌ **Unrealistic Mocks**
```typescript
// Mock returns invalid data
getVendor: jest.fn().mockResolvedValue({
  id: 'vendor-1',
  // Missing required fields
});
```

✅ **Realistic Mocks**
```typescript
getVendor: jest.fn().mockResolvedValue({
  id: 'vendor-1',
  name: 'Test Vendor',
  tin: '1234567890',
  address: {...}, // All required fields
});
```

---

## Summary

**Mock Strategy:**
- External APIs → **Mock**
- EventStore → **Mock**
- Database → **Real** (testcontainers)
- Internal Services → **Real** (use DI)

**Verification:**
- Use `expect(mock).toHaveBeenCalledWith(...)`
- Clear mocks between tests
- Test both success and error paths

**Error Simulation:**
- Network timeouts
- Rate limiting (429)
- Invalid responses
- Service unavailable (503)
