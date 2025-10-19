# Authorization Patterns (RBAC)

Reference for Security First Skill - Role-Based Access Control

---

## Permission Structure

### Hierarchical Permissions
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

### Role to Permission Mapping
```typescript
const ROLES = {
  accountant: ['invoice:read', 'invoice:create', 'finance:read'],
  manager: ['invoice:*', 'finance:read'],
  admin: ['admin:*'],
};
```

**Permission Format**: `resource:action`
- Wildcard support: `invoice:*` matches all invoice permissions
- Admin wildcard: `admin:*` matches all permissions

---

## RBAC Guard Implementation

```typescript
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required permissions from decorator
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions) {
      return true; // No permissions required
    }

    // Get user from request (set by JwtAuthGuard)
    const request = this.getRequest(context);
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Check if user has required permissions
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
        if (userPerm === permission) {
          return true;
        }

        // Wildcard match (e.g., 'invoice:*' matches 'invoice:read')
        const [resource, action] = permission.split(':');
        const wildcardPerm = `${resource}:*`;
        return userPerm === wildcardPerm;
      });
    });
  }

  private getRequest(context: ExecutionContext): any {
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest();
    }
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
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

## Usage Patterns

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

### No Permission Check (Public after authentication)
```typescript
@Query(() => User)
@UseGuards(JwtAuthGuard) // Auth only, no RBAC
async me(@Context() ctx: any) {
  // Any authenticated user can access
  return ctx.req.user;
}
```

---

## Best Practices

1. **Always use with JwtAuthGuard** - RBAC requires authenticated user
2. **Least privilege** - Grant minimum permissions needed
3. **Resource-level permissions** - Check object ownership if needed
4. **Audit permission checks** - Log all authorization decisions
5. **Deny by default** - Require explicit permission grants
