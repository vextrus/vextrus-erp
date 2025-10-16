# Master Data Service CLAUDE.md

## Purpose
Provides centralized master data management for core business reference entities including customers, vendors, and products with multi-tenant support and GraphQL federation.

## Narrative Summary
The Master Data Service implements a comprehensive data management system using NestJS v11 with TypeORM for PostgreSQL persistence. It manages critical business entities with full CRUD operations, caching, event publishing, and Bangladesh-specific validations. The service features dual interfaces with both REST controllers and GraphQL resolvers, supporting GraphQL Federation v2.3 for seamless API gateway integration. Multi-tenant isolation ensures data security, while Redis caching optimizes performance. Event publishing via Kafka enables real-time synchronization across the ERP system. The service uses a configuration class pattern (GraphQLModule.forRootAsync with useClass) for GraphQL Federation setup, ensuring proper schema generation and tenant context propagation.

## Key Files
- `src/app.module.ts:1-142` - Application module with NestJS v11, GraphQL Federation v2.3 using forRootAsync pattern, TypeORM, Redis cache, and Kafka
- `src/config/graphql-federation.config.ts:1-39` - GraphQL Federation v2 configuration class with tenant context, error formatting, and playground setup
- `src/entities/customer.entity.ts` - Customer entity with GraphQL federation directives and Bangladesh address structure
- `src/entities/vendor.entity.ts` - Vendor entity with federation support and TIN/BIN validation
- `src/entities/product.entity.ts` - Product entity with federation directives and multi-variant support
- `src/graphql/customer.resolver.ts` - GraphQL resolver for customer CRUD operations with pagination
- `src/graphql/vendor.resolver.ts:1-105` - GraphQL resolver with TIN validation, address mapping, and vendor lookup
- `src/graphql/product.resolver.ts` - GraphQL resolver for product management with filtering
- `src/graphql/dto/customer.input.ts` - Customer GraphQL input DTOs for create/update operations
- `src/graphql/dto/customer.response.ts` - Customer GraphQL response DTOs with pagination support
- `src/graphql/dto/vendor.input.ts` - Vendor GraphQL input DTOs with TIN validation
- `src/graphql/dto/vendor.response.ts:4-20` - Vendor paginated response DTO for GraphQL
- `src/graphql/dto/product.input.ts` - Product GraphQL input DTOs for catalog management
- `src/graphql/dto/product.response.ts` - Product GraphQL response DTOs with variant support
- `src/services/customer.service.ts` - Customer business logic with caching
- `src/services/vendor.service.ts` - Vendor management with Bangladesh TIN validation
- `src/services/product.service.ts` - Product catalog management
- `src/validators/bangladesh.validator.ts` - Bangladesh-specific validation rules

## API Endpoints

### REST Endpoints
- `GET /api/customers` - List customers with pagination and filtering
- `POST /api/customers` - Create new customer
- `GET /api/customers/:id` - Get customer by ID
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `GET /api/vendors` - List vendors with pagination and filtering
- `POST /api/vendors` - Create new vendor
- `GET /api/vendors/:id` - Get vendor by ID
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Delete vendor
- `GET /api/products` - List products with pagination and filtering
- `POST /api/products` - Create new product
- `GET /api/products/:id` - Get product by ID
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/health` - Service health check

### GraphQL Operations

**Interface**: Apollo Sandbox UI at http://localhost:3009/graphql
- Interactive GraphQL explorer with query autocompletion
- Schema documentation browser
- Query history and variable management
- Replaces deprecated GraphQL Playground
- Requires CSRF prevention disabled for local development (see graphql-federation.config.ts:20)

#### Customer Operations
- `Query.customers(filter: CustomerFilterInput, page: Number, limit: Number): PaginatedCustomerResponse` - List customers with filtering and pagination
- `Query.customer(id: ID): Customer` - Get customer by ID
- `Query.customerByCode(code: String): Customer` - Find customer by business code
- `Mutation.createCustomer(input: CreateCustomerInput): Customer` - Create new customer with validation
- `Mutation.updateCustomer(id: ID, input: UpdateCustomerInput): Customer` - Update customer details
- `Mutation.deleteCustomer(id: ID): Boolean` - Soft delete customer

#### Vendor Operations
- `Query.vendors(filter: VendorFilterInput, page: Number, limit: Number): PaginatedVendorResponse` - List vendors with filtering and pagination
- `Query.vendor(id: ID): Vendor` - Get vendor by ID
- `Query.vendorByCode(code: String): Vendor` - Find vendor by business code
- `Query.vendorByTin(tin: String): Vendor` - Find vendor by TIN number
- `Query.validateVendorTin(tin: String): Boolean` - Validate Bangladesh TIN format
- `Mutation.createVendor(input: CreateVendorInput): Vendor` - Create vendor with TIN validation
- `Mutation.updateVendor(id: ID, input: UpdateVendorInput): Vendor` - Update vendor information
- `Mutation.deleteVendor(id: ID): Boolean` - Soft delete vendor

#### Product Operations
- `Query.products(filter: ProductFilterInput, page: Number, limit: Number): PaginatedProductResponse` - List products with catalog filtering
- `Query.product(id: ID): Product` - Get product by ID
- `Query.productsByCategory(category: String): [Product]` - Find products by category
- `Query.productsBySku(sku: String): Product` - Find product by SKU
- `Mutation.createProduct(input: CreateProductInput): Product` - Create product with variants
- `Mutation.updateProduct(id: ID, input: UpdateProductInput): Product` - Update product details
- `Mutation.deleteProduct(id: ID): Boolean` - Soft delete product

#### Federation Support
- Entity resolution for Customer, Vendor, and Product entities
- Reference lookups for cross-service data relationships
- @key directives for federation entity identification

## Integration Points
### Consumes
- PostgreSQL: Entity persistence with multi-tenant isolation
- Redis: Caching layer for performance optimization
- Kafka: Event publishing for data synchronization
- JWT Authentication: Service-to-service security
- Tenant Context: Multi-tenant data isolation

### Provides
- Master Data API: RESTful and GraphQL interfaces for core reference entities
- GraphQL Federation Schema: Customer, Vendor, and Product entities with federation keys
- Entity Resolution: Cross-service entity lookups via federation reference resolvers
- Paginated Responses: Consistent pagination patterns across all GraphQL queries
- Domain Events: EntityCreated, EntityUpdated, EntityDeleted events via Kafka
- Cached Data: Redis-backed caching for frequently accessed entities
- Bangladesh Validations: TIN/BIN format validation and address standardization
- Business Logic: Vendor TIN verification, product catalog management, customer relationship tracking

## Configuration
Required environment variables:
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME` - PostgreSQL connection
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` - Redis cache configuration
- `KAFKA_BROKERS`, `KAFKA_CLIENT_ID`, `KAFKA_CONSUMER_GROUP` - Kafka event publishing
- `JWT_SECRET` - JWT token validation
- `PORT` - Service port (default: 3001)
- `CORS_ORIGIN` - CORS configuration
- `NODE_ENV` - Environment mode for GraphQL playground and debug features

Optional configuration:
- `CACHE_TTL` - Cache time-to-live in seconds (default: 300)
- `CACHE_MAX` - Maximum cache entries (default: 1000)
- `DATABASE_SYNCHRONIZE` - TypeORM auto-sync (default: false)
- `DATABASE_LOGGING` - Database query logging (default: false)

## Technology Stack
- **NestJS**: v11.1.6 - Framework upgrade with improved dependency injection and module loading
- **GraphQL**: v16.11.0 - Schema definition and query execution
- **Apollo Federation**: v2.3 - Subgraph implementation with @apollo/subgraph v2.11.2 and @apollo/federation v0.38.1
- **Apollo Server**: v4.11.0 - GraphQL server with Apollo Sandbox UI (replaced GraphQL Playground)
- **Express**: v4.18.2 - HTTP middleware for request body parsing
- **TypeORM**: v0.3.17 - Database ORM with PostgreSQL support
- **Redis**: IORedis v5.3.2 with cache-manager integration
- **Kafka**: KafkaJS v2.2.4 - Event streaming platform

## Key Patterns
- Multi-tenant data isolation using tenant context headers
- Repository pattern with TypeORM for data persistence
- Redis caching with automatic TTL management
- Event sourcing via Kafka for cross-service synchronization
- GraphQL federation with @key directives for entity resolution
- Bangladesh-specific validation patterns for TIN/BIN formats
- Address mapping for Bangladesh postal system integration
- Express middleware initialization for Apollo Server compatibility (see main.ts:18-23)

### GraphQL Federation Configuration Pattern
The service uses NestJS v11's recommended configuration class pattern for GraphQL Federation:

**Configuration Approach** (see app.module.ts:102-106):
```
GraphQLModule.forRootAsync<ApolloFederationDriverConfig>({
  driver: ApolloFederationDriver,
  imports: [ConfigModule],
  useClass: GraphQLFederationConfig,
})
```

**Key Features** (see graphql-federation.config.ts):
- Implements GqlOptionsFactory interface with createGqlOptions() method
- Federation v2 schema generation with autoSchemaFile.federation: 2
- Apollo Sandbox UI via ApolloServerPluginLandingPageLocalDefault (line 4, 18)
- CSRF prevention disabled for local development (csrfPrevention: false on line 20)
- Tenant context extraction from X-Tenant-Id headers
- Environment-aware introspection settings (playground deprecated)
- Structured error formatting with timestamps and extension codes
- Schema sorting for consistent SDL output

**Federation Schema Generation**:
- Entity federation with @Directive('@key(fields: "id")') on all entities
- Tenant-aware resolvers with @CurrentTenant() context injection
- Consistent pagination using PaginatedResponse DTOs across all queries
- Input validation with class-validator decorators on GraphQL DTOs
- Filter-based queries supporting complex business logic (account types, vendor TIN lookup)
- Reference resolution for cross-service entity relationships
- Authentication guard integration for all GraphQL endpoints

Bangladesh ERP patterns:
- TIN validation for vendor onboarding (see vendor.resolver.ts:86-92)
- Address standardization with division/district mapping
- Multi-currency support for international vendors
- Product categorization aligned with Bangladesh trade codes
- Chart of accounts following Bangladesh accounting standards

## Related Documentation
- ../../shared/kernel/CLAUDE.md - Domain primitives and shared utilities
- ../../shared/contracts/CLAUDE.md - Data transfer objects and interfaces
- ../../docs/adr/ - Architecture decisions for master data patterns
- ../auth/CLAUDE.md - Authentication and authorization integration