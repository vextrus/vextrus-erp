import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class KafkaService {
  constructor(@Inject('KAFKA_CLIENT') private readonly client: ClientKafka) {}

  async emit(topic: string, data: any): Promise<void> {
    this.client.emit(topic, data);
  }

  async send(pattern: string, data: any): Promise<any> {
    return this.client.send(pattern, data).toPromise();
  }

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  getProducer(): any {
    return this.client;
  }

  isConnected(): boolean {
    try {
      // Check if the Kafka client is connected
      // For NestJS ClientKafka, we check if the client exists and is connected
      return !!(this.client && this.client['producer'] && this.client['consumer']);
    } catch {
      return false;
    }
  }
}