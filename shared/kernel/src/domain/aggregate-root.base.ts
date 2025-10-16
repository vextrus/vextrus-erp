import { AggregateRoot as NestAggregateRoot } from '@nestjs/cqrs';
import { IDomainEvent } from './domain-event.interface';

export abstract class AggregateRoot extends NestAggregateRoot {
  private _domainEvents: IDomainEvent[] = [];
  private _version: number = 0;

  get domainEvents(): IDomainEvent[] {
    return this._domainEvents;
  }

  get version(): number {
    return this._version;
  }

  protected addDomainEvent(event: IDomainEvent): void {
    this._domainEvents.push(event);
    this.apply(event);
  }

  clearEvents(): void {
    this._domainEvents = [];
  }

  incrementVersion(): void {
    this._version++;
  }

  loadFromHistory(history: IDomainEvent[]): void {
    history.forEach((event) => {
      this.apply(event, true);
      this._version++;
    });
  }

  abstract getId(): string;
}