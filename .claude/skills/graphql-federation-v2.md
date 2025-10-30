---
name: graphql-federation-v2
description: |
  GraphQL Federation v2 patterns for distributed schema across microservices.
  Auto-activates on: GraphQL, federation, @key, resolver, schema, entity, gateway.
triggers:
  - GraphQL
  - federation
  - "@key"
  - resolver
  - schema
  - entity
  - gateway
  - subgraph
---

# GraphQL Federation V2 (Quick Reference)

## Entity Definition (@key)

**Purpose**: Mark types that can be referenced across services

**Syntax**:
```graphql
type Invoice @key(fields: "id") {
  id: ID!
  # fields...
}
```

**Multiple Keys**:
```graphql
type Invoice @key(fields: "id") @key(fields: "invoiceNumber") {
  id: ID!
  invoiceNumber: String!
}
```

**Location**: `services/*/src/graphql/schema.graphql`

---

## Reference Resolver

**Purpose**: Resolve entity by @key fields

**Pattern**:
```typescript
@ResolveReference()
async resolveReference(ref: { id?: string }) {
  return this.service.findById(ref.id);
}
```

**Rules**:
- Required for all @key fields
- Return null if not found
- Use DataLoader for batching

**Location**: `services/*/src/graphql/resolvers/*.resolver.ts`

---

## Extending Entities

**Purpose**: Add fields to entities from other services

**Syntax**:
```graphql
extend type Customer @key(fields: "id") {
  id: ID! @external
  invoices: [Invoice!]!  # New field
}
```

**Resolver**:
```typescript
@Resolver('Customer')
@ResolveField('invoices')
async invoices(@Parent() customer: { id: string }) {
  return this.invoiceService.findByCustomerId(customer.id);
}
```

---

## Pagination (MANDATORY)

**Rule**: Always paginate lists

**Pattern**:
```graphql
type Query {
  invoices(first: Int, after: String): InvoiceConnection!
}

type InvoiceConnection {
  edges: [InvoiceEdge!]!
  pageInfo: PageInfo!
}
```

**DON'T**: Return unbounded arrays `[Invoice!]!`

---

## Guards (MANDATORY)

**Rule**: Always use JwtAuthGuard + RbacGuard

**Pattern**:
```typescript
@UseGuards(JwtAuthGuard, RbacGuard)
@RequirePermissions('invoice:read')
@Query(() => Invoice)
async invoice(@Args('id') id: string) {
  return this.service.findById(id);
}
```

**DON'T**: Skip authentication/authorization

---

## Query Patterns

**Single Entity**:
```graphql
invoice(id: ID!): Invoice
```

**List with Pagination**:
```graphql
invoices(first: Int, after: String): InvoiceConnection!
```

**Filtered List**:
```graphql
invoicesByCustomer(customerId: ID!, first: Int): InvoiceConnection!
```

**Always**: Return nullable for flexibility

---

## Mutation Patterns

**Create**:
```graphql
createInvoice(input: CreateInvoiceInput!): InvoicePayload!
```

**Update**:
```graphql
updateInvoice(id: ID!, input: UpdateInvoiceInput!): InvoicePayload!
```

**Payload Pattern**:
```graphql
type InvoicePayload {
  invoice: Invoice
  errors: [Error!]
}
```

---

## Best Practices

**DO ✅**:
- @key on all entities
- ResolveReference for all @key fields
- Always paginate lists
- JwtAuthGuard + RbacGuard
- Return nullable for flexibility
- Use DataLoader for batching

**DON'T ❌**:
- Unbounded arrays
- Skip authentication
- Missing @key on entities
- Circular dependencies

---

## Quick Patterns

**Entity**: @key(fields: "id") + ResolveReference
**Extend**: extend type + @external + ResolveField
**Query**: Always paginate, always guard
**Mutation**: Input + Payload pattern
**Guards**: JwtAuthGuard + RbacGuard (MANDATORY)

---

## Reference

- **Full Patterns**: `VEXTRUS-PATTERNS.md` sections 6-8
- **Examples**: See `services/*/src/graphql/` for implementations
- **Location**: schema.graphql, resolvers/

---

**Always follow GraphQL Federation v2 patterns for distributed schema.**
