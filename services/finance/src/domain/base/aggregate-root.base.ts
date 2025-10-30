import { DomainEvent } from './domain-event.base';
import { Entity } from './entity.base';

export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: DomainEvent[] = [];
  private _version: number = 0;

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return this._domainEvents;
  }

  get version(): number {
    return this._version;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearEvents(): void {
    this._domainEvents = [];
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  markEventsAsCommitted(): void {
    this._domainEvents = [];
  }

  loadFromHistory(events: DomainEvent[]): void {
    events.forEach(event => {
      this.apply(event, false);
      this._version++;
    });
  }

  protected apply(event: DomainEvent, isNew: boolean = true): void {
    this.when(event);

    if (isNew) {
      this.addDomainEvent(event);
      this._version++; // Increment version for new events
    }
  }

  protected abstract when(event: DomainEvent): void;
}