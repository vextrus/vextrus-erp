import { Injectable, Logger } from '@nestjs/common';
import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as ss from 'simple-statistics';
import moment from 'moment';

export interface CashFlowData {
  date: Date;
  inflow: number;
  outflow: number;
  balance: number;
  category?: string;
  description?: string;
  tenantId: string;
}

export interface CashFlowPrediction {
  predictions: PredictedCashFlow[];
  confidence: ConfidenceInterval[];
  insights: CashFlowInsight[];
  alerts: CashFlowAlert[];
  metadata: PredictionMetadata;
}

export interface PredictedCashFlow {
  date: Date;
  predictedInflow: number;
  predictedOutflow: number;
  predictedBalance: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface ConfidenceInterval {
  date: Date;
  lowerBound: number;
  upperBound: number;
  confidenceLevel: number;
}

export interface CashFlowInsight {
  type: 'WARNING' | 'OPTIMIZATION' | 'INFO' | 'CRITICAL';
  title: string;
  message: string;
  recommendation?: string;
  confidence?: number;
  impactAmount?: number;
  affectedDates?: Date[];
}

export interface CashFlowAlert {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: string;
  message: string;
  triggerDate?: Date;
  threshold?: number;
  predictedValue?: number;
}

export interface PredictionMetadata {
  modelVersion: string;
  trainingDataPoints: number;
  predictionHorizon: number;
  generatedAt: Date;
  accuracy?: number;
  mape?: number; // Mean Absolute Percentage Error
}

export interface SeasonalPattern {
  description: string;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  strength: number;
  recommendation: string;
}

@Injectable()
export class CashFlowPredictionService {
  private readonly logger = new Logger(CashFlowPredictionService.name);
  private timeSeriesModel!: tf.LayersModel;
  private readonly modelPath = path.join(process.cwd(), 'models', 'cashflow-lstm');
  private seasonalityFactors: Map<string, number> = new Map();
  private readonly lookbackWindow = 30; // Days to look back
  private readonly features = 7; // Number of features per time step

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.initializeModel();
    this.initializeSeasonalityFactors();
  }

  private async initializeModel(): Promise<void> {
    try {
      await this.loadOrCreateModel();
      this.logger.log('Cash flow prediction model initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize LSTM model', error);
    }
  }

  private initializeSeasonalityFactors(): void {
    // Bangladesh-specific seasonal factors
    this.seasonalityFactors.set('eid-al-fitr', 1.5); // 50% increase during Eid
    this.seasonalityFactors.set('eid-al-adha', 1.4);
    this.seasonalityFactors.set('durga-puja', 1.3);
    this.seasonalityFactors.set('pohela-boishakh', 1.2); // Bengali New Year
    this.seasonalityFactors.set('month-end', 1.1); // Salary payments
    this.seasonalityFactors.set('harvest-aman', 1.3); // November-December
    this.seasonalityFactors.set('harvest-boro', 1.25); // April-May
  }

  private async loadOrCreateModel(): Promise<void> {
    const modelJsonPath = path.join(this.modelPath, 'model.json');

    if (fs.existsSync(modelJsonPath)) {
      try {
        this.timeSeriesModel = await tf.loadLayersModel(`file://${this.modelPath}/model.json`);
        this.logger.log('Loaded pre-trained LSTM cash flow model');
      } catch (error) {
        this.logger.warn('Failed to load LSTM model, creating new one', error);
        await this.createLSTMModel();
      }
    } else {
      await this.createLSTMModel();
    }
  }

  private async createLSTMModel(): Promise<void> {
    // LSTM model for complex time series pattern recognition
    this.timeSeriesModel = tf.sequential({
      layers: [
        // First LSTM layer with return sequences
        tf.layers.lstm({
          units: 128,
          returnSequences: true,
          inputShape: [this.lookbackWindow, this.features],
          kernelInitializer: 'glorotNormal',
          recurrentInitializer: 'orthogonal',
          biasInitializer: 'zeros',
          dropout: 0.2,
          recurrentDropout: 0.2,
        }),
        tf.layers.batchNormalization(),

        // Second LSTM layer
        tf.layers.lstm({
          units: 64,
          returnSequences: true,
          kernelInitializer: 'glorotNormal',
          recurrentInitializer: 'orthogonal',
          dropout: 0.2,
          recurrentDropout: 0.2,
        }),
        tf.layers.batchNormalization(),

        // Third LSTM layer (no return sequences)
        tf.layers.lstm({
          units: 32,
          returnSequences: false,
          kernelInitializer: 'glorotNormal',
          recurrentInitializer: 'orthogonal',
          dropout: 0.2,
        }),

        // Dense layers for output
        tf.layers.dense({
          units: 64,
          activation: 'relu',
          kernelInitializer: 'heNormal',
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu',
          kernelInitializer: 'heNormal',
        }),

        // Output layer - predicting multiple days ahead
        tf.layers.dense({
          units: 90 * 3, // 90 days × 3 values (inflow, outflow, balance)
          activation: 'linear',
        }),
      ]
    });

    this.timeSeriesModel.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae', 'mape'],
    });

    this.logger.log('Created new LSTM model for cash flow prediction');
  }

  async predictCashFlow(
    historicalData: CashFlowData[],
    horizonDays: number = 90
  ): Promise<CashFlowPrediction> {
    const startTime = Date.now();

    // Validate input data
    if (historicalData.length < this.lookbackWindow) {
      throw new Error(`Insufficient historical data. Need at least ${this.lookbackWindow} days of data.`);
    }

    // Preprocess time series data
    const processed = this.preprocessTimeSeries(historicalData);

    // Apply multiple prediction methods
    const [lstmPrediction, trendPrediction, seasonalPrediction]: [PredictedCashFlow[], PredictedCashFlow[], PredictedCashFlow[]] = await Promise.all([
      this.predictWithLSTM(processed, horizonDays),
      this.predictTrend(processed, horizonDays),
      this.extractAndPredictSeasonality(processed, horizonDays),
    ]);

    // Combine predictions with weighted average
    const combined = this.combineForecasts(lstmPrediction, trendPrediction, seasonalPrediction);

    // Calculate confidence intervals
    const intervals = this.calculateConfidenceIntervals(combined, historicalData);

    // Generate insights and alerts
    const insights = this.generateInsights(combined, historicalData);
    const alerts = this.detectAnomaliesAndAlerts(combined, historicalData);

    // Calculate metrics
    const processingTime = Date.now() - startTime;

    const prediction: CashFlowPrediction = {
      predictions: combined,
      confidence: intervals,
      insights,
      alerts,
      metadata: {
        modelVersion: '1.0.0',
        trainingDataPoints: historicalData.length,
        predictionHorizon: horizonDays,
        generatedAt: new Date(),
        accuracy: await this.estimateAccuracy(historicalData),
      },
    };

    // Emit prediction event
    this.eventEmitter.emit('cashflow.prediction.generated', {
      horizonDays,
      processingTimeMs: processingTime,
      alertCount: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'CRITICAL').length,
    });

    this.logger.log(`Cash flow prediction completed in ${processingTime}ms`);

    return prediction;
  }

  private preprocessTimeSeries(data: CashFlowData[]): number[][] {
    const processed: number[][] = [];

    for (let i = 0; i < data.length; i++) {
      const row = [
        data[i].inflow,
        data[i].outflow,
        data[i].balance,
        new Date(data[i].date).getDay(), // Day of week
        new Date(data[i].date).getDate(), // Day of month
        new Date(data[i].date).getMonth(), // Month
        this.isSpecialDay(data[i].date) ? 1 : 0, // Special day indicator
      ];
      processed.push(this.normalizeFeatures(row));
    }

    return processed;
  }

  private normalizeFeatures(features: number[]): number[] {
    // Min-max normalization for each feature
    const normalized = [...features];

    // Normalize monetary values (assuming max transaction of 10M BDT)
    normalized[0] = features[0] / 10000000; // Inflow
    normalized[1] = features[1] / 10000000; // Outflow
    normalized[2] = features[2] / 100000000; // Balance (can be higher)
    normalized[3] = features[3] / 6; // Day of week (0-6)
    normalized[4] = features[4] / 31; // Day of month (1-31)
    normalized[5] = features[5] / 11; // Month (0-11)
    // Special day is already binary (0 or 1)

    return normalized;
  }

  private isSpecialDay(date: Date): boolean {
    const momentDate = moment(date);
    const dayOfMonth = momentDate.date();
    const month = momentDate.month();

    // Month-end (last 3 days)
    if (dayOfMonth >= momentDate.daysInMonth() - 2) return true;

    // Common salary days in Bangladesh (1st and 25th)
    if (dayOfMonth === 1 || dayOfMonth === 25) return true;

    // Approximate festival periods (would need a proper calendar API for accuracy)
    // Eid periods (varies each year)
    if (month === 4 || month === 6) return true; // Approximate

    return false;
  }

  private async predictWithLSTM(
    data: number[][],
    horizon: number
  ): Promise<PredictedCashFlow[]> {
    // Prepare sequences for LSTM
    const sequences = this.createSequences(data, this.lookbackWindow);

    if (sequences.features.length === 0) {
      throw new Error('Unable to create sequences from data');
    }

    // Convert to tensor
    const input = tf.tensor3d([sequences.features[sequences.features.length - 1]]);

    // Make prediction
    const predictionTensor = this.timeSeriesModel.predict(input) as tf.Tensor;
    const predictionData = await predictionTensor.data();

    // Clean up tensors
    input.dispose();
    predictionTensor.dispose();

    // Parse predictions
    const predictions: PredictedCashFlow[] = [];
    const lastDate = new Date(data[data.length - 1][6] || Date.now());

    for (let i = 0; i < horizon; i++) {
      const idx = i * 3;
      const predictedDate = moment(lastDate).add(i + 1, 'days').toDate();

      const inflow = Math.max(0, predictionData[idx] * 10000000); // Denormalize
      const outflow = Math.max(0, predictionData[idx + 1] * 10000000);
      const balance = predictionData[idx + 2] * 100000000;

      // Determine trend
      const previousBalance = i === 0
        ? data[data.length - 1][2] * 100000000
        : predictions[i - 1].predictedBalance;

      let trend: 'increasing' | 'decreasing' | 'stable';
      const changePercent = Math.abs((balance - previousBalance) / previousBalance);

      if (changePercent < 0.02) {
        trend = 'stable';
      } else if (balance > previousBalance) {
        trend = 'increasing';
      } else {
        trend = 'decreasing';
      }

      predictions.push({
        date: predictedDate,
        predictedInflow: inflow,
        predictedOutflow: outflow,
        predictedBalance: balance,
        confidence: this.calculatePointConfidence(i, horizon),
        trend,
      });
    }

    return predictions;
  }

  private createSequences(
    data: number[][],
    lookback: number
  ): { features: number[][][]; targets?: number[][] } {
    const features: number[][][] = [];
    const targets: number[][] = [];

    for (let i = lookback; i < data.length; i++) {
      const sequence = data.slice(i - lookback, i);
      features.push(sequence);

      // For training, we'd also prepare targets
      if (i < data.length - 1) {
        targets.push(data[i]);
      }
    }

    return { features, targets: targets.length > 0 ? targets : undefined };
  }

  private calculatePointConfidence(dayIndex: number, totalDays: number): number {
    // Confidence decreases with prediction distance
    const decayRate = 0.005; // 0.5% decrease per day
    return Math.max(0.5, 1 - (dayIndex * decayRate));
  }

  private async predictTrend(data: number[][], horizonDays: number): Promise<PredictedCashFlow[]> {
    // Extract balance values
    const balances = data.map(d => d[2] * 100000000);

    // Simple linear regression for trend
    const indices = Array.from({ length: balances.length }, (_, i) => i);
    const regression = ss.linearRegression([indices, balances]);
    const linearFn = ss.linearRegressionLine(regression);

    const predictions: PredictedCashFlow[] = [];
    const lastDate = new Date();
    const avgInflow = ss.mean(data.map(d => d[0] * 10000000));
    const avgOutflow = ss.mean(data.map(d => d[1] * 10000000));

    for (let i = 0; i < horizonDays; i++) {
      const predictedBalance = linearFn(data.length + i);
      predictions.push({
        date: moment(lastDate).add(i + 1, 'days').toDate(),
        predictedInflow: avgInflow,
        predictedOutflow: avgOutflow,
        predictedBalance,
        confidence: 0.7, // Lower confidence for simple trend
        trend: regression.m > 0 ? 'increasing' : 'decreasing',
      });
    }

    return predictions;
  }

  private extractAndPredictSeasonality(
    data: number[][],
    horizonDays: number
  ): PredictedCashFlow[] {
    // Weekly seasonality detection
    const weeklyPattern = this.detectWeeklyPattern(data);

    // Monthly seasonality detection
    const monthlyPattern = this.detectMonthlyPattern(data);

    const predictions: PredictedCashFlow[] = [];
    const lastDate = new Date();

    for (let i = 0; i < horizonDays; i++) {
      const predictedDate = moment(lastDate).add(i + 1, 'days').toDate();
      const dayOfWeek = predictedDate.getDay();
      const dayOfMonth = predictedDate.getDate();

      // Apply seasonal adjustments
      let inflowMultiplier = 1;
      let outflowMultiplier = 1;

      // Weekly pattern
      if (weeklyPattern[dayOfWeek]) {
        inflowMultiplier *= weeklyPattern[dayOfWeek].inflowFactor;
        outflowMultiplier *= weeklyPattern[dayOfWeek].outflowFactor;
      }

      // Monthly pattern (salary days, month-end)
      if (monthlyPattern[dayOfMonth]) {
        inflowMultiplier *= monthlyPattern[dayOfMonth].inflowFactor;
        outflowMultiplier *= monthlyPattern[dayOfMonth].outflowFactor;
      }

      // Apply special day factors
      const specialFactor = this.getSpecialDayFactor(predictedDate);
      inflowMultiplier *= specialFactor;

      const baseInflow = ss.mean(data.map(d => d[0] * 10000000));
      const baseOutflow = ss.mean(data.map(d => d[1] * 10000000));

      predictions.push({
        date: predictedDate,
        predictedInflow: baseInflow * inflowMultiplier,
        predictedOutflow: baseOutflow * outflowMultiplier,
        predictedBalance: 0, // Will be calculated in combination
        confidence: 0.65,
        trend: 'stable',
      });
    }

    return predictions;
  }

  private detectWeeklyPattern(data: number[][]): any {
    const weeklyStats: any = {};

    for (let dow = 0; dow < 7; dow++) {
      const dayData = data.filter(d => d[3] === dow / 6);
      if (dayData.length > 0) {
        weeklyStats[dow] = {
          inflowFactor: ss.mean(dayData.map(d => d[0])) / ss.mean(data.map(d => d[0])),
          outflowFactor: ss.mean(dayData.map(d => d[1])) / ss.mean(data.map(d => d[1])),
        };
      }
    }

    return weeklyStats;
  }

  private detectMonthlyPattern(data: number[][]): any {
    const monthlyStats: any = {};

    // Focus on key days: 1st, 25th, and last 3 days
    const keyDays = [1, 25, 28, 29, 30, 31];

    for (const day of keyDays) {
      const dayData = data.filter(d => Math.floor(d[4] * 31) === day);
      if (dayData.length > 0) {
        monthlyStats[day] = {
          inflowFactor: ss.mean(dayData.map(d => d[0])) / ss.mean(data.map(d => d[0])),
          outflowFactor: ss.mean(dayData.map(d => d[1])) / ss.mean(data.map(d => d[1])),
        };
      }
    }

    return monthlyStats;
  }

  private getSpecialDayFactor(date: Date): number {
    const momentDate = moment(date);
    const month = momentDate.month();
    const week = momentDate.week();

    // Bangladesh specific events (simplified - would need a proper calendar)
    // Eid periods (approximate)
    if ((month === 4 && week >= 2) || (month === 6 && week <= 3)) {
      return this.seasonalityFactors.get('eid-al-fitr') || 1;
    }

    // Durga Puja (October)
    if (month === 9 && week >= 2 && week <= 3) {
      return this.seasonalityFactors.get('durga-puja') || 1;
    }

    // Pohela Boishakh (April 14)
    if (month === 3 && momentDate.date() === 14) {
      return this.seasonalityFactors.get('pohela-boishakh') || 1;
    }

    // Harvest seasons
    if (month === 10 || month === 11) {
      return this.seasonalityFactors.get('harvest-aman') || 1;
    }
    if (month === 3 || month === 4) {
      return this.seasonalityFactors.get('harvest-boro') || 1;
    }

    return 1;
  }

  private combineForecasts(
    lstm: PredictedCashFlow[],
    trend: PredictedCashFlow[],
    seasonal: PredictedCashFlow[]
  ): PredictedCashFlow[] {
    const combined: PredictedCashFlow[] = [];

    // Weights for different models
    const weights = {
      lstm: 0.5,      // 50% weight to LSTM
      trend: 0.2,     // 20% to trend
      seasonal: 0.3,  // 30% to seasonality
    };

    for (let i = 0; i < lstm.length; i++) {
      const combinedInflow =
        lstm[i].predictedInflow * weights.lstm +
        trend[i].predictedInflow * weights.trend +
        seasonal[i].predictedInflow * weights.seasonal;

      const combinedOutflow =
        lstm[i].predictedOutflow * weights.lstm +
        trend[i].predictedOutflow * weights.trend +
        seasonal[i].predictedOutflow * weights.seasonal;

      const previousBalance = i === 0
        ? lstm[0].predictedBalance // Use LSTM's initial balance
        : combined[i - 1].predictedBalance;

      const combinedBalance = previousBalance + combinedInflow - combinedOutflow;

      // Weighted confidence
      const combinedConfidence =
        lstm[i].confidence * weights.lstm +
        trend[i].confidence * weights.trend +
        seasonal[i].confidence * weights.seasonal;

      // Determine trend based on balance change
      let trendDirection: 'increasing' | 'decreasing' | 'stable';
      const changePercent = Math.abs((combinedBalance - previousBalance) / previousBalance);

      if (changePercent < 0.02) {
        trendDirection = 'stable';
      } else if (combinedBalance > previousBalance) {
        trendDirection = 'increasing';
      } else {
        trendDirection = 'decreasing';
      }

      combined.push({
        date: lstm[i].date,
        predictedInflow: combinedInflow,
        predictedOutflow: combinedOutflow,
        predictedBalance: combinedBalance,
        confidence: combinedConfidence,
        trend: trendDirection,
      });
    }

    return combined;
  }

  private calculateConfidenceIntervals(
    predictions: PredictedCashFlow[],
    historicalData: CashFlowData[]
  ): ConfidenceInterval[] {
    // Calculate historical standard deviation
    const historicalBalances = historicalData.map(d => d.balance);
    const stdDev = ss.standardDeviation(historicalBalances);

    const intervals: ConfidenceInterval[] = [];

    for (let i = 0; i < predictions.length; i++) {
      const prediction = predictions[i];

      // Increase uncertainty with prediction distance
      const uncertaintyFactor = 1 + (i * 0.01); // 1% increase per day
      const adjustedStdDev = stdDev * uncertaintyFactor;

      // 95% confidence interval (1.96 standard deviations)
      const margin = 1.96 * adjustedStdDev;

      intervals.push({
        date: prediction.date,
        lowerBound: prediction.predictedBalance - margin,
        upperBound: prediction.predictedBalance + margin,
        confidenceLevel: 0.95,
      });
    }

    return intervals;
  }

  private generateInsights(
    predictions: PredictedCashFlow[],
    historical: CashFlowData[]
  ): CashFlowInsight[] {
    const insights: CashFlowInsight[] = [];

    // 1. Cash shortage risk detection
    const shortageIndex = predictions.findIndex(p => p.predictedBalance < 0);
    if (shortageIndex !== -1) {
      const shortage = predictions[shortageIndex];
      insights.push({
        type: 'CRITICAL',
        title: 'Cash Shortage Risk Detected',
        message: `Potential cash shortage of BDT ${Math.abs(shortage.predictedBalance).toLocaleString()} expected on ${moment(shortage.date).format('YYYY-MM-DD')}`,
        recommendation: 'Consider: 1) Accelerating receivables collection, 2) Negotiating extended payment terms with suppliers, 3) Securing a credit line or overdraft facility',
        confidence: shortage.confidence,
        impactAmount: Math.abs(shortage.predictedBalance),
        affectedDates: [shortage.date],
      });
    }

    // 2. Optimal payment timing
    const optimalPaymentDays = this.findOptimalPaymentDays(predictions);
    if (optimalPaymentDays.length > 0) {
      insights.push({
        type: 'OPTIMIZATION',
        title: 'Optimal Payment Timing Identified',
        message: `Best days for scheduling large payments: ${optimalPaymentDays.map(d => moment(d).format('MMM DD')).join(', ')}`,
        recommendation: 'Schedule non-urgent large payments on these dates to maintain healthy cash reserves',
        confidence: 0.8,
      });
    }

    // 3. Working capital optimization
    const avgBalance = ss.mean(predictions.map(p => p.predictedBalance));
    const minBalance = Math.min(...predictions.map(p => p.predictedBalance));
    const excessCash = avgBalance - (minBalance * 1.2); // 20% buffer

    if (excessCash > 1000000) { // If excess cash > 1M BDT
      insights.push({
        type: 'OPTIMIZATION',
        title: 'Excess Cash Opportunity',
        message: `Average excess cash of BDT ${excessCash.toLocaleString()} could be invested`,
        recommendation: 'Consider short-term investments or early payment discounts to optimize cash utilization',
        impactAmount: excessCash,
      });
    }

    // 4. Seasonal pattern insights
    const seasonalPattern = this.detectSeasonalPattern(historical);
    if (seasonalPattern) {
      insights.push({
        type: 'INFO',
        title: 'Seasonal Pattern Detected',
        message: seasonalPattern.description,
        recommendation: seasonalPattern.recommendation,
        confidence: seasonalPattern.strength,
      });
    }

    // 5. Cash flow trend analysis
    const trendAnalysis = this.analyzeTrend(predictions);
    if (trendAnalysis.significance > 0.7) {
      insights.push({
        type: trendAnalysis.direction === 'declining' ? 'WARNING' : 'INFO',
        title: `${trendAnalysis.direction === 'declining' ? 'Declining' : 'Improving'} Cash Flow Trend`,
        message: `Cash flow shows a ${trendAnalysis.direction} trend of ${Math.abs(trendAnalysis.rate).toFixed(2)}% per month`,
        recommendation: trendAnalysis.direction === 'declining'
          ? 'Review revenue streams and cost reduction opportunities'
          : 'Continue current financial strategies while planning for growth',
        confidence: trendAnalysis.significance,
      });
    }

    return insights;
  }

  private findOptimalPaymentDays(predictions: PredictedCashFlow[]): Date[] {
    const optimalDays: Date[] = [];

    // Find days with highest predicted balance
    const sortedByBalance = [...predictions]
      .sort((a, b) => b.predictedBalance - a.predictedBalance)
      .slice(0, 5); // Top 5 days

    // Filter for days with high confidence
    const highConfidenceDays = sortedByBalance.filter(p => p.confidence > 0.7);

    optimalDays.push(...highConfidenceDays.map(p => p.date));

    return optimalDays;
  }

  private detectSeasonalPattern(historical: CashFlowData[]): SeasonalPattern | null {
    // Detect monthly pattern
    const monthlyData: { [key: number]: number[] } = {};

    historical.forEach(data => {
      const month = new Date(data.date).getMonth();
      if (!monthlyData[month]) {
        monthlyData[month] = [];
      }
      monthlyData[month].push(data.balance);
    });

    // Calculate monthly averages
    const monthlyAverages = Object.entries(monthlyData).map(([month, balances]) => ({
      month: parseInt(month),
      average: ss.mean(balances),
      stdDev: ss.standardDeviation(balances),
    }));

    // Find patterns
    const overallAverage = ss.mean(monthlyAverages.map(m => m.average));
    const significantMonths = monthlyAverages.filter(
      m => Math.abs(m.average - overallAverage) > overallAverage * 0.2
    );

    if (significantMonths.length > 0) {
      const highMonths = significantMonths.filter(m => m.average > overallAverage);
      const lowMonths = significantMonths.filter(m => m.average < overallAverage);

      return {
        description: `Strong ${highMonths.length > lowMonths.length ? 'positive' : 'negative'} seasonal pattern detected`,
        period: 'monthly',
        strength: 0.8,
        recommendation: highMonths.length > 0
          ? `Plan major expenses outside peak months: ${highMonths.map(m => moment().month(m.month).format('MMMM')).join(', ')}`
          : `Prepare additional funding for low months: ${lowMonths.map(m => moment().month(m.month).format('MMMM')).join(', ')}`,
      };
    }

    return null;
  }

  private analyzeTrend(predictions: PredictedCashFlow[]): {
    direction: 'improving' | 'declining' | 'stable';
    rate: number;
    significance: number;
  } {
    const balances = predictions.map(p => p.predictedBalance);
    const indices = Array.from({ length: balances.length }, (_, i) => i);

    const regression = ss.linearRegression([indices, balances]);
    const r2 = ss.rSquared(
      indices.map((x, i) => [x, balances[i]]),
      ss.linearRegressionLine(regression)
    );

    // Calculate monthly rate
    const dailyRate = regression.m / (balances[0] || 1);
    const monthlyRate = dailyRate * 30 * 100; // Percentage per month

    let direction: 'improving' | 'declining' | 'stable';
    if (Math.abs(monthlyRate) < 2) {
      direction = 'stable';
    } else if (monthlyRate > 0) {
      direction = 'improving';
    } else {
      direction = 'declining';
    }

    return {
      direction,
      rate: monthlyRate,
      significance: r2,
    };
  }

  private detectAnomaliesAndAlerts(
    predictions: PredictedCashFlow[],
    historical: CashFlowData[]
  ): CashFlowAlert[] {
    const alerts: CashFlowAlert[] = [];

    // Calculate thresholds based on historical data
    const historicalBalances = historical.map(d => d.balance);
    const minHistorical = Math.min(...historicalBalances);
    const avgHistorical = ss.mean(historicalBalances);

    // Critical low balance alert
    const criticalThreshold = Math.max(0, minHistorical * 0.5); // 50% of historical minimum
    const criticalDays = predictions.filter(p => p.predictedBalance < criticalThreshold);

    if (criticalDays.length > 0) {
      alerts.push({
        severity: 'CRITICAL',
        type: 'LOW_BALANCE',
        message: `Critical low balance expected on ${criticalDays.length} days`,
        triggerDate: criticalDays[0].date,
        threshold: criticalThreshold,
        predictedValue: criticalDays[0].predictedBalance,
      });
    }

    // Unusual outflow detection
    const avgOutflow = ss.mean(historical.map(d => d.outflow));
    const stdOutflow = ss.standardDeviation(historical.map(d => d.outflow));
    const unusualOutflowThreshold = avgOutflow + (3 * stdOutflow);

    predictions.forEach(prediction => {
      if (prediction.predictedOutflow > unusualOutflowThreshold) {
        alerts.push({
          severity: 'HIGH',
          type: 'UNUSUAL_OUTFLOW',
          message: `Unusually high outflow predicted: BDT ${prediction.predictedOutflow.toLocaleString()}`,
          triggerDate: prediction.date,
          threshold: unusualOutflowThreshold,
          predictedValue: prediction.predictedOutflow,
        });
      }
    });

    // Sustained negative trend alert
    const decliningDays = predictions.filter((p, i) =>
      i > 0 && p.predictedBalance < predictions[i - 1].predictedBalance
    );

    if (decliningDays.length > predictions.length * 0.7) { // More than 70% declining
      alerts.push({
        severity: 'HIGH',
        type: 'SUSTAINED_DECLINE',
        message: 'Sustained declining cash flow trend detected',
        triggerDate: predictions[0].date,
      });
    }

    // Working capital alert
    const workingCapitalDays = predictions.filter(p =>
      p.predictedBalance < avgHistorical * 0.3 // Less than 30% of average
    );

    if (workingCapitalDays.length > 0) {
      alerts.push({
        severity: 'MEDIUM',
        type: 'LOW_WORKING_CAPITAL',
        message: `Working capital concerns on ${workingCapitalDays.length} days`,
        triggerDate: workingCapitalDays[0].date,
        threshold: avgHistorical * 0.3,
      });
    }

    return alerts.sort((a, b) => {
      // Sort by severity
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  private async estimateAccuracy(historicalData: CashFlowData[]): Promise<number> {
    // Use backtesting to estimate model accuracy
    if (historicalData.length < 60) {
      return 0; // Not enough data for backtesting
    }

    const testSize = Math.min(30, Math.floor(historicalData.length * 0.2));
    const trainData = historicalData.slice(0, -testSize);
    const testData = historicalData.slice(-testSize);

    try {
      // Make predictions on historical data
      const predictions = await this.predictCashFlow(trainData, testSize);

      // Calculate MAPE (Mean Absolute Percentage Error)
      const errors: number[] = [];
      for (let i = 0; i < testSize && i < predictions.predictions.length; i++) {
        const actual = testData[i].balance;
        const predicted = predictions.predictions[i].predictedBalance;

        if (actual !== 0) {
          const error = Math.abs((actual - predicted) / actual);
          errors.push(error);
        }
      }

      const mape = ss.mean(errors);
      const accuracy = Math.max(0, 1 - mape);

      return accuracy;
    } catch (error) {
      this.logger.error('Error estimating accuracy', error);
      return 0;
    }
  }

  async trainModel(historicalData: CashFlowData[]): Promise<void> {
    if (historicalData.length < 100) {
      this.logger.warn('Insufficient training data. Need at least 100 data points.');
      return;
    }

    this.logger.log(`Training LSTM model with ${historicalData.length} samples`);

    // Prepare training data
    const processed = this.preprocessTimeSeries(historicalData);
    const sequences = this.createSequences(processed, this.lookbackWindow);

    if (!sequences.targets) {
      throw new Error('Unable to prepare training targets');
    }

    // Convert to tensors
    const xs = tf.tensor3d(sequences.features);
    const ys = tf.tensor2d(sequences.targets);

    // Train the model
    const history = await this.timeSeriesModel.fit(xs, ys, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 5 === 0) {
            this.logger.log(
              `Epoch ${epoch}: loss = ${logs?.loss?.toFixed(4)}, ` +
              `mae = ${logs?.mae?.toFixed(4)}, ` +
              `val_loss = ${logs?.val_loss?.toFixed(4)}`
            );
          }
        },
      },
    });

    // Save the model
    await this.saveModel();

    // Clean up tensors
    xs.dispose();
    ys.dispose();

    // Emit training complete event
    this.eventEmitter.emit('cashflow.model.trained', {
      samples: historicalData.length,
      finalLoss: history.history.val_loss[history.history.val_loss.length - 1],
      epochs: 50,
    });

    this.logger.log('LSTM model training completed');
  }

  private async saveModel(): Promise<void> {
    try {
      if (!fs.existsSync(this.modelPath)) {
        fs.mkdirSync(this.modelPath, { recursive: true });
      }

      await this.timeSeriesModel.save(`file://${this.modelPath}`);
      this.logger.log('Cash flow model saved successfully');
    } catch (error) {
      this.logger.error('Failed to save model', error);
    }
  }
}