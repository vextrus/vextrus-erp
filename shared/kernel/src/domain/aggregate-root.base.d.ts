import { AggregateRoot as NestAggregateRoot } from '@nestjs/cqrs';
import { IDomainEvent } from './domain-event.interface';
export declare abstract class AggregateRoot extends NestAggregateRoot {
    private _domainEvents;
    private _version;
    get domainEvents(): IDomainEvent[];
    get version(): number;
    protected addDomainEvent(event: IDomainEvent): void;
    clearEvents(): void;
    incrementVersion(): void;
    loadFromHistory(history: IDomainEvent[]): void;
    abstract getId(): string;
}
//# sourceMappingURL=aggregate-root.base.d.ts.map