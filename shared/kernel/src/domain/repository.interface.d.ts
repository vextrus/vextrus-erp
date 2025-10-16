export interface IRepository<T> {
    findById(id: string): Promise<T | null>;
    findAll(): Promise<T[]>;
    save(entity: T): Promise<void>;
    delete(id: string): Promise<void>;
}
export interface IEventStoreRepository {
    saveEvent(event: any): Promise<void>;
    getEvents(aggregateId: string): Promise<any[]>;
    getEventsByType(aggregateType: string, eventType?: string): Promise<any[]>;
    getEventsSince(timestamp: Date, aggregateType?: string): Promise<any[]>;
    getSnapshot(aggregateId: string, version?: number): Promise<any[]>;
}
export interface IUnitOfWork {
    begin(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    complete(): Promise<void>;
}
//# sourceMappingURL=repository.interface.d.ts.map