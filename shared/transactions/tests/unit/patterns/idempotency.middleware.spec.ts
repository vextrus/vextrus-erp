import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Pool } from 'pg';
import { IdempotencyService } from '../../../src/patterns/idempotency.middleware';
import type { IdempotencyOptions } from '../../../src/patterns/idempotency.middleware';

// Mock pg
vi.mock('pg', () => {
  const mockClient = {
    query: vi.fn(),
    release: vi.fn(),
  };
  
  const mockPool = {
    connect: vi.fn().mockResolvedValue(mockClient),
    query: vi.fn(),
    end: vi.fn(),
  };
  
  return {
    Pool: vi.fn(() => mockPool),
  };
});

describe('IdempotencyService', () => {
  let service: IdempotencyService;
  let mockPool: any;
  let mockClient: any;
  const options: IdempotencyOptions = {
    keyHeader: 'X-Idempotency-Key',
    ttlHours: 24,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPool = new Pool({} as any);
    mockClient = {
      query: vi.fn(),
      release: vi.fn(),
    };
    mockPool.connect.mockResolvedValue(mockClient);
    service = new IdempotencyService(mockPool, options);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('check', () => {
    it('should return cache miss for new idempotency key', async () => {
      const key = 'test-key-123';
      const requestData = { amount: 100, currency: 'USD' };

      mockClient.query.mockResolvedValueOnce({ rows: [] }); // No existing key
      mockClient.query.mockResolvedValueOnce({}); // INSERT new key

      const result = await service.check(key, requestData);

      expect(result.isNew).toBe(true);
      expect(result.status).toBeUndefined();
      expect(result.response).toBeUndefined();
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining([key])
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return cached response for existing completed request', async () => {
      const key = 'test-key-456';
      const requestData = { amount: 200, currency: 'USD' };
      const cachedResponse = { success: true, orderId: 'order-789' };
      
      // Calculate the expected hash that the service will generate
      const expectedHash = require('crypto').createHash('sha256').update(JSON.stringify(requestData)).digest('hex');
      
      mockClient.query.mockResolvedValueOnce({
        rows: [{
          key: 'test-key-456',
          request_hash: expectedHash,
          response: cachedResponse,
          status: 'COMPLETED',
          created_at: new Date(),
        }],
      });

      const result = await service.check(key, requestData);

      expect(result.isNew).toBe(false);
      expect(result.status).toBe('COMPLETED');
      expect(result.response).toEqual(cachedResponse);
    });

    it('should detect duplicate request with different data', async () => {
      const key = 'test-key-789';
      const originalHash = 'original-hash';
      const newData = { amount: 200 };
      
      // Mock crypto.createHash
      const createHashSpy = vi.spyOn(require('crypto'), 'createHash');
      createHashSpy.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue('new-hash'),
      } as any);

      mockClient.query.mockResolvedValueOnce({
        rows: [{
          key,
          request_hash: originalHash,
          status: 'PROCESSING',
        }],
      });

      await expect(service.check(key, newData)).rejects.toThrow(
        'Idempotency key exists with different request data'
      );
      
      // Restore the crypto mock
      createHashSpy.mockRestore();
    });

    it('should handle processing status', async () => {
      const key = 'test-key-processing';
      
      mockClient.query.mockResolvedValueOnce({
        rows: [{
          key,
          request_hash: 'hash',
          status: 'PROCESSING',
          created_at: new Date(),
        }],
      });

      const result = await service.check(key);

      expect(result.exists).toBe(true);
      expect(result.status).toBe('PROCESSING');
      expect(result.response).toBeUndefined();
    });

    it('should handle failed status', async () => {
      const key = 'test-key-failed';
      const errorResponse = { error: 'Payment failed' };
      
      mockClient.query.mockResolvedValueOnce({
        rows: [{
          key,
          request_hash: 'hash',
          status: 'FAILED',
          response: errorResponse,
        }],
      });

      const result = await service.check(key);

      expect(result.exists).toBe(true);
      expect(result.status).toBe('FAILED');
      expect(result.response).toEqual(errorResponse);
    });
  });

  describe('store', () => {
    it('should store new idempotency key', async () => {
      const key = 'store-key-123';
      const requestData = { amount: 300 };

      mockClient.query.mockResolvedValueOnce({}); // BEGIN
      mockClient.query.mockResolvedValueOnce({ rowCount: 1 }); // INSERT
      mockClient.query.mockResolvedValueOnce({}); // COMMIT

      await service.store(key, requestData);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO idempotency_keys'),
        expect.arrayContaining([key, expect.any(String), 'PROCESSING'])
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should handle duplicate key insertion', async () => {
      const key = 'duplicate-key';
      const requestData = { amount: 400 };

      mockClient.query.mockResolvedValueOnce({}); // BEGIN
      mockClient.query.mockRejectedValueOnce({ code: '23505' }); // Unique violation
      mockClient.query.mockResolvedValueOnce({}); // ROLLBACK

      // Should not throw, just silently handle duplicate
      await service.store(key, requestData);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should rollback on error', async () => {
      const key = 'error-key';
      const requestData = { amount: 500 };

      mockClient.query.mockResolvedValueOnce({}); // BEGIN
      mockClient.query.mockRejectedValueOnce(new Error('Database error')); // INSERT fails
      mockClient.query.mockResolvedValueOnce({}); // ROLLBACK

      await expect(service.store(key, requestData)).rejects.toThrow('Database error');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('complete', () => {
    it('should mark request as completed with response', async () => {
      const key = 'complete-key';
      const response = { success: true, id: 'result-123' };

      mockClient.query.mockResolvedValueOnce({ rowCount: 1 }); // UPDATE

      await service.complete(key, response);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE idempotency_keys'),
        expect.arrayContaining([key, response, 'COMPLETED'])
      );
    });

    it('should handle non-existent key', async () => {
      const key = 'non-existent-key';
      const response = { data: 'test' };

      mockClient.query.mockResolvedValueOnce({ rowCount: 0 }); // UPDATE returns 0 rows

      await service.complete(key, response);

      // Should complete without error even if key doesn't exist
      expect(mockClient.query).toHaveBeenCalled();
    });
  });

  describe('fail', () => {
    it('should mark request as failed with error', async () => {
      const key = 'fail-key';
      const error = { error: 'Validation failed', code: 'INVALID_INPUT' };

      mockClient.query.mockResolvedValueOnce({ rowCount: 1 }); // UPDATE

      await service.fail(key, error);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE idempotency_keys'),
        expect.arrayContaining([key, error, 'FAILED'])
      );
    });
  });

  describe('cleanup', () => {
    it('should cleanup expired keys', async () => {
      mockClient.query.mockResolvedValueOnce({ rowCount: 5 }); // DELETE

      const deleted = await service.cleanup();

      expect(deleted).toBe(5);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM idempotency_keys WHERE expires_at < NOW()')
      );
    });

    it('should handle cleanup with no expired keys', async () => {
      mockClient.query.mockResolvedValueOnce({ rowCount: 0 }); // DELETE

      const deleted = await service.cleanup();

      expect(deleted).toBe(0);
    });
  });

  describe('middleware', () => {
    it('should create express middleware', () => {
      const middleware = service.middleware();
      
      expect(middleware).toBeInstanceOf(Function);
      expect(middleware.length).toBe(3); // req, res, next
    });

    it('should process request with idempotency key', async () => {
      const middleware = service.middleware();
      const req = {
        headers: { 'x-idempotency-key': 'middleware-key' },
        body: { data: 'test' },
        method: 'POST',
        path: '/test',
        query: {}
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
        on: vi.fn(),
      };
      const next = vi.fn();

      // Mock service.check to return cache miss
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // SELECT query
      mockClient.query.mockResolvedValueOnce({}); // INSERT query

      await middleware(req as any, res as any, next);


      expect(next).toHaveBeenCalled();
      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });

    it('should return cached response for duplicate request', async () => {
      const middleware = service.middleware();
      const cachedResponse = { cached: true, data: 'cached-data' };
      const req = {
        headers: { 'x-idempotency-key': 'cached-key' },
        body: { data: 'test' },
        method: 'POST',
        path: '/test',
        query: {}
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
        setHeader: vi.fn(),
      };
      const next = vi.fn();

      // Calculate the expected hash that the middleware will generate
      const requestData = { body: { data: 'test' }, query: {}, method: 'POST', path: '/test' };
      const expectedHash = require('crypto').createHash('sha256').update(JSON.stringify(requestData)).digest('hex');

      // Mock service.check to return cached response
      mockClient.query.mockResolvedValueOnce({
        rows: [{
          key: 'cached-key',
          request_hash: expectedHash,
          response: cachedResponse,
          status: 'COMPLETED',
        }],
      });

      await middleware(req as any, res as any, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith('X-Idempotent-Replayed', 'true');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(cachedResponse);
    });

    it('should pass through request without idempotency key', async () => {
      const middleware = service.middleware();
      const req = {
        headers: {},
        body: { data: 'test' },
      };
      const res = {};
      const next = vi.fn();

      await middleware(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
      expect(mockClient.query).not.toHaveBeenCalled();
    });
  });

  describe('decorator', () => {
    it('should create method decorator', () => {
      const decorator = IdempotencyService.decorator('test-key');
      
      expect(decorator).toBeInstanceOf(Function);
      
      // Test decorator application
      class TestClass {
        @decorator
        async testMethod() {
          return { result: 'test' };
        }
      }
      
      const instance = new TestClass();
      expect(instance.testMethod).toBeInstanceOf(Function);
    });
  });
});