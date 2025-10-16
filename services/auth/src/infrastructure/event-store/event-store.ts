import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventStoreEntity } from './event-store.entity';

export interface EventData {
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  eventData: any;
  eventVersion: number;
  timestamp: Date;
}

@Injectable()
export class EventStore {
  constructor(
    @InjectRepository(EventStoreEntity)
    private readonly eventRepository: Repository<EventStoreEntity>,
  ) {}

  async saveEvent(eventData: EventData): Promise<void> {
    const event = this.eventRepository.create({
      aggregateId: eventData.aggregateId,
      aggregateType: eventData.aggregateType,
      eventType: eventData.eventType,
      eventData: JSON.stringify(eventData.eventData),
      eventVersion: eventData.eventVersion,
      timestamp: eventData.timestamp,
    });

    await this.eventRepository.save(event);
  }

  async getEvents(aggregateId: string): Promise<EventStoreEntity[]> {
    return this.eventRepository.find({
      where: { aggregateId },
      order: { eventVersion: 'ASC' },
    });
  }

  async getEventsByType(
    aggregateType: string,
    eventType?: string,
  ): Promise<EventStoreEntity[]> {
    const query = this.eventRepository
      .createQueryBuilder('event')
      .where('event.aggregateType = :aggregateType', { aggregateType });

    if (eventType) {
      query.andWhere('event.eventType = :eventType', { eventType });
    }

    return query.orderBy('event.timestamp', 'DESC').getMany();
  }

  async getEventsSince(
    timestamp: Date,
    aggregateType?: string,
  ): Promise<EventStoreEntity[]> {
    const query = this.eventRepository
      .createQueryBuilder('event')
      .where('event.timestamp > :timestamp', { timestamp });

    if (aggregateType) {
      query.andWhere('event.aggregateType = :aggregateType', { aggregateType });
    }

    return query.orderBy('event.timestamp', 'ASC').getMany();
  }

  async getSnapshot(
    aggregateId: string,
    version?: number,
  ): Promise<EventStoreEntity[]> {
    const query = this.eventRepository
      .createQueryBuilder('event')
      .where('event.aggregateId = :aggregateId', { aggregateId });

    if (version) {
      query.andWhere('event.eventVersion <= :version', { version });
    }

    return query.orderBy('event.eventVersion', 'ASC').getMany();
  }
}