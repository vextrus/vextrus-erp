import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';

// Test data
const testTenant = {
  id: 'test-tenant-' + Date.now(),
  name: 'Test Construction Ltd',
  subdomain: 'test-const',
};

const testUsers = {
  admin: {
    email: 'admin@testconst.bd',
    password: 'Admin123!@#',
    role: 'System Admin',
  },
  projectManager: {
    email: 'pm@testconst.bd',
    password: 'PM123!@#',
    role: 'Project Manager',
  },
  siteEngineer: {
    email: 'engineer@testconst.bd',
    password: 'Eng123!@#',
    role: 'Site Engineer',
  },
  viewer: {
    email: 'viewer@testconst.bd',
    password: 'View123!@#',
    role: 'Viewer',
  },
};

test.describe('RBAC Flow - Complete Permission System', () => {
  let adminPage: Page;
  let userPage: Page;

  test.beforeAll(async ({ browser }) => {
    // Setup admin context
    const adminContext = await browser.newContext();
    adminPage = await adminContext.newPage();
    
    // Setup user context
    const userContext = await browser.newContext();
    userPage = await userContext.newPage();
  });

  test('Complete RBAC flow: login → role assignment → permission check → action', async () => {
    // Step 1: Admin login
    await adminPage.goto('/login');
    await adminPage.fill('[data-testid="email-input"]', testUsers.admin.email);
    await adminPage.fill('[data-testid="password-input"]', testUsers.admin.password);
    await adminPage.click('[data-testid="login-button"]');
    
    // Verify admin dashboard
    await expect(adminPage).toHaveURL('/dashboard');
    await expect(adminPage.locator('[data-testid="user-role"]')).toContainText('System Admin');

    // Step 2: Create new user with Project Manager role
    await adminPage.goto('/users/create');
    await adminPage.fill('[data-testid="user-email"]', testUsers.projectManager.email);
    await adminPage.fill('[data-testid="user-name"]', 'Test Project Manager');
    await adminPage.fill('[data-testid="user-phone"]', '+8801712345678');
    await adminPage.selectOption('[data-testid="user-role"]', 'Project Manager');
    
    // Set role validity period
    await adminPage.fill('[data-testid="role-valid-from"]', '2025-01-01');
    await adminPage.fill('[data-testid="role-valid-until"]', '2025-12-31');
    
    // Assign to specific project
    await adminPage.check('[data-testid="project-dhaka-metro"]');
    await adminPage.click('[data-testid="create-user-button"]');
    
    // Verify user created
    await expect(adminPage.locator('[data-testid="success-message"]')).toContainText('User created successfully');

    // Step 3: Login as Project Manager
    await userPage.goto('/login');
    await userPage.fill('[data-testid="email-input"]', testUsers.projectManager.email);
    await userPage.fill('[data-testid="password-input"]', testUsers.projectManager.password);
    await userPage.click('[data-testid="login-button"]');
    
    // Verify Project Manager dashboard
    await expect(userPage).toHaveURL('/dashboard');
    await expect(userPage.locator('[data-testid="user-role"]')).toContainText('Project Manager');

    // Step 4: Test Project Manager permissions
    // Can create project
    await userPage.goto('/projects/create');
    await userPage.fill('[data-testid="project-name"]', 'New Bridge Construction');
    await userPage.fill('[data-testid="project-budget"]', '50000000'); // 50M BDT
    await userPage.selectOption('[data-testid="project-type"]', 'Infrastructure');
    await userPage.click('[data-testid="create-project-button"]');
    await expect(userPage.locator('[data-testid="success-message"]')).toContainText('Project created');

    // Can approve budget up to limit
    await userPage.goto('/projects/1/budget');
    await userPage.fill('[data-testid="budget-amount"]', '10000000'); // 10M BDT
    await userPage.click('[data-testid="approve-budget-button"]');
    await expect(userPage.locator('[data-testid="success-message"]')).toContainText('Budget approved');

    // Cannot approve beyond limit
    await userPage.fill('[data-testid="budget-amount"]', '60000000'); // 60M BDT
    await userPage.click('[data-testid="approve-budget-button"]');
    await expect(userPage.locator('[data-testid="error-message"]')).toContainText('Insufficient permission');

    // Step 5: Test role-based UI elements
    // Project Manager should see these buttons
    await expect(userPage.locator('[data-testid="create-task-button"]')).toBeVisible();
    await expect(userPage.locator('[data-testid="assign-team-button"]')).toBeVisible();
    await expect(userPage.locator('[data-testid="generate-report-button"]')).toBeVisible();
    
    // But not these (admin only)
    await expect(userPage.locator('[data-testid="delete-project-button"]')).not.toBeVisible();
    await expect(userPage.locator('[data-testid="system-settings-button"]')).not.toBeVisible();

    // Step 6: Test Viewer restrictions
    await userPage.goto('/logout');
    await userPage.goto('/login');
    await userPage.fill('[data-testid="email-input"]', testUsers.viewer.email);
    await userPage.fill('[data-testid="password-input"]', testUsers.viewer.password);
    await userPage.click('[data-testid="login-button"]');
    
    // Viewer can only read
    await userPage.goto('/projects');
    await expect(userPage.locator('[data-testid="project-list"]')).toBeVisible();
    await expect(userPage.locator('[data-testid="create-project-button"]')).not.toBeVisible();
    await expect(userPage.locator('[data-testid="edit-button"]')).not.toBeVisible();
    await expect(userPage.locator('[data-testid="delete-button"]')).not.toBeVisible();
  });

  test('Bangladesh-specific role permissions', async () => {
    // Login as admin
    await adminPage.goto('/login');
    await adminPage.fill('[data-testid="email-input"]', testUsers.admin.email);
    await adminPage.fill('[data-testid="password-input"]', testUsers.admin.password);
    await adminPage.click('[data-testid="login-button"]');

    // Test RAJUK compliance officer permissions
    await adminPage.goto('/users/create');
    await adminPage.fill('[data-testid="user-email"]', 'rajuk@testconst.bd');
    await adminPage.selectOption('[data-testid="user-role"]', 'Compliance Officer');
    
    // Assign RAJUK-specific permissions
    await adminPage.check('[data-testid="permission-rajuk-submission"]');
    await adminPage.check('[data-testid="permission-building-approval"]');
    await adminPage.check('[data-testid="permission-land-clearance"]');
    await adminPage.click('[data-testid="create-user-button"]');

    // Test NBR tax permissions
    await adminPage.goto('/roles/accountant/permissions');
    await adminPage.check('[data-testid="permission-nbr-filing"]');
    await adminPage.check('[data-testid="permission-vat-submission"]');
    await adminPage.check('[data-testid="permission-tax-certificate"]');
    await adminPage.click('[data-testid="save-permissions"]');
    
    await expect(adminPage.locator('[data-testid="success-message"]')).toContainText('Permissions updated');
  });

  test('Temporal role assignments', async () => {
    // Create contractor with time-limited access
    await adminPage.goto('/users/create');
    await adminPage.fill('[data-testid="user-email"]', 'contractor@external.bd');
    await adminPage.selectOption('[data-testid="user-role"]', 'Contractor');
    
    // Set 30-day project access
    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    await adminPage.fill('[data-testid="role-valid-from"]', today.toISOString().split('T')[0]);
    await adminPage.fill('[data-testid="role-valid-until"]', thirtyDaysLater.toISOString().split('T')[0]);
    await adminPage.selectOption('[data-testid="project-scope"]', 'Dhaka Metro Phase 2');
    await adminPage.click('[data-testid="create-user-button"]');

    // Verify temporal access
    await adminPage.goto('/users/contractor@external.bd');
    await expect(adminPage.locator('[data-testid="access-status"]')).toContainText('Active');
    await expect(adminPage.locator('[data-testid="expires-in"]')).toContainText('30 days');
  });

  test('Multi-tenant role isolation', async () => {
    const tenant1Context = await test.browser!.newContext();
    const tenant1Page = await tenant1Context.newPage();
    
    const tenant2Context = await test.browser!.newContext();
    const tenant2Page = await tenant2Context.newPage();

    // Tenant 1 admin creates role
    await tenant1Page.goto('https://tenant1.vextrus.com/login');
    await tenant1Page.fill('[data-testid="email-input"]', 'admin@tenant1.bd');
    await tenant1Page.fill('[data-testid="password-input"]', 'Admin123!');
    await tenant1Page.click('[data-testid="login-button"]');
    
    await tenant1Page.goto('/roles/create');
    await tenant1Page.fill('[data-testid="role-name"]', 'Custom Manager');
    await tenant1Page.click('[data-testid="create-role-button"]');

    // Tenant 2 admin cannot see Tenant 1's role
    await tenant2Page.goto('https://tenant2.vextrus.com/login');
    await tenant2Page.fill('[data-testid="email-input"]', 'admin@tenant2.bd');
    await tenant2Page.fill('[data-testid="password-input"]', 'Admin456!');
    await tenant2Page.click('[data-testid="login-button"]');
    
    await tenant2Page.goto('/roles');
    await expect(tenant2Page.locator('text=Custom Manager')).not.toBeVisible();
    
    // Verify each tenant only sees their own roles
    const tenant1Roles = await tenant1Page.locator('[data-testid="role-list"] > li').count();
    const tenant2Roles = await tenant2Page.locator('[data-testid="role-list"] > li').count();
    
    expect(tenant1Roles).toBeGreaterThan(0);
    expect(tenant2Roles).toBeGreaterThan(0);
  });

  test('Permission checking performance', async () => {
    // Login with complex permission set
    await userPage.goto('/login');
    await userPage.fill('[data-testid="email-input"]', testUsers.projectManager.email);
    await userPage.fill('[data-testid="password-input"]', testUsers.projectManager.password);
    await userPage.click('[data-testid="login-button"]');

    // Measure permission check time
    const startTime = Date.now();
    
    // Navigate to permission-heavy page
    await userPage.goto('/projects/1/detailed-view');
    
    // Wait for all permission-based UI elements to render
    await userPage.waitForSelector('[data-testid="permissions-loaded"]');
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    // Permission checking should be < 10ms (target)
    expect(loadTime).toBeLessThan(1000); // Total page load < 1s
    
    // Check console for permission check metrics
    const metrics = await userPage.evaluate(() => {
      return (window as any).__PERMISSION_METRICS__;
    });
    
    expect(metrics.averageCheckTime).toBeLessThan(10); // Each check < 10ms
    expect(metrics.totalChecks).toBeGreaterThan(0);
  });

  test('Role delegation workflow', async () => {
    // Project Manager delegates to Site Engineer
    await userPage.goto('/delegation/create');
    await userPage.fill('[data-testid="delegate-to"]', testUsers.siteEngineer.email);
    await userPage.selectOption('[data-testid="delegate-permission"]', 'approve_material_requisition');
    await userPage.fill('[data-testid="delegation-start"]', '2025-01-10');
    await userPage.fill('[data-testid="delegation-end"]', '2025-01-15');
    await userPage.fill('[data-testid="delegation-reason"]', 'On leave for 5 days');
    await userPage.click('[data-testid="delegate-button"]');
    
    await expect(userPage.locator('[data-testid="success-message"]')).toContainText('Delegation created');

    // Verify Site Engineer has temporary permission
    const engineerContext = await test.browser!.newContext();
    const engineerPage = await engineerContext.newPage();
    
    await engineerPage.goto('/login');
    await engineerPage.fill('[data-testid="email-input"]', testUsers.siteEngineer.email);
    await engineerPage.fill('[data-testid="password-input"]', testUsers.siteEngineer.password);
    await engineerPage.click('[data-testid="login-button"]');
    
    await engineerPage.goto('/requisitions');
    await expect(engineerPage.locator('[data-testid="approve-button"]')).toBeVisible();
    await expect(engineerPage.locator('[data-testid="delegation-badge"]')).toContainText('Delegated');
  });
});