import http from 'k6/http';
import { check, group } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';
import sql from 'k6/x/sql';
import { SharedArray } from 'k6/data';

// Custom metrics
const queryLatency = new Trend('query_latency');
const transactionLatency = new Trend('transaction_latency');
const connectionPoolWait = new Trend('connection_pool_wait');
const deadlockRate = new Rate('deadlock_rate');
const transactionRollbacks = new Counter('transaction_rollbacks');

// Test data
const tenants = new SharedArray('tenants', function () {
  return [
    { id: 'tenant-001', name: 'Alpha Construction' },
    { id: 'tenant-002', name: 'Beta Builders' },
    { id: 'tenant-003', name: 'Gamma Group' },
    { id: 'tenant-004', name: 'Delta Developers' },
    { id: 'tenant-005', name: 'Epsilon Engineering' },
  ];
});

export const options = {
  stages: [
    { duration: '30s', target: 50 },    // Warm up
    { duration: '1m', target: 200 },    // Ramp up
    { duration: '3m', target: 500 },    // Sustained load
    { duration: '2m', target: 1000 },   // Peak load
    { duration: '1m', target: 100 },    // Ramp down
  ],
  thresholds: {
    query_latency: ['p(95)<100', 'p(99)<200'],        // Query < 100ms
    transaction_latency: ['p(95)<500', 'p(99)<1000'], // Transaction < 500ms
    connection_pool_wait: ['p(95)<50', 'p(99)<100'],  // Pool wait < 50ms
    deadlock_rate: ['rate<0.01'],                     // Deadlock rate < 1%
    http_req_duration: ['p(95)<1000'],                // Overall < 1s
  },
};

const BASE_URL = 'http://localhost:3000/api/v1';
const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'vextrus_test',
  username: 'vextrus',
  password: 'test_password',
};

// Open database connection
const db = sql.open('postgres', `${DB_CONFIG.username}:${DB_CONFIG.password}@${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`);

export default function () {
  const tenant = tenants[Math.floor(Math.random() * tenants.length)];
  
  group('Query Performance Tests', function () {
    // Test 1: Simple Query Performance
    const startSimple = Date.now();
    const simpleResult = db.exec(`
      SELECT id, name, email, created_at 
      FROM users 
      WHERE tenant_id = '${tenant.id}' 
      LIMIT 100
    `);
    queryLatency.add(Date.now() - startSimple);
    
    check(simpleResult, {
      'simple query successful': (r) => r !== null,
      'simple query returns data': (r) => r && r.length > 0,
    });
    
    // Test 2: Complex Join Query
    const startComplex = Date.now();
    const complexResult = db.exec(`
      SELECT 
        p.id, p.name, p.budget,
        u.name as manager_name,
        COUNT(t.id) as task_count,
        SUM(i.amount) as total_invoiced
      FROM projects p
      LEFT JOIN users u ON p.manager_id = u.id
      LEFT JOIN tasks t ON p.id = t.project_id
      LEFT JOIN invoices i ON p.id = i.project_id
      WHERE p.tenant_id = '${tenant.id}'
        AND p.status = 'ACTIVE'
      GROUP BY p.id, p.name, p.budget, u.name
      HAVING COUNT(t.id) > 5
      ORDER BY p.budget DESC
      LIMIT 50
    `);
    queryLatency.add(Date.now() - startComplex);
    
    check(complexResult, {
      'complex query successful': (r) => r !== null,
      'complex query under 200ms': (r) => (Date.now() - startComplex) < 200,
    });
    
    // Test 3: Aggregation Query
    const startAgg = Date.now();
    const aggResult = db.exec(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as project_count,
        SUM(budget) as total_budget,
        AVG(budget) as avg_budget,
        MAX(budget) as max_budget,
        MIN(budget) as min_budget
      FROM projects
      WHERE tenant_id = '${tenant.id}'
        AND created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
    `);
    queryLatency.add(Date.now() - startAgg);
    
    check(aggResult, {
      'aggregation query successful': (r) => r !== null,
      'aggregation returns monthly data': (r) => r && r.length <= 12,
    });
  });
  
  group('Transaction Performance Tests', function () {
    // Test 4: Multi-Table Transaction
    const startTxn = Date.now();
    let txnSuccess = false;
    
    try {
      db.exec('BEGIN');
      
      // Insert project
      const projectResult = db.exec(`
        INSERT INTO projects (id, name, budget, tenant_id, status)
        VALUES (gen_random_uuid(), 'Test Project ${Date.now()}', 1000000, '${tenant.id}', 'PENDING')
        RETURNING id
      `);
      
      const projectId = projectResult[0].id;
      
      // Insert tasks
      for (let i = 0; i < 5; i++) {
        db.exec(`
          INSERT INTO tasks (id, project_id, name, assigned_to, tenant_id)
          VALUES (gen_random_uuid(), '${projectId}', 'Task ${i}', null, '${tenant.id}')
        `);
      }
      
      // Insert audit log
      db.exec(`
        INSERT INTO audit_logs (id, entity_type, entity_id, action, tenant_id, performed_by)
        VALUES (gen_random_uuid(), 'Project', '${projectId}', 'CREATE', '${tenant.id}', 'system')
      `);
      
      db.exec('COMMIT');
      txnSuccess = true;
    } catch (error) {
      db.exec('ROLLBACK');
      transactionRollbacks.add(1);
    }
    
    transactionLatency.add(Date.now() - startTxn);
    
    check(txnSuccess, {
      'transaction completed': (s) => s === true,
      'transaction under 500ms': (s) => (Date.now() - startTxn) < 500,
    });
  });
  
  group('Connection Pool Tests', function () {
    // Test 5: Connection Pool Performance
    const startPool = Date.now();
    const poolRes = http.get(`${BASE_URL}/database/pool-status`, {
      headers: { 'X-Tenant-Id': tenant.id },
    });
    connectionPoolWait.add(Date.now() - startPool);
    
    check(poolRes, {
      'pool status retrieved': (r) => r.status === 200,
      'pool has available connections': (r) => {
        if (r.status !== 200) return false;
        const body = JSON.parse(r.body);
        return body.available > 0;
      },
      'pool wait time acceptable': (r) => {
        if (r.status !== 200) return false;
        const body = JSON.parse(r.body);
        return body.avgWaitTime < 50;
      },
    });
  });
  
  group('Index Performance Tests', function () {
    // Test 6: Index-Optimized Queries
    const queries = [
      // Primary key lookup
      {
        name: 'primary_key_lookup',
        sql: `SELECT * FROM users WHERE id = gen_random_uuid()`,
        expectedTime: 5,
      },
      // Foreign key lookup
      {
        name: 'foreign_key_lookup',
        sql: `SELECT * FROM projects WHERE manager_id = gen_random_uuid()`,
        expectedTime: 10,
      },
      // Composite index lookup
      {
        name: 'composite_index_lookup',
        sql: `SELECT * FROM audit_logs WHERE tenant_id = '${tenant.id}' AND entity_type = 'Project' AND created_at > NOW() - INTERVAL '1 day'`,
        expectedTime: 20,
      },
      // Full-text search
      {
        name: 'fulltext_search',
        sql: `SELECT * FROM projects WHERE to_tsvector('english', name || ' ' || description) @@ to_tsquery('construction & building')`,
        expectedTime: 50,
      },
    ];
    
    queries.forEach(query => {
      const start = Date.now();
      const result = db.exec(query.sql);
      const duration = Date.now() - start;
      
      check(result, {
        [`${query.name} successful`]: (r) => r !== null,
        [`${query.name} under ${query.expectedTime}ms`]: (r) => duration < query.expectedTime,
      });
      
      queryLatency.add(duration);
    });
  });
  
  group('Deadlock Detection Tests', function () {
    // Test 7: Concurrent Updates (Deadlock Simulation)
    const deadlockOccurred = false;
    
    try {
      // This might cause a deadlock with concurrent VUs
      db.exec('BEGIN');
      db.exec(`UPDATE projects SET budget = budget + 1000 WHERE id = 'project-1' AND tenant_id = '${tenant.id}'`);
      db.exec(`UPDATE tasks SET status = 'IN_PROGRESS' WHERE project_id = 'project-1' AND tenant_id = '${tenant.id}'`);
      db.exec('COMMIT');
    } catch (error) {
      if (error.message && error.message.includes('deadlock')) {
        deadlockRate.add(1);
      } else {
        deadlockRate.add(0);
      }
      db.exec('ROLLBACK');
    }
  });
  
  group('Multi-Tenant Isolation Tests', function () {
    // Test 8: Tenant Data Isolation
    const otherTenant = tenants.find(t => t.id !== tenant.id);
    
    // Try to access another tenant's data (should return empty)
    const isolationResult = db.exec(`
      SELECT COUNT(*) as count 
      FROM projects 
      WHERE tenant_id = '${otherTenant.id}'
    `);
    
    check(isolationResult, {
      'tenant isolation enforced': (r) => {
        // In a properly isolated system, this should return 0
        // unless we're explicitly allowed cross-tenant access
        return r !== null && r[0].count === 0;
      },
    });
    
    // Test row-level security
    const rlsResult = db.exec(`
      SELECT COUNT(*) as count
      FROM users
      WHERE tenant_id != '${tenant.id}'
    `);
    
    check(rlsResult, {
      'row-level security active': (r) => r !== null && r[0].count === 0,
    });
  });
  
  group('Batch Operations Tests', function () {
    // Test 9: Bulk Insert Performance
    const startBulk = Date.now();
    const values = [];
    for (let i = 0; i < 100; i++) {
      values.push(`(gen_random_uuid(), 'Item ${i}', ${1000 * i}, '${tenant.id}')`);
    }
    
    const bulkResult = db.exec(`
      INSERT INTO inventory_items (id, name, quantity, tenant_id)
      VALUES ${values.join(', ')}
      ON CONFLICT (id) DO NOTHING
    `);
    
    const bulkDuration = Date.now() - startBulk;
    
    check(bulkResult, {
      'bulk insert successful': (r) => r !== null,
      'bulk insert under 200ms for 100 records': (r) => bulkDuration < 200,
    });
    
    // Test 10: Bulk Update Performance
    const startBulkUpdate = Date.now();
    const updateResult = db.exec(`
      UPDATE inventory_items 
      SET quantity = quantity * 1.1
      WHERE tenant_id = '${tenant.id}'
        AND created_at > NOW() - INTERVAL '1 hour'
    `);
    
    check(updateResult, {
      'bulk update successful': (r) => r !== null,
      'bulk update under 100ms': (r) => (Date.now() - startBulkUpdate) < 100,
    });
  });
}

export function teardown() {
  // Close database connection
  db.close();
  
  console.log('Database Performance Test Complete');
  console.log('Check Grafana dashboard for detailed metrics');
}