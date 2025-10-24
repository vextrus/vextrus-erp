# Phase 2B: Infrastructure Services Authentication - EXECUTION PLAN

**Date Prepared**: 2025-10-24
**For Session**: Next session (Phase 2B)
**Estimated Duration**: 2-3 days (15-20 hours)
**Priority**: P1 - HIGH (Required for production)

---

## QUICK START (Session Opening)

### 1. Verify Context (5 minutes)
```bash
# Check current branch
git status

# Verify Phase 2A checkpoint exists
cat .claude/checkpoints/checkpoint-phase2a-critical-fixes-complete.md

# Verify finance build still passes
cd services/finance && pnpm build
```

### 2. Load Key Context (10 minutes)
**Read these files first**:
1. `.claude/checkpoints/checkpoint-phase2a-critical-fixes-complete.md` - What we just completed
2. This file - Execution plan
3. Infrastructure services agent report (from Phase 2A research)

### 3. Set Up Todo List (5 minutes)
```markdown
Phase 2B Todo List:
1. Replace mock JWT guard in rules-engine service
2. Replace mock JWT guard in workflow service
3. Add JWT guard to notification service
4. Add JWT guard to import-export service
5. Add JWT guard to document-generator service
6. Create permissions table migration (organization)
7. Create role_permissions junction table
8. Create user_roles junction table
9. Implement PermissionsGuard (organization)
10. Add @RequirePermissions decorator
11. Implement validateInvoiceData activity (workflow)
12. Implement checkBudgetAvailability activity (workflow)
13. Implement validateVendorStatus activity (workflow)
14. Implement createPaymentRecord activity (workflow)
15. Implement updateGeneralLedger activity (workflow)
16. Implement notifyApprover activity (workflow)
17. Run kieran-typescript-reviewer on all changes
18. Create Phase 2B checkpoint
```

---

## PHASE 2B OBJECTIVES

### Primary Goals
1. ✅ All 7 services have REAL authentication (no mocks)
2. ✅ Organization service has working RBAC
3. ✅ Workflow service has 5-6 critical activities implemented
4. ✅ Finance invoice approval workflow functional end-to-end

### Success Criteria
- [ ] `rules-engine` service rejects unauthenticated requests
- [ ] `workflow` service rejects unauthenticated requests
- [ ] `notification`, `import-export`, `document-generator` have auth
- [ ] Organization service has `PermissionsGuard` working
- [ ] Invoice approval workflow creates real payment (not mock)
- [ ] All builds pass with zero TypeScript errors
- [ ] kieran-typescript-reviewer score ≥8.5/10

---

## EXECUTION SEQUENCE

### DAY 1 (6-8 hours): Service Authentication

#### Task 1.1: Rules Engine Auth (2-3 hours)

**Goal**: Replace mock JWT guard with real authentication

**Current State** (VULNERABLE):
```typescript
// services/rules-engine/src/auth/guards/jwt-auth.guard.ts
// TODO: Replace with proper JWT validation when auth service is integrated
request.user = {
  id: 'mock-user-id',
  email: 'user@example.com',
  organizationId: 'mock-org-id', // <-- FAKE DATA
};
return true; // Always passes
```

**Steps**:
1. Read organization service JWT guard:
   ```bash
   Read: services/organization/src/infrastructure/guards/jwt-auth.guard.ts
   ```

2. Copy pattern to rules-engine:
   ```bash
   # Create new file (or overwrite existing mock)
   Write: services/rules-engine/src/infrastructure/guards/jwt-auth.guard.ts
   ```

3. Update imports in module files:
   ```typescript
   // Find all files importing the guard
   Grep: "jwt-auth.guard" in services/rules-engine
   ```

4. Add environment variables:
   ```env
   # services/rules-engine/.env
   AUTH_SERVICE_URL=http://localhost:3001
   JWT_SECRET=your-development-jwt-secret-change-in-production
   ```

5. Build and verify:
   ```bash
   cd services/rules-engine && pnpm build
   ```

**Verification**:
- [ ] Build passes
- [ ] No TypeScript errors
- [ ] Auth guard validates real JWT tokens
- [ ] Mock user data removed

---

#### Task 1.2: Workflow Service Auth (2-3 hours)

**Goal**: Replace mock JWT guard with real authentication

**Current State** (VULNERABLE):
Same as rules-engine - mock authentication

**Steps**:
1. Copy JWT guard from organization service
2. Update workflow service module
3. Add AUTH_SERVICE_URL and JWT_SECRET to .env
4. Update all protected resolvers/controllers
5. Build and verify

**Files to Modify**:
- `services/workflow/src/infrastructure/guards/jwt-auth.guard.ts`
- `services/workflow/src/app.module.ts`
- `services/workflow/.env`

**Verification**:
- [ ] Build passes
- [ ] Authentication works with real JWT
- [ ] Unauthenticated requests rejected

---

#### Task 1.3: Supporting Services Auth (2-3 hours)

**Goal**: Add real authentication to 3 services

**Services**:
1. notification
2. import-export
3. document-generator

**For Each Service**:
1. Create `src/infrastructure/guards/jwt-auth.guard.ts`
2. Add to module providers
3. Protect resolvers/controllers with `@UseGuards(JwtAuthGuard)`
4. Add AUTH_SERVICE_URL and JWT_SECRET to .env
5. Build and verify

**Pattern** (apply to all 3):
```typescript
import { JwtAuthGuard } from '../infrastructure/guards/jwt-auth.guard';

@Resolver()
@UseGuards(JwtAuthGuard)  // <-- Add this
export class SomeResolver {
  // ...
}
```

**Verification** (for each service):
- [ ] Build passes
- [ ] Authentication configured
- [ ] Protected endpoints reject unauthenticated requests

---

### DAY 2 (6-8 hours): RBAC Implementation

#### Task 2.1: Database Migration (2 hours)

**Goal**: Create RBAC tables in organization service

**Tables to Create**:
1. `permissions` - Available permissions (e.g., "invoice:create")
2. `role_permissions` - Junction table (role → permissions)
3. `user_roles` - Junction table (user → roles)

**Migration File**:
```typescript
// services/organization/src/infrastructure/persistence/migrations/TIMESTAMP-add-rbac-tables.ts

export class AddRbacTables implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create permissions table
    await queryRunner.createTable(
      new Table({
        name: 'permissions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'resource', type: 'varchar', length: '50' },  // 'invoice', 'payment', etc.
          { name: 'action', type: 'varchar', length: '50' },    // 'create', 'read', 'update', etc.
          { name: 'description', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      })
    );

    // Unique constraint on resource:action
    await queryRunner.createIndex('permissions', new TableIndex({
      name: 'idx_permissions_resource_action',
      columnNames: ['resource', 'action'],
      isUnique: true,
    }));

    // Create role_permissions junction table
    await queryRunner.createTable(
      new Table({
        name: 'role_permissions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'role_id', type: 'uuid' },
          { name: 'permission_id', type: 'uuid' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      })
    );

    // Foreign keys
    await queryRunner.createForeignKey('role_permissions', new TableForeignKey({
      columnNames: ['role_id'],
      referencedTableName: 'roles',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('role_permissions', new TableForeignKey({
      columnNames: ['permission_id'],
      referencedTableName: 'permissions',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    // Create user_roles junction table
    await queryRunner.createTable(
      new Table({
        name: 'user_roles',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'user_id', type: 'uuid' },
          { name: 'role_id', type: 'uuid' },
          { name: 'tenant_id', type: 'varchar' },  // Tenant-scoped
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      })
    );

    // Foreign keys
    await queryRunner.createForeignKey('user_roles', new TableForeignKey({
      columnNames: ['role_id'],
      referencedTableName: 'roles',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    // Seed default permissions
    await queryRunner.query(`
      INSERT INTO permissions (resource, action, description) VALUES
      -- Invoice permissions
      ('invoice', 'create', 'Create new invoices'),
      ('invoice', 'read', 'View invoices'),
      ('invoice', 'update', 'Modify invoices'),
      ('invoice', 'delete', 'Delete invoices'),
      ('invoice', 'approve', 'Approve invoices'),
      ('invoice', 'cancel', 'Cancel invoices'),

      -- Payment permissions
      ('payment', 'create', 'Create payments'),
      ('payment', 'read', 'View payments'),
      ('payment', 'process', 'Process payments'),
      ('payment', 'reconcile', 'Reconcile payments'),
      ('payment', 'refund', 'Refund payments'),

      -- Account permissions
      ('account', 'create', 'Create chart of accounts'),
      ('account', 'read', 'View accounts'),
      ('account', 'update', 'Update accounts'),
      ('account', 'deactivate', 'Deactivate accounts'),

      -- Journal permissions
      ('journal', 'create', 'Create journal entries'),
      ('journal', 'read', 'View journal entries'),
      ('journal', 'post', 'Post journal entries'),
      ('journal', 'reverse', 'Reverse journal entries'),

      -- Finance reports
      ('finance', 'trial-balance:view', 'View trial balance'),
      ('finance', 'financial-statements:view', 'View financial statements'),
      ('finance', 'reports:export', 'Export financial reports')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_roles');
    await queryRunner.dropTable('role_permissions');
    await queryRunner.dropTable('permissions');
  }
}
```

**Steps**:
1. Create migration file
2. Run migration: `npm run migration:run`
3. Verify tables created in database

**Verification**:
- [ ] 3 tables created (permissions, role_permissions, user_roles)
- [ ] Foreign keys working
- [ ] Default permissions seeded

---

#### Task 2.2: PermissionsGuard (2-3 hours)

**Goal**: Create guard to check user permissions

**File**: `services/organization/src/infrastructure/guards/permissions.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../persistence/entities/permission.entity';
import { RolePermission } from '../persistence/entities/role-permission.entity';
import { UserRole } from '../persistence/entities/user-role.entity';

export const PERMISSIONS_KEY = 'permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    private reflector: Reflector,
    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,
    @InjectRepository(RolePermission)
    private rolePermissionRepo: Repository<RolePermission>,
    @InjectRepository(UserRole)
    private userRoleRepo: Repository<UserRole>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permissions from decorator
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permissions required
    }

    // Get user from request
    const request = this.getRequest(context);
    const user = request.user;
    const tenantId = request.tenantId;

    if (!user) {
      this.logger.warn('No user found in request - permission check failed');
      throw new ForbiddenException('Authentication required');
    }

    // Get user's roles for this tenant
    const userRoles = await this.userRoleRepo.find({
      where: { user_id: user.userId, tenant_id: tenantId },
    });

    if (userRoles.length === 0) {
      this.logger.warn(`User ${user.userId} has no roles in tenant ${tenantId}`);
      throw new ForbiddenException('No roles assigned');
    }

    const roleIds = userRoles.map(ur => ur.role_id);

    // Get permissions for these roles
    const rolePermissions = await this.rolePermissionRepo.find({
      where: roleIds.map(roleId => ({ role_id: roleId })),
      relations: ['permission'],
    });

    const userPermissions = rolePermissions.map(rp =>
      `${rp.permission.resource}:${rp.permission.action}`
    );

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every(required =>
      userPermissions.includes(required) || userPermissions.includes('*') // Admin wildcard
    );

    if (!hasAllPermissions) {
      this.logger.warn(
        `Permission denied for user ${user.userId}. ` +
        `Required: ${requiredPermissions.join(', ')}. ` +
        `Has: ${userPermissions.join(', ')}`
      );
      throw new ForbiddenException(
        `Missing permissions: ${requiredPermissions.filter(p => !userPermissions.includes(p)).join(', ')}`
      );
    }

    this.logger.debug(`Permission granted for user ${user.userId}`);
    return true;
  }

  private getRequest(context: ExecutionContext) {
    const type = context.getType();
    if (type === 'http') {
      return context.switchToHttp().getRequest();
    } else {
      const ctx = GqlExecutionContext.create(context);
      return ctx.getContext().req;
    }
  }
}
```

**Steps**:
1. Create PermissionsGuard file
2. Create entity files for Permission, RolePermission, UserRole
3. Add to module providers
4. Test permission checking

**Verification**:
- [ ] Guard compiles
- [ ] Database queries work
- [ ] Permission denied throws proper error
- [ ] Admin wildcard (*) works

---

#### Task 2.3: @RequirePermissions Decorator (30 minutes)

**File**: `services/organization/src/infrastructure/decorators/require-permissions.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY } from '../guards/permissions.guard';

/**
 * Require specific permissions to access endpoint
 *
 * @example
 * @RequirePermissions('invoice:create', 'invoice:approve')
 * async createInvoice() { ... }
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
```

**Usage in Finance Service**:
```typescript
import { RequirePermissions } from '@organization/infrastructure/decorators';

@Mutation(() => InvoiceDto)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('invoice:create')
async createInvoice(@Args('input') input: CreateInvoiceInput) {
  // ...
}
```

**Verification**:
- [ ] Decorator compiles
- [ ] Can be imported by other services
- [ ] Works with PermissionsGuard

---

### DAY 3 (8-12 hours): Workflow Activities

#### Task 3.1: validateInvoiceData (2 hours)

**Goal**: Replace mock with real database query

**Current (Mock)**:
```typescript
async validateInvoiceData(...) {
  // TODO: Implement actual database check
  const isDuplicate = Math.random() < 0.05; // <-- MOCK
}
```

**New (Real)**:
```typescript
async validateInvoiceData(params: {
  invoiceNumber: string;
  vendorId: string;
  amount: number;
  tenantId: string;
}): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Check for duplicate invoice number
  const existingInvoice = await this.financeDb.query(
    `SELECT id FROM invoices WHERE invoice_number = $1 AND tenant_id = $2`,
    [params.invoiceNumber, params.tenantId]
  );

  if (existingInvoice.length > 0) {
    errors.push(`Duplicate invoice number: ${params.invoiceNumber}`);
  }

  // Validate amount is positive
  if (params.amount <= 0) {
    errors.push('Invoice amount must be positive');
  }

  // Validate vendor exists
  const vendor = await this.masterDataClient.getVendor(params.vendorId);
  if (!vendor) {
    errors.push(`Vendor not found: ${params.vendorId}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

**Steps**:
1. Add database connection to workflow service
2. Implement real validation logic
3. Test with real invoice data
4. Handle errors gracefully

---

#### Task 3.2: checkBudgetAvailability (2-3 hours)

**Goal**: Query organization service for budget

**Current (Mock)**:
```typescript
const totalBudget = 50000000; // <-- HARDCODED
```

**New (Real)**:
```typescript
async checkBudgetAvailability(params: {
  departmentId: string;
  amount: number;
  fiscalYear: string;
  tenantId: string;
}): Promise<{ available: boolean; remainingBudget: number }> {
  // Query organization service for budget
  const budget = await this.organizationClient.getDepartmentBudget({
    departmentId: params.departmentId,
    fiscalYear: params.fiscalYear,
    tenantId: params.tenantId,
  });

  if (!budget) {
    throw new Error(`No budget found for department ${params.departmentId}`);
  }

  // Calculate spent amount
  const spent = await this.financeDb.query(
    `SELECT COALESCE(SUM(grand_total), 0) as total
     FROM invoices
     WHERE department_id = $1
       AND fiscal_year = $2
       AND tenant_id = $3
       AND status IN ('APPROVED', 'PAID')`,
    [params.departmentId, params.fiscalYear, params.tenantId]
  );

  const spentAmount = parseFloat(spent[0].total);
  const remainingBudget = budget.totalBudget - spentAmount;

  return {
    available: remainingBudget >= params.amount,
    remainingBudget,
  };
}
```

---

#### Task 3.3: createPaymentRecord (2 hours)

**Goal**: Save real payment to finance database

**Current (Mock)**:
```typescript
const paymentId = `PAY-${Date.now()}-${Math.random()...}`; // <-- MOCK
```

**New (Real)**:
```typescript
async createPaymentRecord(params: {
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  reference: string;
  tenantId: string;
  userId: string;
}): Promise<string> {
  // Call finance service GraphQL mutation
  const result = await this.financeClient.createPayment({
    invoiceId: params.invoiceId,
    amount: params.amount,
    currency: 'BDT',
    paymentMethod: params.paymentMethod,
    paymentDate: new Date().toISOString(),
    reference: params.reference,
  }, {
    headers: {
      'X-Tenant-ID': params.tenantId,
      'Authorization': `Bearer ${await this.getServiceToken()}`,
    },
  });

  this.logger.log(`Payment created: ${result.id} for invoice ${params.invoiceId}`);

  return result.id;
}
```

---

#### Task 3.4: updateGeneralLedger (2 hours)

**Goal**: Create journal entry via finance service

**Current (Mock)**:
```typescript
this.logger.debug('GL entries created:', glEntries); // <-- JUST LOGS
```

**New (Real)**:
```typescript
async updateGeneralLedger(params: {
  invoiceId: string;
  paymentId: string;
  amount: number;
  tenantId: string;
  userId: string;
}): Promise<string> {
  // Get invoice details
  const invoice = await this.financeClient.getInvoice(params.invoiceId);

  // Create journal entry via GraphQL
  const journalEntry = await this.financeClient.createJournalEntry({
    description: `Payment for Invoice ${invoice.invoiceNumber}`,
    fiscalYear: invoice.fiscalYear,
    entries: [
      {
        accountCode: '1010', // Cash/Bank
        accountName: 'Cash in Bank',
        debitAmount: params.amount,
        creditAmount: 0,
        description: `Payment received - ${invoice.invoiceNumber}`,
      },
      {
        accountCode: '1200', // Accounts Receivable
        accountName: 'Accounts Receivable',
        debitAmount: 0,
        creditAmount: params.amount,
        description: `Invoice payment - ${invoice.invoiceNumber}`,
      },
    ],
  }, {
    headers: {
      'X-Tenant-ID': params.tenantId,
      'Authorization': `Bearer ${await this.getServiceToken()}`,
    },
  });

  this.logger.log(`Journal entry created: ${journalEntry.id}`);

  return journalEntry.id;
}
```

---

#### Task 3.5: notifyApprover (1-2 hours)

**Goal**: Send real notification via notification service

**Current (Mock)**:
```typescript
// TODO: Integrate with notification service
```

**New (Real)**:
```typescript
async notifyApprover(params: {
  role: string;
  department: string;
  workflowId: string;
  amount: number;
  tenantId: string;
}): Promise<void> {
  // Get approvers with this role in department
  const approvers = await this.organizationClient.getUsersByRole({
    role: params.role,
    departmentId: params.department,
    tenantId: params.tenantId,
  });

  if (approvers.length === 0) {
    throw new Error(`No approvers found for role ${params.role} in department ${params.department}`);
  }

  // Send notification to each approver
  for (const approver of approvers) {
    await this.notificationClient.sendNotification({
      userId: approver.id,
      type: 'WORKFLOW_APPROVAL_REQUEST',
      title: 'Invoice Approval Required',
      message: `Invoice approval required for amount: ৳${params.amount.toLocaleString('en-BD')}`,
      data: {
        workflowId: params.workflowId,
        amount: params.amount,
        role: params.role,
      },
      channels: ['EMAIL', 'IN_APP'],
    });
  }

  this.logger.log(`Notified ${approvers.length} approvers for workflow ${params.workflowId}`);
}
```

---

## QUALITY GATES

### After Each Task
1. **Build Verification**
   ```bash
   cd services/<service-name> && pnpm build
   ```
   - Must pass with zero TypeScript errors

2. **Code Review**
   - Run `kieran-typescript-reviewer` on modified files
   - Fix any issues rated 7/10 or below

### End of Day 1
1. All 5 services have real authentication
2. No mock JWT guards remain
3. All builds passing

### End of Day 2
1. RBAC tables created and seeded
2. PermissionsGuard working
3. Finance service using permissions

### End of Day 3
1. 5-6 critical workflow activities implemented
2. Invoice approval workflow functional
3. No mock implementations in critical path

---

## TESTING STRATEGY

### Unit Tests (Optional - Phase 2C)
Create tests for:
- JWT guard validation
- PermissionsGuard authorization
- Workflow activities

### Integration Tests (Required)
1. **Authentication Flow**:
   - Request without JWT → 401 Unauthorized
   - Request with valid JWT → Success
   - Request with expired JWT → 401 Unauthorized

2. **RBAC Flow**:
   - User with permission → Success
   - User without permission → 403 Forbidden
   - Admin wildcard (*) → Success

3. **Workflow Flow**:
   - Create invoice → Trigger approval workflow
   - Workflow validates invoice (real data)
   - Workflow checks budget (real query)
   - Workflow creates payment (real record)
   - Workflow creates journal entry (real GL)
   - Workflow sends notification (real email)

---

## MONITORING & DEBUGGING

### Logs to Add
1. **Authentication**:
   ```typescript
   this.logger.log(`Authenticated user: ${user.id}, tenant: ${tenantId}`);
   this.logger.warn(`Authentication failed: ${error.message}`);
   ```

2. **Authorization**:
   ```typescript
   this.logger.debug(`Checking permissions: ${requiredPermissions.join(', ')}`);
   this.logger.warn(`Permission denied for user ${user.id}`);
   ```

3. **Workflow**:
   ```typescript
   this.logger.log(`Starting invoice approval workflow: ${workflowId}`);
   this.logger.log(`Activity completed: validateInvoiceData - isValid: ${result.isValid}`);
   this.logger.error(`Activity failed: ${activityName} - ${error.message}`);
   ```

---

## ROLLBACK PLAN

### If Day 1 Fails
- Revert auth changes
- Keep mock guards temporarily
- Continue with RBAC implementation
- Fix auth issues separately

### If Day 2 Fails
- RBAC not critical for Phase 2B minimum
- Can defer to Phase 2C
- Focus on workflow activities instead

### If Day 3 Fails
- Implement 2-3 activities instead of 5-6
- Minimum: validateInvoiceData, createPaymentRecord
- Defer others to Phase 2C

---

## SUCCESS METRICS

### Code Quality
- [ ] Zero TypeScript errors across all services
- [ ] kieran-typescript-reviewer score ≥8.5/10
- [ ] All imports resolved correctly

### Functionality
- [ ] Invoice approval workflow completes end-to-end
- [ ] Real payment created (not mock)
- [ ] Real journal entry created (not mock)
- [ ] Real notification sent (not logged)

### Security
- [ ] All services reject unauthenticated requests
- [ ] RBAC denies users without permissions
- [ ] No security regressions from Phase 2A

---

## CHECKPOINT PLAN

### End of Phase 2B
Create: `checkpoint-phase2b-infrastructure-auth-complete.md`

**Contents**:
1. Services with authentication (7/7)
2. RBAC implementation status
3. Workflow activities implemented (5-6/31)
4. Integration test results
5. Production readiness assessment
6. Next steps for Phase 2C

---

## RESOURCES

### Reference Files
- Organization JWT Guard: `services/organization/src/infrastructure/guards/jwt-auth.guard.ts`
- Finance PermissionsGuard (to create): Based on organization RBAC
- Workflow Invoice Approval: `services/workflow/src/workflows/invoice-approval.workflow.ts`

### Documentation
- NestJS Guards: https://docs.nestjs.com/guards
- TypeORM Migrations: https://typeorm.io/migrations
- Temporal Workflows: https://docs.temporal.io/workflows

---

**READY FOR PHASE 2B EXECUTION** ✅

Start with Task 1.1 (Rules Engine Auth) when beginning next session.
