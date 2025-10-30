---
name: GraphQL Schema
description: When working with GraphQL schemas, resolvers, queries, or mutations, activate this skill to enforce GraphQL Federation v2 best practices and consistency patterns. Use when user says "graphql", "schema", "resolver", "query", "mutation", "federation", or when modifying GraphQL API definitions.
---

# GraphQL Schema Skill

## Purpose
Enforce **GraphQL Federation v2** best practices and maintain API consistency across Vextrus ERP's 18 microservices.

## Activation Triggers
- User says: "graphql", "schema", "resolver", "query", "mutation", "federation"
- Creating/modifying: GraphQL schemas, resolvers, type definitions
- API design: New queries, mutations, subscriptions
- Schema stitching: Cross-service entity references

## Federation v2 Architecture

```
API Gateway (Port 4000)
├── Federation v2 Supergraph
├── Composes schemas from services:
│   ├── auth (Port 4001)
│   ├── finance (Port 4002)
│   ├── master-data (Port 4003)
│   ├── notification (Port 4004)
│   └── [14 more services]
```

---

## Quick Reference: Naming Conventions

### Types
- PascalCase: `Invoice`, `InvoicePage`, `Customer`
- Descriptive: `InvoicePayload` not `InvoiceResponse`

### Fields
- camelCase: `customerId`, `dueDate`, `totalAmount`
- Avoid abbreviations: `customerId` not `custId`

### Mutations
- Action verbs: `createInvoice`, `updateInvoice`, `cancelInvoice`
- Business actions, not CRUD: `cancelInvoice` not `deleteInvoice`

### Queries
- Singular/plural: `invoice(id)`, `invoices(filter)`
- Descriptive: `overdueInvoices`, `recentPayments`

---

## Schema Design Patterns (Brief Overview)

For detailed examples with code, see **resources/examples.md**

### 1. Entity Pattern (Federation)
- Use `@key` directive on all federated entities
- Reference entities from other services with `@external`
- Example: Invoice entity with Customer reference

### 2. Query Pattern
- Single entity: `invoice(id: ID!): Invoice`
- List with pagination: `invoices(page, limit, filter, sort): InvoicePage!`
- Always use pagination response type

### 3. Mutation Pattern
- Action-oriented names (not CRUD)
- Separate input types for create/update
- Payload type with `success`, `data`, and `errors` fields

### 4. Input Types
- Separate create/update inputs
- Nested inputs for complex data
- Default values where appropriate

### 5. Enum Pattern
- UPPERCASE values: `DRAFT`, `SENT`, `PAID`
- Clear, business-meaningful names

**Full Examples**: See `resources/examples.md` for complete schema and resolver code

---

## Resolver Patterns (Brief Overview)

For detailed implementations, see **resources/examples.md**

### Query Resolver
- Use QueryBus for CQRS pattern
- Handle nullable results
- Pagination for lists

### Mutation Resolver
- Use CommandBus for CQRS pattern
- Apply guards: `@UseGuards(JwtAuthGuard, RbacGuard)`
- Return payload with errors (don't throw)

### Field Resolver
- Use for computed fields
- Use for cross-service references (federation)
- Consider DataLoader for N+1 prevention

**Full Examples**: See `resources/examples.md` for complete resolver implementations

---

## Federation v2 Essentials

**Core Directives**:
- `@key(fields: "id")` - Define federated entity
- `@external` - Reference field from another service
- `@requires(fields: "...")` - Declare dependencies
- `@provides(fields: "...")` - Optimize resolution

**Shared Types**:
- Move common types to master-data service
- Use `extend type` to reference across services
- Example: Currency, Country, Language

**Authentication & Authorization**:
```graphql
@Authenticated
@RequirePermissions(permissions: ["invoice:read"])
```

**For Federation patterns and error handling**, see `resources/best-practices.md`

---

## Tools & Setup

```bash
# Generate TypeScript types from schema
npm run graphql:codegen

# Test schema composition
rover supergraph compose --config supergraph.yaml

# GraphQL Playground
http://localhost:4000/graphql
```

---

## Schema Checklist

Before implementing GraphQL changes:

- [ ] Entity has `@key` directive for federation
- [ ] Pagination for list queries
- [ ] Input types for mutations (not inline)
- [ ] Payload type with errors field
- [ ] Proper naming conventions followed
- [ ] Authentication guards on resolvers
- [ ] RBAC permissions on mutations
- [ ] Field resolvers for computed/joined data
- [ ] Error handling with codes
- [ ] Tests for queries and mutations

---

## Plan Mode Integration

In plan mode:
1. User requests GraphQL feature
2. Skill presents schema design with federation considerations
3. User approves schema structure
4. Execute with resolver implementation
5. Add tests and guards

**Workflow**: Design → Approve → Implement → Test

---

## Integration with Execute First

Typical workflow:
1. Execute First: Orchestrates overall implementation
2. GraphQL Schema: Guides schema design and resolver patterns
3. Security First: Ensures guards and permissions
4. Event Sourcing: Coordinates with command/query handlers (if applicable)
5. Test First: Creates resolver tests

**Order**: Schema → Resolvers → Guards → Tests → Verification

---

## References

- **Full Examples**: `resources/examples.md` (schema patterns, resolver patterns, testing)
- **Best Practices**: `resources/best-practices.md` (federation, error handling, common mistakes)
- **Federation Docs**: https://apollographql.com/docs/federation/
- **GraphQL Playground**: http://localhost:4000/graphql

---

## Override

Skip this skill if user explicitly says:
- "skip graphql validation"
- "just make it work"

**Default**: ENFORCE GraphQL Federation v2 best practices
