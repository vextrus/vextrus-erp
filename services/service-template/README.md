# Service Template Generator

## Overview

The service template generator creates new NestJS microservices with proper structure, configuration, and integration with the Vextrus ERP monorepo shared libraries.

## Usage

### Generate a New Service

From the repository root:

```bash
# Basic usage
node services/service-template/generate-service.js service-name

# Examples
node services/service-template/generate-service.js inventory
node services/service-template/generate-service.js notification
node services/service-template/generate-service.js reporting
```

### What Gets Generated

The generator creates a complete NestJS service with:

```
services/[service-name]/
├── src/
│   ├── config/
│   │   ├── app.config.ts           # Application configuration
│   │   ├── database.config.ts      # Database configuration
│   │   └── configuration.ts        # Config loader
│   ├── database/
│   │   ├── migrations/            # TypeORM migrations
│   │   └── database.module.ts     # Database module
│   ├── domain/
│   │   ├── entities/              # Domain entities
│   │   ├── value-objects/         # Value objects
│   │   └── repositories/          # Repository interfaces
│   ├── application/
│   │   ├── commands/              # CQRS commands
│   │   ├── queries/               # CQRS queries
│   │   └── services/              # Application services
│   ├── infrastructure/
│   │   ├── repositories/          # Repository implementations
│   │   └── external/              # External service integrations
│   ├── interfaces/
│   │   ├── http/                  # REST controllers
│   │   ├── graphql/               # GraphQL resolvers
│   │   └── grpc/                  # gRPC services
│   ├── shared/
│   │   ├── decorators/            # Custom decorators
│   │   ├── filters/               # Exception filters
│   │   ├── guards/                # Guards
│   │   ├── interceptors/          # Interceptors
│   │   └── pipes/                 # Validation pipes
│   ├── app.module.ts              # Root module
│   └── main.ts                    # Application entry point
├── test/
│   ├── unit/                      # Unit tests
│   ├── integration/               # Integration tests
│   └── e2e/                       # End-to-end tests
├── .env.example                   # Environment template
├── .eslintrc.js                   # ESLint configuration
├── .prettierrc                    # Prettier configuration
├── CLAUDE.md                      # Service documentation
├── Dockerfile                     # Docker configuration
├── nest-cli.json                  # NestJS CLI configuration
├── package.json                   # Package configuration
├── README.md                      # Service readme
├── tsconfig.build.json           # TypeScript build config
└── tsconfig.json                 # TypeScript config
```

## Features

### Pre-configured Integrations

The generated service includes:

1. **Shared Libraries**
   - `@vextrus/kernel` - Domain primitives
   - `@vextrus/contracts` - Service contracts
   - `@vextrus/utils` - Common utilities

2. **Database Setup**
   - TypeORM configuration
   - PostgreSQL connection
   - Migration support
   - Repository pattern

3. **Health Checks**
   - Database health indicator
   - Memory health indicators
   - Redis health check (if configured)
   - Custom health endpoints

4. **API Documentation**
   - Swagger/OpenAPI setup
   - API versioning
   - DTO validation

5. **CQRS Pattern**
   - Command/Query separation
   - Event sourcing ready
   - Domain events

6. **Security**
   - JWT authentication ready
   - CORS configuration
   - Helmet integration
   - Rate limiting

## Configuration

### Service Configuration

Each generated service uses environment variables for configuration:

```env
# Application
APP_NAME=service-name
APP_PORT=3002
NODE_ENV=development

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=vextrus
DATABASE_PASSWORD=vextrus_dev_2024
DATABASE_NAME=vextrus_erp

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=vextrus_redis_2024

# JWT (if using auth)
JWT_ACCESS_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Kafka (optional)
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=service-name
KAFKA_CONSUMER_GROUP=service-name-group
```

### Port Assignment

Services are assigned ports sequentially:
- Auth Service: 3001
- Organization Service: 3002
- Project Management: 3003
- Finance: 3004
- HR: 3005
- SCM: 3006
- CRM: 3007
- New services: 3008+

## Customization

### Modifying the Template

The template can be customized by editing `generate-service.js`:

```javascript
// Add new dependencies
const additionalDependencies = {
  "@nestjs/graphql": "^12.0.0",
  "@nestjs/apollo": "^12.0.0",
  "graphql": "^16.0.0"
};

// Add new dev dependencies
const additionalDevDependencies = {
  "@types/lodash": "^4.14.0"
};
```

### Template Variables

The generator supports these variables:
- `{{serviceName}}` - The service name (kebab-case)
- `{{ServiceName}}` - PascalCase service name
- `{{SERVICE_NAME}}` - UPPER_SNAKE_CASE
- `{{port}}` - Assigned port number
- `{{description}}` - Service description

### Adding Custom Files

To add custom files to the template:

1. Add file generation in the `generateServiceFiles` function
2. Use template literals for dynamic content
3. Ensure proper file paths

Example:
```javascript
function generateCustomFile(serviceName) {
  return `
    // Custom file for ${serviceName}
    export class ${toPascalCase(serviceName)}Custom {
      // Implementation
    }
  `;
}
```

## Post-Generation Steps

After generating a service:

### 1. Install Dependencies

```bash
cd services/[service-name]
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Run Database Migrations

```bash
npm run migration:generate -- -n Initial
npm run migration:run
```

### 4. Start the Service

```bash
# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

### 5. Update Root Configuration

Add the service to the root workspace:

```json
// package.json
{
  "workspaces": [
    "services/auth",
    "services/organization",
    "services/[new-service]"  // Add here
  ]
}
```

Update Turbo configuration if needed:

```json
// turbo.json
{
  "pipeline": {
    "services/[new-service]#build": {
      "dependsOn": ["^build"]
    }
  }
}
```

## Domain-Driven Design

The generated service follows DDD principles:

### Domain Layer
- Contains business logic
- Independent of infrastructure
- Uses shared kernel primitives

```typescript
import { AggregateRoot } from '@vextrus/kernel';

export class ServiceAggregate extends AggregateRoot {
  // Domain logic here
}
```

### Application Layer
- Use cases and orchestration
- CQRS commands and queries
- Application services

```typescript
@CommandHandler(CreateServiceCommand)
export class CreateServiceHandler {
  // Command handling logic
}
```

### Infrastructure Layer
- External integrations
- Repository implementations
- Database access

```typescript
@Injectable()
export class ServiceRepository implements IServiceRepository {
  // Repository implementation
}
```

### Interface Layer
- REST controllers
- GraphQL resolvers
- External APIs

```typescript
@Controller('service')
export class ServiceController {
  // HTTP endpoints
}
```

## Testing

Generated services include test setup:

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Coverage
```bash
npm run test:coverage
```

## Docker Support

Each service includes a Dockerfile:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3002
CMD ["node", "dist/main.js"]
```

Build and run:
```bash
docker build -t vextrus/service-name .
docker run -p 3002:3002 vextrus/service-name
```

## Integration with Shared Libraries

### Using @vextrus/kernel

```typescript
import { Entity, ValueObject, AggregateRoot } from '@vextrus/kernel';

export class User extends AggregateRoot {
  constructor(
    public readonly id: string,
    public readonly email: Email
  ) {
    super();
  }
}

export class Email extends ValueObject<string> {
  constructor(value: string) {
    super(value);
    this.validate();
  }
}
```

### Using @vextrus/contracts

```typescript
import { IAuthUser, ErrorCodes } from '@vextrus/contracts';

export class AuthService {
  validateUser(user: IAuthUser): void {
    if (!user.email) {
      throw new DomainError(ErrorCodes.INVALID_USER);
    }
  }
}
```

### Using @vextrus/utils

```typescript
import { formatCurrency, toBengali } from '@vextrus/utils';

export class PriceService {
  formatPrice(amount: number): string {
    return formatCurrency(amount, 'BDT');
  }
  
  getBengaliAmount(amount: number): string {
    return toBengali(amount);
  }
}
```

## Best Practices

### 1. Service Naming
- Use kebab-case: `inventory-management`
- Be descriptive: `notification` not `notif`
- Avoid abbreviations

### 2. Port Management
- Check existing services for port conflicts
- Document port assignment
- Use environment variables

### 3. Dependencies
- Use workspace protocol for shared libraries
- Pin production dependencies
- Keep services lightweight

### 4. Configuration
- Never commit `.env` files
- Use strong secrets in production
- Document all environment variables

### 5. Testing
- Write tests during development
- Maintain high coverage (>80%)
- Test integration with shared libraries

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Change port in .env
APP_PORT=3099
```

**Shared library not found:**
```bash
# Rebuild shared libraries
npm run build:shared
# Reinstall dependencies
npm install
```

**Database connection failed:**
```bash
# Ensure PostgreSQL is running
docker-compose up -d postgres
# Check connection settings in .env
```

**TypeScript errors:**
```bash
# Rebuild TypeScript references
npm run build:ts
# Clear cache
rm -rf dist *.tsbuildinfo
```

## Contributing

To improve the service template:

1. Edit `generate-service.js`
2. Test generation with a sample service
3. Update this documentation
4. Submit a pull request

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [CQRS Pattern](https://docs.nestjs.com/recipes/cqrs)
- [TypeORM Documentation](https://typeorm.io)