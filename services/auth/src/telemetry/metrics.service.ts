import { Injectable } from '@nestjs/common';
import { metrics } from '@opentelemetry/api';
import { Counter, Histogram, UpDownCounter, ObservableGauge } from '@opentelemetry/api';

@Injectable()
export class MetricsService {
  private readonly meter = metrics.getMeter('auth-service', '1.0.0');
  
  // Authentication metrics
  private loginAttemptsCounter: Counter;
  private loginSuccessCounter: Counter;
  private loginFailureCounter: Counter;
  private tokenRefreshCounter: Counter;
  private logoutCounter: Counter;
  
  // Performance metrics
  private authResponseTimeHistogram: Histogram;
  private tokenGenerationTimeHistogram: Histogram;
  private databaseQueryTimeHistogram: Histogram;
  
  // Session metrics
  private activeSessionsGauge: UpDownCounter;
  private sessionStore: Map<string, { userId: string; createdAt: Date }> = new Map();
  
  // Error metrics
  private authErrorCounter: Counter;
  private validationErrorCounter: Counter;
  
  constructor() {
    this.initializeMetrics();
  }
  
  private initializeMetrics() {
    // Authentication counters
    this.loginAttemptsCounter = this.meter.createCounter('auth.login.attempts', {
      description: 'Total number of login attempts',
    });
    
    this.loginSuccessCounter = this.meter.createCounter('auth.login.success', {
      description: 'Number of successful logins',
    });
    
    this.loginFailureCounter = this.meter.createCounter('auth.login.failure', {
      description: 'Number of failed logins',
    });
    
    this.tokenRefreshCounter = this.meter.createCounter('auth.token.refresh', {
      description: 'Number of token refresh operations',
    });
    
    this.logoutCounter = this.meter.createCounter('auth.logout', {
      description: 'Number of logout operations',
    });
    
    // Performance histograms
    this.authResponseTimeHistogram = this.meter.createHistogram('auth.response.time', {
      description: 'Authentication response time in milliseconds',
      unit: 'ms',
    });
    
    this.tokenGenerationTimeHistogram = this.meter.createHistogram('auth.token.generation.time', {
      description: 'Token generation time in milliseconds',
      unit: 'ms',
    });
    
    this.databaseQueryTimeHistogram = this.meter.createHistogram('auth.database.query.time', {
      description: 'Database query time in milliseconds',
      unit: 'ms',
    });
    
    // Session gauge
    this.activeSessionsGauge = this.meter.createUpDownCounter('auth.sessions.active', {
      description: 'Number of active user sessions',
    });
    
    // Observable gauge for session details
    this.meter.createObservableGauge('auth.sessions.by_age', {
      description: 'Active sessions grouped by age',
    }).addCallback((observableResult) => {
      const now = new Date();
      let under1Hour = 0;
      let under24Hours = 0;
      let over24Hours = 0;
      
      this.sessionStore.forEach((session) => {
        const ageMs = now.getTime() - session.createdAt.getTime();
        const ageHours = ageMs / (1000 * 60 * 60);
        
        if (ageHours < 1) {
          under1Hour++;
        } else if (ageHours < 24) {
          under24Hours++;
        } else {
          over24Hours++;
        }
      });
      
      observableResult.observe(under1Hour, { age_group: 'under_1h' });
      observableResult.observe(under24Hours, { age_group: '1h_to_24h' });
      observableResult.observe(over24Hours, { age_group: 'over_24h' });
    });
    
    // Error counters
    this.authErrorCounter = this.meter.createCounter('auth.errors', {
      description: 'Number of authentication errors',
    });
    
    this.validationErrorCounter = this.meter.createCounter('auth.validation.errors', {
      description: 'Number of validation errors',
    });
  }
  
  // Login metrics
  recordLoginAttempt(email: string, success: boolean, reason?: string) {
    this.loginAttemptsCounter.add(1, { email_domain: this.extractDomain(email) });
    
    if (success) {
      this.loginSuccessCounter.add(1, { email_domain: this.extractDomain(email) });
    } else {
      this.loginFailureCounter.add(1, { 
        email_domain: this.extractDomain(email),
        failure_reason: reason || 'unknown'
      });
    }
  }
  
  // Token metrics
  recordTokenRefresh(userId: string, success: boolean) {
    this.tokenRefreshCounter.add(1, { 
      success: success.toString(),
      user_id: userId 
    });
  }
  
  recordTokenGenerationTime(durationMs: number, tokenType: 'access' | 'refresh') {
    this.tokenGenerationTimeHistogram.record(durationMs, { token_type: tokenType });
  }
  
  // Session metrics
  recordSessionStart(sessionId: string, userId: string) {
    this.sessionStore.set(sessionId, { userId, createdAt: new Date() });
    this.activeSessionsGauge.add(1);
  }
  
  recordSessionEnd(sessionId: string) {
    if (this.sessionStore.delete(sessionId)) {
      this.activeSessionsGauge.add(-1);
    }
  }
  
  recordLogout(userId: string) {
    this.logoutCounter.add(1, { user_id: userId });
  }
  
  // Performance metrics
  recordResponseTime(operation: string, durationMs: number, statusCode: number) {
    this.authResponseTimeHistogram.record(durationMs, {
      operation,
      status_code: statusCode.toString(),
      status_category: this.getStatusCategory(statusCode),
    });
  }
  
  recordDatabaseQueryTime(operation: string, durationMs: number) {
    this.databaseQueryTimeHistogram.record(durationMs, { operation });
  }
  
  // Error metrics
  recordAuthError(errorType: string, operation: string) {
    this.authErrorCounter.add(1, { 
      error_type: errorType,
      operation 
    });
  }
  
  recordValidationError(field: string, operation: string) {
    this.validationErrorCounter.add(1, { 
      field,
      operation 
    });
  }
  
  // Utility methods
  private extractDomain(email: string): string {
    const parts = email.split('@');
    return parts.length === 2 && parts[1] ? parts[1] : 'unknown';
  }
  
  private getStatusCategory(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return '2xx';
    if (statusCode >= 300 && statusCode < 400) return '3xx';
    if (statusCode >= 400 && statusCode < 500) return '4xx';
    if (statusCode >= 500) return '5xx';
    return 'unknown';
  }
  
  // Method to create a timer for measuring durations
  startTimer(): { end: (labels?: Record<string, string>) => number } {
    const startTime = Date.now();
    return {
      end: (labels?: Record<string, string>) => {
        const duration = Date.now() - startTime;
        return duration;
      }
    };
  }
}