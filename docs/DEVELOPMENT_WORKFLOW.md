# Vextrus ERP Development Workflow

## 🚀 Quick Start

### Prerequisites
- Node.js 20 LTS
- Docker Desktop
- Git

### Initial Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd vextrus-erp
```

2. **Setup environment variables**
```bash
cp .env.example .env
cp .env.example services/auth/.env
```

3. **Start infrastructure services**
```bash
docker-compose up -d postgres redis
```

4. **Install dependencies**
```bash
cd services/auth
npm install
```

5. **Start development server**
```bash
npm run start:dev
```

The auth service will be available at:
- API: http://localhost:3001
- Swagger Docs: http://localhost:3001/api/docs

## 📦 Available Services

### Docker Services
| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Session cache |
| Kafka | 9092 | Event streaming (optional) |
| Adminer | 8082 | Database UI |
| Redis Commander | 8083 | Redis UI |
| Kafka UI | 8080 | Kafka management |

### Application Services
| Service | Port | Description |
|---------|------|-------------|
| Auth Service | 3001 | Authentication & authorization |

## 📦 Shared Libraries

The monorepo includes three core shared libraries:

### @vextrus/kernel
Core domain primitives (Entity, ValueObject, AggregateRoot)
```bash
npm run build --workspace=@vextrus/kernel
```

### @vextrus/contracts
Cross-service contracts and interfaces
```bash
npm run build --workspace=@vextrus/contracts
```

### @vextrus/utils
Common utilities and helpers
```bash
npm run build --workspace=@vextrus/utils
```

### Building All Shared Libraries
```bash
# Build all shared libraries
npm run build:shared

# Watch mode for development
npm run dev:shared
```

## 🛠️ Development Commands

### Monorepo Commands
```bash
# Install all dependencies
npm install

# Build everything
npm run build

# Build specific workspace
npm run build --workspace=@vextrus/kernel

# Run tests across monorepo
npm run test

# Check TypeScript
npm run typecheck

# Lint all packages
npm run lint
```

### Turbo Pipeline Commands
```bash
# Build with Turbo (respects dependencies)
turbo build

# Run tests with caching
turbo test

# Development mode
turbo dev --filter=services/auth

# Build only affected packages
turbo build --filter=...services/auth
```

### Docker Commands
```bash
# Start all services
docker-compose up -d

# Start specific services
docker-compose up -d postgres redis

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

### NestJS Commands
```bash
# Development mode with hot reload
npm run start:dev

# Production build
npm run build
npm run start:prod

# Run tests
npm run test
npm run test:watch
npm run test:cov

# Linting
npm run lint
```

### Database Commands
```bash
# Generate migration
npm run db:migrate:generate -- -n MigrationName

# Run migrations
npm run db:migrate

# Revert migration
npm run db:migrate:revert
```

## 🔍 Testing the API

### Using Swagger UI
1. Navigate to http://localhost:3001/api/docs
2. Use the interactive documentation to test endpoints

### Health Check Endpoints
```bash
# Main health check - all indicators
curl http://localhost:3001/api/v1/health | python -m json.tool

# Readiness check - external dependencies
curl http://localhost:3001/api/v1/health/ready | python -m json.tool

# Liveness check - application status
curl http://localhost:3001/api/v1/health/live | python -m json.tool
```

Expected healthy response:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" },
    "redis": { "status": "up" },
    "kafka": { "status": "up" }
  }
}
```

### Using curl

#### Register User
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "testuser",
    "password": "Test@1234",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+8801712345678"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Test@1234"
  }'
```

#### Get Current User
```bash
curl -X POST http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🗄️ Database Access

### Using Adminer
1. Open http://localhost:8082
2. Login with:
   - System: PostgreSQL
   - Server: postgres
   - Username: vextrus
   - Password: vextrus_dev_2024
   - Database: vextrus_erp

### Using psql
```bash
docker exec -it vextrus-postgres psql -U vextrus -d vextrus_erp
```

### Common Queries
```sql
-- View all users
SELECT * FROM auth.users;

-- View roles
SELECT * FROM auth.roles;

-- View organizations
SELECT * FROM core.organizations;
```

## 🐛 Debugging

### View Service Logs
```bash
# Auth service logs
docker-compose logs -f

# Database logs
docker exec vextrus-postgres tail -f /var/log/postgresql/postgresql-*.log
```

### Common Issues

#### Port Already in Use
```bash
# Find process using port
netstat -ano | grep 3001

# Safe kill using npx (recommended for Windows)
npx kill-port 3001

# Alternative: Kill process (Windows - use double slashes in Git Bash)
taskkill //F //PID <PID>
```

#### Database Connection Issues
1. Ensure PostgreSQL is running: `docker ps`
2. Check connection string in `.env`
3. Verify database exists: `docker exec vextrus-postgres psql -U vextrus -c "\l"`

#### Redis Connection Issues
1. Check Redis is running: `docker ps`
2. Test connection: `docker exec vextrus-redis redis-cli ping`

#### Kafka Issues
1. Create topics if missing:
```bash
docker exec -it kafka kafka-topics.sh --create --topic auth-events --bootstrap-server localhost:9092
docker exec -it kafka kafka-topics.sh --create --topic user-events --bootstrap-server localhost:9092
```
2. List topics: `docker exec -it kafka kafka-topics.sh --list --bootstrap-server localhost:9092`
3. Check consumer groups: `docker exec -it kafka kafka-consumer-groups.sh --list --bootstrap-server localhost:9092`

## 🏗️ Project Structure

```
vextrus-erp/
├── services/auth/          # Authentication service
│   ├── src/
│   │   ├── config/        # Configuration
│   │   ├── database/      # Database setup
│   │   ├── modules/       # Feature modules
│   │   │   ├── auth/      # Auth endpoints
│   │   │   └── users/     # User management
│   │   └── shared/        # Shared utilities
│   ├── test/              # Tests
│   └── package.json
├── docker-compose.yml      # Docker services
├── .env.example           # Environment template
└── docs/                  # Documentation
```

## 🔄 Git Workflow

### Branches
- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - Feature branches

### Creating a Feature
```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: your feature description"

# Push to remote
git push origin feature/your-feature
```

## 📝 Environment Variables

Key environment variables in `.env`:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=vextrus
DATABASE_PASSWORD=vextrus_dev_2024
DATABASE_NAME=vextrus_erp

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=vextrus_redis_2024

# JWT
JWT_ACCESS_SECRET=<change-in-production>
JWT_REFRESH_SECRET=<change-in-production>

# API
APP_PORT=3001
```

## 🚢 Deployment

### Development
The application auto-reloads on code changes when running with `npm run start:dev`.

### Production Build
```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Docker Documentation](https://docs.docker.com)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section
2. Review existing issues in GitHub
3. Contact the development team

---

**Last Updated**: 2025-09-05
**Version**: 1.0.0