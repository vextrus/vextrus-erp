import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { performance } from 'perf_hooks';

interface ModelMetadata {
  id: string;
  name: string;
  version: string;
  type: 'tensorflow' | 'brain.js' | 'custom';
  category: 'reconciliation' | 'cash_flow' | 'anomaly' | 'classification' | 'forecasting';
  createdAt: Date;
  updatedAt: Date;
  deployedAt?: Date;
  status: 'training' | 'testing' | 'staging' | 'production' | 'archived';
  metrics: ModelMetrics;
  config: ModelConfig;
  changelog: ModelChange[];
}

interface ModelMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  loss?: number;
  mse?: number;
  mae?: number;
  trainingTime?: number;
  inferenceTime?: number;
  datasetSize?: number;
  customMetrics?: Record<string, number>;
}

interface ModelConfig {
  architecture?: any;
  hyperparameters?: Record<string, any>;
  trainingConfig?: any;
  preprocessingSteps?: string[];
  postprocessingSteps?: string[];
  inputShape?: number[];
  outputShape?: number[];
}

interface ModelChange {
  timestamp: Date;
  action: 'created' | 'updated' | 'deployed' | 'rolled_back' | 'archived';
  description: string;
  performedBy?: string;
  previousVersion?: string;
  metrics?: Partial<ModelMetrics>;
}

interface ABTestConfig {
  id: string;
  name: string;
  modelA: string; // Model ID
  modelB: string; // Model ID
  splitRatio: number; // 0-1, percentage for model A
  startDate: Date;
  endDate?: Date;
  metrics: ABTestMetrics;
  status: 'running' | 'completed' | 'cancelled';
}

interface ABTestMetrics {
  modelAPerformance: ModelMetrics;
  modelBPerformance: ModelMetrics;
  sampleSizeA: number;
  sampleSizeB: number;
  statisticalSignificance?: number;
  winner?: 'A' | 'B' | 'inconclusive';
}

interface ModelDeployment {
  modelId: string;
  environment: 'development' | 'staging' | 'production';
  endpoint?: string;
  loadBalancingWeight?: number;
  maxInstances?: number;
  minInstances?: number;
  autoScaling?: boolean;
  healthCheck?: {
    interval: number;
    timeout: number;
    threshold: number;
  };
}

interface ModelMonitoring {
  modelId: string;
  alerts: MonitoringAlert[];
  driftDetection: DriftMetrics;
  performanceTracking: PerformanceTracking;
}

interface MonitoringAlert {
  id: string;
  type: 'performance_degradation' | 'data_drift' | 'high_latency' | 'error_rate';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  metrics?: Record<string, any>;
}

interface DriftMetrics {
  featureDrift: Record<string, number>;
  conceptDrift: number;
  lastChecked: Date;
  threshold: number;
  isDrifting: boolean;
}

interface PerformanceTracking {
  hourlyMetrics: Record<string, ModelMetrics>;
  dailyMetrics: Record<string, ModelMetrics>;
  trends: {
    accuracy: 'improving' | 'stable' | 'degrading';
    latency: 'improving' | 'stable' | 'degrading';
    errorRate: 'improving' | 'stable' | 'degrading';
  };
}

@Injectable()
export class MLModelManagementService implements OnModuleInit {
  private readonly logger = new Logger(MLModelManagementService.name);
  private models: Map<string, ModelMetadata> = new Map();
  private deployments: Map<string, ModelDeployment> = new Map();
  private activeABTests: Map<string, ABTestConfig> = new Map();
  private monitoring: Map<string, ModelMonitoring> = new Map();
  private modelInstances: Map<string, tf.LayersModel | any> = new Map();
  private readonly modelsDirectory = './models';
  private readonly metricsDirectory = './metrics';

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    await this.initializeDirectories();
    await this.loadExistingModels();
    await this.startMonitoring();
  }

  private async initializeDirectories() {
    try {
      await fs.mkdir(this.modelsDirectory, { recursive: true });
      await fs.mkdir(this.metricsDirectory, { recursive: true });
      await fs.mkdir(path.join(this.modelsDirectory, 'archive'), { recursive: true });
      await fs.mkdir(path.join(this.modelsDirectory, 'staging'), { recursive: true });
      await fs.mkdir(path.join(this.modelsDirectory, 'production'), { recursive: true });
    } catch (error) {
      this.logger.error('Failed to initialize directories:', error);
    }
  }

  private async loadExistingModels() {
    try {
      const metadataPath = path.join(this.modelsDirectory, 'metadata.json');
      const metadataExists = await fs.access(metadataPath).then(() => true).catch(() => false);

      if (metadataExists) {
        const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
        for (const model of metadata.models) {
          model.createdAt = new Date(model.createdAt);
          model.updatedAt = new Date(model.updatedAt);
          if (model.deployedAt) model.deployedAt = new Date(model.deployedAt);
          this.models.set(model.id, model);
        }

        if (metadata.deployments) {
          for (const deployment of metadata.deployments) {
            this.deployments.set(deployment.modelId, deployment);
          }
        }

        this.logger.log(`Loaded ${this.models.size} models from metadata`);
      }
    } catch (error) {
      this.logger.error('Failed to load existing models:', error);
    }
  }

  async registerModel(
    name: string,
    type: 'tensorflow' | 'brain.js' | 'custom',
    category: ModelMetadata['category'],
    config?: ModelConfig,
  ): Promise<ModelMetadata> {
    const modelId = this.generateModelId(name);
    const version = await this.generateVersion(name);

    const metadata: ModelMetadata = {
      id: modelId,
      name,
      version,
      type,
      category,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'training',
      metrics: {},
      config: config || {},
      changelog: [{
        timestamp: new Date(),
        action: 'created',
        description: `Model ${name} v${version} created`,
      }],
    };

    this.models.set(modelId, metadata);
    await this.saveMetadata();

    this.eventEmitter.emit('model.registered', metadata);
    this.logger.log(`Registered model: ${name} v${version}`);

    return metadata;
  }

  async trainModel(
    modelId: string,
    trainingData: any,
    validationData?: any,
    callbacks?: any,
  ): Promise<ModelMetrics> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const startTime = performance.now();
    let metrics: ModelMetrics = {};

    try {
      model.status = 'training';
      model.updatedAt = new Date();

      // Training logic would be implemented based on model type
      if (model.type === 'tensorflow') {
        // TensorFlow training
        const tfModel = this.modelInstances.get(modelId) as tf.LayersModel;
        if (tfModel) {
          const history = await tfModel.fit(trainingData.x, trainingData.y, {
            epochs: model.config.hyperparameters?.epochs || 100,
            batchSize: model.config.hyperparameters?.batchSize || 32,
            validationData: validationData ? [validationData.x, validationData.y] : undefined,
            callbacks: {
              onEpochEnd: (epoch, logs) => {
                this.eventEmitter.emit('model.training.epoch', {
                  modelId,
                  epoch,
                  logs,
                });
              },
              ...callbacks,
            },
          });

          // Extract accuracy and loss values from history
          let accuracy: number | undefined;
          let loss: number | undefined;

          if (history.history.accuracy || history.history.acc) {
            const accuracyValues = history.history.accuracy || history.history.acc;
            const lastAccuracy = accuracyValues[accuracyValues.length - 1];
            // Check if it's a tensor and extract data, otherwise use as number
            accuracy = (lastAccuracy && typeof lastAccuracy === 'object' && 'dataSync' in lastAccuracy)
              ? (lastAccuracy as tf.Tensor).dataSync()[0]
              : lastAccuracy as number;
          }

          if (history.history.loss) {
            const lastLoss = history.history.loss[history.history.loss.length - 1];
            // Check if it's a tensor and extract data, otherwise use as number
            loss = (lastLoss && typeof lastLoss === 'object' && 'dataSync' in lastLoss)
              ? (lastLoss as tf.Tensor).dataSync()[0]
              : lastLoss as number;
          }

          metrics = {
            accuracy,
            loss,
            trainingTime: performance.now() - startTime,
          };
        }
      } else if (model.type === 'brain.js') {
        // Brain.js training would be implemented here
      }

      model.metrics = { ...model.metrics, ...metrics };
      model.status = 'testing';
      model.changelog.push({
        timestamp: new Date(),
        action: 'updated',
        description: `Training completed with accuracy: ${metrics.accuracy?.toFixed(4)}`,
        metrics,
      });

      await this.saveModel(modelId);
      await this.saveMetadata();

      this.eventEmitter.emit('model.trained', { modelId, metrics });
      return metrics;

    } catch (error) {
      this.logger.error(`Failed to train model ${modelId}:`, error);
      model.status = 'training';
      throw error;
    }
  }

  async evaluateModel(
    modelId: string,
    testData: any,
  ): Promise<ModelMetrics> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const startTime = performance.now();
    let metrics: ModelMetrics = {};

    try {
      if (model.type === 'tensorflow') {
        const tfModel = this.modelInstances.get(modelId) as tf.LayersModel;
        if (tfModel) {
          const evaluation = tfModel.evaluate(testData.x, testData.y) as tf.Tensor[];
          const loss = await evaluation[0].data();
          const accuracy = evaluation.length > 1 ? await evaluation[1].data() : undefined;

          metrics = {
            loss: loss[0],
            accuracy: accuracy?.[0],
            inferenceTime: performance.now() - startTime,
            datasetSize: testData.x.shape[0],
          };

          // Calculate additional metrics
          const predictions = tfModel.predict(testData.x) as tf.Tensor;
          const predData = await predictions.data();
          const trueData = await testData.y.data();

          metrics = {
            ...metrics,
            ...this.calculateMetrics(Array.from(predData), Array.from(trueData)),
          };

          predictions.dispose();
          evaluation.forEach(t => t.dispose());
        }
      }

      model.metrics = { ...model.metrics, ...metrics };
      await this.saveMetadata();

      this.eventEmitter.emit('model.evaluated', { modelId, metrics });
      return metrics;

    } catch (error) {
      this.logger.error(`Failed to evaluate model ${modelId}:`, error);
      throw error;
    }
  }

  async deployModel(
    modelId: string,
    environment: 'development' | 'staging' | 'production',
    config?: Partial<ModelDeployment>,
  ): Promise<ModelDeployment> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    // Check if model is ready for deployment
    if (model.status === 'training') {
      throw new Error(`Model ${modelId} is still training`);
    }

    const deployment: ModelDeployment = {
      modelId,
      environment,
      endpoint: `/api/ml/${model.category}/${model.name}/v${model.version}`,
      loadBalancingWeight: config?.loadBalancingWeight || 1.0,
      maxInstances: config?.maxInstances || 10,
      minInstances: config?.minInstances || 1,
      autoScaling: config?.autoScaling !== false,
      healthCheck: config?.healthCheck || {
        interval: 30000,
        timeout: 5000,
        threshold: 3,
      },
    };

    // Copy model to appropriate environment directory
    const sourceDir = path.join(this.modelsDirectory, modelId);
    const targetDir = path.join(this.modelsDirectory, environment, modelId);
    await this.copyModelFiles(sourceDir, targetDir);

    this.deployments.set(modelId, deployment);
    model.status = environment === 'production' ? 'production' : 'staging';
    model.deployedAt = new Date();
    model.changelog.push({
      timestamp: new Date(),
      action: 'deployed',
      description: `Deployed to ${environment}`,
    });

    await this.saveMetadata();

    // Initialize monitoring for production deployments
    if (environment === 'production') {
      await this.initializeMonitoring(modelId);
    }

    this.eventEmitter.emit('model.deployed', { modelId, environment, deployment });
    this.logger.log(`Deployed model ${model.name} v${model.version} to ${environment}`);

    return deployment;
  }

  async rollbackModel(modelId: string, targetVersion?: string): Promise<void> {
    const currentModel = this.models.get(modelId);
    if (!currentModel) {
      throw new Error(`Model ${modelId} not found`);
    }

    // Find target version to rollback to
    let targetModel: ModelMetadata;
    if (targetVersion) {
      // Find specific version
      targetModel = Array.from(this.models.values()).find(m =>
        m.name === currentModel.name && m.version === targetVersion
      )!;
    } else {
      // Find previous production version
      const versions = Array.from(this.models.values())
        .filter(m => m.name === currentModel.name && m.status === 'archived')
        .sort((a, b) => b.deployedAt!.getTime() - a.deployedAt!.getTime());

      if (versions.length === 0) {
        throw new Error('No previous version available for rollback');
      }
      targetModel = versions[0];
    }

    if (!targetModel) {
      throw new Error(`Target version ${targetVersion} not found`);
    }

    // Perform rollback
    const deployment = this.deployments.get(modelId);
    if (deployment) {
      // Copy old model files to production
      const sourceDir = path.join(this.modelsDirectory, 'archive', targetModel.id);
      const targetDir = path.join(this.modelsDirectory, deployment.environment, modelId);
      await this.copyModelFiles(sourceDir, targetDir);

      // Update deployment to use old model
      this.deployments.set(targetModel.id, deployment);
      this.deployments.delete(modelId);
    }

    // Update model statuses
    currentModel.status = 'archived';
    targetModel.status = 'production';
    targetModel.deployedAt = new Date();

    // Add changelog entries
    currentModel.changelog.push({
      timestamp: new Date(),
      action: 'rolled_back',
      description: `Rolled back from v${currentModel.version} to v${targetModel.version}`,
      previousVersion: currentModel.version,
    });

    targetModel.changelog.push({
      timestamp: new Date(),
      action: 'deployed',
      description: `Restored from rollback (was v${currentModel.version})`,
    });

    await this.saveMetadata();

    this.eventEmitter.emit('model.rolled_back', {
      from: currentModel,
      to: targetModel,
    });

    this.logger.log(`Rolled back ${currentModel.name} from v${currentModel.version} to v${targetModel.version}`);
  }

  async startABTest(
    name: string,
    modelAId: string,
    modelBId: string,
    splitRatio: number = 0.5,
    duration?: number, // in milliseconds
  ): Promise<ABTestConfig> {
    const modelA = this.models.get(modelAId);
    const modelB = this.models.get(modelBId);

    if (!modelA || !modelB) {
      throw new Error('One or both models not found');
    }

    const testId = `ab-test-${Date.now()}`;
    const abTest: ABTestConfig = {
      id: testId,
      name,
      modelA: modelAId,
      modelB: modelBId,
      splitRatio,
      startDate: new Date(),
      endDate: duration ? new Date(Date.now() + duration) : undefined,
      metrics: {
        modelAPerformance: {},
        modelBPerformance: {},
        sampleSizeA: 0,
        sampleSizeB: 0,
      },
      status: 'running',
    };

    this.activeABTests.set(testId, abTest);

    // Deploy both models with appropriate weights
    await this.deployModel(modelAId, 'production', {
      loadBalancingWeight: splitRatio,
    });
    await this.deployModel(modelBId, 'production', {
      loadBalancingWeight: 1 - splitRatio,
    });

    this.eventEmitter.emit('abtest.started', abTest);
    this.logger.log(`Started A/B test: ${name} (${modelA.name} vs ${modelB.name})`);

    // Schedule test end if duration specified
    if (duration) {
      setTimeout(() => this.endABTest(testId), duration);
    }

    return abTest;
  }

  async updateABTestMetrics(testId: string, modelId: string, metrics: Partial<ModelMetrics>) {
    const abTest = this.activeABTests.get(testId);
    if (!abTest) return;

    if (modelId === abTest.modelA) {
      abTest.metrics.modelAPerformance = {
        ...abTest.metrics.modelAPerformance,
        ...metrics,
      };
      abTest.metrics.sampleSizeA++;
    } else if (modelId === abTest.modelB) {
      abTest.metrics.modelBPerformance = {
        ...abTest.metrics.modelBPerformance,
        ...metrics,
      };
      abTest.metrics.sampleSizeB++;
    }

    // Calculate statistical significance if enough samples
    if (abTest.metrics.sampleSizeA >= 100 && abTest.metrics.sampleSizeB >= 100) {
      abTest.metrics.statisticalSignificance = this.calculateStatisticalSignificance(
        abTest.metrics.modelAPerformance,
        abTest.metrics.modelBPerformance,
        abTest.metrics.sampleSizeA,
        abTest.metrics.sampleSizeB,
      );

      // Determine winner if significance is high enough
      if (abTest.metrics.statisticalSignificance > 0.95) {
        const aScore = abTest.metrics.modelAPerformance.accuracy || 0;
        const bScore = abTest.metrics.modelBPerformance.accuracy || 0;
        abTest.metrics.winner = aScore > bScore ? 'A' : 'B';
      }
    }
  }

  async endABTest(testId: string): Promise<ABTestConfig> {
    const abTest = this.activeABTests.get(testId);
    if (!abTest) {
      throw new Error(`A/B test ${testId} not found`);
    }

    abTest.status = 'completed';
    abTest.endDate = new Date();

    // Determine final winner
    if (!abTest.metrics.winner) {
      const aScore = abTest.metrics.modelAPerformance.accuracy || 0;
      const bScore = abTest.metrics.modelBPerformance.accuracy || 0;
      const difference = Math.abs(aScore - bScore);

      if (difference < 0.01) {
        abTest.metrics.winner = 'inconclusive';
      } else {
        abTest.metrics.winner = aScore > bScore ? 'A' : 'B';
      }
    }

    // Deploy winning model with full weight
    if (abTest.metrics.winner === 'A') {
      await this.deployModel(abTest.modelA, 'production', {
        loadBalancingWeight: 1.0,
      });
      const modelB = this.models.get(abTest.modelB);
      if (modelB) modelB.status = 'testing';
    } else if (abTest.metrics.winner === 'B') {
      await this.deployModel(abTest.modelB, 'production', {
        loadBalancingWeight: 1.0,
      });
      const modelA = this.models.get(abTest.modelA);
      if (modelA) modelA.status = 'testing';
    }

    this.activeABTests.delete(testId);
    this.eventEmitter.emit('abtest.completed', abTest);

    this.logger.log(`A/B test completed: ${abTest.name}, winner: ${abTest.metrics.winner}`);
    return abTest;
  }

  private async initializeMonitoring(modelId: string) {
    const monitoring: ModelMonitoring = {
      modelId,
      alerts: [],
      driftDetection: {
        featureDrift: {},
        conceptDrift: 0,
        lastChecked: new Date(),
        threshold: 0.1,
        isDrifting: false,
      },
      performanceTracking: {
        hourlyMetrics: {},
        dailyMetrics: {},
        trends: {
          accuracy: 'stable',
          latency: 'stable',
          errorRate: 'stable',
        },
      },
    };

    this.monitoring.set(modelId, monitoring);

    // Start monitoring intervals
    this.startPerformanceMonitoring(modelId);
    this.startDriftDetection(modelId);
  }

  private startPerformanceMonitoring(modelId: string) {
    // Monitor every minute
    setInterval(async () => {
      const monitoring = this.monitoring.get(modelId);
      if (!monitoring) return;

      const model = this.models.get(modelId);
      if (!model || model.status !== 'production') return;

      const currentHour = new Date().toISOString().slice(0, 13);
      const metrics = await this.collectRuntimeMetrics(modelId);

      // Update hourly metrics
      monitoring.performanceTracking.hourlyMetrics[currentHour] = metrics;

      // Check for performance degradation
      if (metrics.accuracy && model.metrics.accuracy) {
        const degradation = model.metrics.accuracy - metrics.accuracy;
        if (degradation > 0.05) {
          const alert: MonitoringAlert = {
            id: `alert-${Date.now()}`,
            type: 'performance_degradation',
            severity: degradation > 0.1 ? 'high' : 'medium',
            message: `Model accuracy degraded by ${(degradation * 100).toFixed(2)}%`,
            timestamp: new Date(),
            resolved: false,
            metrics: { current: metrics.accuracy, baseline: model.metrics.accuracy },
          };

          monitoring.alerts.push(alert);
          this.eventEmitter.emit('monitoring.alert', alert);
        }
      }

      // Update trends
      monitoring.performanceTracking.trends = this.calculateTrends(
        monitoring.performanceTracking.hourlyMetrics,
      );

    }, 60000); // Every minute
  }

  private startDriftDetection(modelId: string) {
    // Check for drift every hour
    setInterval(async () => {
      const monitoring = this.monitoring.get(modelId);
      if (!monitoring) return;

      const driftScore = await this.detectDataDrift(modelId);
      monitoring.driftDetection.conceptDrift = driftScore;
      monitoring.driftDetection.lastChecked = new Date();
      monitoring.driftDetection.isDrifting = driftScore > monitoring.driftDetection.threshold;

      if (monitoring.driftDetection.isDrifting) {
        const alert: MonitoringAlert = {
          id: `drift-${Date.now()}`,
          type: 'data_drift',
          severity: driftScore > 0.2 ? 'high' : 'medium',
          message: `Data drift detected (score: ${driftScore.toFixed(3)})`,
          timestamp: new Date(),
          resolved: false,
          metrics: { driftScore },
        };

        monitoring.alerts.push(alert);
        this.eventEmitter.emit('monitoring.drift', { modelId, driftScore });
      }

    }, 3600000); // Every hour
  }

  private async startMonitoring() {
    // Clean up old metrics periodically
    setInterval(async () => {
      const retentionDays = 30;
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      for (const monitoring of this.monitoring.values()) {
        // Clean hourly metrics older than retention period
        for (const hour in monitoring.performanceTracking.hourlyMetrics) {
          if (new Date(hour) < cutoffDate) {
            delete monitoring.performanceTracking.hourlyMetrics[hour];
          }
        }

        // Clean resolved alerts older than retention period
        monitoring.alerts = monitoring.alerts.filter(alert =>
          !alert.resolved || alert.timestamp > cutoffDate
        );
      }
    }, 86400000); // Daily
  }

  private async collectRuntimeMetrics(modelId: string): Promise<ModelMetrics> {
    // In production, this would collect actual runtime metrics
    // For now, returning simulated metrics
    return {
      accuracy: 0.92 + Math.random() * 0.05,
      precision: 0.90 + Math.random() * 0.05,
      recall: 0.88 + Math.random() * 0.05,
      inferenceTime: 50 + Math.random() * 20,
    };
  }

  private async detectDataDrift(modelId: string): Promise<number> {
    // In production, this would use statistical tests like KS test, chi-square, etc.
    // For now, returning simulated drift score
    return Math.random() * 0.15;
  }

  private calculateTrends(
    metrics: Record<string, ModelMetrics>,
  ): PerformanceTracking['trends'] {
    const hours = Object.keys(metrics).sort().slice(-24); // Last 24 hours
    if (hours.length < 2) {
      return { accuracy: 'stable', latency: 'stable', errorRate: 'stable' };
    }

    const recentMetrics = hours.slice(-12).map(h => metrics[h]);
    const olderMetrics = hours.slice(0, 12).map(h => metrics[h]);

    const avgRecentAccuracy = recentMetrics.reduce((sum, m) => sum + (m.accuracy || 0), 0) / recentMetrics.length;
    const avgOlderAccuracy = olderMetrics.reduce((sum, m) => sum + (m.accuracy || 0), 0) / olderMetrics.length;

    const avgRecentLatency = recentMetrics.reduce((sum, m) => sum + (m.inferenceTime || 0), 0) / recentMetrics.length;
    const avgOlderLatency = olderMetrics.reduce((sum, m) => sum + (m.inferenceTime || 0), 0) / olderMetrics.length;

    return {
      accuracy: avgRecentAccuracy > avgOlderAccuracy + 0.01 ? 'improving' :
                avgRecentAccuracy < avgOlderAccuracy - 0.01 ? 'degrading' : 'stable',
      latency: avgRecentLatency < avgOlderLatency - 5 ? 'improving' :
               avgRecentLatency > avgOlderLatency + 5 ? 'degrading' : 'stable',
      errorRate: 'stable', // Would be calculated from error metrics
    };
  }

  private calculateMetrics(predictions: number[], actuals: number[]): Partial<ModelMetrics> {
    const n = predictions.length;
    let tp = 0, fp = 0, tn = 0, fn = 0;

    // For binary classification
    for (let i = 0; i < n; i++) {
      const pred = predictions[i] > 0.5 ? 1 : 0;
      const actual = actuals[i] > 0.5 ? 1 : 0;

      if (pred === 1 && actual === 1) tp++;
      else if (pred === 1 && actual === 0) fp++;
      else if (pred === 0 && actual === 0) tn++;
      else if (pred === 0 && actual === 1) fn++;
    }

    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

    // Calculate MSE and MAE
    let mse = 0, mae = 0;
    for (let i = 0; i < n; i++) {
      const error = predictions[i] - actuals[i];
      mse += error * error;
      mae += Math.abs(error);
    }
    mse /= n;
    mae /= n;

    return { precision, recall, f1Score, mse, mae };
  }

  private calculateStatisticalSignificance(
    metricsA: ModelMetrics,
    metricsB: ModelMetrics,
    sampleSizeA: number,
    sampleSizeB: number,
  ): number {
    // Simple z-test for proportion difference
    const pA = metricsA.accuracy || 0;
    const pB = metricsB.accuracy || 0;
    const p = (pA * sampleSizeA + pB * sampleSizeB) / (sampleSizeA + sampleSizeB);
    const se = Math.sqrt(p * (1 - p) * (1/sampleSizeA + 1/sampleSizeB));
    const z = Math.abs(pA - pB) / se;

    // Convert z-score to confidence level
    // Simplified normal CDF approximation
    return 1 - Math.exp(-z * z / 2);
  }

  private generateModelId(name: string): string {
    const timestamp = Date.now();
    const hash = crypto.createHash('sha256')
      .update(`${name}-${timestamp}`)
      .digest('hex')
      .substring(0, 8);
    return `${name.toLowerCase().replace(/\s+/g, '-')}-${hash}`;
  }

  private async generateVersion(name: string): Promise<string> {
    const existingVersions = Array.from(this.models.values())
      .filter(m => m.name === name)
      .map(m => m.version);

    if (existingVersions.length === 0) {
      return '1.0.0';
    }

    const latest = existingVersions.sort().pop()!;
    const [major, minor, patch] = latest.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }

  private async copyModelFiles(sourceDir: string, targetDir: string) {
    await fs.mkdir(targetDir, { recursive: true });
    const files = await fs.readdir(sourceDir);

    for (const file of files) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);
      const stat = await fs.stat(sourcePath);

      if (stat.isDirectory()) {
        await this.copyModelFiles(sourcePath, targetPath);
      } else {
        await fs.copyFile(sourcePath, targetPath);
      }
    }
  }

  private async saveModel(modelId: string) {
    const model = this.models.get(modelId);
    if (!model) return;

    const modelDir = path.join(this.modelsDirectory, modelId);
    await fs.mkdir(modelDir, { recursive: true });

    const tfModel = this.modelInstances.get(modelId) as tf.LayersModel;
    if (tfModel) {
      await tfModel.save(`file://${modelDir}`);
    }

    // Save model metadata
    await fs.writeFile(
      path.join(modelDir, 'metadata.json'),
      JSON.stringify(model, null, 2),
    );
  }

  private async saveMetadata() {
    const metadata = {
      models: Array.from(this.models.values()),
      deployments: Array.from(this.deployments.values()),
      timestamp: new Date(),
    };

    await fs.writeFile(
      path.join(this.modelsDirectory, 'metadata.json'),
      JSON.stringify(metadata, null, 2),
    );
  }

  // Public API methods

  async getModel(modelId: string): Promise<ModelMetadata | undefined> {
    return this.models.get(modelId);
  }

  async listModels(filter?: {
    status?: ModelMetadata['status'];
    category?: ModelMetadata['category'];
    name?: string;
  }): Promise<ModelMetadata[]> {
    let models = Array.from(this.models.values());

    if (filter) {
      if (filter.status) {
        models = models.filter(m => m.status === filter.status);
      }
      if (filter.category) {
        models = models.filter(m => m.category === filter.category);
      }
      if (filter.name) {
        models = models.filter(m => filter.name && m.name.includes(filter.name));
      }
    }

    return models;
  }

  async getMonitoring(modelId: string): Promise<ModelMonitoring | undefined> {
    return this.monitoring.get(modelId);
  }

  async getActiveABTests(): Promise<ABTestConfig[]> {
    return Array.from(this.activeABTests.values());
  }

  async loadModel(modelId: string): Promise<tf.LayersModel | any> {
    if (this.modelInstances.has(modelId)) {
      return this.modelInstances.get(modelId);
    }

    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const modelDir = path.join(this.modelsDirectory, modelId);

    if (model.type === 'tensorflow') {
      const tfModel = await tf.loadLayersModel(`file://${modelDir}/model.json`);
      this.modelInstances.set(modelId, tfModel);
      return tfModel;
    }

    throw new Error(`Model type ${model.type} not supported`);
  }

  async predict(modelId: string, input: any): Promise<any> {
    const model = await this.loadModel(modelId);

    if (model instanceof tf.LayersModel) {
      const prediction = model.predict(input) as tf.Tensor;
      const result = await prediction.data();
      prediction.dispose();
      return result;
    }

    throw new Error('Model type not supported for prediction');
  }
}