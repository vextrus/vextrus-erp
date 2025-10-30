import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Kafka, Consumer, Producer, EachMessagePayload, KafkaMessage } from 'kafkajs';
import * as tf from '@tensorflow/tfjs-node';
import { performance } from 'perf_hooks';

interface FinancialEvent {
  id: string;
  timestamp: Date;
  type: 'transaction' | 'payment' | 'adjustment' | 'journal_entry' | 'reconciliation';
  source: string;
  amount: number;
  currency: string;
  accountId: string;
  metadata: Record<string, any>;
}

interface AnomalyAlert {
  id: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  event: FinancialEvent;
  score: number;
  context: Record<string, any>;
}

interface StreamingMetrics {
  eventsProcessed: number;
  averageLatency: number;
  anomaliesDetected: number;
  cashFlowVariance: number;
  throughput: number;
}

interface PatternRule {
  name: string;
  pattern: RegExp | ((events: FinancialEvent[]) => boolean);
  windowSize: number;
  threshold?: number;
  action: (events: FinancialEvent[]) => void;
}

interface CashPosition {
  timestamp: Date;
  totalCash: number;
  byAccount: Map<string, number>;
  byCurrency: Map<string, number>;
  projectedShortfall?: number;
  liquidityRatio: number;
}

@Injectable()
export class StreamingAnalyticsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StreamingAnalyticsService.name);
  private kafka: Kafka;
  private consumer: Consumer;
  private producer: Producer;
  private anomalyModel!: tf.LayersModel;
  private eventBuffer: FinancialEvent[] = [];
  private readonly bufferSize = 1000;
  private metrics: StreamingMetrics = {
    eventsProcessed: 0,
    averageLatency: 0,
    anomaliesDetected: 0,
    cashFlowVariance: 0,
    throughput: 0,
  };
  private patternRules: PatternRule[] = [];
  private cashPosition: CashPosition;
  private processingInterval!: NodeJS.Timeout;
  private metricsInterval!: NodeJS.Timeout;

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    this.kafka = new Kafka({
      clientId: 'finance-streaming',
      brokers: this.configService.get('KAFKA_BROKERS', 'localhost:9092').split(','),
      connectionTimeout: 10000,
      retry: {
        retries: 5,
        maxRetryTime: 30000,
        initialRetryTime: 300,
      },
    });

    this.consumer = this.kafka.consumer({
      groupId: 'finance-analytics-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 60000,
    });

    this.cashPosition = {
      timestamp: new Date(),
      totalCash: 0,
      byAccount: new Map(),
      byCurrency: new Map(),
      liquidityRatio: 1.0,
    };

    this.initializePatternRules();
  }

  async onModuleInit() {
    await this.initializeAnomalyModel();
    await this.connectKafka();
    await this.startProcessing();
  }

  async onModuleDestroy() {
    await this.disconnect();
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
  }

  private async initializeAnomalyModel() {
    // Initialize anomaly detection model
    this.anomalyModel = tf.sequential({
      layers: [
        tf.layers.dense({
          units: 128,
          activation: 'relu',
          inputShape: [10], // Features: amount, time_of_day, day_of_week, account_activity, etc.
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.batchNormalization(),
        tf.layers.dense({
          units: 64,
          activation: 'relu',
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu',
        }),
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid', // Anomaly score 0-1
        }),
      ],
    });

    this.anomalyModel.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });

    // Load pre-trained weights if available
    const modelPath = `./models/anomaly-detector-${new Date().getFullYear()}`;
    try {
      // Use tf.loadLayersModel to load the complete model with weights
      const modelUrl = `file://${modelPath}/model.json`;
      const savedModel = await tf.loadLayersModel(modelUrl);

      // Extract weights from the loaded model and set them to our model
      const weights = savedModel.getWeights();
      this.anomalyModel.setWeights(weights);

      // Dispose the temporary loaded model
      savedModel.dispose();

      this.logger.log('Loaded pre-trained anomaly detection weights');
    } catch (error) {
      this.logger.warn('No pre-trained weights found, using initial weights', error);
    }
  }

  private async connectKafka() {
    try {
      await this.producer.connect();
      await this.consumer.connect();

      // Subscribe to financial event topics
      await this.consumer.subscribe({
        topics: [
          'financial.transactions',
          'financial.payments',
          'financial.adjustments',
          'financial.journal-entries',
          'financial.reconciliations',
        ],
        fromBeginning: false,
      });

      this.logger.log('Connected to Kafka for streaming analytics');
    } catch (error) {
      this.logger.error('Failed to connect to Kafka:', error);
      // Fallback to in-memory processing if Kafka is not available
      this.setupInMemoryProcessing();
    }
  }

  private async startProcessing() {
    // Start consuming messages
    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.processEvent(payload);
      },
    });

    // Start periodic processing
    this.processingInterval = setInterval(() => {
      this.processEventWindow();
    }, 5000); // Process window every 5 seconds

    // Start metrics reporting
    this.metricsInterval = setInterval(() => {
      this.reportMetrics();
    }, 30000); // Report metrics every 30 seconds
  }

  private async processEvent(payload: EachMessagePayload) {
    const startTime = performance.now();

    try {
      const event = JSON.parse(payload.message.value?.toString() || '{}') as FinancialEvent;
      event.timestamp = new Date(event.timestamp);

      // Add to buffer
      this.eventBuffer.push(event);
      if (this.eventBuffer.length > this.bufferSize) {
        this.eventBuffer.shift();
      }

      // Real-time anomaly detection
      const anomalyScore = await this.detectAnomaly(event);
      if (anomalyScore > 0.7) {
        await this.handleAnomaly(event, anomalyScore);
      }

      // Update cash position
      await this.updateCashPosition(event);

      // Pattern matching
      await this.matchPatterns(event);

      // Update metrics
      this.metrics.eventsProcessed++;
      const latency = performance.now() - startTime;
      this.metrics.averageLatency =
        (this.metrics.averageLatency * (this.metrics.eventsProcessed - 1) + latency) /
        this.metrics.eventsProcessed;

      // Emit processed event
      this.eventEmitter.emit('streaming.event.processed', {
        event,
        anomalyScore,
        latency,
      });

    } catch (error) {
      this.logger.error('Error processing event:', error);
    }
  }

  private async detectAnomaly(event: FinancialEvent): Promise<number> {
    try {
      const features = this.extractEventFeatures(event);
      const prediction = this.anomalyModel.predict(
        tf.tensor2d([features], [1, 10])
      ) as tf.Tensor;

      const score = (await prediction.data())[0];
      prediction.dispose();

      return score;
    } catch (error) {
      this.logger.error('Error detecting anomaly:', error);
      return 0;
    }
  }

  private extractEventFeatures(event: FinancialEvent): number[] {
    const now = new Date();
    const hour = event.timestamp.getHours();
    const dayOfWeek = event.timestamp.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0;
    const isBusinessHours = hour >= 9 && hour <= 17 ? 1 : 0;

    // Calculate account activity level
    const accountEvents = this.eventBuffer.filter(e =>
      e.accountId === event.accountId &&
      e.timestamp > new Date(now.getTime() - 3600000) // Last hour
    );
    const accountActivity = accountEvents.length / 10; // Normalized

    // Calculate amount deviation
    const recentAmounts = this.eventBuffer
      .filter(e => e.type === event.type)
      .map(e => e.amount);
    const avgAmount = recentAmounts.length > 0
      ? recentAmounts.reduce((a, b) => a + b, 0) / recentAmounts.length
      : event.amount;
    const amountDeviation = Math.abs(event.amount - avgAmount) / (avgAmount || 1);

    return [
      event.amount / 1000000, // Normalized amount
      hour / 24, // Normalized hour
      dayOfWeek / 7, // Normalized day
      isWeekend,
      isBusinessHours,
      accountActivity,
      amountDeviation,
      event.type === 'transaction' ? 1 : 0,
      event.type === 'adjustment' ? 1 : 0,
      event.currency === 'BDT' ? 1 : 0,
    ];
  }

  private async handleAnomaly(event: FinancialEvent, score: number) {
    const severity = this.calculateSeverity(score, event.amount);

    const alert: AnomalyAlert = {
      id: `anomaly-${Date.now()}`,
      timestamp: new Date(),
      severity,
      type: 'unusual_pattern',
      description: `Unusual ${event.type} detected with amount ${event.amount} ${event.currency}`,
      event,
      score,
      context: {
        recentEvents: this.eventBuffer.slice(-5),
        cashPosition: this.cashPosition.totalCash,
      },
    };

    // Send alert
    await this.producer.send({
      topic: 'financial.anomalies',
      messages: [{
        key: alert.id,
        value: JSON.stringify(alert),
      }],
    });

    // Emit alert event
    this.eventEmitter.emit('anomaly.detected', alert);

    this.metrics.anomaliesDetected++;
    this.logger.warn(`Anomaly detected: ${alert.description} (score: ${score.toFixed(3)})`);
  }

  private calculateSeverity(score: number, amount: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score > 0.95 || amount > 10000000) return 'critical';
    if (score > 0.85 || amount > 1000000) return 'high';
    if (score > 0.75 || amount > 100000) return 'medium';
    return 'low';
  }

  private async updateCashPosition(event: FinancialEvent) {
    // Update cash position based on event
    if (event.type === 'transaction' || event.type === 'payment') {
      const currentAccountBalance = this.cashPosition.byAccount.get(event.accountId) || 0;
      const newBalance = currentAccountBalance + (event.amount * (event.metadata.direction === 'credit' ? 1 : -1));
      this.cashPosition.byAccount.set(event.accountId, newBalance);

      const currentCurrencyBalance = this.cashPosition.byCurrency.get(event.currency) || 0;
      const newCurrencyBalance = currentCurrencyBalance + (event.amount * (event.metadata.direction === 'credit' ? 1 : -1));
      this.cashPosition.byCurrency.set(event.currency, newCurrencyBalance);

      // Recalculate total
      this.cashPosition.totalCash = Array.from(this.cashPosition.byAccount.values())
        .reduce((sum, balance) => sum + balance, 0);

      // Calculate liquidity ratio
      const currentLiabilities = this.eventBuffer
        .filter(e => e.metadata.isLiability && e.timestamp > new Date(Date.now() - 86400000))
        .reduce((sum, e) => sum + e.amount, 0);

      this.cashPosition.liquidityRatio = currentLiabilities > 0
        ? this.cashPosition.totalCash / currentLiabilities
        : 1.0;

      // Check for potential shortfalls
      if (this.cashPosition.liquidityRatio < 0.5) {
        this.cashPosition.projectedShortfall = currentLiabilities - this.cashPosition.totalCash;

        // Send alert
        await this.producer.send({
          topic: 'financial.alerts',
          messages: [{
            key: 'cash-shortfall',
            value: JSON.stringify({
              type: 'cash_shortfall',
              timestamp: new Date(),
              projectedShortfall: this.cashPosition.projectedShortfall,
              liquidityRatio: this.cashPosition.liquidityRatio,
            }),
          }],
        });
      }
    }

    this.cashPosition.timestamp = new Date();
  }

  private initializePatternRules() {
    // Define pattern detection rules
    this.patternRules = [
      {
        name: 'rapid_transactions',
        pattern: (events: FinancialEvent[]) => {
          const recentEvents = events.filter(e =>
            e.timestamp > new Date(Date.now() - 60000) // Last minute
          );
          return recentEvents.length > 20;
        },
        windowSize: 60000,
        action: (events) => {
          this.logger.warn(`Rapid transaction pattern detected: ${events.length} events in last minute`);
          this.eventEmitter.emit('pattern.rapid_transactions', events);
        },
      },
      {
        name: 'large_adjustment',
        pattern: (events: FinancialEvent[]) => {
          return events.some(e =>
            e.type === 'adjustment' &&
            e.amount > 1000000
          );
        },
        windowSize: 300000, // 5 minutes
        action: (events) => {
          const largeAdjustments = events.filter(e => e.type === 'adjustment' && e.amount > 1000000);
          this.logger.warn(`Large adjustments detected: ${largeAdjustments.length}`);
          this.eventEmitter.emit('pattern.large_adjustment', largeAdjustments);
        },
      },
      {
        name: 'duplicate_transactions',
        pattern: (events: FinancialEvent[]) => {
          const seen = new Set<string>();
          const duplicates = [];
          for (const event of events) {
            const key = `${event.amount}-${event.accountId}-${event.type}`;
            if (seen.has(key)) {
              duplicates.push(event);
            }
            seen.add(key);
          }
          return duplicates.length > 0;
        },
        windowSize: 180000, // 3 minutes
        action: (events) => {
          this.logger.warn('Potential duplicate transactions detected');
          this.eventEmitter.emit('pattern.duplicates', events);
        },
      },
      {
        name: 'currency_fluctuation',
        pattern: (events: FinancialEvent[]) => {
          const currencyEvents = events.filter(e => e.currency !== 'BDT');
          if (currencyEvents.length < 2) return false;

          const rates = currencyEvents.map(e => e.metadata.exchangeRate || 1);
          const maxRate = Math.max(...rates);
          const minRate = Math.min(...rates);
          const fluctuation = (maxRate - minRate) / minRate;

          return fluctuation > 0.05; // 5% fluctuation
        },
        windowSize: 900000, // 15 minutes
        action: (events) => {
          this.logger.warn('Significant currency fluctuation detected');
          this.eventEmitter.emit('pattern.currency_fluctuation', events);
        },
      },
    ];
  }

  private async matchPatterns(event: FinancialEvent) {
    for (const rule of this.patternRules) {
      const windowEvents = this.eventBuffer.filter(e =>
        e.timestamp > new Date(Date.now() - rule.windowSize)
      );

      const matches = typeof rule.pattern === 'function'
        ? rule.pattern(windowEvents)
        : rule.pattern.test(JSON.stringify(windowEvents));

      if (matches) {
        rule.action(windowEvents);
      }
    }
  }

  private processEventWindow() {
    // Process sliding window analytics
    const windowSize = 60000; // 1 minute window
    const windowEvents = this.eventBuffer.filter(e =>
      e.timestamp > new Date(Date.now() - windowSize)
    );

    if (windowEvents.length === 0) return;

    // Calculate window statistics
    const totalAmount = windowEvents.reduce((sum, e) => sum + e.amount, 0);
    const avgAmount = totalAmount / windowEvents.length;

    const amounts = windowEvents.map(e => e.amount);
    const variance = amounts.reduce((sum, amount) =>
      sum + Math.pow(amount - avgAmount, 2), 0
    ) / amounts.length;

    this.metrics.cashFlowVariance = Math.sqrt(variance);
    this.metrics.throughput = windowEvents.length / (windowSize / 1000); // Events per second

    // Emit window statistics
    this.eventEmitter.emit('streaming.window.processed', {
      timestamp: new Date(),
      eventCount: windowEvents.length,
      totalAmount,
      avgAmount,
      variance: this.metrics.cashFlowVariance,
      throughput: this.metrics.throughput,
    });
  }

  private reportMetrics() {
    this.logger.log('Streaming Analytics Metrics:', {
      eventsProcessed: this.metrics.eventsProcessed,
      averageLatency: `${this.metrics.averageLatency.toFixed(2)}ms`,
      anomaliesDetected: this.metrics.anomaliesDetected,
      cashFlowVariance: this.metrics.cashFlowVariance.toFixed(2),
      throughput: `${this.metrics.throughput.toFixed(2)} events/sec`,
      cashPosition: {
        total: this.cashPosition.totalCash,
        liquidityRatio: this.cashPosition.liquidityRatio.toFixed(2),
        accountCount: this.cashPosition.byAccount.size,
        currencyCount: this.cashPosition.byCurrency.size,
      },
    });

    // Send metrics to monitoring
    this.producer.send({
      topic: 'financial.metrics',
      messages: [{
        key: 'streaming-analytics',
        value: JSON.stringify({
          timestamp: new Date(),
          metrics: this.metrics,
          cashPosition: {
            total: this.cashPosition.totalCash,
            liquidityRatio: this.cashPosition.liquidityRatio,
          },
        }),
      }],
    }).catch(err => this.logger.error('Failed to send metrics:', err));
  }

  private setupInMemoryProcessing() {
    // Fallback for when Kafka is not available
    this.logger.warn('Using in-memory event processing (Kafka not available)');

    // Subscribe to internal events
    this.eventEmitter.on('finance.transaction', (event) => {
      this.processInMemoryEvent({
        ...event,
        type: 'transaction',
      });
    });

    this.eventEmitter.on('finance.payment', (event) => {
      this.processInMemoryEvent({
        ...event,
        type: 'payment',
      });
    });

    this.eventEmitter.on('finance.adjustment', (event) => {
      this.processInMemoryEvent({
        ...event,
        type: 'adjustment',
      });
    });
  }

  private async processInMemoryEvent(event: FinancialEvent) {
    // Process event without Kafka
    await this.processEvent({
      topic: 'financial.events',
      partition: 0,
      message: {
        key: Buffer.from(event.id),
        value: Buffer.from(JSON.stringify(event)),
        timestamp: event.timestamp.toISOString(),
        headers: {},
        offset: '0',
      } as KafkaMessage,
      heartbeat: async () => {},
      pause: () => () => {},
    });
  }

  async disconnect() {
    try {
      await this.consumer.disconnect();
      await this.producer.disconnect();
      this.logger.log('Disconnected from Kafka');
    } catch (error) {
      this.logger.error('Error disconnecting from Kafka:', error);
    }
  }

  // Public methods for external access

  async getRealtimeMetrics(): Promise<StreamingMetrics> {
    return this.metrics;
  }

  async getCashPosition(): Promise<CashPosition> {
    return this.cashPosition;
  }

  async getRecentAnomalies(limit: number = 10): Promise<AnomalyAlert[]> {
    // In production, this would fetch from a persistence layer
    return this.eventBuffer
      .filter(e => e.metadata.anomalyScore > 0.7)
      .slice(-limit)
      .map(e => ({
        id: `anomaly-${e.id}`,
        timestamp: e.timestamp,
        severity: this.calculateSeverity(e.metadata.anomalyScore, e.amount),
        type: 'detected',
        description: `Anomaly in ${e.type}`,
        event: e,
        score: e.metadata.anomalyScore,
        context: {},
      }));
  }

  async publishEvent(event: FinancialEvent) {
    // Publish event to Kafka
    await this.producer.send({
      topic: `financial.${event.type}s`,
      messages: [{
        key: event.id,
        value: JSON.stringify(event),
      }],
    });
  }

  async trainAnomalyModel(trainingData: FinancialEvent[]) {
    // Prepare training data
    const features = trainingData.map(e => this.extractEventFeatures(e));
    const labels = trainingData.map(e => e.metadata.isAnomaly ? 1 : 0);

    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels, [labels.length, 1]);

    // Train model
    await this.anomalyModel.fit(xs, ys, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          this.logger.log(`Training epoch ${epoch}: loss=${logs?.loss?.toFixed(4)}`);
        },
      },
    });

    // Save model
    const modelPath = `./models/anomaly-detector-${new Date().getFullYear()}.json`;
    await this.anomalyModel.save(`file://${modelPath}`);

    xs.dispose();
    ys.dispose();

    this.logger.log('Anomaly model training completed');
  }
}