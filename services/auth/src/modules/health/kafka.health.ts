import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { KafkaService } from '@shared/kafka/kafka.service';

@Injectable()
export class KafkaHealthIndicator extends HealthIndicator {
  constructor(private readonly kafkaService: KafkaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Check the actual connection status of the Kafka client
      if (this.kafkaService.isConnected()) {
        return this.getStatus(key, true);
      } else {
        throw new Error('Kafka client is not connected');
      }
    } catch (error: any) {
      throw new HealthCheckError(
        'Kafka check failed',
        this.getStatus(key, false, { message: error.message }),
      );
    }
  }
}