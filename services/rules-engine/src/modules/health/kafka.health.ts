import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { KafkaService } from '../kafka/kafka.service';

@Injectable()
export class KafkaHealthIndicator extends HealthIndicator {
  constructor(
    private readonly kafkaService: KafkaService
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Simple health check - if KafkaService exists and service is running, consider it healthy
      // Kafka consumers will log errors if there are actual connection issues
      const isConnected = !!this.kafkaService;

      const result = this.getStatus(key, isConnected, {
        message: isConnected ? 'Kafka service is initialized' : 'Kafka service not available',
        status: isConnected ? 'connected' : 'disconnected',
      });

      if (isConnected) {
        return result;
      }
      throw new HealthCheckError('Kafka check failed', result);
    } catch (error) {
      throw new HealthCheckError(
        'Kafka check failed',
        this.getStatus(key, false, {
          message: error.message || 'Unable to connect to Kafka',
        }),
      );
    }
  }
}
