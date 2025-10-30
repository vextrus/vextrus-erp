# Finance Service - Quick Start Guide

## Prerequisites

- Node.js 20+
- PostgreSQL 16+
- EventStore DB 23+
- Kafka 3.5+ (optional for local dev)

## Installation

```bash
cd services/finance
npm install
```

## Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## Database Setup

```bash
# Verify infrastructure
bash scripts/verify-infrastructure.sh

# Run migrations
bash scripts/run-migrations.sh run
```

## Start Development Server

```bash
npm run start:dev
```

The service will be available at:
- **GraphQL API**: http://localhost:3006/graphql
- **Health Check**: http://localhost:3006/health/live

## Test the API

Open Apollo Sandbox at http://localhost:3006/graphql and run:

```graphql
mutation CreateInvoice {
  createInvoice(input: {
    customerId: "customer-001"
    vendorId: "vendor-001"
    invoiceDate: "2025-01-15"
    dueDate: "2025-02-15"
    lineItems: [{
      description: "Test Item"
      quantity: 10
      unitPrice: { amount: 1000, currency: "BDT" }
      vatCategory: standard
    }]
  }) {
    id
    invoiceNumber
    status
    grandTotal { amount formattedAmount }
  }
}
```

**Note**: Add these headers to your request:
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "X-Tenant-ID": "tenant-123"
}
```

## Run Tests

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm test
```

## Performance Benchmark

```bash
node scripts/performance-benchmark.js
```

## Production Deployment

See comprehensive guide at: `docs/PRODUCTION_DEPLOYMENT_GUIDE.md`

Quick deploy:
```bash
bash scripts/deploy-finance-service.sh production
```

## Documentation

- **Apollo Sandbox Tests**: `docs/apollo-sandbox-test-scenarios.md`
- **Production Deployment**: `docs/PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Task Work Log**: `../../sessions/tasks/h-implement-finance-backend-business-logic.md`

## Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432
```

### EventStore Connection Error
```bash
# Check EventStore is running
curl http://localhost:2113/health/live
```

### Migration Errors
```bash
# Show migration status
npm run migration:show

# Revert last migration
bash scripts/run-migrations.sh revert
```

## Support

For issues and questions, see:
- Documentation: `docs/`
- Work Log: `sessions/tasks/h-implement-finance-backend-business-logic.md`
- Deployment Guide: `docs/PRODUCTION_DEPLOYMENT_GUIDE.md`
