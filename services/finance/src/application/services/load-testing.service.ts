import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface LoadTestResults {
  scenarios: ScenarioResult[];
  passed: boolean;
  metrics: AggregateMetrics;
  timestamp: Date;
  report?: string;
}

export interface ScenarioResult {
  name: string;
  passed: boolean;
  metrics: ScenarioMetrics;
  errors?: string[];
  details?: any;
}

export interface ScenarioMetrics {
  virtualUsers: number;
  duration: string;
  requestsPerSecond: number;
  responseTime: {
    p50: number;
    p95: number;
    p99: number;
    avg: number;
    min: number;
    max: number;
  };
  errorRate: number;
  throughput: number;
  dataTransferred: string;
  successfulRequests: number;
  failedRequests: number;
}

export interface AggregateMetrics {
  totalRequests: number;
  totalErrors: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  peakRPS: number;
  avgRPS: number;
  errorRate: number;
  successRate: number;
  totalDataTransferred: string;
}

export interface LoadTestEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  target: number; // Target RPS
  payload?: any;
  headers?: Record<string, string>;
}

export interface StressTestConfig {
  baseUrl: string;
  stages: Array<{
    duration: string;
    target: number;
  }>;
  thresholds: {
    [key: string]: string[];
  };
  scenarios: {
    [key: string]: any;
  };
}

@Injectable()
export class LoadTestingService {
  private readonly logger = new Logger(LoadTestingService.name);
  private k6ScriptsPath: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.k6ScriptsPath = path.join(process.cwd(), 'k6-scripts');
    this.ensureK6ScriptsDirectory();
  }

  async runLoadTests(): Promise<LoadTestResults> {
    this.logger.log('Starting comprehensive load tests...');
    const startTime = Date.now();

    const scenarios = [
      await this.testConcurrentUsers(),
      await this.testAPIEndpoints(),
      await this.testDatabaseLoad(),
      await this.testEventProcessing(),
      await this.testReportGeneration(),
      await this.testBangladeshCompliance(),
      await this.testMLServices(),
      await this.testWebSocketConnections(),
      await this.testCachePerformance(),
      await this.stressTest(),
    ];

    const results: LoadTestResults = {
      scenarios,
      passed: scenarios.every(s => s.passed),
      metrics: this.aggregateMetrics(scenarios),
      timestamp: new Date(),
    };

    // Generate HTML report
    results.report = await this.generateHTMLReport(results);

    const duration = Date.now() - startTime;
    this.logger.log(`Load tests completed in ${duration}ms`);

    return results;
  }

  private async testConcurrentUsers(): Promise<ScenarioResult> {
    this.logger.log('Testing concurrent users scalability...');

    const script = `
      import http from 'k6/http';
      import { check, sleep } from 'k6';
      import { Rate } from 'k6/metrics';

      const errorRate = new Rate('errors');

      export let options = {
        stages: [
          { duration: '2m', target: 100 },     // Ramp up to 100 users
          { duration: '5m', target: 1000 },    // Ramp up to 1000 users
          { duration: '10m', target: 10000 },  // Ramp up to 10000 users
          { duration: '20m', target: 50000 },  // Ramp up to 50000 users
          { duration: '10m', target: 50000 },  // Stay at 50000 users
          { duration: '5m', target: 0 },       // Ramp down
        ],
        thresholds: {
          http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% under 500ms, 99% under 1s
          http_req_failed: ['rate<0.1'],                  // Error rate under 10%
          errors: ['rate<0.1'],                            // Custom error rate under 10%
        },
      };

      const BASE_URL = '${process.env.API_URL || 'http://localhost:3006'}';

      export default function() {
        // Simulate user journey
        let response;

        // 1. Get dashboard
        response = http.get(\`\${BASE_URL}/finance/dashboard\`, {
          headers: { 'Authorization': 'Bearer \${__VU}' }, // VU-specific token
        });

        check(response, {
          'dashboard status is 200': (r) => r.status === 200,
          'dashboard response time OK': (r) => r.timings.duration < 500,
        }) || errorRate.add(1);

        sleep(1);

        // 2. Get KPIs
        response = http.get(\`\${BASE_URL}/finance/kpis\`, {
          headers: { 'Authorization': 'Bearer \${__VU}' },
        });

        check(response, {
          'kpis status is 200': (r) => r.status === 200,
          'kpis response time OK': (r) => r.timings.duration < 300,
        }) || errorRate.add(1);

        sleep(2);

        // 3. Create invoice (write operation)
        if (Math.random() < 0.1) { // 10% of users create invoices
          response = http.post(\`\${BASE_URL}/finance/invoices\`,
            JSON.stringify({
              customer_id: 'cust_' + Math.floor(Math.random() * 1000),
              amount: Math.floor(Math.random() * 10000) + 1000,
              tax_rate: 0.15,
              items: [
                {
                  description: 'Service',
                  quantity: 1,
                  unit_price: Math.floor(Math.random() * 5000),
                },
              ],
            }),
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer \${__VU}',
              },
            }
          );

          check(response, {
            'invoice creation status OK': (r) => r.status === 201 || r.status === 200,
            'invoice creation time OK': (r) => r.timings.duration < 1000,
          }) || errorRate.add(1);
        }

        sleep(Math.random() * 3 + 1);
      }

      export function handleSummary(data) {
        return {
          'concurrent-users-summary.json': JSON.stringify(data),
        };
      }
    `;

    const result = await this.executeK6Script(script, 'concurrent-users.js');
    return this.parseK6Results(result, 'Concurrent Users Test');
  }

  private async testAPIEndpoints(): Promise<ScenarioResult> {
    this.logger.log('Testing API endpoints performance...');

    const endpoints: LoadTestEndpoint[] = [
      { path: '/finance/invoices', method: 'GET', target: 100 },
      { path: '/finance/payments', method: 'GET', target: 100 },
      { path: '/finance/journal-entries', method: 'GET', target: 100 },
      { path: '/finance/chart-of-accounts', method: 'GET', target: 100 },
      { path: '/finance/reports/trial-balance', method: 'GET', target: 50 },
      { path: '/finance/reports/profit-loss', method: 'GET', target: 50 },
      { path: '/finance/reports/balance-sheet', method: 'GET', target: 50 },
      { path: '/finance/tax/calculate', method: 'POST', target: 75,
        payload: { amount: 10000, taxType: 'VAT' }
      },
      { path: '/finance/mushak/generate', method: 'POST', target: 25,
        payload: { type: 'MUSHAK_6.1', data: {} }
      },
    ];

    const script = this.generateAPITestScript(endpoints);
    const result = await this.executeK6Script(script, 'api-endpoints.js');
    return this.parseK6Results(result, 'API Endpoints Test');
  }

  private async testDatabaseLoad(): Promise<ScenarioResult> {
    this.logger.log('Testing database load handling...');

    const script = `
      import http from 'k6/http';
      import { check } from 'k6';

      export let options = {
        scenarios: {
          heavy_reads: {
            executor: 'constant-arrival-rate',
            rate: 1000,
            timeUnit: '1s',
            duration: '5m',
            preAllocatedVUs: 100,
            maxVUs: 500,
          },
          heavy_writes: {
            executor: 'constant-arrival-rate',
            rate: 100,
            timeUnit: '1s',
            duration: '5m',
            preAllocatedVUs: 50,
            maxVUs: 200,
          },
          complex_queries: {
            executor: 'constant-arrival-rate',
            rate: 10,
            timeUnit: '1s',
            duration: '5m',
            preAllocatedVUs: 10,
            maxVUs: 50,
          },
        },
        thresholds: {
          http_req_duration: ['p(95)<1000'], // 95% of requests under 1s
          http_req_failed: ['rate<0.05'],    // Error rate under 5%
        },
      };

      const BASE_URL = '${process.env.API_URL || 'http://localhost:3006'}';

      export default function() {
        const scenario = __ENV.scenario;

        if (scenario === 'heavy_reads') {
          // Heavy read operations
          const response = http.get(\`\${BASE_URL}/finance/accounts/balance\`, {
            headers: { 'Authorization': 'Bearer test' },
          });

          check(response, {
            'read status OK': (r) => r.status === 200,
            'read time acceptable': (r) => r.timings.duration < 500,
          });
        } else if (scenario === 'heavy_writes') {
          // Heavy write operations
          const response = http.post(\`\${BASE_URL}/finance/transactions\`,
            JSON.stringify({
              type: 'JOURNAL_ENTRY',
              amount: Math.random() * 10000,
              debit_account: 'ACC_' + Math.floor(Math.random() * 100),
              credit_account: 'ACC_' + Math.floor(Math.random() * 100),
              description: 'Load test transaction',
            }),
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test',
              },
            }
          );

          check(response, {
            'write status OK': (r) => r.status === 201 || r.status === 200,
            'write time acceptable': (r) => r.timings.duration < 1000,
          });
        } else {
          // Complex query operations
          const response = http.get(\`\${BASE_URL}/finance/reports/consolidated\`, {
            headers: { 'Authorization': 'Bearer test' },
          });

          check(response, {
            'complex query status OK': (r) => r.status === 200,
            'complex query time acceptable': (r) => r.timings.duration < 3000,
          });
        }
      }
    `;

    const result = await this.executeK6Script(script, 'database-load.js');
    return this.parseK6Results(result, 'Database Load Test');
  }

  private async testEventProcessing(): Promise<ScenarioResult> {
    this.logger.log('Testing event processing performance...');

    const script = `
      import http from 'k6/http';
      import { check } from 'k6';
      import { Rate } from 'k6/metrics';

      const eventProcessingRate = new Rate('event_processing_success');

      export let options = {
        scenarios: {
          event_burst: {
            executor: 'shared-iterations',
            vus: 100,
            iterations: 10000,
            maxDuration: '5m',
          },
        },
        thresholds: {
          event_processing_success: ['rate>0.99'], // 99% success rate
          http_req_duration: ['p(95)<200'],        // 95% under 200ms
        },
      };

      const BASE_URL = '${process.env.API_URL || 'http://localhost:3006'}';

      export default function() {
        const events = [
          { type: 'INVOICE_CREATED', data: { amount: 10000, customer_id: 'CUST_001' } },
          { type: 'PAYMENT_RECEIVED', data: { amount: 5000, invoice_id: 'INV_001' } },
          { type: 'EXPENSE_APPROVED', data: { amount: 3000, category: 'OFFICE' } },
          { type: 'TAX_CALCULATED', data: { amount: 1500, type: 'VAT' } },
        ];

        const event = events[Math.floor(Math.random() * events.length)];

        const response = http.post(\`\${BASE_URL}/finance/events\`,
          JSON.stringify(event),
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer test',
            },
          }
        );

        const success = check(response, {
          'event accepted': (r) => r.status === 202 || r.status === 200,
          'processing fast': (r) => r.timings.duration < 200,
        });

        eventProcessingRate.add(success ? 1 : 0);
      }
    `;

    const result = await this.executeK6Script(script, 'event-processing.js');
    return this.parseK6Results(result, 'Event Processing Test');
  }

  private async testReportGeneration(): Promise<ScenarioResult> {
    this.logger.log('Testing report generation under load...');

    const script = `
      import http from 'k6/http';
      import { check } from 'k6';

      export let options = {
        scenarios: {
          report_generation: {
            executor: 'ramping-vus',
            startVUs: 1,
            stages: [
              { duration: '2m', target: 50 },  // Ramp up to 50 concurrent report requests
              { duration: '5m', target: 50 },  // Stay at 50
              { duration: '2m', target: 0 },   // Ramp down
            ],
          },
        },
        thresholds: {
          http_req_duration: ['p(95)<10000'], // 95% under 10s for reports
          http_req_failed: ['rate<0.05'],     // Error rate under 5%
        },
      };

      const BASE_URL = '${process.env.API_URL || 'http://localhost:3006'}';

      export default function() {
        const reports = [
          'trial-balance',
          'profit-loss',
          'balance-sheet',
          'cash-flow',
          'vat-return',
          'tds-report',
          'aging-analysis',
          'financial-ratios',
        ];

        const report = reports[Math.floor(Math.random() * reports.length)];
        const params = {
          from_date: '2024-01-01',
          to_date: '2024-12-31',
          format: Math.random() > 0.5 ? 'pdf' : 'excel',
        };

        const response = http.get(
          \`\${BASE_URL}/finance/reports/\${report}?\${new URLSearchParams(params)}\`,
          {
            headers: { 'Authorization': 'Bearer test' },
            timeout: '30s',
          }
        );

        check(response, {
          'report generated': (r) => r.status === 200,
          'report size reasonable': (r) => r.body.length > 1000,
          'generation time acceptable': (r) => r.timings.duration < 10000,
        });
      }
    `;

    const result = await this.executeK6Script(script, 'report-generation.js');
    return this.parseK6Results(result, 'Report Generation Test');
  }

  private async testBangladeshCompliance(): Promise<ScenarioResult> {
    this.logger.log('Testing Bangladesh compliance features under load...');

    const script = `
      import http from 'k6/http';
      import { check } from 'k6';

      export let options = {
        scenarios: {
          vat_calculations: {
            executor: 'constant-arrival-rate',
            rate: 200,
            timeUnit: '1s',
            duration: '5m',
            preAllocatedVUs: 50,
          },
          mushak_generation: {
            executor: 'constant-arrival-rate',
            rate: 50,
            timeUnit: '1s',
            duration: '5m',
            preAllocatedVUs: 25,
          },
          nbr_submissions: {
            executor: 'constant-arrival-rate',
            rate: 10,
            timeUnit: '1s',
            duration: '5m',
            preAllocatedVUs: 10,
          },
        },
        thresholds: {
          http_req_duration: {
            'p(95)<500': ['scenario:vat_calculations'],
            'p(95)<2000': ['scenario:mushak_generation'],
            'p(95)<5000': ['scenario:nbr_submissions'],
          },
        },
      };

      const BASE_URL = '${process.env.API_URL || 'http://localhost:3006'}';

      export default function() {
        const scenario = __ITER % 3;

        if (scenario === 0) {
          // VAT calculation
          const response = http.post(\`\${BASE_URL}/finance/tax/calculate\`,
            JSON.stringify({
              amount: Math.floor(Math.random() * 100000),
              taxType: 'VAT',
              isExempt: Math.random() > 0.9,
            }),
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test',
              },
            }
          );

          check(response, {
            'VAT calculated': (r) => r.status === 200,
            'VAT correct': (r) => {
              const data = JSON.parse(r.body);
              return data.taxRate === 0.15 || data.taxAmount === 0;
            },
          });
        } else if (scenario === 1) {
          // Mushak form generation
          const mushakType = ['6.1', '6.2.1', '6.3', '6.4', '6.5', '6.6', '6.7', '9.1'];
          const response = http.post(\`\${BASE_URL}/finance/mushak/generate\`,
            JSON.stringify({
              type: 'MUSHAK_' + mushakType[Math.floor(Math.random() * mushakType.length)],
              data: {
                tin: '1234567890',
                bin: '123456789',
                amount: Math.floor(Math.random() * 100000),
              },
            }),
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test',
              },
            }
          );

          check(response, {
            'Mushak generated': (r) => r.status === 200,
            'PDF returned': (r) => r.headers['Content-Type'].includes('pdf'),
          });
        } else {
          // NBR submission
          const response = http.post(\`\${BASE_URL}/finance/nbr/submit\`,
            JSON.stringify({
              type: 'VAT_RETURN',
              period: '2024-01',
              data: {
                sales: Math.floor(Math.random() * 1000000),
                purchases: Math.floor(Math.random() * 500000),
                vat_collected: Math.floor(Math.random() * 150000),
              },
            }),
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test',
              },
            }
          );

          check(response, {
            'NBR submission accepted': (r) => r.status === 200 || r.status === 202,
          });
        }
      }
    `;

    const result = await this.executeK6Script(script, 'bangladesh-compliance.js');
    return this.parseK6Results(result, 'Bangladesh Compliance Test');
  }

  private async testMLServices(): Promise<ScenarioResult> {
    this.logger.log('Testing ML services performance...');

    const script = `
      import http from 'k6/http';
      import { check } from 'k6';

      export let options = {
        scenarios: {
          fraud_detection: {
            executor: 'constant-arrival-rate',
            rate: 100,
            timeUnit: '1s',
            duration: '5m',
            preAllocatedVUs: 30,
          },
          cash_flow_prediction: {
            executor: 'constant-arrival-rate',
            rate: 50,
            timeUnit: '1s',
            duration: '5m',
            preAllocatedVUs: 20,
          },
        },
        thresholds: {
          http_req_duration: ['p(95)<1000'], // ML predictions under 1s
        },
      };

      const BASE_URL = '${process.env.API_URL || 'http://localhost:3006'}';

      export default function() {
        const scenario = __ITER % 2;

        if (scenario === 0) {
          // Fraud detection
          const response = http.post(\`\${BASE_URL}/finance/ml/fraud-detection\`,
            JSON.stringify({
              transaction: {
                amount: Math.floor(Math.random() * 100000),
                type: ['PAYMENT', 'TRANSFER', 'WITHDRAWAL'][Math.floor(Math.random() * 3)],
                timestamp: new Date().toISOString(),
                user_id: 'USER_' + Math.floor(Math.random() * 1000),
              },
            }),
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test',
              },
            }
          );

          check(response, {
            'fraud check completed': (r) => r.status === 200,
            'risk score returned': (r) => {
              const data = JSON.parse(r.body);
              return data.riskScore >= 0 && data.riskScore <= 100;
            },
          });
        } else {
          // Cash flow prediction
          const response = http.post(\`\${BASE_URL}/finance/ml/predict-cashflow\`,
            JSON.stringify({
              historical_data: Array(30).fill(0).map((_, i) => ({
                date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
                inflow: Math.floor(Math.random() * 50000),
                outflow: Math.floor(Math.random() * 40000),
              })),
              days_ahead: 30,
            }),
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test',
              },
            }
          );

          check(response, {
            'prediction completed': (r) => r.status === 200,
            'forecast returned': (r) => {
              const data = JSON.parse(r.body);
              return Array.isArray(data.forecast) && data.forecast.length === 30;
            },
          });
        }
      }
    `;

    const result = await this.executeK6Script(script, 'ml-services.js');
    return this.parseK6Results(result, 'ML Services Test');
  }

  private async testWebSocketConnections(): Promise<ScenarioResult> {
    this.logger.log('Testing WebSocket connections for real-time updates...');

    const script = `
      import ws from 'k6/ws';
      import { check } from 'k6';

      export let options = {
        stages: [
          { duration: '2m', target: 1000 },  // Ramp up to 1000 connections
          { duration: '5m', target: 5000 },  // Ramp up to 5000 connections
          { duration: '5m', target: 5000 },  // Stay at 5000
          { duration: '2m', target: 0 },     // Ramp down
        ],
        thresholds: {
          ws_connecting: ['p(95)<1000'],     // Connection time under 1s
          ws_msgs_received: ['rate>100'],    // Receive > 100 msgs/s
        },
      };

      const WS_URL = '${process.env.WS_URL || 'ws://localhost:3006'}';

      export default function() {
        const url = \`\${WS_URL}/finance/realtime\`;
        const params = { tags: { type: 'dashboard' } };

        const response = ws.connect(url, params, function(socket) {
          socket.on('open', function() {
            // Subscribe to KPI updates
            socket.send(JSON.stringify({
              type: 'SUBSCRIBE',
              channel: 'kpi_updates',
              tenant_id: 'TENANT_' + __VU,
            }));

            // Simulate periodic pings
            socket.setInterval(function() {
              socket.send(JSON.stringify({ type: 'PING' }));
            }, 30000);
          });

          socket.on('message', function(data) {
            const message = JSON.parse(data);
            check(message, {
              'valid message format': (m) => m.type && m.timestamp,
              'KPI data received': (m) => m.type === 'KPI_UPDATE',
            });
          });

          socket.on('error', function(e) {
            console.log('WebSocket error:', e);
          });

          // Keep connection open for test duration
          socket.setTimeout(function() {
            socket.close();
          }, 60000);
        });

        check(response, {
          'WebSocket connected': (r) => r && r.status === 101,
        });
      }
    `;

    const result = await this.executeK6Script(script, 'websocket-test.js');
    return this.parseK6Results(result, 'WebSocket Connections Test');
  }

  private async testCachePerformance(): Promise<ScenarioResult> {
    this.logger.log('Testing cache performance...');

    const script = `
      import http from 'k6/http';
      import { check } from 'k6';
      import { Trend } from 'k6/metrics';

      const cacheHitTime = new Trend('cache_hit_time');
      const cacheMissTime = new Trend('cache_miss_time');

      export let options = {
        scenarios: {
          cache_test: {
            executor: 'constant-arrival-rate',
            rate: 500,
            timeUnit: '1s',
            duration: '5m',
            preAllocatedVUs: 100,
          },
        },
        thresholds: {
          cache_hit_time: ['p(95)<50'],    // Cache hits under 50ms
          cache_miss_time: ['p(95)<500'],  // Cache misses under 500ms
        },
      };

      const BASE_URL = '${process.env.API_URL || 'http://localhost:3006'}';

      export default function() {
        // 80% of requests should be cache hits (same parameters)
        const useCache = Math.random() < 0.8;
        const tenantId = useCache ? 'TENANT_001' : 'TENANT_' + Math.floor(Math.random() * 100);

        const response = http.get(\`\${BASE_URL}/finance/dashboard?tenant_id=\${tenantId}\`, {
          headers: { 'Authorization': 'Bearer test' },
        });

        const isCacheHit = response.headers['X-Cache'] === 'HIT';

        check(response, {
          'response OK': (r) => r.status === 200,
          'cache header present': (r) => r.headers['X-Cache'] !== undefined,
        });

        if (isCacheHit) {
          cacheHitTime.add(response.timings.duration);
        } else {
          cacheMissTime.add(response.timings.duration);
        }
      }
    `;

    const result = await this.executeK6Script(script, 'cache-performance.js');
    return this.parseK6Results(result, 'Cache Performance Test');
  }

  private async stressTest(): Promise<ScenarioResult> {
    this.logger.log('Running stress test to find breaking point...');

    const script = `
      import http from 'k6/http';
      import { check } from 'k6';

      export let options = {
        stages: [
          { duration: '2m', target: 100 },
          { duration: '5m', target: 500 },
          { duration: '5m', target: 1000 },
          { duration: '5m', target: 2000 },
          { duration: '5m', target: 5000 },
          { duration: '10m', target: 10000 },  // Push to breaking point
          { duration: '5m', target: 0 },
        ],
        thresholds: {
          http_req_failed: ['rate<0.5'],      // Allow up to 50% failure to find breaking point
          http_req_duration: ['p(95)<5000'],  // Allow degraded performance
        },
      };

      const BASE_URL = '${process.env.API_URL || 'http://localhost:3006'}';

      export default function() {
        const endpoints = [
          '/finance/dashboard',
          '/finance/invoices',
          '/finance/payments',
          '/finance/reports/trial-balance',
        ];

        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

        const response = http.get(\`\${BASE_URL}\${endpoint}\`, {
          headers: { 'Authorization': 'Bearer test' },
          timeout: '10s',
        });

        check(response, {
          'response received': (r) => r.status > 0,
        });
      }

      export function handleSummary(data) {
        // Find breaking point
        const stages = data.metrics.vus.values;
        let breakingPoint = 0;

        for (let i = 0; i < stages.length; i++) {
          if (data.metrics.http_req_failed.values.rate > 0.1) {
            breakingPoint = stages[i];
            break;
          }
        }

        return {
          'stress-test-summary.json': JSON.stringify({
            ...data,
            breakingPoint,
          }),
        };
      }
    `;

    const result = await this.executeK6Script(script, 'stress-test.js');
    return this.parseK6Results(result, 'Stress Test');
  }

  private generateAPITestScript(endpoints: LoadTestEndpoint[]): string {
    const endpointTests = endpoints.map(ep => `
      {
        name: '${ep.path}',
        method: '${ep.method}',
        target: ${ep.target},
        payload: ${ep.payload ? JSON.stringify(ep.payload) : 'null'},
      }
    `).join(',');

    return `
      import http from 'k6/http';
      import { check } from 'k6';

      const endpoints = [${endpointTests}];

      export let options = {
        scenarios: {},
      };

      // Create a scenario for each endpoint
      endpoints.forEach((ep, index) => {
        options.scenarios[\`endpoint_\${index}\`] = {
          executor: 'constant-arrival-rate',
          rate: ep.target,
          timeUnit: '1s',
          duration: '5m',
          preAllocatedVUs: Math.ceil(ep.target / 10),
          maxVUs: ep.target * 2,
        };
      });

      const BASE_URL = '${process.env.API_URL || 'http://localhost:3006'}';

      export default function() {
        const endpoint = endpoints[__ITER % endpoints.length];
        let response;

        if (endpoint.method === 'GET') {
          response = http.get(\`\${BASE_URL}\${endpoint.name}\`, {
            headers: { 'Authorization': 'Bearer test' },
          });
        } else {
          response = http[endpoint.method.toLowerCase()](\`\${BASE_URL}\${endpoint.name}\`,
            JSON.stringify(endpoint.payload),
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test',
              },
            }
          );
        }

        check(response, {
          'status OK': (r) => r.status === 200 || r.status === 201,
          'response time OK': (r) => r.timings.duration < 1000,
        });
      }
    `;
  }

  private async executeK6Script(script: string, filename: string): Promise<any> {
    try {
      // Write script to file
      const scriptPath = path.join(this.k6ScriptsPath, filename);
      fs.writeFileSync(scriptPath, script);

      // Execute k6
      const command = `k6 run --out json=${scriptPath}.json ${scriptPath}`;
      const { stdout, stderr } = await execAsync(command);

      if (stderr && !stderr.includes('running')) {
        this.logger.error(`k6 error: ${stderr}`);
      }

      // Read results
      const resultsPath = `${scriptPath}.json`;
      if (fs.existsSync(resultsPath)) {
        const results = fs.readFileSync(resultsPath, 'utf-8');
        return this.parseK6Output(results);
      }

      return { stdout, stderr };
    } catch (error) {
      this.logger.error(`Failed to execute k6 script: ${(error as Error).message}`);
      return { error: (error as Error).message };
    }
  }

  private parseK6Output(output: string): any {
    const lines = output.split('\n').filter(line => line.trim());
    const metrics: any = {
      vus: 0,
      iterations: 0,
      requests: 0,
      data_received: 0,
      data_sent: 0,
      http_req_duration: {},
      http_req_failed: 0,
    };

    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        if (data.type === 'Point' && data.metric === 'http_req_duration') {
          if (!metrics.http_req_duration.values) {
            metrics.http_req_duration.values = [];
          }
          metrics.http_req_duration.values.push(data.data.value);
        }
        // Add more metric parsing as needed
      } catch {
        // Skip non-JSON lines
      }
    }

    return metrics;
  }

  private parseK6Results(result: any, name: string): ScenarioResult {
    if (result.error) {
      return {
        name,
        passed: false,
        metrics: this.createEmptyMetrics(),
        errors: [result.error],
      };
    }

    const metrics: ScenarioMetrics = {
      virtualUsers: result.vus || 0,
      duration: result.duration || '0s',
      requestsPerSecond: result.rps || 0,
      responseTime: {
        p50: this.calculatePercentile(result.http_req_duration?.values || [], 50),
        p95: this.calculatePercentile(result.http_req_duration?.values || [], 95),
        p99: this.calculatePercentile(result.http_req_duration?.values || [], 99),
        avg: this.calculateAverage(result.http_req_duration?.values || []),
        min: Math.min(...(result.http_req_duration?.values || [0])),
        max: Math.max(...(result.http_req_duration?.values || [0])),
      },
      errorRate: result.http_req_failed || 0,
      throughput: result.data_received || 0,
      dataTransferred: this.formatBytes(result.data_received || 0),
      successfulRequests: result.requests - (result.requests * result.http_req_failed),
      failedRequests: result.requests * result.http_req_failed,
    };

    const passed = metrics.errorRate < 0.1 && metrics.responseTime.p95 < 1000;

    return {
      name,
      passed,
      metrics,
      details: result,
    };
  }

  private createEmptyMetrics(): ScenarioMetrics {
    return {
      virtualUsers: 0,
      duration: '0s',
      requestsPerSecond: 0,
      responseTime: {
        p50: 0,
        p95: 0,
        p99: 0,
        avg: 0,
        min: 0,
        max: 0,
      },
      errorRate: 0,
      throughput: 0,
      dataTransferred: '0 B',
      successfulRequests: 0,
      failedRequests: 0,
    };
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private formatBytes(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  private aggregateMetrics(scenarios: ScenarioResult[]): AggregateMetrics {
    let totalRequests = 0;
    let totalErrors = 0;
    let totalResponseTime = 0;
    let maxP95 = 0;
    let maxP99 = 0;
    let peakRPS = 0;
    let totalRPS = 0;
    let totalData = 0;

    for (const scenario of scenarios) {
      totalRequests += scenario.metrics.successfulRequests + scenario.metrics.failedRequests;
      totalErrors += scenario.metrics.failedRequests;
      totalResponseTime += scenario.metrics.responseTime.avg;
      maxP95 = Math.max(maxP95, scenario.metrics.responseTime.p95);
      maxP99 = Math.max(maxP99, scenario.metrics.responseTime.p99);
      peakRPS = Math.max(peakRPS, scenario.metrics.requestsPerSecond);
      totalRPS += scenario.metrics.requestsPerSecond;
      totalData += scenario.metrics.throughput;
    }

    return {
      totalRequests,
      totalErrors,
      avgResponseTime: totalResponseTime / scenarios.length,
      p95ResponseTime: maxP95,
      p99ResponseTime: maxP99,
      peakRPS,
      avgRPS: totalRPS / scenarios.length,
      errorRate: (totalErrors / totalRequests) * 100,
      successRate: ((totalRequests - totalErrors) / totalRequests) * 100,
      totalDataTransferred: this.formatBytes(totalData),
    };
  }

  private async generateHTMLReport(results: LoadTestResults): Promise<string> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Load Test Report - ${new Date().toISOString()}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { background: #007bff; color: white; padding: 20px; }
          .summary { background: #f8f9fa; padding: 15px; margin: 20px 0; }
          .scenario { border: 1px solid #dee2e6; margin: 10px 0; padding: 15px; }
          .passed { color: green; }
          .failed { color: red; }
          .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
          .metric { background: #f8f9fa; padding: 10px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; text-align: left; border: 1px solid #dee2e6; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Load Test Report</h1>
          <p>Generated: ${results.timestamp}</p>
          <p>Status: <span class="${results.passed ? 'passed' : 'failed'}">
            ${results.passed ? 'PASSED' : 'FAILED'}
          </span></p>
        </div>

        <div class="summary">
          <h2>Summary Metrics</h2>
          <div class="metrics">
            <div class="metric">
              <strong>Total Requests:</strong> ${results.metrics.totalRequests.toLocaleString()}
            </div>
            <div class="metric">
              <strong>Success Rate:</strong> ${results.metrics.successRate.toFixed(2)}%
            </div>
            <div class="metric">
              <strong>Error Rate:</strong> ${results.metrics.errorRate.toFixed(2)}%
            </div>
            <div class="metric">
              <strong>Avg Response Time:</strong> ${results.metrics.avgResponseTime.toFixed(2)}ms
            </div>
            <div class="metric">
              <strong>P95 Response Time:</strong> ${results.metrics.p95ResponseTime.toFixed(2)}ms
            </div>
            <div class="metric">
              <strong>Peak RPS:</strong> ${results.metrics.peakRPS.toFixed(2)}
            </div>
          </div>
        </div>

        <h2>Scenario Results</h2>
        ${results.scenarios.map(scenario => `
          <div class="scenario">
            <h3>${scenario.name} -
              <span class="${scenario.passed ? 'passed' : 'failed'}">
                ${scenario.passed ? 'PASSED' : 'FAILED'}
              </span>
            </h3>
            <table>
              <tr>
                <th>Virtual Users</th>
                <td>${scenario.metrics.virtualUsers}</td>
                <th>Duration</th>
                <td>${scenario.metrics.duration}</td>
              </tr>
              <tr>
                <th>Requests/sec</th>
                <td>${scenario.metrics.requestsPerSecond.toFixed(2)}</td>
                <th>Error Rate</th>
                <td>${(scenario.metrics.errorRate * 100).toFixed(2)}%</td>
              </tr>
              <tr>
                <th>P50 Response Time</th>
                <td>${scenario.metrics.responseTime.p50.toFixed(2)}ms</td>
                <th>P95 Response Time</th>
                <td>${scenario.metrics.responseTime.p95.toFixed(2)}ms</td>
              </tr>
              <tr>
                <th>Successful Requests</th>
                <td>${scenario.metrics.successfulRequests}</td>
                <th>Failed Requests</th>
                <td>${scenario.metrics.failedRequests}</td>
              </tr>
            </table>
            ${scenario.errors ? `
              <div class="errors">
                <strong>Errors:</strong>
                <ul>
                  ${scenario.errors.map(e => `<li>${e}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </body>
      </html>
    `;

    // Save report to file
    const reportPath = path.join(this.k6ScriptsPath, `report-${Date.now()}.html`);
    fs.writeFileSync(reportPath, html);
    this.logger.log(`HTML report saved to: ${reportPath}`);

    return html;
  }

  private ensureK6ScriptsDirectory(): void {
    if (!fs.existsSync(this.k6ScriptsPath)) {
      fs.mkdirSync(this.k6ScriptsPath, { recursive: true });
    }
  }

  async runSpecificScenario(scenarioName: string): Promise<ScenarioResult> {
    const scenarios: { [key: string]: () => Promise<ScenarioResult> } = {
      'concurrent-users': () => this.testConcurrentUsers(),
      'api-endpoints': () => this.testAPIEndpoints(),
      'database-load': () => this.testDatabaseLoad(),
      'event-processing': () => this.testEventProcessing(),
      'report-generation': () => this.testReportGeneration(),
      'bangladesh-compliance': () => this.testBangladeshCompliance(),
      'ml-services': () => this.testMLServices(),
      'websocket': () => this.testWebSocketConnections(),
      'cache': () => this.testCachePerformance(),
      'stress': () => this.stressTest(),
    };

    const scenario = scenarios[scenarioName];
    if (!scenario) {
      throw new Error(`Unknown scenario: ${scenarioName}`);
    }

    return scenario();
  }
}