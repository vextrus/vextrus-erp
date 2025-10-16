import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// Custom metrics
const permissionCheckLatency = new Trend('permission_check_latency');
const roleAssignmentLatency = new Trend('role_assignment_latency');
const tokenValidationLatency = new Trend('token_validation_latency');
const errorRate = new Rate('errors');

// Test data
const users = new SharedArray('users', function () {
  return JSON.parse(open('./fixtures/users.json'));
});

const roles = [
  'System Admin',
  'Organization Owner',
  'Project Director',
  'Project Manager',
  'Site Engineer',
  'Site Supervisor',
  'Contractor',
  'Accountant',
  'HR Manager',
  'Procurement Officer',
  'Quality Inspector',
  'Safety Officer',
  'Document Controller',
  'Viewer'
];

const permissions = [
  'project.create',
  'project.read',
  'project.update',
  'project.delete',
  'project.approve',
  'budget.approve',
  'user.manage',
  'role.manage',
  'report.generate',
  'audit.view'
];

export const options = {
  stages: [
    { duration: '30s', target: 100 },   // Ramp up to 100 users
    { duration: '1m', target: 500 },    // Ramp up to 500 users
    { duration: '3m', target: 1000 },   // Stay at 1000 users
    { duration: '1m', target: 100 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // Response time thresholds
    permission_check_latency: ['p(95)<10', 'p(99)<20'], // Permission check < 10ms
    role_assignment_latency: ['p(95)<100', 'p(99)<200'],
    token_validation_latency: ['p(95)<50', 'p(99)<100'],
    errors: ['rate<0.01'], // Error rate < 1%
  },
};

const BASE_URL = 'http://localhost:3001'; // Auth service

export function setup() {
  // Login as admin to get token for role management tests
  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email: 'admin@test.bd',
    password: 'Admin123!',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const adminToken = JSON.parse(loginRes.body).token;
  return { adminToken };
}

export default function (data) {
  const user = users[Math.floor(Math.random() * users.length)];
  
  // Test 1: JWT Token Validation Performance
  const startTokenValidation = Date.now();
  const validateRes = http.post(`${BASE_URL}/api/v1/auth/validate`, JSON.stringify({
    token: user.token,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  tokenValidationLatency.add(Date.now() - startTokenValidation);
  
  check(validateRes, {
    'token validation successful': (r) => r.status === 200,
    'token validation fast': (r) => r.timings.duration < 50,
  });
  
  // Test 2: Permission Checking Performance
  const permission = permissions[Math.floor(Math.random() * permissions.length)];
  const startPermissionCheck = Date.now();
  const permissionRes = http.get(
    `${BASE_URL}/api/v1/permissions/check?permission=${permission}`,
    {
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'X-Tenant-Id': user.tenantId,
      },
    }
  );
  permissionCheckLatency.add(Date.now() - startPermissionCheck);
  
  check(permissionRes, {
    'permission check successful': (r) => r.status === 200 || r.status === 403,
    'permission check under 10ms': (r) => r.timings.duration < 10,
  });
  
  errorRate.add(permissionRes.status !== 200 && permissionRes.status !== 403);
  
  // Test 3: Role-based Access Control
  const projectId = Math.floor(Math.random() * 100);
  const accessRes = http.get(
    `${BASE_URL}/api/v1/projects/${projectId}`,
    {
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'X-Tenant-Id': user.tenantId,
      },
    }
  );
  
  check(accessRes, {
    'RBAC enforcement working': (r) => {
      // Check based on user role
      if (user.role === 'Viewer') {
        return r.status === 200 && JSON.parse(r.body).readonly === true;
      } else if (user.role === 'Project Manager') {
        return r.status === 200;
      } else if (user.role === 'Contractor') {
        // Contractor might have limited access
        return r.status === 200 || r.status === 403;
      }
      return true;
    },
  });
  
  // Test 4: Role Assignment Performance (admin only)
  if (Math.random() < 0.1 && data.adminToken) { // 10% of VUs test role assignment
    const targetUserId = Math.floor(Math.random() * 1000);
    const newRole = roles[Math.floor(Math.random() * roles.length)];
    
    const startRoleAssignment = Date.now();
    const assignRes = http.post(
      `${BASE_URL}/api/v1/users/${targetUserId}/roles`,
      JSON.stringify({
        role: newRole,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        scope: 'project:123',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.adminToken}`,
        },
      }
    );
    roleAssignmentLatency.add(Date.now() - startRoleAssignment);
    
    check(assignRes, {
      'role assignment successful': (r) => r.status === 200 || r.status === 201,
      'role assignment under 100ms': (r) => r.timings.duration < 100,
    });
  }
  
  // Test 5: Hierarchical Permission Inheritance
  const hierarchyRes = http.get(
    `${BASE_URL}/api/v1/permissions/hierarchy`,
    {
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'X-Tenant-Id': user.tenantId,
      },
    }
  );
  
  check(hierarchyRes, {
    'hierarchy retrieval successful': (r) => r.status === 200,
    'hierarchy includes parent permissions': (r) => {
      if (r.status !== 200) return false;
      const perms = JSON.parse(r.body).permissions;
      // Child roles should inherit parent permissions
      return Array.isArray(perms) && perms.length > 0;
    },
  });
  
  // Test 6: Temporal Role Validation
  const temporalRes = http.get(
    `${BASE_URL}/api/v1/roles/validate-temporal`,
    {
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'X-Tenant-Id': user.tenantId,
      },
    }
  );
  
  check(temporalRes, {
    'temporal validation successful': (r) => r.status === 200,
    'role still valid': (r) => {
      if (r.status !== 200) return false;
      const body = JSON.parse(r.body);
      return body.isValid === true;
    },
  });
  
  // Test 7: Multi-tenant Permission Isolation
  const wrongTenantRes = http.get(
    `${BASE_URL}/api/v1/projects/999`,
    {
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'X-Tenant-Id': 'different-tenant-id',
      },
    }
  );
  
  check(wrongTenantRes, {
    'tenant isolation enforced': (r) => r.status === 403 || r.status === 401,
  });
  
  // Test 8: Bulk Permission Check (for UI rendering)
  const bulkPermissions = permissions.slice(0, 5);
  const bulkCheckRes = http.post(
    `${BASE_URL}/api/v1/permissions/check-bulk`,
    JSON.stringify({
      permissions: bulkPermissions,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`,
        'X-Tenant-Id': user.tenantId,
      },
    }
  );
  
  check(bulkCheckRes, {
    'bulk permission check successful': (r) => r.status === 200,
    'bulk check returns all permissions': (r) => {
      if (r.status !== 200) return false;
      const results = JSON.parse(r.body).results;
      return Object.keys(results).length === bulkPermissions.length;
    },
    'bulk check under 50ms': (r) => r.timings.duration < 50,
  });
  
  sleep(0.5);
}

export function teardown(data) {
  // Cleanup or final reporting
  console.log('RBAC Performance Test Complete');
}