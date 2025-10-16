# Frontend Integration Guide

Complete guide for integrating frontend applications with the Vextrus ERP GraphQL API.

## Table of Contents

- [Quick Start](#quick-start)
- [Authentication Flow](#authentication-flow)
- [API Gateway Endpoint](#api-gateway-endpoint)
- [GraphQL Clients](#graphql-clients)
- [Query Examples](#query-examples)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Quick Start

### 1. API Gateway Endpoint

All GraphQL requests should be sent to the API Gateway:

```
http://localhost:4000/graphql
```

**Production:** Replace `localhost:4000` with your production API Gateway URL.

### 2. Authentication

All protected queries and mutations require a JWT token in the Authorization header:

```http
POST /graphql
Content-Type: application/json
Authorization: Bearer <your-jwt-token>
```

## Authentication Flow

### Step 1: Login

```graphql
mutation Login {
  login(input: {
    email: "user@example.com"
    password: "your-password"
  }) {
    accessToken
    refreshToken
    expiresIn
    user {
      id
      email
      username
      firstName
      lastName
      organizationId
    }
  }
}
```

**Response:**
```json
{
  "data": {
    "login": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900,
      "user": {
        "id": "uuid-here",
        "email": "user@example.com",
        "username": "user",
        "firstName": "John",
        "lastName": "Doe",
        "organizationId": "org-uuid-here"
      }
    }
  }
}
```

### Step 2: Store Token

Store the `accessToken` securely:

- **Web:** `localStorage` or `sessionStorage` (be aware of XSS risks)
- **Mobile:** Secure storage (Keychain/KeyStore)
- **Recommended:** HttpOnly cookies for web applications

### Step 3: Include Token in Requests

Add the token to all authenticated requests:

```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${accessToken}`
};
```

### Step 4: Handle Token Expiration

Tokens expire after 15 minutes. Use the refresh token to get a new access token:

```graphql
mutation RefreshToken {
  refreshToken(input: {
    refreshToken: "your-refresh-token"
  }) {
    accessToken
    refreshToken
    expiresIn
  }
}
```

## GraphQL Clients

### Apollo Client (React)

```bash
npm install @apollo/client graphql
```

**Setup:**

```typescript
import { ApolloClient, InMemoryCache, createHttpLink, ApolloProvider } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('accessToken');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

function App() {
  return (
    <ApolloProvider client={client}>
      {/* Your app components */}
    </ApolloProvider>
  );
}
```

**Usage:**

```typescript
import { useQuery, gql } from '@apollo/client';

const GET_CUSTOMERS = gql`
  query GetCustomers {
    customers(page: 1, limit: 20) {
      data {
        id
        name
        email
        phone
      }
      pagination {
        total
        page
        limit
      }
    }
  }
`;

function CustomerList() {
  const { loading, error, data } = useQuery(GET_CUSTOMERS);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <ul>
      {data.customers.data.map(customer => (
        <li key={customer.id}>{customer.name}</li>
      ))}
    </ul>
  );
}
```

### urql (React/Vue)

```bash
npm install urql graphql
```

**Setup:**

```typescript
import { createClient, Provider, cacheExchange, fetchExchange } from 'urql';

const client = createClient({
  url: 'http://localhost:4000/graphql',
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: () => {
    const token = localStorage.getItem('accessToken');
    return {
      headers: {
        authorization: token ? `Bearer ${token}` : '',
      },
    };
  },
});

function App() {
  return (
    <Provider value={client}>
      {/* Your app components */}
    </Provider>
  );
}
```

### Vanilla JavaScript/Fetch

```typescript
async function queryGraphQL(query: string, variables?: any) {
  const token = localStorage.getItem('accessToken');

  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data;
}

// Usage
const data = await queryGraphQL(`
  query GetCustomers {
    customers(page: 1, limit: 20) {
      data {
        id
        name
      }
    }
  }
`);
```

## Query Examples by Service

### Auth Service

#### Get Current User

```graphql
query Me {
  me {
    id
    email
    username
    firstName
    lastName
    organizationId
    status
  }
}
```

#### Register New User

```graphql
mutation Register {
  register(input: {
    email: "newuser@example.com"
    password: "SecureP@ss123"
    firstName: "Jane"
    lastName: "Smith"
    phone: "01712345678"
  }) {
    accessToken
    refreshToken
    user {
      id
      email
    }
    message
  }
}
```

### Master Data Service

#### List Customers

```graphql
query GetCustomers($page: Number, $limit: Number, $filter: CustomerFilterInput) {
  customers(page: $page, limit: $limit, filter: $filter) {
    data {
      id
      name
      email
      phone
      address {
        line1
        area
        district
        division
      }
      customerType
      creditLimit
    }
    pagination {
      total
      page
      limit
      totalPages
    }
  }
}
```

**Variables:**
```json
{
  "page": 1,
  "limit": 20,
  "filter": {
    "customerType": "INDIVIDUAL"
  }
}
```

#### Create Customer

```graphql
mutation CreateCustomer($input: CreateCustomerInput!) {
  createCustomer(input: $input) {
    id
    name
    email
    phone
  }
}
```

**Variables:**
```json
{
  "input": {
    "name": "ABC Corporation",
    "email": "contact@abc.com",
    "phone": "01712345678",
    "customerType": "CORPORATE",
    "address": {
      "street1": "123 Main Street",
      "city": "Dhaka",
      "district": "Dhaka",
      "division": "Dhaka",
      "postalCode": "1205",
      "country": "Bangladesh"
    }
  }
}
```

#### List Vendors

```graphql
query GetVendors($page: Number, $limit: Number) {
  vendors(page: $page, limit: $limit) {
    data {
      id
      name
      email
      phone
      tin
      address {
        line1
        area
        district
      }
    }
    pagination {
      total
      page
      limit
    }
  }
}
```

#### List Products

```graphql
query GetProducts($filter: ProductFilterInput) {
  products(filter: $filter) {
    data {
      id
      name
      sku
      category
      unitPrice
      stockQuantity
      description
    }
    pagination {
      total
      page
      limit
    }
  }
}
```

### Finance Service

#### List Invoices

```graphql
query GetInvoices {
  invoices {
    id
    invoiceNumber
    customerId
    amount
    status
    dueDate
  }
}
```

#### Create Invoice

```graphql
mutation CreateInvoice($input: CreateInvoiceInput!) {
  createInvoice(input: $input) {
    id
    invoiceNumber
    amount
    status
  }
}
```

#### List Chart of Accounts

```graphql
query GetChartOfAccounts($accountType: AccountType, $isActive: Boolean) {
  chartOfAccounts(accountType: $accountType, isActive: $isActive) {
    id
    accountCode
    accountName
    accountType
    balance
    isActive
  }
}
```

### Organization Service

#### Get Organization

```graphql
query GetOrganization($id: ID!) {
  organization(id: $id) {
    id
    name
    slug
    type
    address
    phone
    email
  }
}
```

#### List Organizations

```graphql
query GetOrganizations($filter: OrganizationFilterInput) {
  organizations(filter: $filter) {
    id
    name
    slug
    type
  }
}
```

### Workflow Service

#### List Workflows

```graphql
query GetWorkflows($page: Number, $limit: Number) {
  workflows(page: $page, limit: $limit) {
    data {
      id
      name
      description
      status
      createdAt
    }
    pagination {
      total
      page
      limit
    }
  }
}
```

#### List Tasks

```graphql
query GetMyTasks($status: String) {
  myTasks(status: $status) {
    id
    title
    description
    status
    priority
    dueDate
    assignedTo
  }
}
```

#### Complete Task

```graphql
mutation CompleteTask($id: ID!, $result: String) {
  completeTask(id: $id, result: $result) {
    id
    status
    completedAt
  }
}
```

### Rules Engine Service

#### List Rules

```graphql
query GetRules($page: Number, $limit: Number) {
  rules(page: $page, limit: $limit) {
    data {
      id
      name
      category
      expression
      isActive
    }
    pagination {
      total
    }
  }
}
```

#### Evaluate Rule

```graphql
mutation EvaluateRule($input: EvaluateRuleInput!) {
  evaluateRule(input: $input) {
    success
    passed
    message
    result
    executionTime
  }
}
```

**Variables:**
```json
{
  "input": {
    "ruleId": "rule-uuid-here",
    "context": "{\"amount\": 1000, \"vatRate\": 0.15}"
  }
}
```

## Error Handling

### GraphQL Error Structure

```json
{
  "errors": [
    {
      "message": "Unauthorized",
      "path": ["me"],
      "extensions": {
        "code": "UNAUTHENTICATED",
        "originalError": {
          "message": "Unauthorized",
          "statusCode": 401
        },
        "serviceName": "auth"
      }
    }
  ],
  "data": {
    "me": null
  }
}
```

### Common Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `UNAUTHENTICATED` | No valid token provided | Redirect to login |
| `FORBIDDEN` | Insufficient permissions | Show permission error |
| `BAD_USER_INPUT` | Invalid input data | Show validation errors |
| `INTERNAL_SERVER_ERROR` | Server error | Show generic error, retry |
| `NOT_FOUND` | Resource not found | Show 404 message |

### Error Handling with Apollo Client

```typescript
import { useQuery, ApolloError } from '@apollo/client';

function Component() {
  const { data, loading, error } = useQuery(GET_CUSTOMERS);

  if (error) {
    // Check for authentication errors
    const isAuthError = error.graphQLErrors.some(
      err => err.extensions?.code === 'UNAUTHENTICATED'
    );

    if (isAuthError) {
      // Redirect to login
      window.location.href = '/login';
      return null;
    }

    // Handle other errors
    return <ErrorMessage error={error.message} />;
  }

  // Rest of component...
}
```

### Automatic Token Refresh

```typescript
import { ApolloClient, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

let isRefreshing = false;
let pendingRequests: Function[] = [];

const errorLink = onError(({ graphQLErrors, operation, forward }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      if (err.extensions?.code === 'UNAUTHENTICATED') {
        if (!isRefreshing) {
          isRefreshing = true;

          return refreshToken().then(newToken => {
            isRefreshing = false;

            // Retry all pending requests
            pendingRequests.forEach(resolve => resolve());
            pendingRequests = [];

            // Retry the failed request
            const oldHeaders = operation.getContext().headers;
            operation.setContext({
              headers: {
                ...oldHeaders,
                authorization: `Bearer ${newToken}`,
              },
            });

            return forward(operation);
          });
        } else {
          // Queue the request
          return new Observable(observer => {
            pendingRequests.push(() => {
              forward(operation).subscribe(observer);
            });
          });
        }
      }
    }
  }
});

async function refreshToken(): Promise<string> {
  const refreshToken = localStorage.getItem('refreshToken');

  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        mutation RefreshToken($refreshToken: String!) {
          refreshToken(input: { refreshToken: $refreshToken }) {
            accessToken
          }
        }
      `,
      variables: { refreshToken },
    }),
  });

  const result = await response.json();
  const newToken = result.data.refreshToken.accessToken;

  localStorage.setItem('accessToken', newToken);
  return newToken;
}

const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});
```

## Best Practices

### 1. Token Security

- **Never** log tokens to console
- Store tokens in httpOnly cookies when possible
- Clear tokens on logout
- Implement token expiration handling
- Use HTTPS in production

### 2. Query Optimization

- Request only needed fields
- Use pagination for large datasets
- Implement caching strategy
- Batch multiple queries when possible

### 3. Error Handling

- Always handle GraphQL errors
- Show user-friendly error messages
- Log errors for debugging
- Implement retry logic for network errors

### 4. Performance

- Use Apollo Client caching
- Implement query batching
- Use GraphQL fragments for reusable fields
- Debounce search/filter inputs

### 5. Type Safety

- Generate TypeScript types from GraphQL schema
- Use GraphQL Code Generator for automatic type generation

```bash
npm install -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations
```

**codegen.yml:**
```yaml
schema: http://localhost:4000/graphql
documents: './src/**/*.graphql'
generates:
  ./src/generated/graphql.ts:
    plugins:
      - typescript
      - typescript-operations
```

## Testing

### Example with Jest and Apollo Client

```typescript
import { MockedProvider } from '@apollo/client/testing';
import { render, screen } from '@testing-library/react';

const mocks = [
  {
    request: {
      query: GET_CUSTOMERS,
      variables: { page: 1, limit: 20 },
    },
    result: {
      data: {
        customers: {
          data: [
            { id: '1', name: 'Test Customer', email: 'test@example.com' }
          ],
          pagination: { total: 1, page: 1, limit: 20 }
        }
      }
    }
  }
];

test('renders customers', async () => {
  render(
    <MockedProvider mocks={mocks}>
      <CustomerList />
    </MockedProvider>
  );

  expect(await screen.findByText('Test Customer')).toBeInTheDocument();
});
```

## Support

For issues or questions:
- **Documentation:** See service-specific `CLAUDE.md` files in `services/*/CLAUDE.md`
- **API Explorer:** Apollo Sandbox at `http://localhost:4000/graphql`
- **Integration Tests:** See `test-integration/` directory for working examples

## Next Steps

1. Explore the [API Gateway Authentication Documentation](../services/api-gateway/AUTHENTICATION.md)
2. Review [GraphQL Federation Patterns](../docs/adr/)
3. Check service-specific documentation in `services/*/CLAUDE.md`
