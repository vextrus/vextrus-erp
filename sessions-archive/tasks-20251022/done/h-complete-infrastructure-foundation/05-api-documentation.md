---
task: h-complete-infrastructure-foundation/05-api-documentation
status: pending
created: 2025-09-20
---

# Subtask 5: API Documentation

## Objective
Set up comprehensive API documentation for all services including Swagger/OpenAPI for REST endpoints, GraphQL playground for Federation Gateway, and integration examples.

## Success Criteria
- [ ] Swagger UI accessible for all REST services
- [ ] GraphQL playground configured with schema introspection
- [ ] API documentation auto-generated from code
- [ ] Authentication flows documented
- [ ] Integration examples provided
- [ ] Postman collections generated

## Tasks

### 1. Configure Swagger for REST Services
- [ ] Add @nestjs/swagger to all services
- [ ] Configure Swagger decorators on controllers
- [ ] Document DTOs and schemas
- [ ] Add authentication documentation
- [ ] Configure API versioning

### 2. GraphQL Documentation
- [ ] Enable GraphQL playground
- [ ] Configure schema introspection
- [ ] Document resolvers and types
- [ ] Add example queries and mutations
- [ ] Configure federation explorer

### 3. Generate API Collections
- [ ] Export Postman collections
- [ ] Create Insomnia workspaces
- [ ] Generate curl examples
- [ ] Create client SDK documentation
- [ ] Provide language-specific examples

### 4. Authentication Documentation
- [ ] Document JWT token flow
- [ ] Provide OAuth2 examples
- [ ] Document API key usage
- [ ] Show permission requirements
- [ ] Include refresh token flow

### 5. Integration Guides
- [ ] Frontend integration guide
- [ ] Mobile app integration
- [ ] Third-party webhooks
- [ ] Event-driven patterns
- [ ] Rate limiting documentation

## Swagger Configuration Example

```typescript
// services/auth/src/main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Auth Service API')
    .setDescription('Authentication and authorization service')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication operations')
    .addTag('users', 'User management')
    .addTag('roles', 'Role and permission management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    customSiteTitle: 'Vextrus ERP - Auth Service',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(3001);
}
```

## Controller Documentation Example

```typescript
// services/auth/src/controllers/auth.controller.ts
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    // Implementation
  }

  @Post('refresh')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed', type: TokenResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<TokenResponseDto> {
    // Implementation
  }
}
```

## GraphQL Schema Documentation

```graphql
"""
User authentication and profile management
"""
type User {
  """Unique identifier"""
  id: ID!

  """User email address"""
  email: String!

  """User full name"""
  name: String!

  """User roles and permissions"""
  roles: [Role!]!

  """Account creation timestamp"""
  createdAt: DateTime!
}

"""
Authentication mutations
"""
extend type Mutation {
  """
  Authenticate user and receive tokens
  Returns JWT access token and refresh token
  """
  login(email: String!, password: String!): AuthResponse!

  """
  Register new user account
  Requires admin permission for enterprise accounts
  """
  register(input: RegisterInput!): User!

  """
  Refresh expired access token
  Requires valid refresh token
  """
  refreshToken(token: String!): TokenResponse!
}
```

## API Documentation Structure

```
/api-docs (Traefik routes to services)
├── /auth/api-docs          # Auth service Swagger
├── /master-data/api-docs   # Master data Swagger
├── /workflow/api-docs      # Workflow service Swagger
├── /rules/api-docs         # Rules engine Swagger
├── /finance/api-docs       # Finance service Swagger
├── /graphql                # GraphQL playground
└── /federation             # Federation explorer
```

## Postman Collection Example

```json
{
  "info": {
    "name": "Vextrus ERP - Auth Service",
    "description": "Authentication and authorization endpoints",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{access_token}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3001",
      "type": "default"
    },
    {
      "key": "access_token",
      "value": "",
      "type": "default"
    }
  ],
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"admin@vextrus.com\",\n  \"password\": \"admin123\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": "{{base_url}}/auth/login"
          }
        }
      ]
    }
  ]
}
```

## Validation
```bash
# Check Swagger endpoints
for service in auth master-data workflow rules-engine finance; do
  echo "Testing $service Swagger:"
  curl -s http://localhost:3000/$service/api-docs/ | head -5
done

# Test GraphQL playground
curl -s http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { queryType { name } } }"}' | jq

# Generate Postman collection
curl -s http://localhost:3001/api-docs-json > auth-api.json
```