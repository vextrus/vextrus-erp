# Integration & Security Guide - Vextrus ERP

## Executive Summary
This guide provides comprehensive patterns for secure API integration, microservices communication, and enterprise-grade security implementation for Vextrus ERP. Based on OWASP standards and industry best practices.

## Part 1: GraphQL Federation Integration

### 1.1 Federation Architecture

```typescript
// gateway/src/index.ts
import { ApolloGateway, RemoteGraphQLDataSource } from '@apollo/gateway'
import { ApolloServer } from '@apollo/server'
import { buildSubgraphSchema } from '@apollo/federation'

class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }) {
    // Forward authentication headers to subgraphs
    request.http.headers.set('x-user-id', context.userId)
    request.http.headers.set('x-tenant-id', context.tenantId)
    request.http.headers.set('x-permissions', JSON.stringify(context.permissions))

    // Add service-to-service authentication
    const serviceToken = this.generateServiceToken()
    request.http.headers.set('x-service-token', serviceToken)
  }

  private generateServiceToken(): string {
    // Generate JWT for service-to-service auth
    return jwt.sign(
      {
        service: 'gateway',
        timestamp: Date.now()
      },
      process.env.SERVICE_SECRET,
      { expiresIn: '30s' }
    )
  }
}

const gateway = new ApolloGateway({
  serviceList: [
    { name: 'auth', url: 'http://auth:3001/graphql' },
    { name: 'finance', url: 'http://finance:3002/graphql' },
    { name: 'mdm', url: 'http://mdm:3003/graphql' },
    { name: 'hr', url: 'http://hr:3004/graphql' }
  ],
  buildService({ url }) {
    return new AuthenticatedDataSource({ url })
  },
  // Enable query planning cache
  experimental_pollInterval: 10000
})
```

### 1.2 Authentication at Gateway

```typescript
// gateway/src/auth/authentication.ts
import { GraphQLError } from 'graphql'
import { verifyJWT } from './jwt'

export async function authenticateRequest(request: Request): Promise<AuthContext> {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new GraphQLError('Missing authentication', {
      extensions: {
        code: 'UNAUTHENTICATED',
        http: { status: 401 }
      }
    })
  }

  const token = authHeader.substring(7)

  try {
    const payload = await verifyJWT(token)

    // Verify tenant access
    const tenant = await getTenant(payload.tenantId)
    if (!tenant.isActive) {
      throw new GraphQLError('Tenant suspended', {
        extensions: {
          code: 'FORBIDDEN',
          http: { status: 403 }
        }
      })
    }

    // Load user permissions
    const permissions = await loadUserPermissions(payload.userId, payload.tenantId)

    return {
      userId: payload.userId,
      tenantId: payload.tenantId,
      permissions,
      sessionId: payload.sessionId
    }
  } catch (error) {
    throw new GraphQLError('Invalid authentication', {
      extensions: {
        code: 'UNAUTHENTICATED',
        http: { status: 401 }
      }
    })
  }
}
```

### 1.3 Authorization at Subgraph Level

```typescript
// services/finance/src/resolvers/invoice.resolver.ts
import { ForbiddenError } from '@apollo/server'

export const invoiceResolvers = {
  Query: {
    invoice: async (_, { id }, context) => {
      // Check basic permission
      if (!context.permissions.includes('finance.invoices.read')) {
        throw new ForbiddenError('Insufficient permissions')
      }

      const invoice = await Invoice.findById(id)

      // Check tenant isolation
      if (invoice.tenantId !== context.tenantId) {
        throw new ForbiddenError('Access denied')
      }

      // Check department-level access if needed
      if (invoice.isConfidential && !context.permissions.includes('finance.confidential.read')) {
        throw new ForbiddenError('Confidential invoice')
      }

      return invoice
    }
  },

  Mutation: {
    createInvoice: async (_, { input }, context) => {
      // Multi-level authorization
      const authCheck = new AuthorizationChecker(context)
      authCheck.require('finance.invoices.create')

      if (input.amount > 1000000) {
        authCheck.require('finance.invoices.high_value')
      }

      if (input.customerId) {
        authCheck.requireCustomerAccess(input.customerId)
      }

      // Create invoice with audit trail
      return Invoice.create({
        ...input,
        tenantId: context.tenantId,
        createdBy: context.userId,
        auditLog: [{
          action: 'CREATE',
          userId: context.userId,
          timestamp: new Date(),
          ip: context.requestIp
        }]
      })
    }
  }
}
```

## Part 2: Security Implementation

### 2.1 OWASP API Security Implementation

```typescript
// security/src/middleware/api-security.ts

export class APISecurityMiddleware {
  // API1: Broken Object Level Authorization
  async checkObjectLevelAuth(userId: string, objectId: string, objectType: string): Promise<boolean> {
    const permissions = await this.getUserObjectPermissions(userId, objectId, objectType)

    if (!permissions.canAccess) {
      await this.logUnauthorizedAccess(userId, objectId)
      return false
    }

    return true
  }

  // API2: Broken Authentication
  async enforceStrongAuthentication(request: Request): Promise<void> {
    const failures = await this.getRecentAuthFailures(request.ip)

    // Rate limit authentication attempts
    if (failures > 5) {
      throw new Error('Too many authentication attempts. Try again later.')
    }

    // Enforce MFA for sensitive operations
    if (this.isSensitiveOperation(request.path)) {
      const mfaToken = request.headers.get('X-MFA-Token')
      if (!await this.verifyMFA(mfaToken)) {
        throw new Error('MFA required for this operation')
      }
    }
  }

  // API3: Broken Object Property Level Authorization
  sanitizeResponseData(data: any, userPermissions: string[]): any {
    const sensitiveFields = ['ssn', 'tin', 'bin', 'bankAccount', 'salary']

    if (!userPermissions.includes('view_sensitive_data')) {
      sensitiveFields.forEach(field => {
        if (data[field]) {
          data[field] = '***REDACTED***'
        }
      })
    }

    return data
  }

  // API4: Unrestricted Resource Consumption
  async enforceRateLimits(userId: string, endpoint: string): Promise<void> {
    const limits = {
      '/api/reports/generate': { requests: 10, window: 3600 }, // 10 per hour
      '/api/invoices': { requests: 100, window: 60 }, // 100 per minute
      '/api/payments': { requests: 50, window: 60 }, // 50 per minute
      'default': { requests: 1000, window: 60 } // 1000 per minute
    }

    const limit = limits[endpoint] || limits.default
    const key = `rate_limit:${userId}:${endpoint}`

    const current = await redis.incr(key)

    if (current === 1) {
      await redis.expire(key, limit.window)
    }

    if (current > limit.requests) {
      throw new Error(`Rate limit exceeded. Max ${limit.requests} requests per ${limit.window} seconds`)
    }
  }

  // API5: Broken Function Level Authorization
  enforceRBAC(userRole: string, requiredPermission: string): boolean {
    const rolePermissions = {
      'admin': ['*'],
      'manager': ['read:*', 'write:invoices', 'write:payments'],
      'accountant': ['read:*', 'write:journals'],
      'viewer': ['read:reports', 'read:invoices']
    }

    const permissions = rolePermissions[userRole] || []

    return permissions.includes('*') ||
           permissions.includes(requiredPermission) ||
           permissions.some(p => this.matchesWildcard(p, requiredPermission))
  }
}
```

### 2.2 Rate Limiting Implementation

```typescript
// security/src/rate-limiter/sliding-window.ts

export class SlidingWindowRateLimiter {
  private redis: Redis

  async isAllowed(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const now = Date.now()
    const windowStart = now - windowMs
    const key = `rate_limit:${identifier}`

    // Remove old entries
    await this.redis.zremrangebyscore(key, '-inf', windowStart)

    // Count current requests in window
    const currentCount = await this.redis.zcard(key)

    if (currentCount < limit) {
      // Add current request
      await this.redis.zadd(key, now, `${now}-${Math.random()}`)
      await this.redis.expire(key, Math.ceil(windowMs / 1000))

      return {
        allowed: true,
        remaining: limit - currentCount - 1,
        resetAt: new Date(now + windowMs)
      }
    }

    // Get oldest entry to determine reset time
    const oldestEntry = await this.redis.zrange(key, 0, 0, 'WITHSCORES')
    const resetAt = oldestEntry[1] ? parseInt(oldestEntry[1]) + windowMs : now + windowMs

    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(resetAt)
    }
  }

  // Advanced rate limiting with multiple tiers
  async checkTieredLimits(userId: string, endpoint: string): Promise<RateLimitResult> {
    const userTier = await this.getUserTier(userId)

    const limits = {
      'free': { requests: 100, window: 3600000 }, // 100/hour
      'basic': { requests: 1000, window: 3600000 }, // 1000/hour
      'premium': { requests: 10000, window: 3600000 }, // 10000/hour
      'enterprise': { requests: 100000, window: 3600000 } // 100000/hour
    }

    const tierLimit = limits[userTier] || limits.free
    const identifier = `${userId}:${endpoint}`

    return this.isAllowed(identifier, tierLimit.requests, tierLimit.window)
  }
}
```

### 2.3 DDoS Protection

```typescript
// security/src/ddos/protection.ts

export class DDoSProtection {
  private requestCounts = new Map<string, number[]>()

  async protectEndpoint(request: Request): Promise<void> {
    const clientId = this.getClientIdentifier(request)

    // Layer 1: Request rate analysis
    if (await this.isRateSuspicious(clientId)) {
      await this.blockClient(clientId, 'suspicious_rate')
      throw new Error('Request blocked')
    }

    // Layer 2: Pattern analysis
    if (await this.isPatternSuspicious(clientId, request)) {
      await this.blockClient(clientId, 'suspicious_pattern')
      throw new Error('Request blocked')
    }

    // Layer 3: Resource consumption
    if (await this.isResourceHeavy(request)) {
      await this.challengeClient(clientId)
    }

    // Layer 4: Geo-blocking for suspicious regions
    if (await this.isGeoBlocked(request.ip)) {
      throw new Error('Region blocked')
    }
  }

  private async isRateSuspicious(clientId: string): Promise<boolean> {
    const recentRequests = this.requestCounts.get(clientId) || []
    const now = Date.now()

    // Keep only requests from last minute
    const filtered = recentRequests.filter(t => now - t < 60000)
    filtered.push(now)
    this.requestCounts.set(clientId, filtered)

    // Suspicious if more than 100 requests per second sustained
    if (filtered.length > 100) {
      const duration = filtered[filtered.length - 1] - filtered[0]
      const requestsPerSecond = filtered.length / (duration / 1000)
      return requestsPerSecond > 100
    }

    return false
  }

  private async challengeClient(clientId: string): Promise<void> {
    // Implement CAPTCHA or proof-of-work challenge
    const challenge = this.generateChallenge()
    await redis.set(`challenge:${clientId}`, challenge, 'EX', 300)
  }

  private getClientIdentifier(request: Request): string {
    // Combine multiple factors for better identification
    const factors = [
      request.ip,
      request.headers.get('User-Agent'),
      request.headers.get('Accept-Language')
    ]
    return crypto.createHash('sha256').update(factors.join('|')).digest('hex')
  }
}
```

### 2.4 JWT Security

```typescript
// security/src/jwt/secure-jwt.ts

export class SecureJWT {
  private readonly ACCESS_TOKEN_EXPIRY = '15m'
  private readonly REFRESH_TOKEN_EXPIRY = '7d'
  private readonly TOKEN_ROTATION_THRESHOLD = 300 // 5 minutes

  async generateTokenPair(payload: TokenPayload): Promise<TokenPair> {
    // Add security claims
    const securityClaims = {
      jti: crypto.randomUUID(), // Unique token ID for revocation
      iat: Math.floor(Date.now() / 1000),
      fingerprint: this.generateFingerprint()
    }

    const accessToken = jwt.sign(
      { ...payload, ...securityClaims, type: 'access' },
      process.env.JWT_ACCESS_SECRET,
      {
        expiresIn: this.ACCESS_TOKEN_EXPIRY,
        algorithm: 'RS256' // Use RSA for better security
      }
    )

    const refreshToken = jwt.sign(
      { ...payload, ...securityClaims, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: this.REFRESH_TOKEN_EXPIRY,
        algorithm: 'RS256'
      }
    )

    // Store token metadata for revocation
    await this.storeTokenMetadata(securityClaims.jti, payload.userId)

    return { accessToken, refreshToken }
  }

  async verifyToken(token: string, type: 'access' | 'refresh'): Promise<TokenPayload> {
    const secret = type === 'access'
      ? process.env.JWT_ACCESS_SECRET
      : process.env.JWT_REFRESH_SECRET

    try {
      const payload = jwt.verify(token, secret, {
        algorithms: ['RS256']
      }) as any

      // Check if token is revoked
      if (await this.isTokenRevoked(payload.jti)) {
        throw new Error('Token has been revoked')
      }

      // Check fingerprint for token binding
      if (!this.verifyFingerprint(payload.fingerprint)) {
        throw new Error('Invalid token binding')
      }

      // Auto-rotate if close to expiry
      if (this.shouldRotateToken(payload)) {
        await this.scheduleTokenRotation(payload)
      }

      return payload
    } catch (error) {
      throw new Error('Invalid token')
    }
  }

  private shouldRotateToken(payload: any): boolean {
    const expiresIn = payload.exp - Math.floor(Date.now() / 1000)
    return expiresIn < this.TOKEN_ROTATION_THRESHOLD
  }

  private generateFingerprint(): string {
    // Generate unique fingerprint based on device/browser characteristics
    return crypto.randomBytes(32).toString('hex')
  }

  async revokeToken(jti: string): Promise<void> {
    await redis.set(`revoked:${jti}`, '1', 'EX', 86400 * 7) // Keep for 7 days
  }

  private async isTokenRevoked(jti: string): Promise<boolean> {
    return await redis.exists(`revoked:${jti}`) === 1
  }
}
```

## Part 3: Payment Gateway Integration

### 3.1 Unified Payment Interface

```typescript
// integrations/src/payment/payment-gateway.interface.ts

export interface PaymentGateway {
  initializePayment(request: PaymentRequest): Promise<PaymentSession>
  executePayment(sessionId: string): Promise<PaymentResult>
  refundPayment(paymentId: string, amount?: number): Promise<RefundResult>
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>
  handleWebhook(payload: any, signature: string): Promise<WebhookResult>
}

export abstract class BasePaymentGateway implements PaymentGateway {
  protected abstract validateWebhookSignature(payload: any, signature: string): boolean
  protected abstract mapErrorCode(code: string): PaymentError

  async processPaymentWithRetry(
    request: PaymentRequest,
    maxRetries: number = 3
  ): Promise<PaymentResult> {
    let lastError: Error

    for (let i = 0; i < maxRetries; i++) {
      try {
        const session = await this.initializePayment(request)
        return await this.executePayment(session.id)
      } catch (error) {
        lastError = error
        await this.delay(Math.pow(2, i) * 1000) // Exponential backoff
      }
    }

    throw lastError
  }

  protected async logPaymentAttempt(request: PaymentRequest, result: any): Promise<void> {
    await PaymentLog.create({
      gateway: this.constructor.name,
      amount: request.amount,
      currency: request.currency,
      status: result.status,
      request: this.sanitizeForLogging(request),
      response: this.sanitizeForLogging(result),
      timestamp: new Date()
    })
  }

  private sanitizeForLogging(data: any): any {
    const sensitive = ['cardNumber', 'cvv', 'pin', 'password', 'token']
    const sanitized = { ...data }

    sensitive.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***'
      }
    })

    return sanitized
  }

  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

### 3.2 bKash Integration

```typescript
// integrations/src/payment/bkash/bkash-gateway.ts

export class BkashGateway extends BasePaymentGateway {
  private tokenCache: TokenCache

  async initializePayment(request: PaymentRequest): Promise<PaymentSession> {
    const token = await this.getAccessToken()

    const bkashRequest = {
      mode: '0011',
      payerReference: request.customerId,
      callbackURL: `${process.env.API_URL}/webhooks/bkash/callback`,
      amount: request.amount.toString(),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: request.invoiceNumber
    }

    const response = await fetch(`${process.env.BKASH_API_URL}/checkout/payment/create`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'X-APP-Key': process.env.BKASH_APP_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bkashRequest)
    })

    const result = await response.json()

    if (result.statusCode !== '0000') {
      throw new PaymentError(this.mapErrorCode(result.statusCode))
    }

    await this.logPaymentAttempt(request, result)

    return {
      id: result.paymentID,
      gatewayUrl: result.bkashURL,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    }
  }

  async executePayment(paymentId: string): Promise<PaymentResult> {
    const token = await this.getAccessToken()

    const response = await fetch(
      `${process.env.BKASH_API_URL}/checkout/payment/execute/${paymentId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': token,
          'X-APP-Key': process.env.BKASH_APP_KEY
        }
      }
    )

    const result = await response.json()

    if (result.statusCode !== '0000') {
      throw new PaymentError(this.mapErrorCode(result.statusCode))
    }

    return {
      paymentId: result.paymentID,
      transactionId: result.trxID,
      amount: parseFloat(result.amount),
      currency: result.currency,
      status: 'SUCCESS',
      customerMsisdn: result.customerMsisdn,
      gatewayResponse: result
    }
  }

  async handleWebhook(payload: any, signature: string): Promise<WebhookResult> {
    if (!this.validateWebhookSignature(payload, signature)) {
      throw new Error('Invalid webhook signature')
    }

    // Process based on webhook type
    switch (payload.type) {
      case 'payment.success':
        await this.handlePaymentSuccess(payload)
        break
      case 'payment.failed':
        await this.handlePaymentFailure(payload)
        break
      case 'refund.success':
        await this.handleRefundSuccess(payload)
        break
      default:
        console.log('Unknown webhook type:', payload.type)
    }

    return { processed: true }
  }

  protected validateWebhookSignature(payload: any, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.BKASH_WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  }

  private async getAccessToken(): Promise<string> {
    // Check cache first
    const cached = await this.tokenCache.get('bkash_token')
    if (cached) return cached

    // Generate new token
    const credentials = Buffer.from(
      `${process.env.BKASH_USERNAME}:${process.env.BKASH_PASSWORD}`
    ).toString('base64')

    const response = await fetch(`${process.env.BKASH_API_URL}/checkout/token/grant`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        app_key: process.env.BKASH_APP_KEY,
        app_secret: process.env.BKASH_APP_SECRET
      })
    })

    const result = await response.json()

    // Cache for slightly less than expiry time
    await this.tokenCache.set('bkash_token', result.id_token, result.expires_in - 60)

    return result.id_token
  }

  protected mapErrorCode(code: string): PaymentError {
    const errorMap = {
      '2001': PaymentError.INSUFFICIENT_BALANCE,
      '2002': PaymentError.INVALID_PAYMENT,
      '2003': PaymentError.PAYMENT_CANCELLED,
      '2004': PaymentError.PAYMENT_EXPIRED,
      '2005': PaymentError.INVALID_CREDENTIALS,
      '2006': PaymentError.DUPLICATE_PAYMENT
    }

    return errorMap[code] || PaymentError.UNKNOWN_ERROR
  }
}
```

## Part 4: Microservices Communication

### 4.1 Event-Driven Architecture with Kafka

```typescript
// events/src/kafka/event-bus.ts

export class EventBus {
  private producer: Kafka.Producer
  private consumers: Map<string, Kafka.Consumer> = new Map()

  async publishEvent<T extends BaseEvent>(event: T): Promise<void> {
    const topic = this.getTopicForEvent(event.type)
    const key = event.aggregateId || crypto.randomUUID()

    const message = {
      key,
      value: JSON.stringify({
        ...event,
        timestamp: new Date().toISOString(),
        correlationId: event.correlationId || crypto.randomUUID(),
        version: '1.0'
      }),
      headers: {
        'event-type': event.type,
        'content-type': 'application/json',
        'service': process.env.SERVICE_NAME
      }
    }

    try {
      await this.producer.send({
        topic,
        messages: [message],
        acks: -1, // Wait for all replicas
        timeout: 30000
      })

      await this.logEvent(event, 'published')
    } catch (error) {
      await this.handlePublishError(error, event)
      throw error
    }
  }

  async subscribeToEvent<T extends BaseEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): Promise<void> {
    const topic = this.getTopicForEvent(eventType)
    const consumerGroup = `${process.env.SERVICE_NAME}-${eventType}`

    if (!this.consumers.has(consumerGroup)) {
      const consumer = kafka.consumer({
        groupId: consumerGroup,
        sessionTimeout: 30000,
        heartbeatInterval: 3000
      })

      await consumer.connect()
      await consumer.subscribe({ topic, fromBeginning: false })
      this.consumers.set(consumerGroup, consumer)

      await consumer.run({
        autoCommit: false,
        eachMessage: async ({ message, partition, topic }) => {
          const event = this.deserializeEvent<T>(message)

          try {
            await handler(event)
            await consumer.commitOffsets([{
              topic,
              partition,
              offset: (parseInt(message.offset) + 1).toString()
            }])
            await this.logEvent(event, 'processed')
          } catch (error) {
            await this.handleProcessingError(error, event)
            // Implement retry logic or DLQ
          }
        }
      })
    }
  }

  private getTopicForEvent(eventType: string): string {
    const topicMap = {
      'invoice.created': 'finance-events',
      'invoice.paid': 'finance-events',
      'payment.received': 'finance-events',
      'customer.created': 'mdm-events',
      'employee.hired': 'hr-events',
      'workflow.started': 'workflow-events'
    }

    return topicMap[eventType] || 'general-events'
  }
}
```

### 4.2 Service Mesh Communication

```typescript
// services/src/communication/service-client.ts

export class ServiceClient {
  private circuitBreaker: CircuitBreaker
  private retryPolicy: RetryPolicy

  constructor(serviceName: string) {
    this.circuitBreaker = new CircuitBreaker({
      threshold: 5,
      timeout: 30000,
      resetTimeout: 60000
    })

    this.retryPolicy = new RetryPolicy({
      maxRetries: 3,
      backoff: 'exponential',
      maxBackoff: 10000
    })
  }

  async call<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<T> {
    return this.circuitBreaker.execute(async () => {
      return this.retryPolicy.execute(async () => {
        const serviceUrl = await this.discoverService()

        const response = await fetch(`${serviceUrl}${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'X-Service-Token': this.generateServiceToken(),
            'X-Trace-Id': this.getTraceId(),
            'X-Span-Id': crypto.randomUUID()
          },
          body: data ? JSON.stringify(data) : undefined,
          timeout: 10000
        })

        if (!response.ok) {
          throw new ServiceError(response.status, await response.text())
        }

        return response.json()
      })
    })
  }

  private async discoverService(): Promise<string> {
    // Use service discovery (Consul, K8s DNS, etc.)
    const instances = await this.serviceRegistry.getInstances(this.serviceName)

    if (instances.length === 0) {
      throw new Error(`No instances found for service: ${this.serviceName}`)
    }

    // Simple round-robin load balancing
    return instances[Math.floor(Math.random() * instances.length)]
  }

  private generateServiceToken(): string {
    return jwt.sign(
      {
        service: process.env.SERVICE_NAME,
        timestamp: Date.now()
      },
      process.env.SERVICE_SECRET,
      { expiresIn: '30s' }
    )
  }
}
```

## Part 5: Monitoring & Observability

### 5.1 Distributed Tracing

```typescript
// monitoring/src/tracing/tracer.ts
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

export class Tracer {
  private tracer: Tracer

  initialize() {
    const provider = new NodeTracerProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: process.env.SERVICE_NAME,
        [SemanticResourceAttributes.SERVICE_VERSION]: process.env.SERVICE_VERSION,
      })
    })

    // Add exporters
    provider.addSpanProcessor(new BatchSpanProcessor(new JaegerExporter({
      endpoint: process.env.JAEGER_ENDPOINT
    })))

    provider.register()
    this.tracer = trace.getTracer(process.env.SERVICE_NAME)
  }

  startSpan(name: string, parentContext?: Context): Span {
    return this.tracer.startSpan(name, {
      parent: parentContext,
      attributes: {
        'tenant.id': getCurrentTenant(),
        'user.id': getCurrentUser(),
        'request.id': getRequestId()
      }
    })
  }

  async traceAsync<T>(
    name: string,
    fn: () => Promise<T>,
    attributes?: Record<string, any>
  ): Promise<T> {
    const span = this.startSpan(name)

    if (attributes) {
      span.setAttributes(attributes)
    }

    try {
      const result = await fn()
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (error) {
      span.recordException(error)
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message
      })
      throw error
    } finally {
      span.end()
    }
  }
}
```

## Part 6: Developer Handbook

### 6.1 Development Environment Setup

```bash
# 1. Clone repository
git clone https://github.com/vextrus/erp.git
cd erp

# 2. Install dependencies
pnpm install

# 3. Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# 4. Start infrastructure
docker-compose up -d postgres redis kafka

# 5. Run database migrations
pnpm migrate:dev

# 6. Seed development data
pnpm seed:dev

# 7. Start services
pnpm dev
```

### 6.2 API Development Guidelines

```typescript
// Example: Creating a new API endpoint

// 1. Define GraphQL schema
// services/finance/src/schema/invoice.graphql
type Invoice {
  id: ID!
  number: String!
  customer: Customer!
  amount: Float!
  status: InvoiceStatus!
}

// 2. Implement resolver
// services/finance/src/resolvers/invoice.resolver.ts
export const invoiceResolvers = {
  Query: {
    invoice: authenticated(
      authorized(['finance.invoices.read'])(
        async (_, { id }, context) => {
          return InvoiceService.findById(id, context.tenantId)
        }
      )
    )
  }
}

// 3. Add service logic
// services/finance/src/services/invoice.service.ts
export class InvoiceService {
  static async findById(id: string, tenantId: string): Promise<Invoice> {
    const invoice = await Invoice.findOne({ id, tenantId })

    if (!invoice) {
      throw new NotFoundError('Invoice not found')
    }

    return invoice
  }
}

// 4. Write tests
// services/finance/src/__tests__/invoice.test.ts
describe('InvoiceService', () => {
  it('should return invoice by id', async () => {
    const invoice = await InvoiceService.findById('123', 'tenant1')
    expect(invoice).toBeDefined()
    expect(invoice.id).toBe('123')
  })
})
```

### 6.3 Security Checklist

- [ ] All endpoints require authentication
- [ ] Authorization checks at resolver level
- [ ] Input validation and sanitization
- [ ] Rate limiting configured
- [ ] Sensitive data encryption
- [ ] Audit logging enabled
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens for mutations
- [ ] Security headers configured

### 6.4 Performance Best Practices

1. **Database Optimization**
   - Use DataLoader for N+1 query prevention
   - Implement pagination for large datasets
   - Create appropriate indexes
   - Use database connection pooling

2. **Caching Strategy**
   - Redis for session data
   - Query result caching
   - CDN for static assets
   - Browser caching headers

3. **API Optimization**
   - GraphQL query complexity analysis
   - Field-level resolvers
   - Batch operations
   - Response compression

## Conclusion

This comprehensive guide provides the foundation for secure, scalable integration patterns in Vextrus ERP. Following these patterns ensures:

- **Security**: OWASP compliance, strong authentication, comprehensive authorization
- **Scalability**: Microservices architecture, event-driven patterns, efficient caching
- **Reliability**: Circuit breakers, retry mechanisms, graceful degradation
- **Observability**: Distributed tracing, metrics, logging
- **Maintainability**: Clear patterns, comprehensive testing, documentation

Regular security audits and performance testing should be conducted to maintain system integrity.