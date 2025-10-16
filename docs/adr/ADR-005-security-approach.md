# ADR-005: Security Architecture and Approach

## Status
Accepted

## Date
2024-12-05

## Context
Vextrus ERP will handle sensitive construction project data, financial transactions, and personal information. Security requirements include:
- Protection of financial data and transactions
- Compliance with Bangladesh Data Protection Act
- Multi-tenant data isolation
- Protection against common web vulnerabilities
- Audit trail for regulatory compliance

Threat landscape:
- 26% of developers prioritize security in 2024
- Construction industry experiencing increased cyber attacks
- Bangladesh seeing rise in digital fraud

## Decision

### Authentication & Authorization

#### JWT Implementation
```typescript
const authConfig = {
  jwt: {
    accessToken: {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m', // Short-lived
    },
    refreshToken: {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d', // Weekly rotation
    }
  },
  
  mfa: {
    enabled: true,
    methods: ['totp', 'sms'], // SMS for Bangladesh market
    smsProvider: 'local', // Bangladesh SMS gateway
  },
  
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventReuse: 5,
    expiryDays: 90
  }
};
```

#### Role-Based Access Control (RBAC)
```typescript
const roles = {
  SUPER_ADMIN: ['*'],
  ORG_ADMIN: ['org:*'],
  PROJECT_MANAGER: ['project:*', 'report:read'],
  ACCOUNTANT: ['finance:*', 'report:*'],
  ENGINEER: ['project:read', 'task:write'],
  VIEWER: ['*:read']
};

// Row-level security
interface DataAccess {
  organization: string;
  projects: string[];
  departments: string[];
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
}
```

### Data Protection

#### Encryption Strategy
```typescript
const encryptionConfig = {
  atRest: {
    algorithm: 'AES-256-GCM',
    keyRotation: '90days',
    fields: [
      'personal.nid', // National ID
      'financial.accountNumber',
      'financial.bkashNumber',
      'personal.mobileNumber'
    ]
  },
  
  inTransit: {
    protocol: 'TLS 1.3',
    cipherSuites: [
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256'
    ],
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }
};
```

### API Security

#### Rate Limiting
```typescript
const rateLimits = {
  global: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // requests
  },
  
  auth: {
    login: { windowMs: 15 * 60 * 1000, max: 5 },
    register: { windowMs: 60 * 60 * 1000, max: 3 },
    passwordReset: { windowMs: 60 * 60 * 1000, max: 3 }
  },
  
  api: {
    standard: { windowMs: 1 * 60 * 1000, max: 100 },
    reports: { windowMs: 5 * 60 * 1000, max: 10 },
    exports: { windowMs: 60 * 60 * 1000, max: 20 }
  }
};
```

#### Input Validation
```typescript
// Using class-validator decorators
class CreateProjectDto {
  @IsString()
  @Length(3, 100)
  @Matches(/^[a-zA-Z0-9\s\u0980-\u09FF]+$/) // Allow Bengali
  name: string;
  
  @IsDecimal()
  @Min(0)
  @Max(999999999999.99)
  budget: number;
  
  @IsEmail()
  @IsOptional()
  clientEmail?: string;
}

// SQL Injection Prevention
const safeQuery = {
  always: 'Use parameterized queries',
  never: 'String concatenation',
  orm: 'TypeORM with query builder'
};
```

### Audit & Compliance

#### Audit Logging
```typescript
interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  organizationId: string;
  action: string;
  resource: string;
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  oldValue?: any;
  newValue?: any;
  result: 'success' | 'failure';
  reason?: string;
}

// Critical actions always logged
const auditableActions = [
  'user.login',
  'user.logout',
  'user.passwordChange',
  'payment.process',
  'project.delete',
  'finance.export',
  'admin.configChange'
];
```

### Security Headers
```typescript
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};
```

## Rationale

### Why JWT with Short Access Tokens?
- Stateless authentication scales better
- 15-minute access tokens limit exposure
- Refresh tokens allow seamless UX
- Industry standard for REST APIs

### Why SMS for MFA?
- High mobile penetration in Bangladesh
- Users familiar with SMS OTP
- More accessible than authenticator apps
- Fallback to TOTP available

### Why Field-Level Encryption?
- Protects sensitive data even if database compromised
- Required for financial data compliance
- Minimal performance impact with modern CPUs

## Consequences

### Positive
- Defense in depth strategy
- Compliance with regulations
- User trust and confidence
- Reduced attack surface
- Complete audit trail

### Negative
- Performance overhead from encryption
- Complexity in key management
- User friction from security measures
- Higher infrastructure costs

### Mitigation
- Use hardware acceleration for crypto
- Implement key management service
- Progressive security (risk-based)
- Security training for team

## Security Testing

```yaml
testing:
  static:
    - ESLint security plugin
    - Snyk dependency scanning
    - SonarQube analysis
    
  dynamic:
    - OWASP ZAP scanning
    - Penetration testing (quarterly)
    - Load testing with security scenarios
    
  compliance:
    - PCI DSS checklist (payment handling)
    - OWASP Top 10 verification
    - Bangladesh Data Protection audit
```

## Incident Response

```typescript
const incidentResponse = {
  levels: ['low', 'medium', 'high', 'critical'],
  
  procedures: {
    detection: 'Automated + manual monitoring',
    containment: 'Isolate affected systems',
    eradication: 'Remove threat and patch',
    recovery: 'Restore from clean backups',
    lessons: 'Post-mortem within 48 hours'
  },
  
  team: {
    lead: 'Security Officer',
    technical: 'DevOps + Backend',
    communication: 'Customer Success',
    legal: 'Compliance Officer'
  }
};
```

## References
- [OWASP Top 10 2024](https://owasp.org/Top10/)
- [Bangladesh Data Protection Guidelines](https://example.com)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)