import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { LoadTestingService, LoadTestResults, ScenarioResult } from '../load-testing.service';
import * as fs from 'fs';

// Mock fs module
jest.mock('fs');
jest.mock('child_process');

describe('LoadTestingService', () => {
  let service: LoadTestingService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockHttpService = {
      get: jest.fn(),
      post: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
        const config: Record<string, string | number> = {
          'api.baseUrl': 'http://localhost:3006',
          'api.timeout': 30000,
          'loadTest.maxVUs': 50000,
          'loadTest.duration': '5m',
        };
        return config[key] ?? defaultValue;
      }),
    };

    // Mock fs methods
    (fs.existsSync as jest.Mock) = jest.fn().mockReturnValue(true);
    (fs.mkdirSync as jest.Mock) = jest.fn();
    (fs.writeFileSync as jest.Mock) = jest.fn();
    (fs.readFileSync as jest.Mock) = jest.fn().mockReturnValue('{}');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoadTestingService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<LoadTestingService>(LoadTestingService);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
  });

  describe('runLoadTests', () => {
    it('should execute all load test scenarios', async () => {
      // Mock all private test methods to return ScenarioResult
      const mockScenarioResult: ScenarioResult = {
        name: 'Test Scenario',
        passed: true,
        metrics: {
          virtualUsers: 1000,
          duration: '5m',
          requestsPerSecond: 100,
          responseTime: {
            p50: 50,
            p95: 95,
            p99: 150,
            avg: 60,
            min: 10,
            max: 200,
          },
          errorRate: 0.001,
          throughput: 1024000,
          dataTransferred: '1 MB',
          successfulRequests: 9990,
          failedRequests: 10,
        },
      };

      jest.spyOn(service as any, 'testConcurrentUsers').mockResolvedValue(mockScenarioResult);
      jest.spyOn(service as any, 'testAPIEndpoints').mockResolvedValue(mockScenarioResult);
      jest.spyOn(service as any, 'testDatabaseLoad').mockResolvedValue(mockScenarioResult);
      jest.spyOn(service as any, 'testEventProcessing').mockResolvedValue(mockScenarioResult);
      jest.spyOn(service as any, 'testReportGeneration').mockResolvedValue(mockScenarioResult);
      jest.spyOn(service as any, 'testBangladeshCompliance').mockResolvedValue(mockScenarioResult);
      jest.spyOn(service as any, 'testMLServices').mockResolvedValue(mockScenarioResult);
      jest.spyOn(service as any, 'testWebSocketConnections').mockResolvedValue(mockScenarioResult);
      jest.spyOn(service as any, 'testCachePerformance').mockResolvedValue(mockScenarioResult);
      jest.spyOn(service as any, 'stressTest').mockResolvedValue(mockScenarioResult);
      jest.spyOn(service as any, 'generateHTMLReport').mockResolvedValue('<html></html>');

      const result = await service.runLoadTests();

      expect(result.passed).toBe(true);
      expect(result.scenarios).toHaveLength(10);
      expect(result.metrics).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.report).toBeDefined();
    });

    it('should fail if any scenario fails', async () => {
      const passedScenario: ScenarioResult = {
        name: 'Passed Scenario',
        passed: true,
        metrics: {
          virtualUsers: 100,
          duration: '1m',
          requestsPerSecond: 50,
          responseTime: { p50: 50, p95: 95, p99: 150, avg: 60, min: 10, max: 200 },
          errorRate: 0.001,
          throughput: 1024000,
          dataTransferred: '1 MB',
          successfulRequests: 990,
          failedRequests: 10,
        },
      };

      const failedScenario: ScenarioResult = {
        name: 'Failed Scenario',
        passed: false,
        metrics: {
          virtualUsers: 100,
          duration: '1m',
          requestsPerSecond: 50,
          responseTime: { p50: 50, p95: 95, p99: 150, avg: 60, min: 10, max: 200 },
          errorRate: 0.5,
          throughput: 1024000,
          dataTransferred: '1 MB',
          successfulRequests: 500,
          failedRequests: 500,
        },
        errors: ['High error rate detected'],
      };

      jest.spyOn(service as any, 'testConcurrentUsers').mockResolvedValue(failedScenario);
      jest.spyOn(service as any, 'testAPIEndpoints').mockResolvedValue(passedScenario);
      jest.spyOn(service as any, 'testDatabaseLoad').mockResolvedValue(passedScenario);
      jest.spyOn(service as any, 'testEventProcessing').mockResolvedValue(passedScenario);
      jest.spyOn(service as any, 'testReportGeneration').mockResolvedValue(passedScenario);
      jest.spyOn(service as any, 'testBangladeshCompliance').mockResolvedValue(passedScenario);
      jest.spyOn(service as any, 'testMLServices').mockResolvedValue(passedScenario);
      jest.spyOn(service as any, 'testWebSocketConnections').mockResolvedValue(passedScenario);
      jest.spyOn(service as any, 'testCachePerformance').mockResolvedValue(passedScenario);
      jest.spyOn(service as any, 'stressTest').mockResolvedValue(passedScenario);
      jest.spyOn(service as any, 'generateHTMLReport').mockResolvedValue('<html></html>');

      const result = await service.runLoadTests();

      expect(result.passed).toBe(false);
      expect(result.scenarios.some(s => !s.passed)).toBe(true);
    });
  });

  describe('runSpecificScenario', () => {
    it('should run concurrent users scenario', async () => {
      const mockResult: ScenarioResult = {
        name: 'Concurrent Users Test',
        passed: true,
        metrics: {
          virtualUsers: 50000,
          duration: '5m',
          requestsPerSecond: 1000,
          responseTime: { p50: 50, p95: 95, p99: 150, avg: 60, min: 10, max: 200 },
          errorRate: 0.001,
          throughput: 1024000,
          dataTransferred: '1 MB',
          successfulRequests: 99900,
          failedRequests: 100,
        },
      };

      jest.spyOn(service as any, 'testConcurrentUsers').mockResolvedValue(mockResult);

      const result = await service.runSpecificScenario('concurrent-users');

      expect(result.name).toBe('Concurrent Users Test');
      expect(result.passed).toBe(true);
      expect(result.metrics.virtualUsers).toBe(50000);
    });

    it('should run API endpoints scenario', async () => {
      const mockResult: ScenarioResult = {
        name: 'API Endpoints Test',
        passed: true,
        metrics: {
          virtualUsers: 100,
          duration: '5m',
          requestsPerSecond: 100,
          responseTime: { p50: 50, p95: 95, p99: 150, avg: 60, min: 10, max: 200 },
          errorRate: 0.001,
          throughput: 1024000,
          dataTransferred: '1 MB',
          successfulRequests: 9990,
          failedRequests: 10,
        },
      };

      jest.spyOn(service as any, 'testAPIEndpoints').mockResolvedValue(mockResult);

      const result = await service.runSpecificScenario('api-endpoints');

      expect(result.name).toBe('API Endpoints Test');
      expect(result.passed).toBe(true);
    });

    it('should run database load scenario', async () => {
      const mockResult: ScenarioResult = {
        name: 'Database Load Test',
        passed: true,
        metrics: {
          virtualUsers: 500,
          duration: '5m',
          requestsPerSecond: 1000,
          responseTime: { p50: 30, p95: 75, p99: 120, avg: 40, min: 10, max: 150 },
          errorRate: 0.001,
          throughput: 2048000,
          dataTransferred: '2 MB',
          successfulRequests: 29970,
          failedRequests: 30,
        },
      };

      jest.spyOn(service as any, 'testDatabaseLoad').mockResolvedValue(mockResult);

      const result = await service.runSpecificScenario('database-load');

      expect(result.name).toBe('Database Load Test');
      expect(result.passed).toBe(true);
    });

    it('should run event processing scenario', async () => {
      const mockResult: ScenarioResult = {
        name: 'Event Processing Test',
        passed: true,
        metrics: {
          virtualUsers: 100,
          duration: '5m',
          requestsPerSecond: 200,
          responseTime: { p50: 20, p95: 50, p99: 100, avg: 30, min: 5, max: 120 },
          errorRate: 0.001,
          throughput: 512000,
          dataTransferred: '500 KB',
          successfulRequests: 9990,
          failedRequests: 10,
        },
      };

      jest.spyOn(service as any, 'testEventProcessing').mockResolvedValue(mockResult);

      const result = await service.runSpecificScenario('event-processing');

      expect(result.name).toBe('Event Processing Test');
      expect(result.passed).toBe(true);
    });

    it('should run Bangladesh compliance scenario', async () => {
      const mockResult: ScenarioResult = {
        name: 'Bangladesh Compliance Test',
        passed: true,
        metrics: {
          virtualUsers: 50,
          duration: '5m',
          requestsPerSecond: 75,
          responseTime: { p50: 30, p95: 70, p99: 120, avg: 40, min: 10, max: 150 },
          errorRate: 0.001,
          throughput: 1024000,
          dataTransferred: '1 MB',
          successfulRequests: 9990,
          failedRequests: 10,
        },
      };

      jest.spyOn(service as any, 'testBangladeshCompliance').mockResolvedValue(mockResult);

      const result = await service.runSpecificScenario('bangladesh-compliance');

      expect(result.name).toBe('Bangladesh Compliance Test');
      expect(result.passed).toBe(true);
    });

    it('should run WebSocket connections scenario', async () => {
      const mockResult: ScenarioResult = {
        name: 'WebSocket Connections Test',
        passed: true,
        metrics: {
          virtualUsers: 5000,
          duration: '5m',
          requestsPerSecond: 100,
          responseTime: { p50: 15, p95: 40, p99: 80, avg: 20, min: 5, max: 100 },
          errorRate: 0.001,
          throughput: 256000,
          dataTransferred: '250 KB',
          successfulRequests: 4995,
          failedRequests: 5,
        },
      };

      jest.spyOn(service as any, 'testWebSocketConnections').mockResolvedValue(mockResult);

      const result = await service.runSpecificScenario('websocket');

      expect(result.name).toBe('WebSocket Connections Test');
      expect(result.passed).toBe(true);
    });

    it('should run cache performance scenario', async () => {
      const mockResult: ScenarioResult = {
        name: 'Cache Performance Test',
        passed: true,
        metrics: {
          virtualUsers: 100,
          duration: '5m',
          requestsPerSecond: 500,
          responseTime: { p50: 10, p95: 30, p99: 60, avg: 15, min: 2, max: 80 },
          errorRate: 0.001,
          throughput: 512000,
          dataTransferred: '500 KB',
          successfulRequests: 9990,
          failedRequests: 10,
        },
      };

      jest.spyOn(service as any, 'testCachePerformance').mockResolvedValue(mockResult);

      const result = await service.runSpecificScenario('cache');

      expect(result.name).toBe('Cache Performance Test');
      expect(result.passed).toBe(true);
    });

    it('should run stress test scenario', async () => {
      const mockResult: ScenarioResult = {
        name: 'Stress Test',
        passed: true,
        metrics: {
          virtualUsers: 10000,
          duration: '10m',
          requestsPerSecond: 2000,
          responseTime: { p50: 100, p95: 300, p99: 500, avg: 150, min: 20, max: 1000 },
          errorRate: 0.05,
          throughput: 10240000,
          dataTransferred: '10 MB',
          successfulRequests: 95000,
          failedRequests: 5000,
        },
      };

      jest.spyOn(service as any, 'stressTest').mockResolvedValue(mockResult);

      const result = await service.runSpecificScenario('stress');

      expect(result.name).toBe('Stress Test');
      expect(result.passed).toBe(true);
    });

    it('should throw error for unknown scenario', async () => {
      await expect(service.runSpecificScenario('unknown-scenario')).rejects.toThrow('Unknown scenario: unknown-scenario');
    });
  });

  describe('Private Helper Methods', () => {
    it('should calculate percentiles correctly', () => {
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

      const p50 = service['calculatePercentile'](values, 50);
      const p95 = service['calculatePercentile'](values, 95);
      const p99 = service['calculatePercentile'](values, 99);

      expect(p50).toBeGreaterThan(0);
      expect(p95).toBeGreaterThan(p50);
      expect(p99).toBeGreaterThan(p95);
    });

    it('should calculate average correctly', () => {
      const values = [10, 20, 30, 40, 50];
      const avg = service['calculateAverage'](values);

      expect(avg).toBe(30);
    });

    it('should format bytes correctly', () => {
      expect(service['formatBytes'](0)).toBe('0 B');
      expect(service['formatBytes'](1024)).toBe('1 KB');
      expect(service['formatBytes'](1048576)).toBe('1 MB');
      expect(service['formatBytes'](1073741824)).toBe('1 GB');
    });

    it('should aggregate metrics from multiple scenarios', () => {
      const scenarios: ScenarioResult[] = [
        {
          name: 'Scenario 1',
          passed: true,
          metrics: {
            virtualUsers: 100,
            duration: '5m',
            requestsPerSecond: 100,
            responseTime: { p50: 50, p95: 95, p99: 150, avg: 60, min: 10, max: 200 },
            errorRate: 0.001,
            throughput: 1024000,
            dataTransferred: '1 MB',
            successfulRequests: 9990,
            failedRequests: 10,
          },
        },
        {
          name: 'Scenario 2',
          passed: true,
          metrics: {
            virtualUsers: 200,
            duration: '5m',
            requestsPerSecond: 200,
            responseTime: { p50: 40, p95: 85, p99: 140, avg: 50, min: 8, max: 180 },
            errorRate: 0.002,
            throughput: 2048000,
            dataTransferred: '2 MB',
            successfulRequests: 19980,
            failedRequests: 20,
          },
        },
      ];

      const aggregated = service['aggregateMetrics'](scenarios);

      expect(aggregated.totalRequests).toBe(30000);
      expect(aggregated.totalErrors).toBe(30);
      expect(aggregated.avgResponseTime).toBeGreaterThan(0);
      expect(aggregated.p95ResponseTime).toBeGreaterThan(0);
      expect(aggregated.successRate).toBeGreaterThan(99);
    });
  });

  describe('Report Generation', () => {
    it('should generate HTML report with results', async () => {
      const results: LoadTestResults = {
        scenarios: [
          {
            name: 'Test Scenario',
            passed: true,
            metrics: {
              virtualUsers: 1000,
              duration: '5m',
              requestsPerSecond: 100,
              responseTime: { p50: 50, p95: 95, p99: 150, avg: 60, min: 10, max: 200 },
              errorRate: 0.001,
              throughput: 1024000,
              dataTransferred: '1 MB',
              successfulRequests: 9990,
              failedRequests: 10,
            },
          },
        ],
        passed: true,
        metrics: {
          totalRequests: 10000,
          totalErrors: 10,
          avgResponseTime: 60,
          p95ResponseTime: 95,
          p99ResponseTime: 150,
          peakRPS: 100,
          avgRPS: 100,
          errorRate: 0.1,
          successRate: 99.9,
          totalDataTransferred: '1 MB',
        },
        timestamp: new Date(),
      };

      const report = await service['generateHTMLReport'](results);

      expect(report).toContain('<!DOCTYPE html>');
      expect(report).toContain('Load Test Report');
      expect(report).toContain('PASSED');
      expect(report).toContain('Test Scenario');
    });

    it('should save HTML report to file', async () => {
      const results: LoadTestResults = {
        scenarios: [],
        passed: true,
        metrics: {
          totalRequests: 0,
          totalErrors: 0,
          avgResponseTime: 0,
          p95ResponseTime: 0,
          p99ResponseTime: 0,
          peakRPS: 0,
          avgRPS: 0,
          errorRate: 0,
          successRate: 100,
          totalDataTransferred: '0 B',
        },
        timestamp: new Date(),
      };

      await service['generateHTMLReport'](results);

      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('K6 Script Execution', () => {
    it('should execute K6 script successfully', async () => {
      const mockK6Results = {
        vus: 100,
        iterations: 1000,
        requests: 1000,
        data_received: 1024000,
        data_sent: 512000,
        http_req_duration: {
          values: [50, 60, 70, 80, 90, 100],
        },
        http_req_failed: 0.001,
      };

      jest.spyOn(service as any, 'parseK6Output').mockReturnValue(mockK6Results);

      const result = await service['executeK6Script']('test script', 'test.js');

      expect(result).toBeDefined();
    });

    it('should handle K6 script execution errors', async () => {
      const childProcess = require('child_process');
      childProcess.exec = jest.fn((cmd: string, callback: Function) => {
        callback(new Error('K6 execution failed'), null, 'error output');
      });

      const result = await service['executeK6Script']('test script', 'test.js');

      expect(result.error).toBeDefined();
    });
  });

  describe('K6 Results Parsing', () => {
    it('should parse K6 results successfully', () => {
      const mockK6Output = {
        vus: 1000,
        duration: '5m',
        rps: 100,
        http_req_duration: {
          values: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
        },
        http_req_failed: 0.001,
        data_received: 1024000,
        requests: 10000,
      };

      const result = service['parseK6Results'](mockK6Output, 'Test Scenario');

      expect(result.name).toBe('Test Scenario');
      expect(result.metrics).toBeDefined();
      expect(result.metrics.virtualUsers).toBe(1000);
      expect(result.metrics.requestsPerSecond).toBe(100);
    });

    it('should handle empty K6 results', () => {
      const result = service['parseK6Results']({ error: 'No results' }, 'Test Scenario');

      expect(result.passed).toBe(false);
      expect(result.errors).toContain('No results');
    });
  });

  describe('Scenario Configuration', () => {
    it('should read configuration values', () => {
      expect(configService.get('api.baseUrl')).toBe('http://localhost:3006');
      expect(configService.get('loadTest.maxVUs')).toBe(50000);
    });

    it('should use default values when config not found', () => {
      expect(configService.get('nonexistent.key', 'default')).toBe('default');
    });
  });
});
