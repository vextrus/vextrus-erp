export abstract class Entity<TId> {
  protected readonly _id: TId;
  protected _createdAt: Date;
  protected _updatedAt: Date;

  constructor(id: TId) {
    this._id = id;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  get id(): TId {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  equals(entity: Entity<TId>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }
    if (this === entity) {
      return true;
    }
    return this._id === entity._id;
  }

  updateTimestamp(): void {
    this._updatedAt = new Date();
  }
}