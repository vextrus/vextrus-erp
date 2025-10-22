# RBAC Patterns (Role-Based Access Control)

**Source**: Security First Skill
**Purpose**: Implement role-based authorization in Vextrus ERP

---

## Permission Structure

### Format: `resource:action`

```typescript
const PERMISSIONS = {
  // Invoice permissions
  'invoice:read': 'Read invoices',
  'invoice:create': 'Create invoices',
  'invoice:update': 'Update invoices',
  'invoice:delete': 'Delete invoices',
  'invoice:approve': 'Approve invoices',

  // Financial permissions
  'finance:read': 'View financial reports',
  'finance:manage': 'Manage financial settings',

  // Admin permissions
  'admin:*': 'Full admin access',
};
```

**Wildcards**:
- `invoice:*` → All invoice permissions
- `admin:*` → All permissions

---

## Role to Permission Mapping

```typescript
const ROLES = {
  accountant: ['invoice:read', 'invoice:create', 'finance:read'],
  manager: ['invoice:*', 'finance:read'],
  admin: ['admin:*'],
};
```

---

## RBAC Guard Implementation

```typescript
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Get required permissions from decorator
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions) {
      return true; // No permissions required
    }

    // 2. Get authenticated user from request
    const request = this.getRequest(context);
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // 3. Check if user has all required permissions
    return this.hasPermissions(user, requiredPermissions);
  }

  private hasPermissions(user: JwtPayload, required: string[]): boolean {
    // Admin wildcard - bypass all checks
    if (user.permissions.includes('admin:*')) {
      return true;
    }

    // Check each required permission
    return required.every(permission => {
      return user.permissions.some(userPerm => {
        // Exact match
        if (userPerm === permission) return true;

        // Wildcard match (e.g., 'invoice:*' matches 'invoice:read')
        const [resource] = permission.split(':');
        return userPerm === `${resource}:*`;
      });
    });
  }
}
```

---

## Permissions Decorator

```typescript
import { SetMetadata } from '@nestjs/common';

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);
```

---

## Usage Examples

### Single Permission
```typescript
@Mutation(() => InvoicePayload)
@UseGuards(JwtAuthGuard, RbacGuard)
@RequirePermissions('invoice:create')
async createInvoice(@Args('input') input: CreateInvoiceInput) {
  // Only users with 'invoice:create' permission
}
```

### Multiple Permissions (ALL required)
```typescript
@Mutation(() => InvoicePayload)
@UseGuards(JwtAuthGuard, RbacGuard)
@RequirePermissions('invoice:approve', 'finance:manage')
async approveInvoice(@Args('id') id: string) {
  // User needs BOTH permissions
}
```

### Wildcard Permission
```typescript
@Mutation(() => InvoicePayload)
@UseGuards(JwtAuthGuard, RbacGuard)
@RequirePermissions('invoice:delete')
async deleteInvoice(@Args('id') id: string) {
  // Works if user has 'invoice:delete' OR 'invoice:*' OR 'admin:*'
}
```

### No Permission Check
```typescript
@Query(() => User)
@UseGuards(JwtAuthGuard) // Auth only, no RBAC
async me(@Context() ctx: any) {
  // Any authenticated user can access
  return ctx.req.user;
}
```

---

## Guard Order Matters

**Always use JwtAuthGuard BEFORE RbacGuard**:

```typescript
@UseGuards(JwtAuthGuard, RbacGuard) // ✅ Correct order
@RequirePermissions('invoice:create')

@UseGuards(RbacGuard, JwtAuthGuard) // ❌ Wrong - RBAC needs user from JWT
```

---

## Best Practices

1. **Least Privilege**: Grant minimum permissions needed
2. **Always Authenticate First**: Use JwtAuthGuard before RbacGuard
3. **Resource-Level Checks**: Add object ownership validation if needed
4. **Audit All Decisions**: Log permission checks
5. **Deny by Default**: Require explicit permission grants
6. **Wildcard Sparingly**: Use `resource:*` only for managers
7. **Admin Wildcard Carefully**: `admin:*` is powerful, limit usage

---

## Resource-Level Authorization

For owner-based permissions:

```typescript
@Mutation(() => InvoicePayload)
@UseGuards(JwtAuthGuard, RbacGuard)
@RequirePermissions('invoice:update')
async updateInvoice(
  @Args('id') id: string,
  @Context() ctx: any,
) {
  const invoice = await this.findInvoice(id);

  // Resource-level check: User can only update their own invoices
  if (invoice.userId !== ctx.req.user.sub && !ctx.req.user.permissions.includes('admin:*')) {
    throw new ForbiddenException('You can only update your own invoices');
  }

  // Proceed with update...
}
```

---

## Testing RBAC

```typescript
describe('RBAC Guard', () => {
  it('should allow user with exact permission', () => {
    const user = { permissions: ['invoice:create'] };
    const required = ['invoice:create'];

    expect(hasPermissions(user, required)).toBe(true);
  });

  it('should allow user with wildcard permission', () => {
    const user = { permissions: ['invoice:*'] };
    const required = ['invoice:create'];

    expect(hasPermissions(user, required)).toBe(true);
  });

  it('should allow admin with admin:* wildcard', () => {
    const user = { permissions: ['admin:*'] };
    const required = ['invoice:create', 'finance:manage'];

    expect(hasPermissions(user, required)).toBe(true);
  });

  it('should deny user without permission', () => {
    const user = { permissions: ['invoice:read'] };
    const required = ['invoice:create'];

    expect(hasPermissions(user, required)).toBe(false);
  });

  it('should require ALL permissions when multiple', () => {
    const user = { permissions: ['invoice:approve'] };
    const required = ['invoice:approve', 'finance:manage'];

    expect(hasPermissions(user, required)).toBe(false);
  });
});
```

---

**See Also**:
- `.claude/skills/security-first/authorization.md` - Complete authorization patterns
- `.claude/skills/security-first/authentication.md` - JWT authentication
- `services/auth/src/rbac/` - Production RBAC implementation
- `sessions/knowledge/vextrus-erp/checklists/security-audit-checklist.md` - Security checklist
