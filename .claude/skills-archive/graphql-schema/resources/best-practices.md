# GraphQL Federation v2 Best Practices

Federation patterns, error handling, and common mistakes for Vextrus ERP.

---

## Federation v2 Best Practices

### 1. Entity References
```graphql
# Service A: Define entity
type Invoice @key(fields: "id") {
  id: ID!
  customerId: ID!
}

# Service B: Extend entity
extend type Invoice @key(fields: "id") {
  id: ID! @external
  payments: [Payment!]!
}
```

**Rules**:
- Always use `@key` directive on entities
- Mark external fields with `@external`
- Use consistent field names across services

### 2. Shared Types (move to master-data)
```graphql
# Common types in master-data service
type Currency @key(fields: "code") {
  code: String!
  name: String!
  symbol: String!
  rate: Float!
}

# Use in other services
extend type Currency @key(fields: "code") {
  code: String! @external
}
```

**Rules**:
- Define common types once in master-data
- Extend in other services
- Examples: Currency, Country, Language, Unit

### 3. Directives
```graphql
# Authentication required
@Authenticated

# Authorization
@RequirePermissions(permissions: ["invoice:read"])

# Deprecation
@deprecated(reason: "Use newField instead")
```

**Rules**:
- Use `@Authenticated` for all authenticated queries/mutations
- Use `@RequirePermissions` for RBAC
- Deprecate old fields instead of removing immediately

---

## Error Handling

### Union Type Pattern
```graphql
type InvoicePayload {
  success: Boolean!
  invoice: Invoice
  errors: [Error!]
}

type Error {
  field: String      # Field that caused error (validation)
  message: String!   # Human-readable message
  code: String!      # Machine-readable code
}
```

**Why**:
- Allows partial success
- Client can handle errors gracefully
- Better than throwing exceptions

### Error Codes
```typescript
enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
}
```

**Usage**:
```typescript
return {
  success: false,
  invoice: null,
  errors: [
    {
      field: 'customerId',
      message: 'Customer not found',
      code: 'NOT_FOUND',
    },
  ],
};
```

---

## Common Mistakes to Avoid

### ❌ Missing @key directive on entities
```graphql
# Bad
type Invoice {
  id: ID!
}

# Good
type Invoice @key(fields: "id") {
  id: ID!
}
```

### ❌ Not using pagination for lists
```graphql
# Bad
invoices: [Invoice!]!

# Good
invoices(page: Int, limit: Int): InvoicePage!
```

### ❌ Inline args instead of input types
```graphql
# Bad
createInvoice(customerId: ID!, total: Float!): Invoice

# Good
createInvoice(input: CreateInvoiceInput!): InvoicePayload!
```

### ❌ CRUD names instead of business actions
```graphql
# Bad
deleteInvoice(id: ID!): Boolean

# Good
cancelInvoice(id: ID!): InvoicePayload!
```

### ❌ Throwing errors instead of returning error payloads
```typescript
// Bad
async createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  if (!input.customerId) {
    throw new Error('Customer required');
  }
}

// Good
async createInvoice(input: CreateInvoiceInput): Promise<InvoicePayload> {
  if (!input.customerId) {
    return {
      success: false,
      errors: [{ code: 'VALIDATION_ERROR', message: 'Customer required' }],
    };
  }
}
```

### ❌ No authentication/authorization guards
```typescript
// Bad
@Mutation(() => Invoice)
async createInvoice(...) {}

// Good
@Mutation(() => InvoicePayload)
@UseGuards(JwtAuthGuard, RbacGuard)
@RequirePermissions('invoice:create')
async createInvoice(...) {}
```

### ❌ Fetching N+1 queries (use DataLoader)
```typescript
// Bad - N+1 query problem
@ResolveField(() => Customer)
async customer(@Parent() invoice: Invoice): Promise<Customer> {
  return this.customerService.findById(invoice.customerId); // 1 query per invoice
}

// Good - Use DataLoader
@ResolveField(() => Customer)
async customer(@Parent() invoice: Invoice): Promise<Customer> {
  return this.customerLoader.load(invoice.customerId); // Batched query
}
```

### ❌ Not testing GraphQL resolvers
```typescript
// Bad - No tests

// Good - Comprehensive tests
describe('InvoiceResolver', () => {
  it('should create invoice');
  it('should validate input');
  it('should enforce permissions');
  it('should handle errors');
});
```

---

**See also**: `examples.md` for complete code examples
