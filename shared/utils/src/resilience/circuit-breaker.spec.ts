import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CircuitBreaker, CircuitState } from './circuit-breaker';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;
  let successFunction: () => Promise<string>;
  let failFunction: () => Promise<string>;

  beforeEach(() => {
    breaker = new CircuitBreaker('test-breaker', {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 100,
      resetTimeout: 500,
      volumeThreshold: 5,
      errorThresholdPercentage: 50
    });

    successFunction = vi.fn().mockResolvedValue('success');
    failFunction = vi.fn().mockRejectedValue(new Error('failure'));
  });

  describe('initial state', () => {
    it('should start in CLOSED state', () => {
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      expect(breaker.isClosed()).toBe(true);
      expect(breaker.isOpen()).toBe(false);
      expect(breaker.isHalfOpen()).toBe(false);
    });

    it('should have zero stats initially', () => {
      const stats = breaker.getStats();
      expect(stats.failures).toBe(0);
      expect(stats.successes).toBe(0);
      expect(stats.totalRequests).toBe(0);
      expect(stats.errorRate).toBe(0);
    });
  });

  describe('successful execution', () => {
    it('should execute function successfully when closed', async () => {
      const result = await breaker.execute(successFunction);
      expect(result).toBe('success');
      expect(successFunction).toHaveBeenCalled();
    });

    it('should track successful executions', async () => {
      await breaker.execute(successFunction);
      await breaker.execute(successFunction);
      
      const stats = breaker.getStats();
      expect(stats.successes).toBe(2);
      expect(stats.totalRequests).toBe(2);
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('failure handling', () => {
    it('should track failures', async () => {
      try {
        await breaker.execute(failFunction);
      } catch (e) {
        // Expected failure
      }

      const stats = breaker.getStats();
      expect(stats.failures).toBe(1);
      expect(stats.totalRequests).toBe(1);
    });

    it('should open circuit after failure threshold', async () => {
      // Fail 3 times to trigger opening
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(failFunction);
        } catch (e) {
          // Expected
        }
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);
      expect(breaker.isOpen()).toBe(true);
    });

    it('should use fallback when open', async () => {
      const fallback = vi.fn().mockResolvedValue('fallback');
      const breakerWithFallback = new CircuitBreaker('test', {
        failureThreshold: 1,
        fallbackFunction: fallback
      });

      // Open the circuit
      try {
        await breakerWithFallback.execute(failFunction);
      } catch (e) {
        // Expected
      }

      // Should use fallback
      const result = await breakerWithFallback.execute(successFunction);
      expect(result).toBe('fallback');
      expect(fallback).toHaveBeenCalled();
      expect(successFunction).not.toHaveBeenCalled();
    });
  });

  describe('half-open state', () => {
    it('should transition to half-open after reset timeout', async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(failFunction);
        } catch (e) {
          // Expected
        }
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 600));

      // Next execution should trigger half-open
      await breaker.execute(successFunction);
      
      // After first success in half-open, still half-open
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);
    });

    it('should close after success threshold in half-open', async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(failFunction);
        } catch (e) {
          // Expected
        }
      }

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 600));

      // Success threshold is 2
      await breaker.execute(successFunction);
      await breaker.execute(successFunction);

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should reopen on failure in half-open', async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(failFunction);
        } catch (e) {
          // Expected
        }
      }

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 600));

      // Trigger half-open with success
      await breaker.execute(successFunction);
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

      // Fail in half-open
      try {
        await breaker.execute(failFunction);
      } catch (e) {
        // Expected
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('timeout handling', () => {
    it('should timeout slow functions', async () => {
      const slowFunction = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('slow'), 200))
      );

      const breaker = new CircuitBreaker('timeout-test', {
        timeout: 50,
        failureThreshold: 2
      });

      try {
        await breaker.execute(slowFunction);
        expect.fail('Should have timed out');
      } catch (error: any) {
        expect(error.message).toContain('timed out');
      }

      const stats = breaker.getStats();
      expect(stats.failures).toBe(1);
    });
  });

  describe('error threshold percentage', () => {
    it('should open based on error percentage', async () => {
      const breaker = new CircuitBreaker('percentage-test', {
        failureThreshold: 100, // High threshold
        volumeThreshold: 4,
        errorThresholdPercentage: 50
      });

      // 2 successes, 2 failures = 50% error rate
      await breaker.execute(successFunction);
      await breaker.execute(successFunction);
      
      try {
        await breaker.execute(failFunction);
      } catch (e) {
        // Expected
      }
      
      // This should not open yet (not enough volume)
      expect(breaker.getState()).toBe(CircuitState.CLOSED);

      try {
        await breaker.execute(failFunction);
      } catch (e) {
        // Expected
      }

      // Now we have 4 requests with 50% error rate
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should calculate error rate correctly', async () => {
      // 3 successes, 2 failures
      await breaker.execute(successFunction);
      await breaker.execute(successFunction);
      await breaker.execute(successFunction);
      
      try {
        await breaker.execute(failFunction);
      } catch (e) {
        // Expected
      }
      
      try {
        await breaker.execute(failFunction);
      } catch (e) {
        // Expected
      }

      const stats = breaker.getStats();
      expect(stats.errorRate).toBe(40); // 2/5 = 40%
    });
  });

  describe('reset functionality', () => {
    it('should reset all stats', async () => {
      // Generate some stats
      await breaker.execute(successFunction);
      try {
        await breaker.execute(failFunction);
      } catch (e) {
        // Expected
      }

      breaker.reset();

      const stats = breaker.getStats();
      expect(stats.failures).toBe(0);
      expect(stats.successes).toBe(0);
      expect(stats.totalRequests).toBe(0);
      expect(stats.errorRate).toBe(0);
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('state change notifications', () => {
    it('should notify on state changes', async () => {
      const stateChanges: Array<{ from: CircuitState; to: CircuitState }> = [];
      
      const breaker = new CircuitBreaker('notify-test', {
        failureThreshold: 2,
        onStateChange: (from, to) => {
          stateChanges.push({ from, to });
        }
      });

      // Trigger opening
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(failFunction);
        } catch (e) {
          // Expected
        }
      }

      expect(stateChanges).toHaveLength(1);
      expect(stateChanges[0]).toEqual({
        from: CircuitState.CLOSED,
        to: CircuitState.OPEN
      });
    });
  });

  describe('decorator', () => {
    it('should work as a decorator', async () => {
      class TestService {
        callCount = 0;
        failCount = 0;

        @WithCircuitBreaker({ failureThreshold: 2 })
        async riskyOperation(): Promise<string> {
          this.callCount++;
          if (this.failCount < 2) {
            this.failCount++;
            throw new Error('Operation failed');
          }
          return 'success';
        }
      }

      const service = new TestService();

      // First two calls should fail
      for (let i = 0; i < 2; i++) {
        try {
          await service.riskyOperation();
        } catch (e) {
          // Expected
        }
      }

      // Circuit should be open, fallback should be used
      try {
        await service.riskyOperation();
        expect.fail('Should have used fallback');
      } catch (error: any) {
        expect(error.message).toContain('Circuit breaker is open');
      }

      expect(service.callCount).toBe(2); // Only two actual calls
    });
  });
});

// Import decorator for testing
import { WithCircuitBreaker } from './circuit-breaker';