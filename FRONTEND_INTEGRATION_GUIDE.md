# Frontend Integration Guide - Finance Service Ready

## Current Status ✅

**All 5 Phases Complete:**
- ✅ Phase 1: Domain Layer (Event Sourcing, DDD, Aggregates)
- ✅ Phase 2: Application Layer (CQRS Handlers)
- ✅ Phase 3: Infrastructure Layer (Repositories, Migrations)
- ✅ Phase 4: GraphQL Federation (Resolvers, E2E Tests)
- ✅ Phase 5: Production Deployment (Scripts, Benchmarks, Documentation)

**Performance Metrics:**
- Create Invoice: 1.94ms average (154x faster than 300ms target)
- Query List: 1.29ms average (194x faster than 250ms target)
- All 194 tests passing
- GraphQL Federation operational

---

## Environment Configuration for Docker

### Current Situation

Your `docker-compose.yml` currently has **hardcoded environment variables** for the finance service (lines 917-943). This is NOT ideal for production deployment.

**Current Approach (NOT RECOMMENDED):**
```yaml
finance:
  environment:
    NODE_ENV: development
    PORT: 3014
    DATABASE_HOST: postgres
    # ... 20+ hardcoded variables
```

### Recommended Approach

Use a `.env` file at the **root level** that Docker Compose will automatically load.

---

## Step-by-Step Setup

### 1. Create Root-Level .env File

Create or update `C:\Users\riz\vextrus-erp\.env` with these variables:

```bash
# ============================================
# DOCKER COMPOSE ENVIRONMENT CONFIGURATION
# ============================================

# Version
VERSION=latest

# PostgreSQL Configuration
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=vextrus
POSTGRES_PASSWORD=vextrus_dev_2024

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=vextrus_redis_2024

# Kafka Configuration
KAFKA_BROKERS=kafka:9093

# EventStore Configuration
EVENTSTORE_CONNECTION_STRING=esdb://eventstore:2113?tls=false

# JWT Configuration
JWT_SECRET=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9
JWT_ACCESS_SECRET=vextrus_jwt_access_secret_dev_2024
JWT_EXPIRES_IN=24h

# Finance Service Configuration
FINANCE_PORT=3014
FINANCE_DATABASE_NAME=vextrus_finance
FINANCE_VAT_RATE=15
FINANCE_TAX_WITHHOLDING_RATE=10
FINANCE_FISCAL_YEAR_START=7
FINANCE_DEFAULT_TENANT_ID=default

# OpenTelemetry
OTEL_EXPORTER_OTLP_ENDPOINT=http://signoz-otel-collector:4318
OTEL_SERVICE_NAME=finance-service

# Node Environment
NODE_ENV=development
```

### 2. Update docker-compose.yml

Replace the hardcoded environment variables in the finance service with references to the `.env` file:

**Find this section (lines 917-943):**
```yaml
finance:
  environment:
    NODE_ENV: development
    PORT: 3014
    # ... many hardcoded variables
```

**Replace with:**
```yaml
finance:
  environment:
    NODE_ENV: ${NODE_ENV:-development}
    PORT: ${FINANCE_PORT:-3014}
    APP_PORT: ${FINANCE_PORT:-3014}
    DATABASE_HOST: ${POSTGRES_HOST:-postgres}
    DATABASE_PORT: ${POSTGRES_PORT:-5432}
    DATABASE_USERNAME: ${POSTGRES_USER:-vextrus}
    DATABASE_PASSWORD: ${POSTGRES_PASSWORD}
    DATABASE_NAME: ${FINANCE_DATABASE_NAME:-vextrus_finance}
    EVENTSTORE_CONNECTION_STRING: ${EVENTSTORE_CONNECTION_STRING}
    REDIS_HOST: ${REDIS_HOST:-redis}
    REDIS_PORT: ${REDIS_PORT:-6379}
    REDIS_PASSWORD: ${REDIS_PASSWORD}
    KAFKA_BROKERS: ${KAFKA_BROKERS:-kafka:9093}
    KAFKA_CLIENT_ID: finance-service
    KAFKA_CONSUMER_GROUP: finance-consumer
    JWT_SECRET: ${JWT_SECRET}
    JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-24h}
    VAT_RATE: ${FINANCE_VAT_RATE:-15}
    TAX_WITHHOLDING_RATE: ${FINANCE_TAX_WITHHOLDING_RATE:-10}
    FISCAL_YEAR_START: ${FINANCE_FISCAL_YEAR_START:-7}
    DEFAULT_TENANT_ID: ${FINANCE_DEFAULT_TENANT_ID:-default}
    OTEL_EXPORTER_OTLP_ENDPOINT: ${OTEL_EXPORTER_OTLP_ENDPOINT}
    OTEL_SERVICE_NAME: ${OTEL_SERVICE_NAME:-finance-service}
    OTEL_TRACES_EXPORTER: otlp
    OTEL_METRICS_EXPORTER: otlp
    OTEL_LOGS_EXPORTER: otlp
```

---

## Frontend Integration Endpoints

### GraphQL Endpoint

**Direct Finance Service (Development):**
```
http://localhost:3014/graphql
```

**Via API Gateway (Production Pattern):**
```
http://localhost:4000/graphql
```

**Via Traefik (Production):**
```
http://api.localhost/api/finance/graphql
```

### Apollo Sandbox Access

The finance service is already configured with Apollo Sandbox. Access it at:

```
http://localhost:3014/graphql
```

Apollo Sandbox will automatically load when you visit this URL in your browser.

### Health Check Endpoints

Monitor service health:
```bash
# Comprehensive health check
curl http://localhost:3014/health

# Readiness probe
curl http://localhost:3014/health/ready

# Liveness probe
curl http://localhost:3014/health/live
```

---

## Frontend Integration Requirements

### 1. GraphQL Client Setup

**Install Apollo Client in your frontend:**

```bash
npm install @apollo/client graphql
```

**Configure Apollo Client:**

```typescript
import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Create HTTP link
const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:4000/graphql',
});

// Auth middleware
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('accessToken');
  const tenantId = localStorage.getItem('tenantId') || 'default';

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'X-Tenant-Id': tenantId,
    },
  };
});

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
```

### 2. Required HTTP Headers

**All requests to the finance service must include:**

| Header | Required | Description | Example |
|--------|----------|-------------|---------|
| `Authorization` | Yes | JWT Bearer token | `Bearer eyJhbGciOi...` |
| `X-Tenant-Id` | Yes | Multi-tenant isolation | `default` or `tenant-uuid` |
| `Content-Type` | Yes | GraphQL requests | `application/json` |

### 3. Authentication Flow

```typescript
// 1. Login to Auth Service
const loginMutation = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken
      refreshToken
      user {
        id
        email
        tenantId
      }
    }
  }
`;

// 2. Store tokens
const { data } = await apolloClient.mutate({
  mutation: loginMutation,
  variables: { email, password },
});

localStorage.setItem('accessToken', data.login.accessToken);
localStorage.setItem('refreshToken', data.login.refreshToken);
localStorage.setItem('tenantId', data.login.user.tenantId);

// 3. Now you can query Finance Service
const invoiceQuery = gql`
  query GetInvoice($id: String!) {
    invoice(id: $id) {
      id
      invoiceNumber
      status
      grandTotal
    }
  }
`;

const { data: invoiceData } = await apolloClient.query({
  query: invoiceQuery,
  variables: { id: 'invoice-uuid' },
});
```

### 4. Example GraphQL Queries

**Create Invoice:**
```graphql
mutation CreateInvoice($input: CreateInvoiceInput!) {
  createInvoice(input: $input) {
    id
    invoiceNumber
    status
    grandTotal
    createdAt
  }
}
```

**Query Invoice:**
```graphql
query GetInvoice($id: String!) {
  invoice(id: $id) {
    id
    invoiceNumber
    vendorId
    customerId
    lineItems
    subtotal
    vatAmount
    grandTotal
    status
    invoiceDate
    dueDate
    fiscalYear
    mushakNumber
    createdAt
    updatedAt
  }
}
```

**List Invoices:**
```graphql
query GetInvoices($tenantId: String!, $limit: Int, $offset: Int) {
  invoices(tenantId: $tenantId, limit: $limit, offset: $offset) {
    id
    invoiceNumber
    customerId
    grandTotal
    status
    invoiceDate
  }
}
```

---

## CORS Configuration

The finance service is already configured with CORS in `docker-compose.yml`:

```yaml
CORS_ORIGIN: http://localhost:3000,http://localhost:4200
```

**For your frontend URL:**
1. Add your frontend URL to the CORS_ORIGIN environment variable
2. Rebuild the finance service container

**Example:**
```bash
# In .env file
CORS_ORIGIN=http://localhost:3000,http://localhost:4200,http://localhost:5173
```

---

## Running the Full Stack

### Development Mode

```bash
# 1. Start all infrastructure services
docker-compose up -d postgres redis kafka eventstore signoz-otel-collector

# 2. Wait for services to be healthy (30 seconds)
sleep 30

# 3. Start the finance service
docker-compose up -d finance

# 4. Check logs
docker-compose logs -f finance

# 5. Verify health
curl http://localhost:3014/health
```

### Production Mode

```bash
# 1. Set NODE_ENV in .env
echo "NODE_ENV=production" >> .env

# 2. Build the production image
docker-compose build finance

# 3. Start with production config
docker-compose up -d finance

# 4. Run migrations
docker-compose exec finance pnpm run migration:run

# 5. Verify
curl http://localhost:3014/health/ready
```

---

## Next Steps for Frontend Development

### 1. Immediate Actions

- [ ] Create root-level `.env` file with the variables above
- [ ] Update `docker-compose.yml` to use environment variables
- [ ] Restart finance service: `docker-compose restart finance`
- [ ] Verify service is accessible: `curl http://localhost:3014/health`
- [ ] Test Apollo Sandbox: Open `http://localhost:3014/graphql` in browser

### 2. Frontend Setup

- [ ] Install Apollo Client in your frontend project
- [ ] Configure Apollo Client with auth middleware
- [ ] Create GraphQL queries/mutations for invoice operations
- [ ] Implement authentication flow with JWT tokens
- [ ] Add tenant context to all requests

### 3. Integration Testing

- [ ] Test invoice creation from frontend
- [ ] Test invoice listing with pagination
- [ ] Test authentication flow end-to-end
- [ ] Test error handling scenarios
- [ ] Verify multi-tenant isolation

### 4. Performance Monitoring

- [ ] Add frontend performance tracking
- [ ] Monitor GraphQL query performance
- [ ] Set up error tracking (Sentry)
- [ ] Configure analytics for user actions

---

## Production Deployment Checklist

### Environment Configuration

- [ ] Create production `.env.production` file with encrypted secrets
- [ ] Use strong passwords (not development defaults)
- [ ] Configure production database hosts
- [ ] Set up SSL/TLS certificates
- [ ] Configure production CORS origins

### Security Hardening

- [ ] Enable JWT token rotation
- [ ] Configure rate limiting per tenant
- [ ] Set up IP whitelisting for admin operations
- [ ] Enable audit logging
- [ ] Configure data encryption at rest

### Infrastructure

- [ ] Set up database replicas for read scaling
- [ ] Configure Redis Sentinel for high availability
- [ ] Set up Kafka cluster (3+ brokers)
- [ ] Configure EventStore clustering
- [ ] Set up backup automation

### Monitoring

- [ ] Configure SigNoz dashboards
- [ ] Set up Prometheus alerts
- [ ] Configure Grafana dashboards
- [ ] Enable error tracking (Sentry)
- [ ] Set up uptime monitoring

### Documentation

- [ ] Document API endpoints for frontend team
- [ ] Create integration examples
- [ ] Document authentication flow
- [ ] Create troubleshooting guide
- [ ] Document deployment procedures

---

## Troubleshooting

### Service Not Starting

```bash
# Check logs
docker-compose logs finance

# Check dependencies
docker-compose ps postgres redis kafka eventstore

# Rebuild if needed
docker-compose build --no-cache finance
docker-compose up -d finance
```

### GraphQL Endpoint Not Accessible

```bash
# Check if service is running
curl http://localhost:3014/health

# Check GraphQL endpoint
curl -X POST http://localhost:3014/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { types { name } } }"}'

# Check Traefik routing
curl http://api.localhost/api/finance/graphql
```

### Authentication Errors

```bash
# Verify JWT secret is consistent across services
docker-compose exec finance env | grep JWT_SECRET
docker-compose exec auth env | grep JWT_SECRET

# Test token generation
node generate-jwt-token.js
```

### Database Connection Errors

```bash
# Check PostgreSQL is running
docker-compose exec postgres pg_isready

# Test connection from finance service
docker-compose exec finance psql -h postgres -U vextrus -d vextrus_finance -c "SELECT 1"

# Run migrations if needed
docker-compose exec finance pnpm run migration:run
```

---

## Frontend Development Best Practices

### 1. Error Handling

```typescript
import { ApolloError } from '@apollo/client';

try {
  const { data } = await apolloClient.mutate({
    mutation: CREATE_INVOICE,
    variables: { input },
  });

  // Handle success
  toast.success('Invoice created successfully');
} catch (error) {
  if (error instanceof ApolloError) {
    if (error.graphQLErrors.length > 0) {
      // Handle GraphQL errors (business logic errors)
      const message = error.graphQLErrors[0].message;
      toast.error(message);
    } else if (error.networkError) {
      // Handle network errors
      toast.error('Network error. Please check your connection.');
    }
  }
}
```

### 2. Loading States

```typescript
const { data, loading, error } = useQuery(GET_INVOICES, {
  variables: { tenantId },
});

if (loading) return <Skeleton count={5} />;
if (error) return <ErrorMessage error={error} />;
if (!data) return null;

return <InvoiceList invoices={data.invoices} />;
```

### 3. Caching Strategy

```typescript
// Optimistic updates
const [createInvoice] = useMutation(CREATE_INVOICE, {
  optimisticResponse: {
    createInvoice: {
      __typename: 'Invoice',
      id: 'temp-id',
      ...input,
      status: 'DRAFT',
    },
  },
  update: (cache, { data: { createInvoice } }) => {
    // Update cache with new invoice
    cache.modify({
      fields: {
        invoices(existingInvoices = []) {
          const newInvoiceRef = cache.writeFragment({
            data: createInvoice,
            fragment: gql`
              fragment NewInvoice on Invoice {
                id
                invoiceNumber
                status
              }
            `,
          });
          return [...existingInvoices, newInvoiceRef];
        },
      },
    });
  },
});
```

### 4. Pagination

```typescript
const { data, loading, fetchMore } = useQuery(GET_INVOICES, {
  variables: {
    tenantId,
    limit: 20,
    offset: 0
  },
});

const loadMore = () => {
  fetchMore({
    variables: {
      offset: data.invoices.length,
    },
    updateQuery: (prev, { fetchMoreResult }) => {
      if (!fetchMoreResult) return prev;
      return {
        ...fetchMoreResult,
        invoices: [...prev.invoices, ...fetchMoreResult.invoices],
      };
    },
  });
};
```

---

## Summary

**Your finance backend is production-ready and waiting for frontend integration!**

### What's Done ✅
- Complete CQRS + Event Sourcing architecture
- GraphQL Federation with Apollo Sandbox
- Multi-tenant isolation
- Bangladesh compliance features
- 154x faster than performance targets
- Comprehensive test coverage (194 tests)
- Production deployment scripts

### What to Do Now 📋
1. Create root `.env` file (5 minutes)
2. Update `docker-compose.yml` to use env vars (10 minutes)
3. Restart finance service (2 minutes)
4. Set up Apollo Client in frontend (30 minutes)
5. Start building your invoice UI (unlimited creativity!)

### Key Endpoints 🚀
- GraphQL: `http://localhost:3014/graphql`
- Apollo Sandbox: `http://localhost:3014/graphql` (browser)
- Health: `http://localhost:3014/health`
- Via Gateway: `http://localhost:4000/graphql`

**The backend is blazing fast (1.94ms avg), bulletproof (event sourcing + full audit), and ready for your frontend magic!**

---

**Need Help?**
- Review `services/finance/docs/PRODUCTION_DEPLOYMENT_GUIDE.md` for detailed deployment
- Check `services/finance/docs/apollo-sandbox-test-scenarios.md` for API examples
- See `services/finance/DEPLOYMENT_SUCCESS.md` for performance metrics
- Explore `services/finance/CLAUDE.md` for architecture overview
