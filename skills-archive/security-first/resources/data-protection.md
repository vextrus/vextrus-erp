# Data Protection Patterns

Reference for Security First Skill - Encryption, SQL Injection Prevention, Rate Limiting

---

## Encryption at Rest

### AES-256-GCM Encryption Service
```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 bytes

  encrypt(plaintext: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(ciphertext: string): string {
    const [ivHex, authTagHex, encrypted] = ciphertext.split(':');

    const decipher = createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(ivHex, 'hex'),
    );

    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

### Usage in Entity
```typescript
@Entity()
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  @Transform(({ value }) => encryptionService.encrypt(value), {
    toClassOnly: true, // Encrypt when saving to DB
  })
  @Transform(({ value }) => encryptionService.decrypt(value), {
    toPlainOnly: true, // Decrypt when reading from DB
  })
  taxId: string; // Encrypted in database

  @Column({ type: 'text' })
  @Transform(({ value }) => encryptionService.encrypt(value), {
    toClassOnly: true,
  })
  @Transform(({ value }) => encryptionService.decrypt(value), {
    toPlainOnly: true,
  })
  bankAccountNumber: string; // Encrypted in database
}
```

**Encryption Best Practices**:
- Use AES-256-GCM (authenticated encryption)
- Generate unique IV for each encryption
- Store encryption key in secrets manager (not .env)
- Rotate keys periodically
- Encrypt: TIN, BIN, bank accounts, credit cards

---

## Sensitive Data in Logs

### Never Log Sensitive Data
```typescript
// ❌ BAD - Logs sensitive data
logger.log(`User logged in: ${user.password}`);
logger.log(`Payment: ${JSON.stringify(paymentInfo)}`);
logger.log(`Token: ${token}`);

// ✅ GOOD - Logs only IDs
logger.log(`User logged in: ${user.id}`);
logger.log(`Payment processed: ${paymentId}`);
logger.log(`Token issued for user: ${userId}`);
```

### Mask Sensitive Fields
```typescript
function maskCardNumber(cardNumber: string): string {
  // Show only last 4 digits
  return `**** **** **** ${cardNumber.slice(-4)}`;
}

function sanitizeForLogging(paymentInfo: any) {
  return {
    ...paymentInfo,
    cardNumber: maskCardNumber(paymentInfo.cardNumber),
    cvv: '***',
    password: undefined, // Remove entirely
    token: undefined,
  };
}

logger.log(`Payment: ${JSON.stringify(sanitizeForLogging(paymentInfo))}`);
```

---

## SQL Injection Prevention

### Use Parameterized Queries

#### ❌ VULNERABLE - String Concatenation
```typescript
const query = `SELECT * FROM invoices WHERE id = '${id}'`;
await db.query(query);

const search = `SELECT * FROM customers WHERE name LIKE '%${name}%'`;
await db.query(search);
```

#### ✅ SAFE - Parameterized Query
```typescript
// Raw query with parameters
await db.query('SELECT * FROM invoices WHERE id = $1', [id]);

// Search with parameters
await db.query('SELECT * FROM customers WHERE name LIKE $1', [`%${name}%`]);
```

#### ✅ SAFE - ORM (TypeORM)
```typescript
// TypeORM find
await invoiceRepo.findOne({ where: { id } });

// TypeORM with conditions
await invoiceRepo.find({
  where: {
    customerId,
    status: In(['pending', 'approved']),
  },
});
```

#### ✅ SAFE - Query Builder
```typescript
await invoiceRepo
  .createQueryBuilder('invoice')
  .where('invoice.id = :id', { id })
  .andWhere('invoice.customerId = :customerId', { customerId })
  .getOne();

// Complex query with parameters
await invoiceRepo
  .createQueryBuilder('invoice')
  .leftJoin('invoice.customer', 'customer')
  .where('customer.name LIKE :name', { name: `%${searchTerm}%` })
  .andWhere('invoice.status = :status', { status })
  .getMany();
```

**SQL Injection Rules**:
1. **ALWAYS use parameterized queries**
2. **NEVER concatenate user input into SQL**
3. **Use ORM whenever possible** (TypeORM, Prisma)
4. **Validate input** even with parameterized queries

---

## Rate Limiting

### Throttle Decorator (NestJS)
```typescript
import { Throttle } from '@nestjs/throttler';

@Resolver(() => Invoice)
export class InvoiceResolver {
  @Query(() => [Invoice])
  @Throttle(100, 60) // 100 requests per 60 seconds
  async invoices() {
    return this.service.findAll();
  }

  @Mutation(() => InvoicePayload)
  @Throttle(10, 60) // 10 mutations per 60 seconds (stricter)
  async createInvoice() {
    // ...
  }

  @Mutation(() => AuthPayload)
  @Throttle(5, 300) // 5 login attempts per 5 minutes
  async login() {
    // ...
  }
}
```

### Global Rate Limiting Configuration
```typescript
// app.module.ts
@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60, // Time to live (seconds)
      limit: 100, // Max requests per TTL
    }),
  ],
})
export class AppModule {}
```

### Custom Rate Limit Strategy
```typescript
@Injectable()
export class UserBasedThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): string {
    // Rate limit per user ID instead of IP
    return req.user?.id || req.ip;
  }
}

// Usage
@UseGuards(UserBasedThrottlerGuard)
export class InvoiceResolver {
  // Each user gets separate rate limit
}
```

**Rate Limiting Best Practices**:
- Stricter limits on mutations vs queries
- Very strict on authentication endpoints (5 attempts / 5 minutes)
- Per-user limits for authenticated endpoints
- Per-IP limits for public endpoints
- Return 429 Too Many Requests with Retry-After header

---

## Configuration Security

### Environment Variables (Never Hardcode)
```typescript
// ❌ BAD - Hardcoded secrets
const jwtSecret = 'my-secret-key-123';
const encryptionKey = 'abcd1234abcd1234abcd1234abcd1234';

// ✅ GOOD - Environment variables
const jwtSecret = process.env.JWT_SECRET;
const encryptionKey = process.env.ENCRYPTION_KEY;

// Validate on startup
if (!jwtSecret || !encryptionKey) {
  throw new Error('Missing required environment variables');
}
```

### Secrets Management
```
Development: .env.local (gitignored)
Staging: AWS Secrets Manager / Vault
Production: AWS Secrets Manager / Vault

NEVER commit secrets to git
NEVER log secrets
Rotate secrets regularly
```

---

## Best Practices Summary

1. **Encrypt sensitive data** at rest (TIN, bank accounts)
2. **Never log** passwords, tokens, credit cards
3. **Always use parameterized queries** (no string concatenation)
4. **Rate limit** all endpoints (stricter for mutations)
5. **Use secrets manager** (never hardcode)
6. **Validate encryption keys** on application startup
