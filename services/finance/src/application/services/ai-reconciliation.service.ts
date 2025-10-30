import { Injectable, Logger } from '@nestjs/common';
import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter2 } from '@nestjs/event-emitter';
import levenshtein from 'levenshtein';

export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  date: Date;
  reference: string;
  vendorId?: string;
  vendorName?: string;
  description?: string;
  tenantId: string;
}

export interface BankTransaction {
  id: string;
  amount: number;
  currency: string;
  date: Date;
  description: string;
  counterparty: string;
  reference?: string;
  tenantId: string;
}

export interface ReconciliationMatch {
  payment: PaymentRecord;
  transaction: BankTransaction;
  confidence: number;
  matchType: 'exact' | 'probable' | 'possible';
  suggestedAction: 'auto-match' | 'review' | 'investigate';
  features?: ReconciliationFeatures;
}

export interface ReconciliationFeatures {
  amountSimilarity: number;
  dateProximity: number;
  referenceSimilarity: number;
  vendorNameMatch: number;
  currencyMatch: number;
  historicalMatchScore: number;
}

export interface ReconciliationHistory {
  payment: PaymentRecord;
  transaction: BankTransaction;
  wasCorrectMatch: boolean;
  matchedBy: string;
  matchedAt: Date;
  confidence?: number;
}

@Injectable()
export class AIReconciliationService {
  private readonly logger = new Logger(AIReconciliationService.name);
  private model!: tf.LayersModel;
  private readonly threshold = 0.95; // 95% confidence threshold
  private readonly modelPath = path.join(process.cwd(), 'models', 'reconciliation');
  private historicalMatches: Map<string, Map<string, number>> = new Map();

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.initializeModel();
  }

  private async initializeModel(): Promise<void> {
    try {
      await this.loadOrCreateModel();
      this.logger.log('AI Reconciliation model initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize AI model', error);
    }
  }

  private async loadOrCreateModel(): Promise<void> {
    const modelJsonPath = path.join(this.modelPath, 'model.json');

    if (fs.existsSync(modelJsonPath)) {
      // Load pre-trained model
      try {
        this.model = await tf.loadLayersModel(`file://${this.modelPath}/model.json`);
        this.logger.log('Loaded pre-trained reconciliation model');
      } catch (error) {
        this.logger.warn('Failed to load model, creating new one', error);
        await this.createNewModel();
      }
    } else {
      // Create new model
      await this.createNewModel();
    }
  }

  private async createNewModel(): Promise<void> {
    // Build neural network for reconciliation
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({
          units: 64,
          activation: 'relu',
          inputShape: [6],
          kernelInitializer: 'heNormal'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.batchNormalization(),
        tf.layers.dense({
          units: 32,
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.batchNormalization(),
        tf.layers.dense({
          units: 16,
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid'
        }),
      ]
    });

    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy', 'precision', 'recall'],
    });

    this.logger.log('Created new reconciliation neural network model');
  }

  async matchTransactions(
    payments: PaymentRecord[],
    bankTransactions: BankTransaction[]
  ): Promise<ReconciliationMatch[]> {
    const startTime = Date.now();
    const allMatches: ReconciliationMatch[] = [];

    // Batch process for better performance
    const batchSize = 100;
    for (let i = 0; i < payments.length; i += batchSize) {
      const paymentBatch = payments.slice(i, i + batchSize);
      const batchMatches = await this.processBatch(paymentBatch, bankTransactions);
      allMatches.push(...batchMatches);
    }

    // Rank and filter matches
    const rankedMatches = this.rankMatches(allMatches);

    // Emit performance metrics
    const processingTime = Date.now() - startTime;
    const transactionsPerSecond = Math.round((payments.length * bankTransactions.length) / (processingTime / 1000));

    this.eventEmitter.emit('reconciliation.performance', {
      totalPayments: payments.length,
      totalTransactions: bankTransactions.length,
      matchesFound: rankedMatches.length,
      processingTimeMs: processingTime,
      transactionsPerSecond,
    });

    this.logger.log(`Processed ${transactionsPerSecond} transactions/second`);

    return rankedMatches;
  }

  private async processBatch(
    payments: PaymentRecord[],
    transactions: BankTransaction[]
  ): Promise<ReconciliationMatch[]> {
    const matches: ReconciliationMatch[] = [];

    for (const payment of payments) {
      const paymentMatches = await this.findMatchesForPayment(payment, transactions);
      matches.push(...paymentMatches);
    }

    return matches;
  }

  private async findMatchesForPayment(
    payment: PaymentRecord,
    transactions: BankTransaction[]
  ): Promise<ReconciliationMatch[]> {
    const matches: ReconciliationMatch[] = [];

    // Pre-filter transactions for efficiency
    const candidateTransactions = this.preFilterTransactions(payment, transactions);

    for (const transaction of candidateTransactions) {
      const features = this.extractFeatures(payment, transaction);
      const prediction = await this.predict(features);

      if (prediction.confidence > 0.5) { // Lower threshold for capturing more possibilities
        const matchType = this.determineMatchType(prediction.confidence);
        const suggestedAction = this.getSuggestedAction(prediction.confidence, features);

        matches.push({
          payment,
          transaction,
          confidence: prediction.confidence,
          matchType,
          suggestedAction,
          features: {
            amountSimilarity: features[0],
            dateProximity: features[1],
            referenceSimilarity: features[2],
            vendorNameMatch: features[3],
            currencyMatch: features[4],
            historicalMatchScore: features[5],
          }
        });
      }
    }

    return matches;
  }

  private preFilterTransactions(
    payment: PaymentRecord,
    transactions: BankTransaction[]
  ): BankTransaction[] {
    // Pre-filter to reduce computation
    return transactions.filter(transaction => {
      // Amount within 5% tolerance
      const amountDiff = Math.abs(payment.amount - Math.abs(transaction.amount));
      const amountTolerance = payment.amount * 0.05;

      // Date within 30 days
      const daysDiff = Math.abs(
        (payment.date.getTime() - transaction.date.getTime()) / (1000 * 60 * 60 * 24)
      );

      return amountDiff <= amountTolerance && daysDiff <= 30;
    });
  }

  private extractFeatures(
    payment: PaymentRecord,
    transaction: BankTransaction
  ): Float32Array {
    const features = new Float32Array([
      // Amount similarity (0-1)
      this.calculateAmountSimilarity(payment.amount, Math.abs(transaction.amount)),

      // Date proximity in days (normalized 0-1, where 1 is same day)
      this.calculateDateProximity(payment.date, transaction.date),

      // Reference string similarity using Levenshtein distance (0-1)
      this.calculateStringSimilarity(
        payment.reference || '',
        transaction.reference || transaction.description
      ),

      // Vendor name match (0-1)
      this.calculateNameMatch(
        payment.vendorName || '',
        transaction.counterparty
      ),

      // Currency match (0 or 1)
      payment.currency === transaction.currency ? 1 : 0,

      // Historical match patterns (0-1)
      this.getHistoricalMatchScore(payment.vendorId, transaction.counterparty),
    ]);

    return features;
  }

  private calculateAmountSimilarity(amount1: number, amount2: number): number {
    if (amount1 === amount2) return 1;

    const diff = Math.abs(amount1 - amount2);
    const avg = (amount1 + amount2) / 2;

    if (avg === 0) return 0;

    // Use exponential decay for similarity
    const percentDiff = diff / avg;
    return Math.exp(-5 * percentDiff); // Decay factor of 5
  }

  private calculateDateProximity(date1: Date, date2: Date): number {
    const daysDiff = Math.abs(
      (date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Same day = 1, 30+ days = 0
    if (daysDiff === 0) return 1;
    if (daysDiff >= 30) return 0;

    // Linear decay
    return 1 - (daysDiff / 30);
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;

    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1;

    // Use Levenshtein distance
    const distance = new levenshtein(s1, s2).distance;
    const maxLength = Math.max(s1.length, s2.length);

    if (maxLength === 0) return 0;

    return 1 - (distance / maxLength);
  }

  private calculateNameMatch(vendorName: string, counterparty: string): number {
    if (!vendorName || !counterparty) return 0;

    const v = vendorName.toLowerCase().trim();
    const c = counterparty.toLowerCase().trim();

    // Exact match
    if (v === c) return 1;

    // Contains match (one contains the other)
    if (v.includes(c) || c.includes(v)) return 0.8;

    // Calculate similarity
    return this.calculateStringSimilarity(vendorName, counterparty);
  }

  private getHistoricalMatchScore(vendorId?: string, counterparty?: string): number {
    if (!vendorId || !counterparty) return 0;

    const vendorHistory = this.historicalMatches.get(vendorId);
    if (!vendorHistory) return 0;

    const matchCount = vendorHistory.get(counterparty) || 0;

    // Normalize based on total matches for this vendor
    const totalMatches = Array.from(vendorHistory.values()).reduce((a, b) => a + b, 0);

    if (totalMatches === 0) return 0;

    return matchCount / totalMatches;
  }

  private async predict(features: Float32Array): Promise<{ confidence: number; matchType: string }> {
    try {
      const input = tf.tensor2d([Array.from(features)], [1, 6]);
      const prediction = this.model.predict(input) as tf.Tensor;
      const confidence = (await prediction.data())[0];

      input.dispose();
      prediction.dispose();

      const matchType = this.determineMatchType(confidence);

      return { confidence, matchType };
    } catch (error) {
      this.logger.error('Prediction error', error);
      return { confidence: 0, matchType: 'none' };
    }
  }

  private determineMatchType(confidence: number): 'exact' | 'probable' | 'possible' {
    if (confidence >= 0.99) return 'exact';
    if (confidence >= 0.85) return 'probable';
    return 'possible';
  }

  private getSuggestedAction(confidence: number, features: Float32Array): 'auto-match' | 'review' | 'investigate' {
    // Auto-match only for very high confidence with good feature alignment
    if (confidence >= 0.99 && features[0] >= 0.99 && features[4] === 1) {
      return 'auto-match';
    }

    // Review for high confidence
    if (confidence >= 0.85) {
      return 'review';
    }

    // Investigate for lower confidence
    return 'investigate';
  }

  private rankMatches(matches: ReconciliationMatch[]): ReconciliationMatch[] {
    // Sort by confidence descending
    const sorted = matches.sort((a, b) => b.confidence - a.confidence);

    // Remove duplicate matches (one transaction matched to multiple payments)
    const uniqueMatches = new Map<string, ReconciliationMatch>();
    const usedTransactions = new Set<string>();

    for (const match of sorted) {
      const paymentKey = match.payment.id;
      const transactionKey = match.transaction.id;

      if (!uniqueMatches.has(paymentKey) && !usedTransactions.has(transactionKey)) {
        uniqueMatches.set(paymentKey, match);
        usedTransactions.add(transactionKey);
      }
    }

    return Array.from(uniqueMatches.values());
  }

  async trainModel(historicalData: ReconciliationHistory[]): Promise<void> {
    if (historicalData.length < 100) {
      this.logger.warn('Insufficient training data. Need at least 100 samples.');
      return;
    }

    this.logger.log(`Training model with ${historicalData.length} samples`);

    // Prepare training data
    const features: number[][] = [];
    const labels: number[] = [];

    for (const data of historicalData) {
      const featureVector = this.extractFeatures(data.payment, data.transaction);
      features.push(Array.from(featureVector));
      labels.push(data.wasCorrectMatch ? 1 : 0);

      // Update historical matches
      if (data.wasCorrectMatch && data.payment.vendorId) {
        if (!this.historicalMatches.has(data.payment.vendorId)) {
          this.historicalMatches.set(data.payment.vendorId, new Map());
        }
        const vendorHistory = this.historicalMatches.get(data.payment.vendorId)!;
        const currentCount = vendorHistory.get(data.transaction.counterparty) || 0;
        vendorHistory.set(data.transaction.counterparty, currentCount + 1);
      }
    }

    // Convert to tensors
    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels, [labels.length, 1]);

    // Split into train and validation sets (80/20)
    const splitIndex = Math.floor(features.length * 0.8);
    const xTrain = xs.slice([0, 0], [splitIndex, -1]);
    const yTrain = ys.slice([0, 0], [splitIndex, -1]);
    const xVal = xs.slice([splitIndex, 0], [-1, -1]);
    const yVal = ys.slice([splitIndex, 0], [-1, -1]);

    // Train the model
    const history = await this.model.fit(xTrain, yTrain, {
      epochs: 100,
      batchSize: 32,
      validationData: [xVal, yVal],
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            this.logger.log(
              `Epoch ${epoch}: loss = ${logs?.loss?.toFixed(4)}, ` +
              `accuracy = ${logs?.acc?.toFixed(4)}, ` +
              `val_loss = ${logs?.val_loss?.toFixed(4)}, ` +
              `val_acc = ${logs?.val_acc?.toFixed(4)}`
            );
          }
        }
      }
    });

    // Save model
    await this.saveModel();

    // Clean up tensors
    xs.dispose();
    ys.dispose();
    xTrain.dispose();
    yTrain.dispose();
    xVal.dispose();
    yVal.dispose();

    // Calculate and log final metrics
    const valAccArray = history.history.val_acc;
    const finalAccuracy = valAccArray && valAccArray.length > 0
      ? valAccArray[valAccArray.length - 1] as number
      : 0;
    this.logger.log(`Training completed. Final validation accuracy: ${(finalAccuracy * 100).toFixed(2)}%`);

    // Emit training completed event
    this.eventEmitter.emit('reconciliation.model.trained', {
      samples: historicalData.length,
      finalAccuracy,
      epochs: 100,
    });
  }

  private async saveModel(): Promise<void> {
    try {
      // Create models directory if it doesn't exist
      if (!fs.existsSync(this.modelPath)) {
        fs.mkdirSync(this.modelPath, { recursive: true });
      }

      // Save the model
      await this.model.save(`file://${this.modelPath}`);
      this.logger.log('Model saved successfully');
    } catch (error) {
      this.logger.error('Failed to save model', error);
    }
  }

  async evaluateModel(testData: ReconciliationHistory[]): Promise<{
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  }> {
    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;

    for (const data of testData) {
      const features = this.extractFeatures(data.payment, data.transaction);
      const prediction = await this.predict(features);
      const predicted = prediction.confidence >= this.threshold;
      const actual = data.wasCorrectMatch;

      if (predicted && actual) truePositives++;
      else if (predicted && !actual) falsePositives++;
      else if (!predicted && actual) falseNegatives++;
      else if (!predicted && !actual) trueNegatives++;
    }

    const accuracy = (truePositives + trueNegatives) / testData.length;
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

    this.logger.log(`Model Evaluation - Accuracy: ${(accuracy * 100).toFixed(2)}%, ` +
      `Precision: ${(precision * 100).toFixed(2)}%, ` +
      `Recall: ${(recall * 100).toFixed(2)}%, ` +
      `F1 Score: ${(f1Score * 100).toFixed(2)}%`);

    return { accuracy, precision, recall, f1Score };
  }

  /**
   * Suggest matches for unmatched transactions using AI
   */
  async suggestMatches(
    unmatchedBankTransactions: BankTransaction[],
    unmatchedSystemPayments: PaymentRecord[]
  ): Promise<ReconciliationMatch[]> {
    this.logger.log(`Suggesting matches for ${unmatchedBankTransactions.length} bank transactions and ${unmatchedSystemPayments.length} system payments`);

    const suggestions = await this.matchTransactions(unmatchedSystemPayments, unmatchedBankTransactions);

    // Filter to only return high-confidence suggestions
    return suggestions.filter(match => match.confidence > 0.7);
  }
}