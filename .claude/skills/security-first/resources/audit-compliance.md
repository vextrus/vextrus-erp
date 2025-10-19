# Audit & Compliance Patterns

Reference for Security First Skill - Audit Logging and Security Testing

---

## Audit Logging

### Audit Event Entity
```typescript
@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  action: string; // 'invoice:created', 'payment:approved', 'user:login'

  @Column()
  resourceType: string; // 'invoice', 'payment', 'user'

  @Column()
  resourceId: string;

  @Column({ type: 'jsonb', nullable: true })
  before: any; // State before change (for updates/deletes)

  @Column({ type: 'jsonb', nullable: true })
  after: any; // State after change (for creates/updates)

  @Column()
  ipAddress: string;

  @Column()
  userAgent: string;

  @Column({ nullable: true })
  tenantId: string; // For multi-tenant systems

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'boolean', default: false })
  isSecurityEvent: boolean; // Flag critical security events
}
```

### Audit Interceptor
```typescript
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = this.getRequest(context);
    const user = request.user;

    // Capture request metadata
    const metadata = {
      userId: user?.id,
      action: context.getHandler().name,
      resourceType: this.getResourceType(context),
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
      tenantId: request.headers['x-tenant-id'],
    };

    return next.handle().pipe(
      tap(async (result) => {
        await this.auditService.log({
          ...metadata,
          resourceId: result?.id,
          after: result,
        });
      }),
    );
  }

  private getRequest(context: ExecutionContext): any {
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest();
    }
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  private getResourceType(context: ExecutionContext): string {
    // Extract from class name (e.g., InvoiceResolver -> 'invoice')
    const className = context.getClass().name;
    return className.replace(/Resolver|Controller/, '').toLowerCase();
  }
}
```

### Usage on Critical Operations
```typescript
@Resolver(() => Invoice)
export class InvoiceResolver {
  @Mutation(() => InvoicePayload)
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermissions('invoice:approve')
  @UseInterceptors(AuditInterceptor) // Log this action
  async approveInvoice(@Args('id') id: string) {
    // Audit log will capture:
    // - Who approved (userId)
    // - What was approved (resourceId)
    // - When (createdAt)
    // - Where from (ipAddress)
    return this.commandBus.execute(new ApproveInvoiceCommand(id));
  }
}
```

### Security Event Logging
```typescript
// Log security events separately
await this.auditService.logSecurityEvent({
  userId: user.id,
  action: 'auth:failed_login',
  reason: 'Invalid password',
  ipAddress: request.ip,
  userAgent: request.get('user-agent'),
});

// Monitor for suspicious patterns
await this.auditService.logSecurityEvent({
  userId: user.id,
  action: 'auth:suspicious_activity',
  reason: 'Multiple failed login attempts',
  ipAddress: request.ip,
  attemptCount: 5,
});
```

---

## Security Testing

### Test Authentication
```typescript
describe('Authentication', () => {
  it('should reject unauthenticated requests', async () => {
    const query = `query { invoices { id } }`;

    const result = await gqlExecWithoutAuth(query);

    expect(result.errors).toBeDefined();
    expect(result.errors[0].message).toContain('Unauthorized');
    expect(result.errors[0].extensions.code).toBe('UNAUTHENTICATED');
  });

  it('should reject invalid JWT tokens', async () => {
    const invalidToken = 'invalid-token-123';

    const query = `query { invoices { id } }`;

    const result = await gqlExec(query, invalidToken);

    expect(result.errors).toBeDefined();
    expect(result.errors[0].message).toContain('Invalid token');
  });

  it('should reject expired JWT tokens', async () => {
    const expiredToken = await createExpiredToken(user);

    const query = `query { invoices { id } }`;

    const result = await gqlExec(query, expiredToken);

    expect(result.errors).toBeDefined();
    expect(result.errors[0].message).toContain('Token expired');
  });
});
```

### Test Authorization (RBAC)
```typescript
describe('Authorization', () => {
  it('should reject users without required permissions', async () => {
    const userWithoutPermission = await createUser({
      permissions: ['invoice:read'], // Missing 'invoice:create'
    });

    const mutation = `
      mutation {
        createInvoice(input: { customerId: "...", amount: 100 }) {
          id
        }
      }
    `;

    const result = await gqlExecAs(mutation, userWithoutPermission);

    expect(result.errors).toBeDefined();
    expect(result.errors[0].message).toContain('Forbidden');
    expect(result.errors[0].extensions.code).toBe('FORBIDDEN');
  });

  it('should allow users with required permissions', async () => {
    const userWithPermission = await createUser({
      permissions: ['invoice:create'],
    });

    const mutation = `
      mutation {
        createInvoice(input: { customerId: "...", amount: 100 }) {
          id
        }
      }
    `;

    const result = await gqlExecAs(mutation, userWithPermission);

    expect(result.errors).toBeUndefined();
    expect(result.data.createInvoice).toBeDefined();
  });
});
```

### Test Input Validation
```typescript
describe('Input Validation', () => {
  it('should reject invalid UUIDs', async () => {
    const invalidInput = {
      customerId: 'not-a-uuid',
      amount: 100,
    };

    await expect(
      service.createInvoice(invalidInput),
    ).rejects.toThrow(ValidationError);
  });

  it('should reject negative amounts', async () => {
    const invalidInput = {
      customerId: validUuid,
      amount: -100,
    };

    await expect(
      service.createInvoice(invalidInput),
    ).rejects.toThrow('amount must not be less than 0');
  });

  it('should reject empty required fields', async () => {
    const invalidInput = {
      customerId: '', // Empty string
      amount: 100,
    };

    await expect(
      service.createInvoice(invalidInput),
    ).rejects.toThrow(ValidationError);
  });
});
```

### Test SQL Injection Prevention
```typescript
describe('SQL Injection Prevention', () => {
  it('should sanitize search inputs', async () => {
    // Attempt SQL injection via search
    const maliciousInput = "'; DROP TABLE invoices; --";

    // Should NOT throw error (injection prevented)
    const result = await service.searchInvoices({ query: maliciousInput });

    // Verify table still exists
    const count = await invoiceRepo.count();
    expect(count).toBeGreaterThan(0);

    // Verify no results for malicious input
    expect(result).toEqual([]);
  });

  it('should use parameterized queries', async () => {
    const spy = jest.spyOn(db, 'query');

    await service.getInvoiceById(invoiceId);

    // Verify parameterized query was used
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('$1'), // Parameterized query
      expect.arrayContaining([invoiceId]),
    );
  });
});
```

---

## Compliance Checklists

### Before Production Deployment
- [ ] All endpoints have authentication guards
- [ ] RBAC guards on sensitive operations
- [ ] Input validation on all DTOs
- [ ] Audit logging for financial operations
- [ ] Rate limiting configured
- [ ] Security event monitoring active
- [ ] Encryption keys in secrets manager
- [ ] No secrets in code/logs
- [ ] HTTPS enforced
- [ ] Security headers configured (CSP, HSTS, etc.)

### Bangladesh ERP Compliance
- [ ] TIN validation (13 digits)
- [ ] BIN validation (12 digits)
- [ ] VAT rates validation (15%, 7.5%, 5%, 0%)
- [ ] Mushak-6.3 format compliance
- [ ] Audit trail for all financial transactions
- [ ] Data retention compliance
- [ ] Financial year handling (July-June)

---

## Best Practices

1. **Log all security events** - Failed logins, permission denials, suspicious activity
2. **Test authentication** - Unauthenticated, invalid token, expired token
3. **Test authorization** - Without permissions, with permissions, boundary cases
4. **Test input validation** - Invalid types, out of range, missing fields
5. **Audit financial operations** - Create, update, approve, delete
6. **Monitor anomalies** - Multiple failed attempts, unusual patterns
7. **Regular security reviews** - Weekly audit log analysis
