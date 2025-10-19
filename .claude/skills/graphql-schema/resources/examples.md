# GraphQL Schema Examples

Complete code examples for Vextrus ERP GraphQL patterns.

---

## Schema Design Patterns

### 1. Entity Pattern (Federation)
```graphql
# Define entity with @key directive
type Invoice @key(fields: "id") {
  id: ID!
  invoiceNumber: String!
  customerId: ID!
  total: Float!
  status: InvoiceStatus!

  # Reference to other service
  customer: Customer @external
}

# Extend entity from another service
extend type Customer @key(fields: "id") {
  id: ID! @external
  invoices: [Invoice!]!
}
```

### 2. Query Pattern
```graphql
type Query {
  # Single entity
  invoice(id: ID!): Invoice

  # List with pagination
  invoices(
    page: Int = 1
    limit: Int = 20
    filter: InvoiceFilterInput
    sort: SortInput
  ): InvoicePage!
}

# Pagination response
type InvoicePage {
  data: [Invoice!]!
  pagination: PaginationInfo!
}

type PaginationInfo {
  currentPage: Int!
  totalPages: Int!
  totalItems: Int!
  hasNext: Boolean!
  hasPrev: Boolean!
}
```

### 3. Mutation Pattern
```graphql
type Mutation {
  # Action-oriented names
  createInvoice(input: CreateInvoiceInput!): InvoicePayload!
  updateInvoice(id: ID!, input: UpdateInvoiceInput!): InvoicePayload!
  cancelInvoice(id: ID!): InvoicePayload!
}

# Mutation response with union for errors
type InvoicePayload {
  success: Boolean!
  invoice: Invoice
  errors: [Error!]
}

type Error {
  field: String
  message: String!
  code: String!
}
```

### 4. Input Types
```graphql
# Separate input types for create/update
input CreateInvoiceInput {
  customerId: ID!
  items: [InvoiceItemInput!]!
  dueDate: DateTime!
  currency: String = "USD"
}

input UpdateInvoiceInput {
  status: InvoiceStatus
  dueDate: DateTime
  notes: String
}

# Nested inputs
input InvoiceItemInput {
  productId: ID!
  quantity: Int!
  unitPrice: Float!
  description: String
}
```

### 5. Enum Pattern
```graphql
enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  OVERDUE
  CANCELLED
}

enum SortDirection {
  ASC
  DESC
}
```

---

## Resolver Patterns

### Query Resolver
```typescript
@Resolver(() => Invoice)
export class InvoiceResolver {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Query(() => Invoice, { nullable: true })
  async invoice(@Args('id') id: string): Promise<Invoice | null> {
    return this.queryBus.execute(new GetInvoiceQuery(id));
  }

  @Query(() => InvoicePage)
  async invoices(
    @Args() args: InvoiceListArgs,
  ): Promise<InvoicePage> {
    return this.queryBus.execute(
      new ListInvoicesQuery(args.page, args.limit, args.filter),
    );
  }
}
```

### Mutation Resolver
```typescript
@Mutation(() => InvoicePayload)
@UseGuards(JwtAuthGuard, RbacGuard)
@RequirePermissions('invoice:create')
async createInvoice(
  @Args('input') input: CreateInvoiceInput,
  @CurrentUser() user: User,
): Promise<InvoicePayload> {
  try {
    const command = new CreateInvoiceCommand(input, user.id);
    const invoice = await this.commandBus.execute(command);

    return {
      success: true,
      invoice,
      errors: [],
    };
  } catch (error) {
    return {
      success: false,
      invoice: null,
      errors: [{ message: error.message, code: 'CREATE_FAILED' }],
    };
  }
}
```

### Field Resolver
```typescript
@ResolveField(() => Customer)
async customer(@Parent() invoice: Invoice): Promise<Customer> {
  return this.queryBus.execute(
    new GetCustomerQuery(invoice.customerId),
  );
}

@ResolveField(() => Float)
async calculatedTotal(@Parent() invoice: Invoice): Promise<number> {
  // Computed field logic
  return invoice.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
}
```

---

## Testing GraphQL APIs

### Query Test
```typescript
describe('InvoiceResolver', () => {
  it('should get invoice by id', async () => {
    const query = `
      query GetInvoice($id: ID!) {
        invoice(id: $id) {
          id
          invoiceNumber
          total
        }
      }
    `;

    const result = await gqlExec(query, { id: 'inv-123' });

    expect(result.data.invoice).toMatchObject({
      id: 'inv-123',
      invoiceNumber: 'INV-2024-001',
      total: 1500.00,
    });
  });
});
```

### Mutation Test
```typescript
it('should create invoice', async () => {
  const mutation = `
    mutation CreateInvoice($input: CreateInvoiceInput!) {
      createInvoice(input: $input) {
        success
        invoice { id }
        errors { message }
      }
    }
  `;

  const result = await gqlExec(mutation, {
    input: { customerId: 'cust-1', items: [...] }
  });

  expect(result.data.createInvoice.success).toBe(true);
  expect(result.data.createInvoice.errors).toHaveLength(0);
});
```

### Error Handling Test
```typescript
it('should return errors for invalid input', async () => {
  const mutation = `
    mutation CreateInvoice($input: CreateInvoiceInput!) {
      createInvoice(input: $input) {
        success
        errors { code message }
      }
    }
  `;

  const result = await gqlExec(mutation, {
    input: { customerId: '', items: [] } // Invalid
  });

  expect(result.data.createInvoice.success).toBe(false);
  expect(result.data.createInvoice.errors).toContainEqual({
    code: 'VALIDATION_ERROR',
    message: expect.any(String),
  });
});
```

---

**See also**: `best-practices.md` for federation patterns and error handling strategies
