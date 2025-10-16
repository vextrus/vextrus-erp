export interface IDomainEvent {
    aggregateId: string;
    eventType: string;
    eventVersion: number;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface IEventHandler<T extends IDomainEvent> {
    handle(event: T): Promise<void>;
}
//# sourceMappingURL=domain-event.interface.d.ts.map