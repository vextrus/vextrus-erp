import { Module, Global } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventPublisherService } from './event-publisher.service';
import { KafkaConsumerService } from './kafka-consumer.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'finance-service',
              brokers: configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(','),
              retry: {
                retries: 5,
                initialRetryTime: 100,
              },
            },
            consumer: {
              groupId: 'finance-consumer',
              allowAutoTopicCreation: true,
              sessionTimeout: 30000,
              heartbeatInterval: 3000,
            },
            producer: {
              allowAutoTopicCreation: true,
              idempotent: true,
              maxInFlightRequests: 5,
              transactionalId: 'finance-producer',
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [EventPublisherService, KafkaConsumerService],
  exports: [ClientsModule, EventPublisherService, KafkaConsumerService],
})
export class KafkaModule {}