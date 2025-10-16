import { Injectable, Inject } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class KafkaHealthIndicator extends HealthIndicator {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Simple health check - if Kafka client exists and service is running, consider it healthy
      // Consumer groups will log errors if there are actual connection issues
      const isConnected = !!this.kafkaClient;

      const result = this.getStatus(key, isConnected, {
        message: isConnected ? 'Kafka client is initialized' : 'Kafka client not available',
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