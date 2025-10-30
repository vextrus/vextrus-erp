import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer, Admin } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private admin: Admin;
  private readonly topics = [
    "gateway.query.received",
    "gateway.query.completed",
    "gateway.mutation.received",
    "gateway.mutation.completed",
    "gateway.federation.error",
    "gateway.auth.failed",
    "gateway.rate.limited",
  ];

  constructor(private configService: ConfigService) {
    this.kafka = new Kafka({
      clientId: 'api-gateway-service',
      brokers: this.configService.get<string>('KAFKA_BROKERS')?.split(',') || ['localhost:9092'],
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'api-gateway-service-group' });
    this.admin = this.kafka.admin();
  }

  async onModuleInit() {
    try {
      await this.admin.connect();
      await this.createTopics();
      await this.producer.connect();
      await this.consumer.connect();
      await this.subscribeToTopics();
      this.logger.log('Kafka module initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Kafka module', error);
    }
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    await this.consumer.disconnect();
    await this.admin.disconnect();
  }

  private async createTopics() {
    const existingTopics = await this.admin.listTopics();
    const topicsToCreate = this.topics.filter(topic => !existingTopics.includes(topic));

    if (topicsToCreate.length > 0) {
      await this.admin.createTopics({
        topics: topicsToCreate.map(topic => ({
          topic,
          numPartitions: 3,
          replicationFactor: 1,
        })),
        waitForLeaders: true,
      });
      this.logger.log(`Created topics: ${topicsToCreate.join(', ')}`);
    }
  }

  private async subscribeToTopics() {
    // Subscribe to relevant topics for this service
    const subscribeTopics = this.getSubscriptionTopics();
    if (subscribeTopics.length > 0) {
      await this.consumer.subscribe({ topics: subscribeTopics, fromBeginning: false });
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          this.logger.log(`Received message from topic ${topic}`);
          await this.handleMessage(topic, message);
        },
      });
    }
  }

  private getSubscriptionTopics(): string[] {
    // Define which topics this service should listen to
    const subscriptions: Record<string, string[]> = {
      'workflow': ['rules.evaluation.completed', 'auth.user.login', 'master-data.entity.changed'],
      'rules-engine': ['workflow.task.created', 'master-data.entity.created', 'master-data.entity.updated'],
      'api-gateway': ['auth.token.refresh', 'workflow.process.completed', 'rules.evaluation.completed'],
    };
    return subscriptions['api-gateway'] || [];
  }

  private async handleMessage(topic: string, message: any) {
    try {
      const payload = JSON.parse(message.value?.toString() || '{}');
      this.logger.log(`Processing message from ${topic}`, payload);
      // Service-specific message handling logic here
    } catch (error) {
      this.logger.error(`Error processing message from ${topic}`, error);
    }
  }

  async publish(topic: string, message: any) {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: message.id || Date.now().toString(),
            value: JSON.stringify(message),
            headers: {
              service: 'api-gateway',
              timestamp: Date.now().toString(),
            },
          },
        ],
      });
      this.logger.log(`Published message to ${topic}`);
    } catch (error) {
      this.logger.error(`Error publishing to ${topic}`, error);
      throw error;
    }
  }
}
