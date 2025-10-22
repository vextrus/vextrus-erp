# GraphQL Federation v2 Patterns

Proven patterns for GraphQL Federation v2 in Vextrus ERP microservices.

---

## Entity References

### Define Entity (Service A)
```graphql
type Invoice @key(fields: "id") {
  id: ID!
  customerId: ID!
  total: Float!
}
```

### Extend Entity (Service B)
```graphql
extend type Invoice @key(fields: "id") {
  id: ID! @external
  payments: [Payment!]!
}
```

**Rules**:
- Always use `@key` directive on entities
- Mark external fields with `@external`
- Use consistent field names across services

---

## Shared Types Strategy

### Define Once (master-data service)
```graphql
type Currency @key(fields: "code") {
  code: String!
  name: String!
  symbol: String!
}

type Country @key(fields: "code") {
  code: String!
  name: String!
}
```

### Extend Elsewhere
```graphql
extend type Currency @key(fields: "code") {
  code: String! @external
}
```

**Common Shared Types**: Currency, Country, Language, Unit, TaxRate

---

## Error Handling Pattern

### Payload Type
```graphql
type InvoicePayload {
  success: Boolean!
  invoice: Invoice
  errors: [Error!]
}

type Error {
  field: String      # validation field
  message: String!   # human-readable
  code: String!      # machine-readable
}
```

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

**Why**: Allows partial success, graceful error handling

---

## Pagination Pattern

```graphql
type InvoicePage {
  items: [Invoice!]!
  totalCount: Int!
  pageInfo: PageInfo!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
}

type Query {
  invoices(page: Int, limit: Int): InvoicePage!
}
```

**Never**: Return unbounded arrays `[Invoice!]!`

---

## DataLoader Pattern (N+1 Prevention)

```typescript
@ResolveField(() => Customer)
async customer(
  @Parent() invoice: Invoice,
  @Loader(CustomerLoader) loader: DataLoader<string, Customer>
): Promise<Customer> {
  return loader.load(invoice.customerId); // Batched
}
```

---

## Security Decorators

```typescript
@Query(() => [Invoice])
@UseGuards(JwtAuthGuard, RbacGuard)
@RequirePermissions('invoice:read')
async invoices(...) {}
```

**Rules**:
- `@Authenticated` on ALL queries/mutations
- `@RequirePermissions` for RBAC
- Guards execute in order: Auth → RBAC → Business logic

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Missing `@key` on entities | Always add `@key(fields: "id")` |
| No pagination | Use `Page` types for lists |
| Inline mutation args | Use `Input` types |
| CRUD names | Use business actions: `cancelInvoice` not `deleteInvoice` |
| Throwing errors | Return error payloads |
| N+1 queries | Use DataLoader |
| No auth guards | `@UseGuards(JwtAuthGuard, RbacGuard)` |

---

**See also**: `.claude/skills/graphql-schema/examples.md` for complete implementations
