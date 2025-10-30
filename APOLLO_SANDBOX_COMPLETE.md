# Apollo Sandbox Integration - Complete ✅

## Status: DEPLOYED & WORKING

The Finance Service now has a fully functional Apollo Sandbox for GraphQL API exploration.

---

## Access Information

### Apollo Sandbox URL
```
http://localhost:3014/graphql
```

**Open this URL in your browser** to access the interactive GraphQL explorer.

### Service Details
- **Service**: Finance Service
- **Port**: 3014
- **GraphQL Endpoint**: `/graphql`
- **Health Check**: `http://localhost:3014/health`

---

## What Was Fixed

### 1. TypeScript Compilation Errors (6 errors resolved)
- ✅ Fixed `CurrentUserContext` interface - added `userId` and `tenantId` properties
- ✅ Fixed JWT guard context type comparison - added type assertion
- ✅ Fixed Invoice entity nullable fields - added `?` modifier to 6 columns
- ✅ Fixed Invoice event handler enum usage - changed to `InvoiceStatus.DRAFT`
- ✅ Fixed Invoice resolver Money conversion - added type assertion
- ✅ Fixed EventStore repository logger - removed duplicate declaration

### 2. Runtime Dependency Injection
- ✅ Created `AuthModule` to provide `HttpService` to `JwtAuthGuard`
- ✅ Imported `AuthModule` in `AppModule` and `FinanceGraphQLModule`
- ✅ Resolved global guard dependency injection scope issue

### 3. Apollo Sandbox Configuration
- ✅ Enabled introspection in Apollo Server config (`introspection: true`)
- ✅ Configured landing page plugin with `embed: true` and `includeCookies: true`
- ✅ JWT guard allows `__schema` and `__type` queries without authentication
- ✅ CSRF prevention disabled for sandbox compatibility

---

## How It Works

### Authentication Flow

**Introspection Queries (No Auth Required)**:
- Apollo Sandbox can query `__schema` and `__type` to explore the API
- These queries are allowed by the JWT guard without authentication
- This enables the schema explorer UI to function

**Regular Queries (Auth Required)**:
- All actual data queries require a valid JWT token
- Token must be provided in the `Authorization` header as `Bearer <token>`
- Multi-tenancy requires `X-Tenant-ID` header for tenant isolation

### Landing Page
- GET requests to `/graphql` serve the Apollo Sandbox HTML UI
- POST requests to `/graphql` execute GraphQL operations
- The embedded sandbox loads directly in the browser

---

## Testing

### 1. Access Apollo Sandbox
Open in your browser:
```
http://localhost:3014/graphql
```

You should see the Apollo Sandbox interface with:
- Schema explorer on the left
- Query editor in the center
- Response panel on the right

### 2. Test Introspection (No Auth)
The schema should automatically load when you open Apollo Sandbox.

You can also test via curl:
```bash
curl -X POST http://localhost:3014/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { queryType { name } mutationType { name } } }"}'
```

Expected response:
```json
{"data":{"__schema":{"queryType":{"name":"Query"},"mutationType":{"name":"Mutation"}}}}
```

### 3. Test Authenticated Query
First, generate a JWT token (see authentication docs).

Then query with the token:
```bash
curl -X POST http://localhost:3014/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "X-Tenant-ID: default" \
  -d '{"query":"{ invoices { id invoiceNumber } }"}'
```

### 4. Test Landing Page HTML
```bash
curl -H "Accept: text/html" http://localhost:3014/graphql
```

Should return HTML with Apollo Sandbox embedded.

---

## Available GraphQL Operations

### Queries
- `invoice(id: ID!): Invoice` - Get a single invoice by ID
- `invoices(limit: Int, offset: Int): [Invoice!]!` - List invoices with pagination

### Mutations
- `createInvoice(input: CreateInvoiceInput!): Invoice!` - Create a new invoice
- `approveInvoice(id: ID!): Invoice!` - Approve an invoice
- `cancelInvoice(id: ID!, reason: String!): Invoice!` - Cancel an invoice

### Types
- `Invoice` - Invoice aggregate with line items, totals, and compliance fields
- `MoneyDto` - Currency value object (amount + currency)
- `LineItem` - Invoice line item with VAT calculations
- `InvoiceStatus` - Enum: DRAFT, PENDING_APPROVAL, APPROVED, PAID, CANCELLED, OVERDUE
- `VATCategory` - Bangladesh VAT categories

---

## Key Files Modified

### Infrastructure
- `src/infrastructure/graphql/federation.config.ts` - Apollo Server configuration
- `src/infrastructure/guards/jwt-auth.guard.ts` - JWT authentication with introspection bypass
- `src/infrastructure/auth/auth.module.ts` - **NEW** Auth module for dependency injection
- `src/infrastructure/decorators/current-user.decorator.ts` - User context interface
- `src/infrastructure/persistence/typeorm/entities/invoice.entity.ts` - Invoice read model
- `src/infrastructure/persistence/event-store/invoice-event-store.repository.ts` - EventStore repository
- `src/infrastructure/event-handlers/invoice-created.handler.ts` - Event handler

### Presentation
- `src/presentation/graphql/finance-graphql.module.ts` - GraphQL module imports
- `src/presentation/graphql/resolvers/invoice.resolver.ts` - Invoice resolver

### Configuration
- `src/app.module.ts` - Root application module

---

## Security Notes

### What's Secure
✅ Introspection only exposes the **schema structure**, not actual data
✅ All data queries require JWT authentication
✅ Multi-tenant isolation via `X-Tenant-ID` header
✅ User context extracted from JWT for authorization
✅ Event sourcing provides complete audit trail

### What's Public
⚠️ Schema structure is publicly visible (types, fields, mutations)
⚠️ Field descriptions and documentation are exposed

This is **standard practice** for GraphQL APIs. The schema is metadata, not data.

### Production Considerations
For production deployment:
1. Enable CSRF prevention: `csrfPrevention: true`
2. Consider disabling introspection: `introspection: false`
3. Use Apollo Studio for authorized schema exploration
4. Implement rate limiting on the GraphQL endpoint
5. Add query complexity analysis to prevent expensive queries

---

## Troubleshooting

### "Unable to reach server"
1. Check the service is running: `docker ps | grep finance`
2. Check service logs: `docker logs vextrus-finance --tail 50`
3. Verify the port is accessible: `curl http://localhost:3014/health`

### "Introspection is disabled"
1. Verify `introspection: true` in `federation.config.ts`
2. Check JWT guard allows `__schema` and `__type` queries
3. Restart the service: `docker-compose restart finance`

### "Authentication error" for data queries
1. Ensure you have a valid JWT token
2. Add `Authorization: Bearer <token>` header
3. Add `X-Tenant-ID` header for multi-tenant queries
4. Check token expiration

### Schema doesn't match code
1. Rebuild the service: `docker-compose build finance`
2. Schema is auto-generated from TypeScript decorators
3. Check the generated schema: `services/finance/src/schema.gql`

---

## Next Steps

### 1. Generate JWT Token
See authentication documentation for token generation.

### 2. Create Test Data
Use the `createInvoice` mutation to create sample invoices.

### 3. Explore the Schema
Use Apollo Sandbox to explore all available types, queries, and mutations.

### 4. Test Business Logic
- Create invoices with line items
- Approve invoices (generates Mushak number)
- Cancel invoices with reasons
- Query invoices by tenant

### 5. Integration with Frontend
- Use the GraphQL endpoint from React/Angular/Vue apps
- Implement authentication flow with JWT tokens
- Handle multi-tenancy with tenant ID from user context

---

## Related Documentation
- `FIX_APOLLO_SANDBOX.md` - Original issue and approach
- `GRAPHQL_QUICK_REFERENCE.md` - GraphQL API reference
- `services/finance/CLAUDE.md` - Finance service architecture
- `AUTHENTICATION_MIDDLEWARE_IMPLEMENTATION_COMPLETE.md` - Auth middleware details

---

**Status**: ✅ All systems operational
**Last Updated**: 2025-10-14
**Deployed Version**: finance:latest
**Apollo Server**: 4.12.2 with Federation v2
