---
name: graphql-federation-v2
description: GraphQL Federation v2 patterns for distributed schema across microservices. Use when working with GraphQL federation, @key directives, entity resolution, reference resolvers, schema stitching, gateway configuration, subgraph design, or cross-service GraphQL queries.
---

# GraphQL Federation V2 - Complete Reference

**Auto-loaded when**: GraphQL, federation, @key, entity, subgraph, resolver, schema stitching keywords detected

---

## 1. Entity Definition (@key Directive)

### Single Key Entity
```typescript
// TypeScript entity with Federation directive
@ObjectType()
@Directive('@key(fields: "id")')
export class InvoiceDto {
  @Field(() => ID)
  id: string;

  @Field()
  invoiceNumber: string;

  @Field(() => Float)
  grandTotal: number;
}
```

### Multiple Keys (Compound Primary Keys)
```graphql
type Invoice @key(fields: "id") @key(fields: "invoiceNumber") {
  id: ID!
  invoiceNumber: String!
  grandTotal: Float!
  status: InvoiceStatus!
}
```

---

## 2. Reference Resolver (Entity Resolution)

### Reference Resolver Pattern
```typescript
@Resolver(() => InvoiceDto)
export class InvoiceResolver {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly masterDataLoader: MasterDataDataLoader
  ) {}

  /**
   * Apollo Federation Reference Resolver
   *
   * Enables cross-service entity resolution when other services reference Invoice by ID.
   * Required for GraphQL Federation v2 when @key directive is used.
   *
   * Example federation query:
   * query {
   *   payment(id: "123") {
   *     invoice { # <-- This triggers resolveReference
   *       id
   *       invoiceNumber
   *       grandTotal
   *     }
   *   }
   * }
   */
  @ResolveReference()
  async resolveReference(
    reference: { __typename: string; id: string }
  ): Promise<InvoiceDto | null> {
    return this.queryBus.execute(new GetInvoiceQuery(reference.id));
  }
}
```

### DataLoader for Batching (Performance Optimization)
```typescript
@ResolveReference()
async resolveReference(ref: { id: string }): Promise<InvoiceDto | null> {
  // Use DataLoader to batch multiple entity requests
  return this.invoiceLoader.load(ref.id);
}
```

---

## 3. Resolver Patterns (Queries & Mutations)

### Query: Single Entity
```typescript
@Query(() => InvoiceDto, { nullable: true, name: 'invoice' })
@UseGuards(JwtAuthGuard, RbacGuard)
@Permissions('invoice:read')
async getInvoice(
  @Args('id', { type: () => ID }) id: string,
  @CurrentUser() user: CurrentUserContext
): Promise<InvoiceDto | null> {
  return this.queryBus.execute(new GetInvoiceQuery(id));
}
```

### Query: List with Pagination (MANDATORY)
```typescript
@Query(() => [InvoiceDto], { name: 'invoices' })
@UseGuards(JwtAuthGuard, RbacGuard)
@Permissions('invoice:read')
async getInvoices(
  @CurrentUser() user: CurrentUserContext,
  @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 }) limit?: number,
  @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset?: number
): Promise<InvoiceDto[]> {
  return this.queryBus.execute(new GetInvoicesQuery(user.tenantId, limit, offset));
}
```

### Mutation: Create with Payload Pattern
```typescript
@Mutation(() => InvoiceDto, { name: 'createInvoice' })
@UseGuards(JwtAuthGuard, RbacGuard)
@Permissions('invoice:create')
async createInvoice(
  @Args('input') input: CreateInvoiceInput,
  @CurrentUser() user: CurrentUserContext
): Promise<InvoiceDto> {
  const command = new CreateInvoiceCommand(
    input.customerId,
    input.vendorId,
    new Date(input.invoiceDate),
    input.lineItems,
    user.tenantId,
    user.userId
  );

  const invoiceId = await this.commandBus.execute<CreateInvoiceCommand, string>(command);

  // Query created invoice to return it
  const invoice = await this.queryBus.execute(new GetInvoiceQuery(invoiceId));
  if (!invoice) {
    throw new NotFoundException(`Invoice ${invoiceId} was created but could not be retrieved`);
  }

  return invoice;
}
```

### Mutation: Update Pattern
```typescript
@Mutation(() => InvoiceDto, { name: 'updateInvoice' })
@UseGuards(JwtAuthGuard, RbacGuard)
@Permissions('invoice:update')
async updateInvoice(
  @Args('id', { type: () => ID }) id: string,
  @Args('input') input: UpdateInvoiceInput,
  @CurrentUser() user: CurrentUserContext
): Promise<InvoiceDto> {
  const command = new UpdateInvoiceCommand(id, user.userId, user.tenantId, input);
  await this.commandBus.execute(command);

  const invoice = await this.queryBus.execute(new GetInvoiceQuery(id));
  if (!invoice) {
    throw new NotFoundException(`Invoice ${id} not found after update`);
  }

  return invoice;
}
```

---

## 4. Extending External Entities (Cross-Service)

### Extend Entity from Another Service
```graphql
# In finance service: Extend Customer from master-data service
extend type Customer @key(fields: "id") {
  id: ID! @external
  invoices: [Invoice!]!  # New field added by finance service
}
```

### ResolveField for Extended Entity
```typescript
@Resolver('Customer')
export class CustomerExtensionResolver {
  @ResolveField('invoices', () => [InvoiceDto])
  async invoices(
    @Parent() customer: { id: string },
    @Args('limit', { type: () => Int, nullable: true }) limit?: number
  ): Promise<InvoiceDto[]> {
    return this.queryBus.execute(
      new GetInvoicesByCustomerQuery(customer.id, limit)
    );
  }
}
```

---

## 5. Federation Configuration (NestJS)

### Configuration Class Pattern
```typescript
@Injectable()
export class GraphQLFederationConfig implements GqlOptionsFactory {
  createGqlOptions(): ApolloFederationDriverConfig {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      driver: ApolloFederationDriver,
      autoSchemaFile: {
        federation: 2,  // Federation v2
        path: join(process.cwd(), 'src/schema.gql'),
      },
      sortSchema: true,
      playground: false,
      plugins: [
        ApolloServerPluginLandingPageLocalDefault({
          embed: true,
          includeCookies: true
        }),
        new QueryComplexityPlugin()  // Prevent DoS attacks
      ],
      csrfPrevention: isProduction,
      introspection: !isProduction,
      context: ({ req, res }) => ({
        req,
        res,
        tenantId: req.headers['x-tenant-id'],
        userId: req.user?.id,
        correlationId: req.headers['x-correlation-id']
      }),
      formatError: (error) => ({
        message: error.message,
        code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
        path: error.path,
        extensions: {
          ...error.extensions,
          timestamp: new Date().toISOString()
        }
      })
    };
  }
}
```

---

## 6. Guards & Security (MANDATORY)

### Always Use Both Guards
```typescript
@Query(() => InvoiceDto)
@UseGuards(JwtAuthGuard, RbacGuard)  // MANDATORY: Both guards
@Permissions('invoice:read')          // Required permissions
async invoice(@Args('id') id: string) {
  return this.service.findById(id);
}
```

### Multi-Tenant Context Extraction
```typescript
context: ({ req }) => ({
  tenantId: req.headers['x-tenant-id'],  // Extract from JWT or header
  userId: req.user?.id,
  userRole: req.user?.role
}),
```

---

## 7. Query Complexity Protection (DoS Prevention)

### Query Complexity Plugin
```typescript
@Plugin()
class QueryComplexityPlugin implements ApolloServerPlugin {
  private readonly MAX_DEPTH = 10;        // Max nesting levels
  private readonly MAX_FIELD_COUNT = 100; // Max fields per query

  async requestDidStart(): Promise<GraphQLRequestListener<any>> {
    return {
      async didResolveOperation(requestContext) {
        const { document } = requestContext;

        const depth = calculateDepth(document);
        if (depth > this.MAX_DEPTH) {
          throw new GraphQLError(
            `Query is too complex. Max depth is ${this.MAX_DEPTH}, got ${depth}`,
            { extensions: { code: 'QUERY_TOO_COMPLEX' } }
          );
        }

        const fieldCount = calculateFieldCount(document);
        if (fieldCount > this.MAX_FIELD_COUNT) {
          throw new GraphQLError(
            `Query requests too many fields. Max ${this.MAX_FIELD_COUNT}, got ${fieldCount}`,
            { extensions: { code: 'QUERY_TOO_WIDE' } }
          );
        }
      }
    };
  }
}
```

---

## 8. Best Practices

✅ **DO**:
- Add `@key(fields: "id")` to all federated entities
- Implement `@ResolveReference()` for all @key fields
- Always paginate lists (use limit/offset or cursor-based)
- Use both `JwtAuthGuard` AND `RbacGuard` (MANDATORY)
- Return nullable types for flexibility (`InvoiceDto | null`)
- Use DataLoader for batching reference resolvers
- Add query complexity limits (max depth, max fields)
- Extract tenant context from headers
- Format errors consistently (code, message, timestamp)
- Disable introspection in production

❌ **DON'T**:
- Return unbounded arrays (`[Invoice!]!` without pagination)
- Skip authentication/authorization guards
- Missing @key directive on federated entities
- Circular dependencies between services
- Expose internal error details in production
- Enable introspection in production (schema enumeration risk)
- Skip CSRF protection in production
- Allow deeply nested queries (DoS risk)

---

**Self-Contained**: All GraphQL Federation v2 patterns inline
**Production-Ready**: Extracted from live Vextrus ERP finance service
**Security-Hardened**: Query complexity limits, CSRF protection, auth guards
**Federation v2**: Full Apollo Federation v2 support with reference resolvers
