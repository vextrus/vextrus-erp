export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerOptions {
  failureThreshold?: number; // Number of failures before opening
  successThreshold?: number; // Number of successes in half-open before closing
  timeout?: number; // Timeout for operations in ms
  resetTimeout?: number; // Time before attempting to close from open state in ms
  volumeThreshold?: number; // Minimum number of requests before calculating failure rate
  errorThresholdPercentage?: number; // Error percentage to open circuit
  fallbackFunction?: (...args: any[]) => Promise<any>;
  onStateChange?: (from: CircuitState, to: CircuitState) => void;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  totalRequests: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
  errorRate: number;
}

export class CircuitBreaker<T = any> {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private totalRequests: number = 0;
  private lastFailureTime?: Date;
  private nextAttemptTime?: Date;
  private requestHistory: boolean[] = [];
  
  private readonly options: Required<CircuitBreakerOptions>;
  
  constructor(
    private readonly name: string,
    options: CircuitBreakerOptions = {}
  ) {
    this.options = {
      failureThreshold: options.failureThreshold ?? 5,
      successThreshold: options.successThreshold ?? 3,
      timeout: options.timeout ?? 10000,
      resetTimeout: options.resetTimeout ?? 60000,
      volumeThreshold: options.volumeThreshold ?? 10,
      errorThresholdPercentage: options.errorThresholdPercentage ?? 50,
      fallbackFunction: options.fallbackFunction ?? (() => Promise.reject(new Error('Circuit breaker is open'))),
      onStateChange: options.onStateChange ?? (() => {})
    };
  }
  
  /**
   * Execute function with circuit breaker protection
   */
  async execute<R = T>(
    fn: (...args: any[]) => Promise<R>,
    ...args: any[]
  ): Promise<R> {
    // Check if circuit should be in half-open state
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        // Circuit is open, use fallback
        return this.options.fallbackFunction(...args) as Promise<R>;
      }
    }
    
    try {
      // Set timeout for the operation
      const result = await this.executeWithTimeout(fn, ...args);
      
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      
      // If circuit is now open, use fallback
      if (this.state === CircuitState.OPEN) {
        return this.options.fallbackFunction(...args) as Promise<R>;
      }
      
      throw error;
    }
  }
  
  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<R>(
    fn: (...args: any[]) => Promise<R>,
    ...args: any[]
  ): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${this.options.timeout}ms`));
      }, this.options.timeout);
      
      fn(...args)
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }
  
  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.totalRequests++;
    this.successCount++;
    this.recordRequest(true);
    
    switch (this.state) {
      case CircuitState.HALF_OPEN:
        if (this.successCount >= this.options.successThreshold) {
          this.transitionTo(CircuitState.CLOSED);
        }
        break;
        
      case CircuitState.CLOSED:
        // Reset failure count on success in closed state
        this.failureCount = 0;
        break;
    }
  }
  
  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.totalRequests++;
    this.failureCount++;
    this.lastFailureTime = new Date();
    this.recordRequest(false);
    
    switch (this.state) {
      case CircuitState.HALF_OPEN:
        // Single failure in half-open reopens the circuit
        this.transitionTo(CircuitState.OPEN);
        break;
        
      case CircuitState.CLOSED:
        // Check if we should open the circuit
        if (this.shouldOpen()) {
          this.transitionTo(CircuitState.OPEN);
        }
        break;
    }
  }
  
  /**
   * Check if circuit should open
   */
  private shouldOpen(): boolean {
    // Check failure threshold
    if (this.failureCount >= this.options.failureThreshold) {
      return true;
    }
    
    // Check error percentage
    if (this.requestHistory.length >= this.options.volumeThreshold) {
      const errorRate = this.calculateErrorRate();
      return errorRate >= this.options.errorThresholdPercentage;
    }
    
    return false;
  }
  
  /**
   * Check if we should attempt to reset from open state
   */
  private shouldAttemptReset(): boolean {
    if (!this.nextAttemptTime) {
      return true;
    }
    
    return new Date().getTime() >= this.nextAttemptTime.getTime();
  }
  
  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    
    // Reset counters based on new state
    switch (newState) {
      case CircuitState.CLOSED:
        this.failureCount = 0;
        this.successCount = 0;
        this.nextAttemptTime = undefined;
        break;
        
      case CircuitState.OPEN:
        this.successCount = 0;
        this.nextAttemptTime = new Date(Date.now() + this.options.resetTimeout);
        break;
        
      case CircuitState.HALF_OPEN:
        this.failureCount = 0;
        this.successCount = 0;
        break;
    }
    
    // Notify state change
    this.options.onStateChange(oldState, newState);
  }
  
  /**
   * Record request result for error rate calculation
   */
  private recordRequest(success: boolean): void {
    this.requestHistory.push(success);
    
    // Keep only recent history (last 100 requests)
    if (this.requestHistory.length > 100) {
      this.requestHistory.shift();
    }
  }
  
  /**
   * Calculate error rate percentage
   */
  private calculateErrorRate(): number {
    if (this.requestHistory.length === 0) {
      return 0;
    }
    
    const failures = this.requestHistory.filter(success => !success).length;
    return (failures / this.requestHistory.length) * 100;
  }
  
  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failureCount,
      successes: this.successCount,
      totalRequests: this.totalRequests,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      errorRate: this.calculateErrorRate()
    };
  }
  
  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.transitionTo(CircuitState.CLOSED);
    this.failureCount = 0;
    this.successCount = 0;
    this.totalRequests = 0;
    this.lastFailureTime = undefined;
    this.requestHistory = [];
  }
  
  /**
   * Get circuit state
   */
  getState(): CircuitState {
    return this.state;
  }
  
  /**
   * Check if circuit is open
   */
  isOpen(): boolean {
    return this.state === CircuitState.OPEN;
  }
  
  /**
   * Check if circuit is closed
   */
  isClosed(): boolean {
    return this.state === CircuitState.CLOSED;
  }
  
  /**
   * Check if circuit is half-open
   */
  isHalfOpen(): boolean {
    return this.state === CircuitState.HALF_OPEN;
  }
}

/**
 * Circuit breaker decorator
 */
export function WithCircuitBreaker(options: CircuitBreakerOptions & { name?: string } = {}) {
  const circuitBreakers = new Map<string, CircuitBreaker>();
  
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const breakerName = options.name || `${target.constructor.name}.${propertyName}`;
    
    descriptor.value = async function (...args: any[]) {
      // Get or create circuit breaker for this method
      if (!circuitBreakers.has(breakerName)) {
        circuitBreakers.set(breakerName, new CircuitBreaker(breakerName, options));
      }
      
      const breaker = circuitBreakers.get(breakerName)!;
      
      return breaker.execute(
        () => originalMethod.apply(this, args),
        ...args
      );
    };
    
    return descriptor;
  };
}