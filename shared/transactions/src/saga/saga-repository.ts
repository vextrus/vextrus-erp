import { Pool } from 'pg';
import type { SagaState } from '../event-sourcing/types';
import { Trace, Metric } from '@vextrus/utils';

/**
 * Repository for saga state persistence
 */
export class SagaRepository {
  constructor(private readonly pool: Pool) {}

  /**
   * Save saga state
   */
  @Metric('saga.repository.save')
  async save(sagaState: SagaState): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      // Include executedSteps in the saga_data JSON
      const dataToStore = {
        ...(sagaState.data as any || {}),
        _executedSteps: sagaState.executedSteps || []
      };
      
      await client.query(
        `INSERT INTO saga_state 
         (id, saga_type, current_state, saga_data, version, correlation_id, 
          started_at, updated_at, completed_at, error_message, retry_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET
           current_state = EXCLUDED.current_state,
           saga_data = EXCLUDED.saga_data,
           version = EXCLUDED.version,
           updated_at = EXCLUDED.updated_at,
           completed_at = EXCLUDED.completed_at,
           error_message = EXCLUDED.error_message,
           retry_count = EXCLUDED.retry_count`,
        [
          sagaState.sagaId || sagaState.id,  // Support both field names
          sagaState.sagaType,
          sagaState.currentState,
          JSON.stringify(dataToStore),
          sagaState.version,
          sagaState.correlationId,
          sagaState.startedAt,
          sagaState.updatedAt,
          sagaState.completedAt || null,
          sagaState.errorMessage || sagaState.error || null,
          sagaState.retryCount || 0
        ]
      );
    } finally {
      client.release();
    }
  }

  /**
   * Load saga state by ID
   */
  @Metric('saga.repository.load')
  async load(sagaId: string): Promise<SagaState | null> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        `SELECT * FROM saga_state WHERE id = $1`,
        [sagaId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      // Map current_state to proper status
      const status = row.current_state === 'COMPLETED' ? 'COMPLETED' : 
                     row.current_state === 'compensated' ? 'COMPENSATED' :
                     row.current_state === 'FAILED' ? 'FAILED' : 'ACTIVE';
      
      // Extract executedSteps from saga_data if present
      const sagaData = row.saga_data || {};
      const executedSteps = sagaData._executedSteps || [];
      // Remove _executedSteps from data to avoid pollution
      const cleanData = { ...sagaData };
      delete cleanData._executedSteps;
      
      return {
        id: row.id,
        sagaId: row.id, // Add sagaId field
        sagaType: row.saga_type,
        currentState: row.current_state,
        status: status, // Use mapped status
        data: cleanData,
        executedSteps: executedSteps,
        version: row.version,
        correlationId: row.correlation_id,
        startedAt: row.started_at,
        updatedAt: row.updated_at,
        completedAt: row.completed_at,
        errorMessage: row.error_message,
        retryCount: row.retry_count
      };
    } finally {
      client.release();
    }
  }

  /**
   * Find saga by ID
   * Alias for load() for test compatibility
   */
  async findById(sagaId: string): Promise<SagaState | null> {
    return this.load(sagaId);
  }

  /**
   * Find sagas by correlation ID
   */
  @Metric('saga.repository.find-by-correlation')
  async findByCorrelationId(correlationId: string): Promise<SagaState[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        `SELECT * FROM saga_state WHERE correlation_id = $1 ORDER BY started_at`,
        [correlationId]
      );
      
      return result.rows.map(row => {
        // Extract executedSteps from saga_data if present
        const sagaData = row.saga_data || {};
        const executedSteps = sagaData._executedSteps || [];
        const cleanData = { ...sagaData };
        delete cleanData._executedSteps;
        
        // Map status from database string to union type
        const statusMap: Record<string, SagaState['status']> = {
          'ACTIVE': 'ACTIVE',
          'COMPLETED': 'COMPLETED',
          'FAILED': 'FAILED',
          'COMPENSATED': 'COMPENSATED',
          'STARTED': 'STARTED'
        };
        const status = statusMap[row.status] || 'ACTIVE';
        
        return {
          id: row.id,
          sagaId: row.id,
          sagaType: row.saga_type,
          currentState: row.current_state,
          status: status,
          data: cleanData,
          executedSteps: executedSteps,
          version: row.version,
          correlationId: row.correlation_id,
          startedAt: row.started_at,
          updatedAt: row.updated_at,
          completedAt: row.completed_at,
          errorMessage: row.error_message,
          retryCount: row.retry_count
        };
      });
    } finally {
      client.release();
    }
  }

  /**
   * Find active sagas by type
   */
  @Metric('saga.repository.find-active')
  async findActive(sagaType?: string): Promise<SagaState[]> {
    const client = await this.pool.connect();
    
    try {
      const query = sagaType
        ? `SELECT * FROM saga_state 
           WHERE saga_type = $1 AND completed_at IS NULL 
           ORDER BY started_at`
        : `SELECT * FROM saga_state 
           WHERE completed_at IS NULL 
           ORDER BY started_at`;
      
      const params = sagaType ? [sagaType] : [];
      const result = await client.query(query, params);
      
      return result.rows.map(row => {
        // Extract executedSteps from saga_data if present
        const sagaData = row.saga_data || {};
        const executedSteps = sagaData._executedSteps || [];
        const cleanData = { ...sagaData };
        delete cleanData._executedSteps;
        
        // Map status from database string to union type
        const statusMap: Record<string, SagaState['status']> = {
          'ACTIVE': 'ACTIVE',
          'COMPLETED': 'COMPLETED',
          'FAILED': 'FAILED',
          'COMPENSATED': 'COMPENSATED',
          'STARTED': 'STARTED'
        };
        const status = statusMap[row.status] || 'ACTIVE';
        
        return {
          id: row.id,
          sagaId: row.id,
          sagaType: row.saga_type,
          currentState: row.current_state,
          status: status,
          data: cleanData,
          executedSteps: executedSteps,
          version: row.version,
          correlationId: row.correlation_id,
          startedAt: row.started_at,
          updatedAt: row.updated_at,
          completedAt: row.completed_at,
          errorMessage: row.error_message,
          retryCount: row.retry_count
        };
      });
    } finally {
      client.release();
    }
  }

  /**
   * Find stale sagas that need timeout handling
   */
  @Metric('saga.repository.find-stale')
  async findStale(timeoutMinutes: number = 30): Promise<SagaState[]> {
    const client = await this.pool.connect();
    
    try {
      const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);
      
      const result = await client.query(
        `SELECT * FROM saga_state 
         WHERE completed_at IS NULL 
         AND updated_at < $1 
         ORDER BY updated_at`,
        [cutoffTime]
      );
      
      return result.rows.map(row => {
        // Map current_state to proper status
        const status = row.current_state === 'COMPLETED' ? 'COMPLETED' : 
                       row.current_state === 'compensated' ? 'COMPENSATED' :
                       row.current_state === 'FAILED' ? 'FAILED' : 'ACTIVE';
        
        // Extract executedSteps from saga_data if present
        const sagaData = row.saga_data || {};
        const executedSteps = sagaData._executedSteps || [];
        const cleanData = { ...sagaData };
        delete cleanData._executedSteps;
        
        return {
          id: row.id,
          sagaId: row.id, // Add sagaId for backward compatibility
          sagaType: row.saga_type,
          currentState: row.current_state,
          status: status, // Use mapped status
          data: cleanData,
          executedSteps: executedSteps,
          version: row.version,
          correlationId: row.correlation_id,
          startedAt: row.started_at,
          updatedAt: row.updated_at,
          completedAt: row.completed_at,
          errorMessage: row.error_message,
          retryCount: row.retry_count
        };
      });
    } finally {
      client.release();
    }
  }

  /**
   * Update saga state with optimistic locking
   */
  @Metric('saga.repository.update')
  async update(sagaState: SagaState, expectedVersion?: number): Promise<boolean> {
    const client = await this.pool.connect();
    
    try {
      // Include executedSteps in the saga_data JSON
      const dataToStore = {
        ...(sagaState.data as any || {}),
        _executedSteps: sagaState.executedSteps || []
      };
      
      // If no expectedVersion provided, skip optimistic locking
      let query: string;
      let params: any[];
      
      if (expectedVersion !== undefined) {
        // Use optimistic locking
        query = `UPDATE saga_state SET
           current_state = $2,
           saga_data = $3,
           version = $4,
           updated_at = $5,
           completed_at = $6,
           error_message = $7,
           retry_count = $8
         WHERE id = $1 AND version = $9`;
        params = [
          sagaState.sagaId || sagaState.id, // Support both field names
          sagaState.currentState,
          JSON.stringify(dataToStore),
          sagaState.version,
          sagaState.updatedAt,
          sagaState.completedAt || null,
          sagaState.errorMessage || sagaState.error || null,
          sagaState.retryCount || 0,
          expectedVersion
        ];
      } else {
        // Update without version check
        query = `UPDATE saga_state SET
           current_state = $2,
           saga_data = $3,
           version = $4,
           updated_at = $5,
           completed_at = $6,
           error_message = $7,
           retry_count = $8
         WHERE id = $1`;
        params = [
          sagaState.sagaId || sagaState.id, // Support both field names
          sagaState.currentState,
          JSON.stringify(dataToStore),
          sagaState.version,
          sagaState.updatedAt,
          sagaState.completedAt || null,
          sagaState.errorMessage || sagaState.error || null,
          sagaState.retryCount || 0
        ];
      }
      
      const result = await client.query(query, params);
      
      return (result.rowCount || 0) > 0;
    } finally {
      client.release();
    }
  }

  /**
   * Delete completed sagas older than retention period
   */
  @Metric('saga.repository.cleanup')
  async cleanup(retentionDays: number = 30): Promise<number> {
    const client = await this.pool.connect();
    
    try {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      
      const result = await client.query(
        `DELETE FROM saga_state 
         WHERE completed_at IS NOT NULL 
         AND completed_at < $1`,
        [cutoffDate]
      );
      
      return result.rowCount || 0;
    } finally {
      client.release();
    }
  }
}