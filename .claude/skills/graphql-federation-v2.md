# GraphQL Federation V2 Skill

## Entity Definition with @key Directive

### Core Principles
- **@key directive**: Marks entity types that can be referenced across services
- **Multiple keys**: Can have multiple @key directives for different reference patterns
- **Resolvable**: Each service can extend entities from other services

### Implementation Pattern
```graphql
# Location: services/*/src/graphql/schema.graphql

# Define entity with @key
type Invoice @key(fields: "id") @key(fields: "invoiceNumber") {
  id: ID!
  invoiceNumber: String!
  customerId: ID!
  totalAmount: Float!
  status: InvoiceStatus!
  createdAt: DateTime!
}

# Extend entity from another service
extend type Customer @key(fields: "id") {
  id: ID! @external
  invoices: [Invoice!]! # Add field to Customer from another service
}

enum InvoiceStatus {
  DRAFT
  APPROVED
  PAID
  CANCELLED
}
```

### TypeScript Implementation
```typescript
// Location: services/*/src/graphql/resolvers/invoice.resolver.ts

import { Parent, ResolveField, ResolveReference, Resolver } from '@nestjs/graphql';

@Resolver('Invoice')
export class InvoiceResolver {
  constructor(private readonly invoiceService: InvoiceService) {}

  // Reference resolver - required for @key directive
  @ResolveReference()
  async resolveReference(reference: { __typename: string; id?: string; invoiceNumber?: string }) {
    if (reference.id) {
      return this.invoiceService.findById(reference.id);
    }
    if (reference.invoiceNumber) {
      return this.invoiceService.findByInvoiceNumber(reference.invoiceNumber);
    }
    return null;
  }

  // Field resolver
  @ResolveField('customer')
  async customer(@Parent() invoice: Invoice) {
    return { __typename: 'Customer', id: invoice.customerId };
  }
}

// Extending entity from another service
@Resolver('Customer')
export class CustomerInvoiceResolver {
  constructor(private readonly invoiceService: InvoiceService) {}

  @ResolveField('invoices')
  async invoices(@Parent() customer: { id: string }) {
    return this.invoiceService.findByCustomerId(customer.id);
  }
}
```

---

## Reference Resolver Patterns

### Core Principles
- **@ResolveReference**: Resolves entity by its @key fields
- **Stub Entities**: Return minimal entity with __typename for cross-service references
- **Efficient Loading**: Use DataLoader to batch entity resolution

### Implementation Pattern
```typescript
@Resolver('Invoice')
export class InvoiceResolver {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly invoiceLoader: InvoiceDataLoader
  ) {}

  // Single reference resolution
  @ResolveReference()
  async resolveReference(reference: {
    __typename: string;
    id?: string;
    invoiceNumber?: string;
  }) {
    if (reference.id) {
      // Use DataLoader for batching
      return this.invoiceLoader.load(reference.id);
    }
    if (reference.invoiceNumber) {
      return this.invoiceService.findByInvoiceNumber(reference.invoiceNumber);
    }
    return null;
  }
}

// DataLoader for batching
@Injectable()
export class InvoiceDataLoader {
  private loader: DataLoader<string, Invoice>;

  constructor(private readonly invoiceService: InvoiceService) {
    this.loader = new DataLoader<string, Invoice>(
      async (ids: readonly string[]) => {
        const invoices = await this.invoiceService.findByIds(ids as string[]);
        const invoiceMap = new Map(invoices.map(inv => [inv.id, inv]));
        return ids.map(id => invoiceMap.get(id) || null);
      }
    );
  }

  load(id: string): Promise<Invoice> {
    return this.loader.load(id);
  }
}
```

---

## Pagination Patterns (Always Required)

### Core Principles
- **Always paginate lists**: Never return unbounded lists
- **Connection pattern**: Use Relay-style connection pattern
- **Cursor-based**: Use cursor-based pagination (not offset-based)

### Schema Pattern
```graphql
# ALWAYS use connection pattern for lists
type InvoiceConnection {
  edges: [InvoiceEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type InvoiceEdge {
  node: Invoice!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type Query {
  # ❌ DON'T: Return unbounded list
  # invoices: [Invoice!]!

  # ✅ DO: Use connection pattern
  invoices(
    first: Int
    after: String
    last: Int
    before: String
    filter: InvoiceFilterInput
  ): InvoiceConnection!
}

input InvoiceFilterInput {
  status: InvoiceStatus
  customerId: ID
  dateRange: DateRangeInput
}
```

### TypeScript Implementation
```typescript
@Resolver('Query')
export class InvoiceQueryResolver {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Query('invoices')
  async invoices(
    @Args('first') first?: number,
    @Args('after') after?: string,
    @Args('last') last?: number,
    @Args('before') before?: string,
    @Args('filter') filter?: InvoiceFilterInput
  ): Promise<InvoiceConnection> {
    // Validate pagination args
    if (first && last) {
      throw new UserInputError('Cannot provide both first and last');
    }

    const limit = first || last || 20; // Default 20
    const direction = last ? 'backward' : 'forward';

    // Decode cursor
    const cursor = after || before;
    const decodedCursor = cursor ? this.decodeCursor(cursor) : null;

    // Fetch data
    const result = await this.invoiceService.findPaginated({
      limit: limit + 1, // +1 to check if there's more
      cursor: decodedCursor,
      direction,
      filter
    });

    // Build connection
    const hasMore = result.length > limit;
    const items = hasMore ? result.slice(0, -1) : result;

    return {
      edges: items.map(invoice => ({
        node: invoice,
        cursor: this.encodeCursor(invoice.id, invoice.createdAt)
      })),
      pageInfo: {
        hasNextPage: direction === 'forward' ? hasMore : false,
        hasPreviousPage: direction === 'backward' ? hasMore : false,
        startCursor: items[0] ? this.encodeCursor(items[0].id, items[0].createdAt) : null,
        endCursor: items[items.length - 1]
          ? this.encodeCursor(items[items.length - 1].id, items[items.length - 1].createdAt)
          : null
      },
      totalCount: await this.invoiceService.count(filter)
    };
  }

  private encodeCursor(id: string, createdAt: Date): string {
    return Buffer.from(`${id}:${createdAt.getTime()}`).toString('base64');
  }

  private decodeCursor(cursor: string): { id: string; createdAt: Date } {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const [id, timestamp] = decoded.split(':');
    return { id, createdAt: new Date(parseInt(timestamp)) };
  }
}
```

---

## Mutation Patterns

### Core Principles
- **Input types**: Use input types for mutation arguments
- **Payload pattern**: Return payload type with result + errors
- **Nullable result**: Result can be null if operation fails

### Schema Pattern
```graphql
type Mutation {
  createInvoice(input: CreateInvoiceInput!): CreateInvoicePayload
  approveInvoice(input: ApproveInvoiceInput!): ApproveInvoicePayload
}

input CreateInvoiceInput {
  customerId: ID!
  items: [InvoiceItemInput!]!
  dueDate: DateTime!
}

input InvoiceItemInput {
  description: String!
  quantity: Float!
  unitPrice: Float!
}

# Payload pattern with errors
type CreateInvoicePayload {
  invoice: Invoice  # Nullable - null if errors
  errors: [UserError!]!
}

type UserError {
  field: String  # Field that caused error
  message: String!
  code: ErrorCode!
}

enum ErrorCode {
  VALIDATION_ERROR
  NOT_FOUND
  UNAUTHORIZED
  INTERNAL_ERROR
}
```

### TypeScript Implementation
```typescript
@Resolver('Mutation')
export class InvoiceMutationResolver {
  constructor(private readonly commandBus: CommandBus) {}

  @Mutation('createInvoice')
  async createInvoice(
    @Args('input') input: CreateInvoiceInput,
    @CurrentUser() user: User
  ): Promise<CreateInvoicePayload> {
    try {
      // Execute command
      const invoiceId = await this.commandBus.execute(
        new CreateInvoiceCommand(
          input.customerId,
          input.items,
          input.dueDate,
          generateIdempotencyKey()
        )
      );

      // Fetch created invoice
      const invoice = await this.invoiceService.findById(invoiceId);

      return {
        invoice,
        errors: []
      };
    } catch (error) {
      // Return errors in payload
      if (error instanceof ValidationError) {
        return {
          invoice: null,
          errors: error.fields.map(field => ({
            field: field.name,
            message: field.message,
            code: 'VALIDATION_ERROR'
          }))
        };
      }

      // Generic error
      return {
        invoice: null,
        errors: [{
          field: null,
          message: error.message,
          code: 'INTERNAL_ERROR'
        }]
      };
    }
  }
}
```

---

## Guard Patterns (Always Required)

### Core Principles
- **Always use guards**: JwtAuthGuard + RbacGuard on all resolvers
- **Permission checks**: Check permissions in resolver
- **Field-level guards**: Can apply guards at field level too

### Implementation Pattern
```typescript
import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
import { RbacGuard } from '@/shared/guards/rbac.guard';
import { Permissions } from '@/shared/decorators/permissions.decorator';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';

@Resolver('Invoice')
@UseGuards(JwtAuthGuard, RbacGuard) // Always apply both guards
export class InvoiceResolver {
  constructor(private readonly invoiceService: InvoiceService) {}

  // Query requires 'invoice:read' permission
  @Query('invoice')
  @Permissions('invoice:read')
  async invoice(
    @Args('id') id: string,
    @CurrentUser() user: User
  ): Promise<Invoice> {
    return this.invoiceService.findById(id);
  }

  // Mutation requires 'invoice:create' permission
  @Mutation('createInvoice')
  @Permissions('invoice:create')
  async createInvoice(
    @Args('input') input: CreateInvoiceInput,
    @CurrentUser() user: User
  ): Promise<CreateInvoicePayload> {
    // Implementation...
  }

  // Field-level permission check
  @ResolveField('internalNotes')
  @Permissions('invoice:read-internal')
  async internalNotes(
    @Parent() invoice: Invoice,
    @CurrentUser() user: User
  ): Promise<string> {
    return invoice.internalNotes;
  }
}
```

---

## Subscription Patterns

### Schema Pattern
```graphql
type Subscription {
  invoiceUpdated(invoiceId: ID!): Invoice!
  invoicesUpdated(filter: InvoiceFilterInput): Invoice!
}
```

### TypeScript Implementation
```typescript
import { Resolver, Subscription, Args } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';

@Resolver()
export class InvoiceSubscriptionResolver {
  constructor(private readonly pubSub: PubSub) {}

  @Subscription('invoiceUpdated', {
    filter: (payload, variables) => {
      return payload.invoiceUpdated.id === variables.invoiceId;
    }
  })
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('invoice:read')
  invoiceUpdated(@Args('invoiceId') invoiceId: string) {
    return this.pubSub.asyncIterator('INVOICE_UPDATED');
  }
}

// Publish from event handler
@EventsHandler(InvoiceApprovedEvent)
export class InvoiceApprovedHandler {
  constructor(private readonly pubSub: PubSub) {}

  async handle(event: InvoiceApprovedEvent) {
    const invoice = await this.invoiceService.findById(event.data.invoiceId);
    await this.pubSub.publish('INVOICE_UPDATED', {
      invoiceUpdated: invoice
    });
  }
}
```

---

## Error Handling

### Schema Pattern
```graphql
interface Error {
  message: String!
  code: ErrorCode!
}

type UserError implements Error {
  message: String!
  code: ErrorCode!
  field: String
}

type SystemError implements Error {
  message: String!
  code: ErrorCode!
  stackTrace: String # Only in dev mode
}

enum ErrorCode {
  VALIDATION_ERROR
  NOT_FOUND
  UNAUTHORIZED
  FORBIDDEN
  INTERNAL_ERROR
  CONFLICT
}
```

### TypeScript Implementation
```typescript
// Global exception filter
@Catch()
export class GraphQLErrorFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    if (exception instanceof ValidationError) {
      return new UserInputError(exception.message, {
        code: 'VALIDATION_ERROR',
        fields: exception.fields
      });
    }

    if (exception instanceof NotFoundError) {
      return new ApolloError(exception.message, 'NOT_FOUND');
    }

    if (exception instanceof UnauthorizedError) {
      return new AuthenticationError(exception.message);
    }

    if (exception instanceof ForbiddenError) {
      return new ForbiddenError(exception.message);
    }

    // Generic error
    return new ApolloError(
      'Internal server error',
      'INTERNAL_ERROR'
    );
  }
}
```

---

## Best Practices

### DO ✅
- Use @key directive for all entities
- Always paginate lists (connection pattern)
- Use guards (JwtAuthGuard + RbacGuard) on all resolvers
- Return payload types with errors from mutations
- Use DataLoader for batching reference resolution
- Use cursor-based pagination (not offset)
- Make mutation results nullable (can fail)
- Apply field-level permissions when needed
- Version schema changes carefully

### DON'T ❌
- Don't return unbounded lists
- Don't forget guards on resolvers
- Don't throw errors from mutations (return in payload)
- Don't use offset-based pagination
- Don't expose internal errors to clients
- Don't skip reference resolvers for @key
- Don't forget to batch entity loading
- Don't make breaking schema changes

---

## Federation V2 Features

### @shareable Directive
```graphql
# Allow field to be defined in multiple services
type Product @key(fields: "id") {
  id: ID!
  name: String! @shareable
}
```

### @inaccessible Directive
```graphql
# Hide field from federated schema
type Invoice @key(fields: "id") {
  id: ID!
  internalId: String! @inaccessible
}
```

### @override Directive
```graphql
# Override field definition from another service
type Invoice @key(fields: "id") {
  id: ID!
  totalAmount: Float! @override(from: "legacy-service")
}
```

---

## Reference

**Location Conventions**:
- Schema: `services/*/src/graphql/schema.graphql`
- Resolvers: `services/*/src/graphql/resolvers/`
- Guards: `services/*/src/shared/guards/`
- DataLoaders: `services/*/src/graphql/dataloaders/`

**Further Reading**: `VEXTRUS-PATTERNS.md` for full GraphQL Federation v2 patterns

---

## Usage in Vextrus ERP

This skill is automatically activated when working on:
- GraphQL schema design
- Resolver implementation
- Entity federation
- API security
- Pagination
- Subscription patterns

**Always follow GraphQL Federation v2 best practices for API consistency across all services.**
