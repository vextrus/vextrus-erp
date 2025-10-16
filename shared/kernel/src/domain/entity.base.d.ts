export declare abstract class Entity<TId> {
    protected readonly _id: TId;
    protected _createdAt: Date;
    protected _updatedAt: Date;
    constructor(id: TId);
    get id(): TId;
    get createdAt(): Date;
    get updatedAt(): Date;
    equals(entity: Entity<TId>): boolean;
    updateTimestamp(): void;
}
//# sourceMappingURL=entity.base.d.ts.map