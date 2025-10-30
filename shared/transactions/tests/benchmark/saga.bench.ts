import { bench, describe } from 'vitest';
import { SagaOrchestrator, SagaBuilder } from '../../src/saga/saga-state-machine';
import { SagaRepository } from '../../src/saga/saga-repository';
import { Pool } from 'pg';
import { v4 as uuid } from 'uuid';

describe('Saga Performance', () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://vextrus:vextrus_dev_2024@localhost:5432/vextrus_test'
  });
  const repository = new SagaRepository(pool);

  bench('create and start saga', async () => {
    const saga = new SagaBuilder<{ orderId: string }>()
      .withName(`BenchSaga-${uuid()}`)
      .addStep('STEP1', async (ctx) => ({
        type: 'Step1Complete',
        data: { orderId: ctx.data.orderId },
        metadata: {}
      }))
      .build();

    const orchestrator = new SagaOrchestrator(saga.name, repository);
    Object.assign(orchestrator, saga);
    
    await orchestrator.start({ orderId: uuid() });
  });

  bench('saga with 5 steps', async () => {
    const sagaBuilder = new SagaBuilder<{ orderId: string }>()
      .withName(`BenchSaga5-${uuid()}`);
    
    for (let i = 1; i <= 5; i++) {
      sagaBuilder.addStep(`STEP${i}`, async (ctx) => ({
        type: `Step${i}Complete`,
        data: { orderId: ctx.data.orderId, step: i },
        metadata: {}
      }));
    }
    
    const saga = sagaBuilder.build();
    const orchestrator = new SagaOrchestrator(saga.name, repository);
    Object.assign(orchestrator, saga);
    
    const sagaId = await orchestrator.start({ orderId: uuid() });
    
    // Execute all steps
    for (let i = 1; i <= 5; i++) {
      await orchestrator.handleEvent(sagaId, {
        type: `Step${i}Complete`,
        data: { orderId: sagaId, step: i },
        metadata: {}
      });
    }
  });

  bench('saga with compensation', async () => {
    const saga = new SagaBuilder<{ orderId: string }>()
      .withName(`BenchCompSaga-${uuid()}`)
      .addStep('STEP1', async (ctx) => ({
        type: 'Step1Complete',
        data: { orderId: ctx.data.orderId },
        metadata: {}
      }))
      .addCompensation('STEP1', async (ctx) => {
        // Compensation logic
      })
      .build();

    const orchestrator = new SagaOrchestrator(saga.name, repository);
    Object.assign(orchestrator, saga);
    
    const sagaId = await orchestrator.start({ orderId: uuid() });
    await orchestrator.compensate(sagaId);
  });

  bench('concurrent saga execution (10 sagas)', async () => {
    const promises = Array.from({ length: 10 }, async (_, i) => {
      const saga = new SagaBuilder<{ orderId: string }>()
        .withName(`ConcurrentSaga-${uuid()}-${i}`)
        .addStep('STEP1', async (ctx) => ({
          type: 'StepComplete',
          data: { orderId: ctx.data.orderId },
          metadata: {}
        }))
        .build();

      const orchestrator = new SagaOrchestrator(saga.name, repository);
      Object.assign(orchestrator, saga);
      
      return orchestrator.start({ orderId: uuid() });
    });
    
    await Promise.all(promises);
  });

  bench('saga state persistence', async () => {
    const sagaId = uuid();
    const sagaState = {
      sagaId,
      sagaType: 'BenchmarkSaga',
      currentState: 'PROCESSING',
      data: { orderId: uuid(), amount: Math.random() * 1000 },
      status: 'ACTIVE' as const,
      version: 1,
      startedAt: new Date(),
      updatedAt: new Date(),
      correlationId: uuid(),
      completedSteps: ['STEP1', 'STEP2'],
      compensatedSteps: [],
      error: null
    };
    
    await repository.save(sagaState);
  });

  bench('saga state retrieval', async () => {
    const sagaId = uuid();
    // Setup: save a saga first
    await repository.save({
      sagaId,
      sagaType: 'RetrievalSaga',
      currentState: 'PROCESSING',
      data: { orderId: uuid() },
      status: 'ACTIVE',
      version: 1,
      startedAt: new Date(),
      updatedAt: new Date(),
      correlationId: uuid(),
      completedSteps: [],
      compensatedSteps: [],
      error: null
    });
    
    // Benchmark retrieval
    await repository.load(sagaId);
  });
});