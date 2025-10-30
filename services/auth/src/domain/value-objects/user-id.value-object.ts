import { randomUUID } from 'crypto';

export class UserId {
  constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('UserId cannot be empty');
    }
    if (!this.isValidUUID(value)) {
      throw new Error('UserId must be a valid UUID');
    }
  }

  static generate(): UserId {
    return new UserId(randomUUID());
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}