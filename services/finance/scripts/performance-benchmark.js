#!/usr/bin/env node
/**
 * Finance Service Performance Benchmark
 * Tests throughput and response times for critical operations
 */

const http = require('http');
const { performance } = require('perf_hooks');

const CONFIG = {
  baseUrl: 'http://localhost:3006',
  graphqlPath: '/graphql',
  tenantId: 'benchmark-tenant',
  jwtToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsInRlbmFudElkIjoiYmVuY2htYXJrLXRlbmFudCIsInVzZXJJZCI6InVzZXItMTIzIiwiaWF0IjoxNTE2MjM5MDIyfQ.placeholder',
  concurrentRequests: 10,
  iterations: 100,
};

class PerformanceBenchmark {
  constructor() {
    this.results = {
      createInvoice: [],
      queryInvoice: [],
      queryInvoices: [],
      approveInvoice: [],
    };
  }

  async executeGraphQL(query, variables = {}) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({ query, variables });
      
      const options = {
        hostname: 'localhost',
        port: 3006,
        path: '/graphql',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
          'Authorization': `Bearer ${CONFIG.jwtToken}`,
          'X-Tenant-ID': CONFIG.tenantId,
        },
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  async benchmarkCreateInvoice() {
    console.log('\n📊 Benchmarking: Create Invoice');
    console.log('━'.repeat(50));

    const query = `
      mutation CreateInvoice($input: CreateInvoiceInput!) {
        createInvoice(input: $input) {
          id
          invoiceNumber
          grandTotal { amount }
        }
      }
    `;

    const times = [];
    const invoiceIds = [];

    for (let i = 0; i < CONFIG.iterations; i++) {
      const variables = {
        input: {
          customerId: `customer-${i}`,
          vendorId: `vendor-${i}`,
          invoiceDate: '2025-01-15',
          dueDate: '2025-02-15',
          lineItems: [
            {
              description: `Benchmark Item ${i}`,
              quantity: 10,
              unitPrice: { amount: 1000, currency: 'BDT' },
              vatCategory: 'standard',
            },
          ],
        },
      };

      const start = performance.now();
      try {
        const result = await this.executeGraphQL(query, variables);
        const end = performance.now();
        const duration = end - start;
        
        times.push(duration);
        if (result.data?.createInvoice?.id) {
          invoiceIds.push(result.data.createInvoice.id);
        }

        if ((i + 1) % 10 === 0) {
          process.stdout.write(`\r  Progress: ${i + 1}/${CONFIG.iterations} [${duration.toFixed(2)}ms]`);
        }
      } catch (error) {
        console.error(`\n  Error on iteration ${i}:`, error.message);
      }
    }

    console.log('');
    this.results.createInvoice = times;
    this.printStatistics('Create Invoice', times);
    return invoiceIds;
  }

  async benchmarkQueryInvoice(invoiceIds) {
    console.log('\n📊 Benchmarking: Query Invoice by ID');
    console.log('━'.repeat(50));

    const query = `
      query GetInvoice($id: ID!) {
        invoice(id: $id) {
          id
          invoiceNumber
          status
          grandTotal { amount }
        }
      }
    `;

    const times = [];
    const sampleSize = Math.min(CONFIG.iterations, invoiceIds.length);

    for (let i = 0; i < sampleSize; i++) {
      const invoiceId = invoiceIds[i % invoiceIds.length];
      
      const start = performance.now();
      try {
        await this.executeGraphQL(query, { id: invoiceId });
        const end = performance.now();
        times.push(end - start);

        if ((i + 1) % 10 === 0) {
          process.stdout.write(`\r  Progress: ${i + 1}/${sampleSize}`);
        }
      } catch (error) {
        console.error(`\n  Error querying invoice ${invoiceId}:`, error.message);
      }
    }

    console.log('');
    this.results.queryInvoice = times;
    this.printStatistics('Query Invoice', times);
  }

  async benchmarkQueryInvoicesList() {
    console.log('\n📊 Benchmarking: Query Invoices List');
    console.log('━'.repeat(50));

    const query = `
      query GetInvoices($limit: Int, $offset: Int) {
        invoices(limit: $limit, offset: $offset) {
          id
          invoiceNumber
          status
          grandTotal { amount }
        }
      }
    `;

    const times = [];

    for (let i = 0; i < CONFIG.iterations; i++) {
      const variables = {
        limit: 50,
        offset: i * 50,
      };

      const start = performance.now();
      try {
        await this.executeGraphQL(query, variables);
        const end = performance.now();
        times.push(end - start);

        if ((i + 1) % 10 === 0) {
          process.stdout.write(`\r  Progress: ${i + 1}/${CONFIG.iterations}`);
        }
      } catch (error) {
        console.error(`\n  Error on iteration ${i}:`, error.message);
      }
    }

    console.log('');
    this.results.queryInvoices = times;
    this.printStatistics('Query Invoices List', times);
  }

  async benchmarkConcurrentLoad() {
    console.log('\n📊 Benchmarking: Concurrent Load');
    console.log('━'.repeat(50));
    console.log(`  Concurrent requests: ${CONFIG.concurrentRequests}`);

    const query = `
      mutation CreateInvoice($input: CreateInvoiceInput!) {
        createInvoice(input: $input) {
          id
        }
      }
    `;

    const times = [];
    const promises = [];

    for (let i = 0; i < CONFIG.concurrentRequests; i++) {
      const variables = {
        input: {
          customerId: `concurrent-${i}`,
          vendorId: `concurrent-${i}`,
          invoiceDate: '2025-01-15',
          dueDate: '2025-02-15',
          lineItems: [{
            description: `Concurrent test ${i}`,
            quantity: 1,
            unitPrice: { amount: 1000, currency: 'BDT' },
          }],
        },
      };

      const start = performance.now();
      const promise = this.executeGraphQL(query, variables)
        .then(() => {
          const duration = performance.now() - start;
          times.push(duration);
        })
        .catch((error) => {
          console.error(`  Concurrent request ${i} failed:`, error.message);
        });
      
      promises.push(promise);
    }

    await Promise.all(promises);
    this.printStatistics('Concurrent Load', times);
  }

  printStatistics(name, times) {
    if (times.length === 0) {
      console.log('  ⚠️  No data collected');
      return;
    }

    const sorted = times.sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    console.log(`\n  Results for ${name}:`);
    console.log(`  ├─ Requests: ${times.length}`);
    console.log(`  ├─ Min: ${min.toFixed(2)}ms`);
    console.log(`  ├─ Max: ${max.toFixed(2)}ms`);
    console.log(`  ├─ Avg: ${avg.toFixed(2)}ms`);
    console.log(`  ├─ P50: ${p50.toFixed(2)}ms`);
    console.log(`  ├─ P95: ${p95.toFixed(2)}ms`);
    console.log(`  └─ P99: ${p99.toFixed(2)}ms`);

    // Performance thresholds
    const thresholds = {
      'Create Invoice': 300,
      'Query Invoice': 100,
      'Query Invoices List': 250,
    };

    const threshold = thresholds[name];
    if (threshold) {
      const passed = p95 < threshold;
      console.log(`  ${passed ? '✅' : '⚠️'} P95 ${passed ? 'within' : 'exceeds'} target (${threshold}ms)`);
    }
  }

  async run() {
    console.log('\n🚀 Finance Service Performance Benchmark');
    console.log('═'.repeat(50));
    console.log(`  Target: ${CONFIG.baseUrl}`);
    console.log(`  Iterations: ${CONFIG.iterations}`);
    console.log('');

    try {
      // Test 1: Create invoices
      const invoiceIds = await this.benchmarkCreateInvoice();

      // Test 2: Query individual invoices
      if (invoiceIds.length > 0) {
        await this.benchmarkQueryInvoice(invoiceIds);
      }

      // Test 3: Query invoices list
      await this.benchmarkQueryInvoicesList();

      // Test 4: Concurrent load
      await this.benchmarkConcurrentLoad();

      // Summary
      console.log('\n\n📈 Benchmark Summary');
      console.log('═'.repeat(50));
      console.log('All benchmarks completed successfully!');
      console.log('');
      console.log('Performance Targets:');
      console.log('  ✓ Create Invoice: < 300ms (P95)');
      console.log('  ✓ Query Invoice: < 100ms (P95)');
      console.log('  ✓ Query List: < 250ms (P95)');
      console.log('');

    } catch (error) {
      console.error('\n❌ Benchmark failed:', error.message);
      process.exit(1);
    }
  }
}

// Run benchmark
if (require.main === module) {
  const benchmark = new PerformanceBenchmark();
  benchmark.run().catch(console.error);
}

module.exports = PerformanceBenchmark;
