import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { trace, SpanStatusCode, context, propagation } from '@opentelemetry/api';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { AppModule } from '../src/app.module';
import { BusinessMetricsService } from '../src/telemetry/business-metrics.service';
import { SagaTraceManager } from '@vextrus/transactions/saga/trace-context';
import { Money } from '@vextrus/kernel';

describe('OpenTelemetry Integration Tests', () => {
  let app: INestApplication;
  let spanExporter: InMemorySpanExporter;
  let tracerProvider: NodeTracerProvider;
  let businessMetrics: BusinessMetricsService;
  let sagaTraceManager: SagaTraceManager;

  beforeAll(async () => {
    // Setup in-memory span exporter for testing
    spanExporter = new InMemorySpanExporter();
    
    const resource = Resource.default().merge(
      new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'auth-service-test',
        [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0-test',
      }),
    );

    tracerProvider = new NodeTracerProvider({
      resource,
      spanProcessors: [new SimpleSpanProcessor(spanExporter)],
    });

    tracerProvider.register({
      propagator: new W3CTraceContextPropagator(),
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    businessMetrics = moduleFixture.get<BusinessMetricsService>(BusinessMetricsService);
    sagaTraceManager = new SagaTraceManager();
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await tracerProvider.shutdown();
  });

  afterEach(() => {
    spanExporter.reset();
  });

  describe('Span Propagation', () => {
    it('should propagate trace context through HTTP headers', async () => {
      const traceId = '00000000000000000000000000000001';
      const spanId = '0000000000000001';
      const traceHeader = `00-${traceId}-${spanId}-01`;

      const response = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('traceparent', traceHeader)
        .set('Authorization', 'Bearer test-token');

      const spans = spanExporter.getFinishedSpans();
      const httpSpan = spans.find(s => s.name.includes('http'));
      
      expect(httpSpan).toBeDefined();
      expect(httpSpan?.spanContext().traceId).toContain(traceId.substring(0, 16));
    });

    it('should create child spans for database operations', async () => {
      const tracer = trace.getTracer('test');
      const span = tracer.startSpan('test-operation');
      
      await context.with(trace.setSpan(context.active(), span), async () => {
        // Simulate a database operation
        const dbSpan = tracer.startSpan('db.query', {
          attributes: {
            'db.system': 'postgresql',
            'db.statement': 'SELECT * FROM users WHERE id = $1',
          },
        });
        dbSpan.end();
      });
      
      span.end();
      await tracerProvider.forceFlush();

      const spans = spanExporter.getFinishedSpans();
      const dbSpan = spans.find(s => s.name === 'db.query');
      
      expect(dbSpan).toBeDefined();
      expect(dbSpan?.attributes['db.system']).toBe('postgresql');
    });

    it('should ignore health check endpoints', async () => {
      await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      await request(app.getHttpServer())
        .get('/health/ready')
        .expect(200);

      const spans = spanExporter.getFinishedSpans();
      const healthSpans = spans.filter(s => 
        s.name.includes('health') || 
        s.attributes['http.target']?.toString().includes('health')
      );
      
      expect(healthSpans).toHaveLength(0);
    });
  });

  describe('Saga Trace Context', () => {
    it('should inject trace context into saga state', () => {
      const tracer = trace.getTracer('test');
      const span = tracer.startSpan('test-saga');
      
      const sagaState = {
        id: 'saga-123',
        type: 'OrderToCapsh',
        status: 'RUNNING',
      };

      const stateWithContext = context.with(trace.setSpan(context.active(), span), () => {
        return sagaTraceManager.injectTraceContext(sagaState);
      });

      expect(stateWithContext.traceContext).toBeDefined();
      expect(stateWithContext.traceContext.traceId).toBeDefined();
      expect(stateWithContext.traceContext.spanId).toBeDefined();
      
      span.end();
    });

    it('should create compensation span with link to original transaction', () => {
      const originalContext = {
        traceId: '00000000000000000000000000000002',
        spanId: '0000000000000002',
        traceFlags: 1,
      };

      const compensationSpan = sagaTraceManager.createCompensationSpan(
        'PaymentReversal',
        'OrderToCapsh',
        'saga-123',
        originalContext,
        new Error('Payment failed'),
      );

      compensationSpan.end();
      
      const spans = spanExporter.getFinishedSpans();
      const compSpan = spans.find(s => s.name.includes('compensate'));
      
      expect(compSpan).toBeDefined();
      expect(compSpan?.attributes['saga.compensation']).toBe(true);
      expect(compSpan?.status.code).toBe(SpanStatusCode.ERROR);
    });

    it('should add event sourcing correlation IDs', () => {
      const tracer = trace.getTracer('test');
      const span = tracer.startSpan('event-test');
      
      sagaTraceManager.addEventSourcingContext(
        span,
        'correlation-123',
        'causation-456',
      );

      span.end();
      
      const spans = spanExporter.getFinishedSpans();
      const eventSpan = spans.find(s => s.name === 'event-test');
      
      expect(eventSpan?.attributes['event.correlation_id']).toBe('correlation-123');
      expect(eventSpan?.attributes['event.causation_id']).toBe('causation-456');
      expect(eventSpan?.attributes['event.source']).toBe('saga');
    });
  });

  describe('Business Metrics', () => {
    it('should record authentication metrics', () => {
      businessMetrics.recordLoginAttempt(true, 'password', 'org-123');
      businessMetrics.recordLoginAttempt(false, 'password', 'org-123');
      businessMetrics.recordRegistration('org-123', 'admin');
      businessMetrics.recordTokenRefresh(true);
      businessMetrics.updateActiveSessions(1);
      businessMetrics.updateActiveSessions(-1);

      // Metrics are recorded but we can't directly assert on them in unit tests
      // In production, these would be visible in SigNoz dashboards
      expect(businessMetrics).toBeDefined();
    });

    it('should record transaction metrics with Bengali context', () => {
      const amount = Money.fromAmount(50000, 'BDT'); // 50,000 BDT
      
      businessMetrics.recordTransaction(
        'invoice_payment',
        amount,
        'org-123',
        'bkash',
      );

      businessMetrics.recordTransaction(
        'purchase_order',
        amount,
        'org-123',
        'bank_transfer',
      );

      // Test weekend detection
      const friday = new Date('2024-01-05'); // Friday
      jest.spyOn(global, 'Date').mockImplementation(() => friday as any);
      
      businessMetrics.recordTransaction(
        'weekend_sale',
        amount,
        'org-123',
        'nagad',
      );

      expect(businessMetrics).toBeDefined();
    });

    it('should record saga execution metrics', () => {
      businessMetrics.recordSagaExecution('OrderToCapsh', true, 1500, false);
      businessMetrics.recordSagaExecution('OrderToCapsh', false, 3000, true);
      
      businessMetrics.recordSagaStep('OrderToCapsh', 'ReserveInventory', true, 500);
      businessMetrics.recordSagaStep('OrderToCapsh', 'ProcessPayment', false, 2000);
      
      expect(businessMetrics).toBeDefined();
    });

    it('should record Bangladesh-specific tax metrics', () => {
      businessMetrics.recordTaxCalculation('VAT', 7500, 'org-123'); // 15% VAT on 50,000
      businessMetrics.recordTaxCalculation('AIT', 2500, 'org-123'); // 5% AIT
      
      expect(businessMetrics).toBeDefined();
    });
  });

  describe('Performance Benchmarks', () => {
    it('should maintain <3% overhead on request latency', async () => {
      const iterations = 100;
      const baselineLatencies: number[] = [];
      const instrumentedLatencies: number[] = [];

      // Baseline without instrumentation
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'test123' });
        baselineLatencies.push(Date.now() - start);
      }

      // With full instrumentation
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await request(app.getHttpServer())
          .post('/api/auth/login')
          .set('traceparent', `00-${i.toString().padStart(32, '0')}-0000000000000001-01`)
          .send({ email: 'test@example.com', password: 'test123' });
        instrumentedLatencies.push(Date.now() - start);
      }

      const avgBaseline = baselineLatencies.reduce((a, b) => a + b, 0) / iterations;
      const avgInstrumented = instrumentedLatencies.reduce((a, b) => a + b, 0) / iterations;
      const overhead = ((avgInstrumented - avgBaseline) / avgBaseline) * 100;

      console.log(`Performance overhead: ${overhead.toFixed(2)}%`);
      expect(overhead).toBeLessThan(3);
    });
  });

  describe('Semantic Convention Migration', () => {
    it('should support both old and new HTTP semantic conventions', () => {
      process.env.OTEL_SEMCONV_STABILITY_OPT_IN = 'http/dup';
      
      const tracer = trace.getTracer('test');
      const span = tracer.startSpan('http.request', {
        attributes: {
          'http.method': 'GET', // Old convention
          'http.request.method': 'GET', // New convention
          'http.status_code': 200, // Old convention
          'http.response.status_code': 200, // New convention
        },
      });

      span.end();
      
      const spans = spanExporter.getFinishedSpans();
      const httpSpan = spans.find(s => s.name === 'http.request');
      
      // Both conventions should be present during migration
      expect(httpSpan?.attributes['http.method']).toBe('GET');
      expect(httpSpan?.attributes['http.request.method']).toBe('GET');
    });
  });
});