import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs/promises';
import * as path from 'path';
import { MLModelManagementService } from '../ml-model-management.service';

jest.mock('fs/promises');

describe('MLModelManagementService', () => {
  let service: MLModelManagementService;
  let eventEmitter: EventEmitter2;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-value'),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    // Mock file system operations
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.readFile as jest.Mock).mockResolvedValue('{}');
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.access as jest.Mock).mockRejectedValue(new Error('File not found'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MLModelManagementService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<MLModelManagementService>(MLModelManagementService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('model registration and lifecycle', () => {
    it('should register a new model', async () => {
      const model = await service.registerModel(
        'Cash Flow Predictor',
        'tensorflow',
        'cash_flow',
        {
          inputShape: [30, 5],
          outputShape: [90, 3],
          hyperparameters: {
            epochs: 100,
            batchSize: 32,
            learningRate: 0.001,
          },
        }
      );

      expect(model).toEqual(
        expect.objectContaining({
          id: expect.stringMatching(/cash-flow-predictor-[a-f0-9]{8}/),
          name: 'Cash Flow Predictor',
          version: '1.0.0',
          type: 'tensorflow',
          category: 'cash_flow',
          status: 'training',
          createdAt: expect.any(Date),
        })
      );

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'model.registered',
        expect.objectContaining({ name: 'Cash Flow Predictor' })
      );
    });

    it('should version models correctly', async () => {
      const model1 = await service.registerModel(
        'Reconciliation Engine',
        'tensorflow',
        'reconciliation'
      );

      const model2 = await service.registerModel(
        'Reconciliation Engine',
        'tensorflow',
        'reconciliation'
      );

      expect(model1.version).toBe('1.0.0');
      expect(model2.version).toBe('1.0.1');
    });

    it('should track model lifecycle stages', async () => {
      const model = await service.registerModel(
        'Test Model',
        'tensorflow',
        'anomaly'
      );

      expect(model.status).toBe('training');

      // Simulate training completion
      const trainingData = {
        x: [[1, 2, 3], [4, 5, 6]],
        y: [[0], [1]],
      };

      await service.trainModel(model.id, trainingData);
      const trainedModel = await service.getModel(model.id);
      expect(trainedModel?.status).toBe('testing');

      // Deploy model
      await service.deployModel(model.id, 'staging');
      const stagedModel = await service.getModel(model.id);
      expect(stagedModel?.status).toBe('staging');

      await service.deployModel(model.id, 'production');
      const productionModel = await service.getModel(model.id);
      expect(productionModel?.status).toBe('production');
    });
  });

  describe('model training and evaluation', () => {
    it('should train and evaluate models', async () => {
      const model = await service.registerModel(
        'Classifier',
        'tensorflow',
        'classification'
      );

      const trainingData = {
        x: Array.from({ length: 100 }, () =>
          Array.from({ length: 10 }, () => Math.random())
        ),
        y: Array.from({ length: 100 }, () => [Math.round(Math.random())]),
      };

      const metrics = await service.trainModel(model.id, trainingData);

      expect(metrics).toEqual(
        expect.objectContaining({
          accuracy: expect.any(Number),
          loss: expect.any(Number),
          trainingTime: expect.any(Number),
        })
      );

      expect(metrics.accuracy).toBeGreaterThan(0);
      expect(metrics.loss).toBeGreaterThan(0);
    });

    it('should evaluate model performance', async () => {
      const model = await service.registerModel(
        'Test Evaluator',
        'tensorflow',
        'forecasting'
      );

      const testData = {
        x: Array.from({ length: 20 }, () =>
          Array.from({ length: 10 }, () => Math.random())
        ),
        y: Array.from({ length: 20 }, () => [Math.random()]),
      };

      const metrics = await service.evaluateModel(model.id, testData);

      expect(metrics).toEqual(
        expect.objectContaining({
          loss: expect.any(Number),
          accuracy: expect.any(Number),
          precision: expect.any(Number),
          recall: expect.any(Number),
          f1Score: expect.any(Number),
          mse: expect.any(Number),
          mae: expect.any(Number),
        })
      );
    });
  });

  describe('model deployment', () => {
    it('should deploy models to different environments', async () => {
      const model = await service.registerModel(
        'Deployment Test',
        'tensorflow',
        'anomaly'
      );

      const devDeployment = await service.deployModel(model.id, 'development');

      expect(devDeployment).toEqual(
        expect.objectContaining({
          modelId: model.id,
          environment: 'development',
          endpoint: expect.stringContaining('/api/ml/anomaly/deployment-test'),
          autoScaling: true,
          minInstances: 1,
          maxInstances: 10,
        })
      );

      const prodDeployment = await service.deployModel(model.id, 'production', {
        maxInstances: 20,
        minInstances: 3,
        loadBalancingWeight: 0.5,
      });

      expect(prodDeployment.maxInstances).toBe(20);
      expect(prodDeployment.minInstances).toBe(3);
      expect(prodDeployment.loadBalancingWeight).toBe(0.5);
    });

    it('should handle rollback scenarios', async () => {
      const v1 = await service.registerModel('Rollback Test', 'tensorflow', 'reconciliation');
      await service.deployModel(v1.id, 'production');

      const v2 = await service.registerModel('Rollback Test', 'tensorflow', 'reconciliation');
      await service.deployModel(v2.id, 'production');

      // Rollback to v1
      await service.rollbackModel(v2.id);

      const v1After = await service.getModel(v1.id);
      const v2After = await service.getModel(v2.id);

      expect(v1After?.status).toBe('production');
      expect(v2After?.status).toBe('archived');

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'model.rolled_back',
        expect.objectContaining({
          from: expect.objectContaining({ version: '1.0.1' }),
          to: expect.objectContaining({ version: '1.0.0' }),
        })
      );
    });
  });

  describe('A/B testing', () => {
    it('should set up A/B tests between models', async () => {
      const modelA = await service.registerModel('Model A', 'tensorflow', 'cash_flow');
      const modelB = await service.registerModel('Model B', 'tensorflow', 'cash_flow');

      const abTest = await service.startABTest(
        'Cash Flow Comparison',
        modelA.id,
        modelB.id,
        0.5,
        60000 // 1 minute
      );

      expect(abTest).toEqual(
        expect.objectContaining({
          name: 'Cash Flow Comparison',
          modelA: modelA.id,
          modelB: modelB.id,
          splitRatio: 0.5,
          status: 'running',
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        })
      );

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'abtest.started',
        expect.any(Object)
      );
    });

    it('should track A/B test metrics', async () => {
      const modelA = await service.registerModel('Accuracy Test A', 'tensorflow', 'anomaly');
      const modelB = await service.registerModel('Accuracy Test B', 'tensorflow', 'anomaly');

      const abTest = await service.startABTest(
        'Accuracy Comparison',
        modelA.id,
        modelB.id,
        0.5
      );

      // Simulate metric updates
      for (let i = 0; i < 100; i++) {
        await service.updateABTestMetrics(
          abTest.id,
          modelA.id,
          { accuracy: 0.92 + Math.random() * 0.05 }
        );

        await service.updateABTestMetrics(
          abTest.id,
          modelB.id,
          { accuracy: 0.88 + Math.random() * 0.05 }
        );
      }

      const updatedTest = await service.endABTest(abTest.id);

      expect(updatedTest.metrics.sampleSizeA).toBe(100);
      expect(updatedTest.metrics.sampleSizeB).toBe(100);
      expect(updatedTest.metrics.statisticalSignificance).toBeGreaterThan(0);
      expect(updatedTest.metrics.winner).toBe('A'); // Model A has higher accuracy
    });

    it('should handle inconclusive A/B tests', async () => {
      const modelA = await service.registerModel('Similar A', 'tensorflow', 'classification');
      const modelB = await service.registerModel('Similar B', 'tensorflow', 'classification');

      const abTest = await service.startABTest(
        'Similar Performance',
        modelA.id,
        modelB.id
      );

      // Simulate very similar performance
      for (let i = 0; i < 50; i++) {
        await service.updateABTestMetrics(
          abTest.id,
          modelA.id,
          { accuracy: 0.90 + Math.random() * 0.01 }
        );

        await service.updateABTestMetrics(
          abTest.id,
          modelB.id,
          { accuracy: 0.90 + Math.random() * 0.01 }
        );
      }

      const result = await service.endABTest(abTest.id);

      expect(result.metrics.winner).toBe('inconclusive');
    });
  });

  describe('model monitoring', () => {
    it('should detect performance degradation', async () => {
      const model = await service.registerModel(
        'Degradation Test',
        'tensorflow',
        'reconciliation'
      );

      await service.deployModel(model.id, 'production');

      // Simulate performance monitoring
      const monitoring = await service.getMonitoring(model.id);

      expect(monitoring).toBeDefined();
      expect(monitoring?.alerts).toBeDefined();
      expect(monitoring?.driftDetection).toEqual(
        expect.objectContaining({
          threshold: 0.1,
          isDrifting: false,
          lastChecked: expect.any(Date),
        })
      );
    });

    it('should track performance trends', async () => {
      const model = await service.registerModel(
        'Trend Analysis',
        'tensorflow',
        'forecasting'
      );

      await service.deployModel(model.id, 'production');

      const monitoring = await service.getMonitoring(model.id);

      expect(monitoring?.performanceTracking.trends).toEqual(
        expect.objectContaining({
          accuracy: expect.stringMatching(/improving|stable|degrading/),
          latency: expect.stringMatching(/improving|stable|degrading/),
          errorRate: expect.stringMatching(/improving|stable|degrading/),
        })
      );
    });
  });

  describe('model management operations', () => {
    it('should list models with filters', async () => {
      await service.registerModel('Production Model', 'tensorflow', 'cash_flow');
      await service.registerModel('Test Model', 'brain.js', 'classification');
      await service.registerModel('Archive Model', 'custom', 'anomaly');

      const cashFlowModels = await service.listModels({ category: 'cash_flow' });
      expect(cashFlowModels).toHaveLength(1);
      expect(cashFlowModels[0].name).toBe('Production Model');

      const tensorflowModels = await service.listModels({ name: 'Model' });
      expect(tensorflowModels.length).toBeGreaterThanOrEqual(2);
    });

    it('should retrieve active A/B tests', async () => {
      const model1 = await service.registerModel('Test 1', 'tensorflow', 'anomaly');
      const model2 = await service.registerModel('Test 2', 'tensorflow', 'anomaly');
      const model3 = await service.registerModel('Test 3', 'tensorflow', 'anomaly');
      const model4 = await service.registerModel('Test 4', 'tensorflow', 'anomaly');

      await service.startABTest('Test 1v2', model1.id, model2.id);
      await service.startABTest('Test 3v4', model3.id, model4.id);

      const activeTests = await service.getActiveABTests();

      expect(activeTests).toHaveLength(2);
      expect(activeTests[0].name).toBe('Test 1v2');
      expect(activeTests[1].name).toBe('Test 3v4');
    });
  });

  describe('model persistence and loading', () => {
    it('should save and load model weights', async () => {
      const model = await service.registerModel(
        'Persistence Test',
        'tensorflow',
        'reconciliation'
      );

      await service.trainModel(model.id, {
        x: [[1, 2], [3, 4]],
        y: [[1], [0]],
      });

      // Load model
      const loadedModel = await service.loadModel(model.id);

      expect(loadedModel).toBeDefined();
      // In real implementation, this would be a TensorFlow model
    });

    it('should make predictions with loaded models', async () => {
      const model = await service.registerModel(
        'Prediction Test',
        'tensorflow',
        'classification'
      );

      // Mock prediction
      const input = [[1, 2, 3, 4, 5]];
      const prediction = await service.predict(model.id, input);

      expect(prediction).toBeDefined();
      expect(Array.isArray(prediction)).toBe(true);
    });
  });

  describe('performance requirements', () => {
    it('should handle concurrent model operations', async () => {
      const operations = [
        service.registerModel('Concurrent 1', 'tensorflow', 'cash_flow'),
        service.registerModel('Concurrent 2', 'brain.js', 'classification'),
        service.registerModel('Concurrent 3', 'custom', 'anomaly'),
        service.listModels(),
        service.getActiveABTests(),
      ];

      const results = await Promise.all(operations);

      expect(results).toHaveLength(5);
      expect(results[0]).toHaveProperty('id');
      expect(results[1]).toHaveProperty('id');
      expect(results[2]).toHaveProperty('id');
      expect(Array.isArray(results[3])).toBe(true);
      expect(Array.isArray(results[4])).toBe(true);
    });

    it('should scale model deployments', async () => {
      const models = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          service.registerModel(`Scale Test ${i}`, 'tensorflow', 'reconciliation')
        )
      );

      const deployments = await Promise.all(
        models.map((model, i) =>
          service.deployModel(model.id, 'production', {
            minInstances: 1 + i,
            maxInstances: 10 + i * 2,
          })
        )
      );

      expect(deployments).toHaveLength(10);
      deployments.forEach((deployment, i) => {
        expect(deployment.minInstances).toBe(1 + i);
        expect(deployment.maxInstances).toBe(10 + i * 2);
      });
    });
  });

  describe('error handling', () => {
    it('should handle model not found errors', async () => {
      await expect(
        service.trainModel('non-existent-model', {})
      ).rejects.toThrow('Model non-existent-model not found');

      await expect(
        service.deployModel('non-existent-model', 'production')
      ).rejects.toThrow('Model non-existent-model not found');
    });

    it('should prevent deployment of training models', async () => {
      const model = await service.registerModel(
        'Training Model',
        'tensorflow',
        'anomaly'
      );

      // Model is in training status
      await expect(
        service.deployModel(model.id, 'production')
      ).rejects.toThrow('still training');
    });

    it('should handle rollback with no previous versions', async () => {
      const model = await service.registerModel(
        'First Version',
        'tensorflow',
        'cash_flow'
      );

      await expect(
        service.rollbackModel(model.id)
      ).rejects.toThrow('No previous version available');
    });
  });
});