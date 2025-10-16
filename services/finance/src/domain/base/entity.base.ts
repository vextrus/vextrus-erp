export abstract class Entity<T> {
  protected readonly _id: string;
  protected props: T;

  constructor(props: T, id: string) {
    this._id = id;
    this.props = props;
  }

  get id(): string {
    return this._id;
  }

  public equals(entity?: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    if (!this.isEntity(entity)) {
      return false;
    }

    return this._id === entity._id;
  }

  private isEntity(v: any): v is Entity<T> {
    return v instanceof Entity;
  }
}