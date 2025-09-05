# Vextrus ERP - Technology Stack & Implementation Guide

## Overview

This document provides detailed technical specifications for implementing Vextrus ERP using modern enterprise technologies optimized for scalability, maintainability, and Bangladesh market requirements.

## Backend Architecture

### NestJS Microservices Framework

#### Core Setup
```typescript
// main.ts - Service Bootstrap
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'auth-service',
          brokers: ['localhost:9092'],
        },
        consumer: {
          groupId: 'auth-consumer',
        },
      },
    },
  );
  await app.listen();
}
```

#### CQRS Implementation
```typescript
// commands/create-project.command.ts
export class CreateProjectCommand {
  constructor(
    public readonly name: string,
    public readonly clientId: string,
    public readonly startDate: Date,
    public readonly budget: Money,
  ) {}
}

// handlers/create-project.handler.ts
@CommandHandler(CreateProjectCommand)
export class CreateProjectHandler implements ICommandHandler<CreateProjectCommand> {
  constructor(
    private readonly repository: ProjectRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateProjectCommand): Promise<Project> {
    const project = Project.create(command);
    await this.repository.save(project);
    
    // Publish domain events
    project.getUncommittedEvents().forEach(event => 
      this.eventBus.publish(event)
    );
    
    return project;
  }
}
```

#### Event Sourcing Pattern
```typescript
// aggregates/project.aggregate.ts
@AggregateRoot()
export class Project extends AggregateRootBase {
  private state: ProjectState;
  
  apply(event: DomainEvent): void {
    switch (event.type) {
      case 'ProjectCreated':
        this.state = {
          id: event.payload.id,
          name: event.payload.name,
          status: 'INITIATED',
        };
        break;
      case 'TaskAdded':
        this.state.tasks.push(event.payload.task);
        break;
    }
  }
  
  static create(params: CreateProjectParams): Project {
    const project = new Project();
    project.raise(new ProjectCreatedEvent(params));
    return project;
  }
}
```

### Domain-Driven Design Structure

```
services/project-management/
├── src/
│   ├── domain/
│   │   ├── aggregates/
│   │   │   ├── project.aggregate.ts
│   │   │   └── task.aggregate.ts
│   │   ├── entities/
│   │   │   ├── resource.entity.ts
│   │   │   └── milestone.entity.ts
│   │   ├── value-objects/
│   │   │   ├── money.vo.ts
│   │   │   ├── duration.vo.ts
│   │   │   └── progress.vo.ts
│   │   ├── events/
│   │   │   └── project-created.event.ts
│   │   └── repositories/
│   │       └── project.repository.interface.ts
│   ├── application/
│   │   ├── commands/
│   │   ├── queries/
│   │   ├── sagas/
│   │   └── services/
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   ├── typeorm/
│   │   │   └── event-store/
│   │   ├── messaging/
│   │   │   └── kafka/
│   │   └── external/
│   │       └── rajuk-api/
│   └── presentation/
│       ├── rest/
│       ├── graphql/
│       └── grpc/
```

## Frontend Architecture

### Next.js 15 App Router

#### Project Structure
```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── projects/
│   │   ├── finance/
│   │   └── reports/
│   ├── api/
│   │   └── [...route]/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/           # Shadcn components
│   ├── features/     # Feature-specific components
│   └── layouts/      # Layout components
├── lib/
│   ├── api/         # API client
│   ├── hooks/       # Custom hooks
│   └── utils/       # Utilities
└── styles/
```

#### Server Components with Data Fetching
```typescript
// app/(dashboard)/projects/page.tsx
import { Suspense } from 'react';
import { ProjectList } from '@/components/features/projects/project-list';
import { getProjects } from '@/lib/api/projects';

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { page?: string; filter?: string };
}) {
  const projects = await getProjects({
    page: Number(searchParams.page) || 1,
    filter: searchParams.filter,
  });

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Projects</h1>
      <Suspense fallback={<ProjectListSkeleton />}>
        <ProjectList projects={projects} />
      </Suspense>
    </div>
  );
}
```

#### State Management with Zustand
```typescript
// stores/project.store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ProjectStore {
  selectedProject: Project | null;
  projects: Project[];
  loading: boolean;
  
  // Actions
  selectProject: (project: Project) => void;
  fetchProjects: () => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => void;
}

export const useProjectStore = create<ProjectStore>()(
  devtools((set, get) => ({
    selectedProject: null,
    projects: [],
    loading: false,
    
    selectProject: (project) => set({ selectedProject: project }),
    
    fetchProjects: async () => {
      set({ loading: true });
      const projects = await api.projects.list();
      set({ projects, loading: false });
    },
    
    updateProject: (id, updates) => {
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      }));
    },
  }))
);
```

## Data Layer

### PostgreSQL Schema Design

```sql
-- Multi-tenant schema with RLS
CREATE SCHEMA core;
CREATE SCHEMA projects;
CREATE SCHEMA finance;

-- Enable Row Level Security
ALTER TABLE projects.projects ENABLE ROW LEVEL SECURITY;

-- Organization-based isolation
CREATE POLICY tenant_isolation ON projects.projects
  FOR ALL
  TO application_role
  USING (organization_id = current_setting('app.current_organization')::uuid);

-- Audit columns
CREATE OR REPLACE FUNCTION core.set_audit_columns()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = current_setting('app.current_user')::uuid;
  
  IF TG_OP = 'INSERT' THEN
    NEW.created_at = NOW();
    NEW.created_by = current_setting('app.current_user')::uuid;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Project Management Tables
CREATE TABLE projects.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  client_id UUID REFERENCES core.clients(id),
  status VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  budget_amount DECIMAL(15,2),
  budget_currency CHAR(3) DEFAULT 'BDT',
  
  -- CPM fields
  critical_path JSONB,
  total_float INTEGER,
  
  -- EVM fields
  planned_value DECIMAL(15,2),
  earned_value DECIMAL(15,2),
  actual_cost DECIMAL(15,2),
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID NOT NULL
);

-- Event Store for Event Sourcing
CREATE TABLE core.event_store (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL,
  stream_type VARCHAR(100) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_version INTEGER NOT NULL,
  event_data JSONB NOT NULL,
  metadata JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure event ordering
  sequence_number BIGSERIAL,
  UNIQUE(stream_id, event_version)
);

CREATE INDEX idx_event_store_stream ON core.event_store(stream_id, sequence_number);
```

### Redis Caching Strategy

```typescript
// cache/redis.service.ts
@Injectable()
export class RedisCacheService {
  private readonly redis: Redis;
  
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
      db: 0, // Sessions
    });
  }
  
  // Session management
  async setSession(sessionId: string, data: SessionData): Promise<void> {
    await this.redis.setex(
      `session:${sessionId}`,
      3600, // 1 hour TTL
      JSON.stringify(data)
    );
  }
  
  // Query result caching
  async cacheQuery<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const result = await fetchFn();
    await this.redis.setex(key, ttl, JSON.stringify(result));
    return result;
  }
  
  // Real-time data with pub/sub
  async publishProjectUpdate(projectId: string, update: any): Promise<void> {
    await this.redis.publish(
      `project:${projectId}:updates`,
      JSON.stringify(update)
    );
  }
}
```

### Apache Kafka Event Streaming

```typescript
// kafka/kafka.module.ts
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'vextrus-erp',
            brokers: ['localhost:9092'],
          },
          consumer: {
            groupId: 'vextrus-consumer',
          },
        },
      },
    ]),
  ],
  providers: [KafkaProducerService, KafkaConsumerService],
  exports: [KafkaProducerService, KafkaConsumerService],
})
export class KafkaModule {}

// Event publishing
@Injectable()
export class KafkaProducerService {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka
  ) {}
  
  async publishEvent(topic: string, event: DomainEvent): Promise<void> {
    await this.kafkaClient.emit(topic, {
      key: event.aggregateId,
      value: JSON.stringify(event),
      headers: {
        'event-type': event.type,
        'correlation-id': event.correlationId,
        'timestamp': event.timestamp.toISOString(),
      },
    });
  }
}
```

## Bangladesh Integration Layer

### RAJUK API Integration

```typescript
// external/rajuk/rajuk.service.ts
@Injectable()
export class RajukService {
  private readonly apiUrl = 'https://rajuk.ecps.gov.bd/api/v1';
  
  async submitPermitApplication(application: PermitApplication): Promise<PermitResponse> {
    const formData = new FormData();
    
    // Add application details
    formData.append('project_name', application.projectName);
    formData.append('plot_number', application.plotNumber);
    formData.append('area_sqft', application.areaSqft.toString());
    
    // Add drawings (PDF/DWG)
    application.drawings.forEach((drawing, index) => {
      formData.append(`drawing_${index}`, drawing.buffer, drawing.filename);
    });
    
    // Add compliance certificates
    formData.append('bnbc_compliance', application.bnbcCompliance);
    formData.append('dap_compliance', application.dapCompliance);
    
    const response = await axios.post(
      `${this.apiUrl}/permits/submit`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${this.getApiToken()}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  }
  
  async checkPermitStatus(applicationId: string): Promise<PermitStatus> {
    const response = await axios.get(
      `${this.apiUrl}/permits/${applicationId}/status`,
      {
        headers: {
          'Authorization': `Bearer ${this.getApiToken()}`,
        },
      }
    );
    
    return response.data;
  }
}
```

### NBR Tax Integration

```typescript
// external/nbr/nbr.service.ts
@Injectable()
export class NbrTaxService {
  private readonly apiUrl = 'https://nbr.gov.bd/api/v2';
  
  async calculateVAT(invoice: Invoice): Promise<VATCalculation> {
    const vatRate = 0.15; // 15% standard rate
    const vatableAmount = invoice.items.reduce((sum, item) => {
      if (!item.vatExempt) {
        return sum + (item.quantity * item.unitPrice);
      }
      return sum;
    }, 0);
    
    const vatAmount = vatableAmount * vatRate;
    
    return {
      vatableAmount,
      vatRate,
      vatAmount,
      totalWithVat: invoice.subtotal + vatAmount,
      vatRegistrationNumber: await this.getVatRegistration(invoice.vendorId),
    };
  }
  
  async generateAIT(payment: Payment): Promise<AITCertificate> {
    const aitRate = this.getAITRate(payment.type);
    const aitAmount = payment.amount * aitRate;
    
    // Submit to NBR
    const response = await axios.post(
      `${this.apiUrl}/ait/generate`,
      {
        tin: payment.vendorTIN,
        amount: payment.amount,
        ait_amount: aitAmount,
        payment_date: payment.date,
        payer_tin: payment.payerTIN,
      },
      {
        headers: {
          'X-API-Key': process.env.NBR_API_KEY,
        },
      }
    );
    
    return {
      certificateNumber: response.data.certificate_number,
      aitAmount,
      issueDate: new Date(),
      pdfUrl: response.data.pdf_url,
    };
  }
  
  private getAITRate(paymentType: string): number {
    const rates: Record<string, number> = {
      'contractor': 0.07,    // 7% for contractors
      'consultant': 0.10,    // 10% for consultants
      'supplier': 0.05,      // 5% for suppliers
      'transport': 0.03,     // 3% for transport
    };
    return rates[paymentType] || 0.05;
  }
}
```

### Payment Gateway Integration

```typescript
// external/payment/bkash.service.ts
@Injectable()
export class BkashPaymentService {
  private readonly apiUrl = 'https://checkout.pay.bka.sh/v1.2.0-beta';
  
  async createPayment(payment: PaymentRequest): Promise<PaymentResponse> {
    // Get token
    const token = await this.getAccessToken();
    
    // Create payment
    const response = await axios.post(
      `${this.apiUrl}/checkout/payment/create`,
      {
        mode: '0011', // Checkout
        payerReference: payment.reference,
        callbackURL: `${process.env.APP_URL}/api/payments/bkash/callback`,
        amount: payment.amount.toString(),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: payment.invoiceNumber,
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-APP-Key': process.env.BKASH_APP_KEY,
        },
      }
    );
    
    return {
      paymentId: response.data.paymentID,
      bkashURL: response.data.bkashURL,
      status: 'PENDING',
    };
  }
  
  async executePayment(paymentId: string): Promise<PaymentExecutionResult> {
    const token = await this.getAccessToken();
    
    const response = await axios.post(
      `${this.apiUrl}/checkout/payment/execute/${paymentId}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-APP-Key': process.env.BKASH_APP_KEY,
        },
      }
    );
    
    if (response.data.transactionStatus === 'Completed') {
      // Save transaction details
      await this.saveTransaction(response.data);
    }
    
    return response.data;
  }
}
```

## DevOps & Infrastructure

### Docker Configuration

```dockerfile
# Base image for Node.js services
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# Builder
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runner
FROM base AS runner
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

USER nestjs
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### Kubernetes Deployment

```yaml
# k8s/deployments/auth-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: vextrus-erp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
      - name: auth-service
        image: vextrus/auth-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: REDIS_HOST
          value: redis-service
        - name: KAFKA_BROKERS
          value: kafka-0.kafka-headless:9092
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: vextrus-erp
spec:
  selector:
    app: auth-service
  ports:
  - protocol: TCP
    port: 3000
    targetPort: 3000
  type: ClusterIP
```

## Monitoring & Observability

### Prometheus Metrics

```typescript
// monitoring/metrics.service.ts
import { Counter, Histogram, register } from 'prom-client';

@Injectable()
export class MetricsService {
  private httpRequestDuration: Histogram<string>;
  private httpRequestTotal: Counter<string>;
  private businessMetrics: Map<string, Counter<string>>;
  
  constructor() {
    // HTTP metrics
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
    });
    
    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });
    
    // Business metrics
    this.registerBusinessMetric('projects_created_total', 'Total projects created');
    this.registerBusinessMetric('invoices_processed_total', 'Total invoices processed');
    this.registerBusinessMetric('payments_received_total', 'Total payments received');
    
    register.registerMetric(this.httpRequestDuration);
    register.registerMetric(this.httpRequestTotal);
  }
  
  private registerBusinessMetric(name: string, help: string): void {
    const metric = new Counter({
      name,
      help,
      labelNames: ['organization', 'type'],
    });
    this.businessMetrics.set(name, metric);
    register.registerMetric(metric);
  }
  
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    this.httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
    this.httpRequestTotal.inc({ method, route, status_code: statusCode });
  }
  
  incrementBusinessMetric(name: string, labels: Record<string, string>): void {
    this.businessMetrics.get(name)?.inc(labels);
  }
}
```

## Security Implementation

### JWT Authentication

```typescript
// auth/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }
  
  async validate(payload: JwtPayload): Promise<UserContext> {
    const user = await this.userService.findById(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException();
    }
    
    // Check organization access
    if (payload.organizationId) {
      const hasAccess = await this.userService.hasOrganizationAccess(
        user.id,
        payload.organizationId
      );
      
      if (!hasAccess) {
        throw new ForbiddenException('No access to organization');
      }
    }
    
    return {
      userId: user.id,
      email: user.email,
      organizationId: payload.organizationId,
      roles: payload.roles,
      permissions: payload.permissions,
    };
  }
}
```

### RBAC Implementation

```typescript
// auth/rbac.guard.ts
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const request = context.switchToHttp().getRequest();
    const user = request.user as UserContext;
    
    // Check if user has any of the required roles
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// Usage in controllers
@Controller('projects')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ProjectController {
  @Post()
  @Roles('PROJECT_MANAGER', 'ADMIN')
  async createProject(@Body() dto: CreateProjectDto) {
    // Only PROJECT_MANAGER or ADMIN can create projects
  }
  
  @Get()
  @Roles('USER') // Any authenticated user can view projects
  async listProjects() {
    // List projects with organization filtering
  }
}
```

## Performance Optimization

### Database Query Optimization

```typescript
// repositories/project.repository.ts
@Injectable()
export class ProjectRepository {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly repository: Repository<ProjectEntity>,
    private readonly cacheService: RedisCacheService,
  ) {}
  
  async findWithOptimization(
    organizationId: string,
    filters: ProjectFilters
  ): Promise<Project[]> {
    const cacheKey = `projects:${organizationId}:${JSON.stringify(filters)}`;
    
    // Try cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Optimized query with selective loading
    const query = this.repository
      .createQueryBuilder('project')
      .select([
        'project.id',
        'project.name',
        'project.status',
        'project.startDate',
        'project.endDate',
        'project.budget',
      ])
      .leftJoinAndSelect('project.client', 'client')
      .where('project.organizationId = :organizationId', { organizationId });
    
    // Apply filters
    if (filters.status) {
      query.andWhere('project.status = :status', { status: filters.status });
    }
    
    if (filters.dateRange) {
      query.andWhere('project.startDate BETWEEN :start AND :end', {
        start: filters.dateRange.start,
        end: filters.dateRange.end,
      });
    }
    
    // Add indexes hint
    query.useIndex('idx_project_org_status');
    
    const results = await query.getMany();
    
    // Cache results
    await this.cacheService.set(cacheKey, results, 300); // 5 minutes
    
    return results;
  }
  
  // Batch loading for GraphQL
  async findByIdsBatch(ids: string[]): Promise<Map<string, Project>> {
    const projects = await this.repository.findByIds(ids);
    return new Map(projects.map(p => [p.id, p]));
  }
}
```

### API Response Caching

```typescript
// interceptors/cache.interceptor.ts
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  constructor(private cacheService: RedisCacheService) {}
  
  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    
    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }
    
    // Generate cache key
    const cacheKey = this.generateCacheKey(request);
    
    // Check cache
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return of(cached);
    }
    
    // Execute and cache
    return next.handle().pipe(
      tap(async (response) => {
        const ttl = this.getCacheTTL(request.url);
        await this.cacheService.set(cacheKey, response, ttl);
      })
    );
  }
  
  private generateCacheKey(request: Request): string {
    const user = request.user as UserContext;
    return `api:${user.organizationId}:${request.url}:${JSON.stringify(request.query)}`;
  }
  
  private getCacheTTL(url: string): number {
    // Different TTLs for different endpoints
    if (url.includes('/reports')) return 3600;  // 1 hour for reports
    if (url.includes('/dashboard')) return 60;   // 1 minute for dashboard
    return 300; // 5 minutes default
  }
}
```

## Conclusion

This technology stack provides a robust foundation for building Vextrus ERP with:
- **Scalability**: Microservices architecture allows independent scaling
- **Maintainability**: DDD and CQRS patterns ensure clean code organization
- **Performance**: Caching strategies and optimized queries ensure fast response times
- **Bangladesh Compliance**: Native integration with local systems
- **Security**: Multi-layered security with JWT, RBAC, and encryption
- **Observability**: Comprehensive monitoring and logging

The architecture is designed to handle enterprise-scale operations while remaining flexible enough to adapt to changing business requirements and regulatory landscapes in Bangladesh.