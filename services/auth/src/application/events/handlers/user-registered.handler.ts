import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserRegisteredEvent } from '../../../domain/events/user-registered.event';
import { Logger } from '@nestjs/common';
import { EventStore } from '../../../infrastructure/event-store/event-store';

@EventsHandler(UserRegisteredEvent)
export class UserRegisteredHandler implements IEventHandler<UserRegisteredEvent> {
  private readonly logger = new Logger(UserRegisteredHandler.name);

  constructor(
    private readonly eventStore: EventStore,
  ) {}

  async handle(event: UserRegisteredEvent): Promise<void> {
    this.logger.log(`User registered: ${event.email}`);

    // Store event in event store
    await this.eventStore.saveEvent({
      aggregateId: event.userId,
      aggregateType: 'User',
      eventType: 'UserRegisteredEvent',
      eventData: event,
      eventVersion: 1,
      timestamp: event.timestamp,
    });

    // Send welcome email (implement email service)
    // await this.emailService.sendWelcomeEmail(event.email, event.firstName);

    // Publish to Kafka for other services
    // await this.kafkaService.publish('user.registered', event);

    // Update analytics
    // await this.analyticsService.trackUserRegistration(event);
  }
}