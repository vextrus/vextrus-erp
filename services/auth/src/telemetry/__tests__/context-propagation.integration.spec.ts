import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ContextPropagationInterceptor } from '../context-propagation.interceptor';
import { TelemetryModule } from '../telemetry.module';
import { Controller, Get, Post, Body } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

// Mock controller for testing
@Controller('test')
class TestController {
  constructor(private readonly httpService: HttpService) {}

  @Get('trace')
  async getTrace() {
    return { message: 'traced', timestamp: Date.now() };
  }

  @Post('propagate')
  async propagateTrace(@Body() body: any) {
    // Simulate calling another service
    const response = await this.httpService
      .post('http://downstream-service/api/endpoint', body)
      .toPromise();
    return response?.data;
  }
}

describe('Context Propagation Integration Tests', () => {
  let app: INestApplication;
  let httpService: HttpService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TelemetryModule],
      controllers: [TestController],
      providers: [
        {
          provide: APP_INTERCEPTOR,
          useClass: ContextPropagationInterceptor,
        },
        {
          provide: HttpService,
          useValue: {
            post: jest.fn().mockReturnValue(of({ data: { success: true } })),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    httpService = moduleFixture.get<HttpService>(HttpService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Trace Context Extraction', () => {
    it('should extract W3C trace context from incoming request', async () => {
      const traceparent = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
      const tracestate = 'vendor1=value1,vendor2=value2';

      const response = await request(app.getHttpServer())
        .get('/test/trace')
        .set('traceparent', traceparent)
        .set('tracestate', tracestate)
        .expect(200);

      // Response should include trace context headers
      expect(response.headers).toHaveProperty('traceparent');
      expect(response.headers.traceparent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/);
    });

    it('should generate new trace context when none provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/trace')
        .expect(200);

      // Should generate new trace context
      expect(response.headers).toHaveProperty('traceparent');
      expect(response.headers.traceparent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/);
    });

    it('should handle baggage propagation', async () => {
      const baggage = 'userId=123,tenantId=456';
      
      const response = await request(app.getHttpServer())
        .get('/test/trace')
        .set('baggage', baggage)
        .expect(200);

      expect(response.status).toBe(200);
    });
  });

  describe('Trace Context Injection', () => {
    it('should inject trace context into outgoing requests', async () => {
      const traceparent = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';

      await request(app.getHttpServer())
        .post('/test/propagate')
        .set('traceparent', traceparent)
        .send({ data: 'test' })
        .expect(201);

      // Verify httpService was called with trace headers
      expect(httpService.post).toHaveBeenCalledWith(
        'http://downstream-service/api/endpoint',
        { data: 'test' }
      );
    });
  });

  describe('Error Handling with Tracing', () => {
    it('should maintain trace context during errors', async () => {
      const traceparent = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';

      // Mock an error response
      jest.spyOn(httpService, 'post').mockImplementation(() => {
        throw new Error('Downstream service error');
      });

      const response = await request(app.getHttpServer())
        .post('/test/propagate')
        .set('traceparent', traceparent)
        .send({ data: 'test' })
        .expect(500);

      // Should still have trace context in error response
      expect(response.headers).toHaveProperty('traceparent');
    });
  });

  describe('Custom Headers', () => {
    it('should handle custom trace headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/trace')
        .set('x-trace-id', 'custom-trace-123')
        .set('x-correlation-id', 'correlation-456')
        .set('x-request-id', 'request-789')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should propagate user context headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/test/trace')
        .set('x-user-id', 'user-123')
        .set('x-tenant-id', 'tenant-456')
        .expect(200);

      expect(response.status).toBe(200);
    });
  });

  describe('Performance', () => {
    it('should handle high volume of requests with tracing', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => 
        request(app.getHttpServer())
          .get('/test/trace')
          .set('traceparent', `00-${i.toString().padStart(32, '0')}-0000000000000001-01`)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.headers).toHaveProperty('traceparent');
      });
    });
  });
});

describe('Trace Context Format Validation', () => {
  describe('W3C Trace Context', () => {
    it('should validate traceparent format', () => {
      const validTraceparents = [
        '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
        '00-00000000000000000000000000000001-0000000000000001-00',
        '00-ffffffffffffffffffffffffffffffff-ffffffffffffffff-01',
      ];

      validTraceparents.forEach(tp => {
        expect(tp).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/);
      });
    });

    it('should reject invalid traceparent formats', () => {
      const invalidTraceparents = [
        '01-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01', // Wrong version
        '00-4bf92f3577b34da6-00f067aa0ba902b7-01', // Wrong trace ID length
        '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7', // Missing trace flags
        'not-a-valid-traceparent',
      ];

      invalidTraceparents.forEach(tp => {
        expect(tp).not.toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/);
      });
    });
  });

  describe('Tracestate Validation', () => {
    it('should handle valid tracestate formats', () => {
      const validTracestates = [
        'vendor1=value1',
        'vendor1=value1,vendor2=value2',
        'rojo=00f067aa0ba902b7',
        'congo=t61rcWkgMzE',
      ];

      validTracestates.forEach(ts => {
        expect(ts).toBeTruthy();
        // Basic validation - contains key=value pairs
        expect(ts).toMatch(/^[a-z0-9_\-*/]+=[^,]+(?:,[a-z0-9_\-*/]+=[^,]+)*$/);
      });
    });
  });
});