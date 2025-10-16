export class UserLockedEvent {
  constructor(
    public readonly userId: string,
    public readonly reason: string,
    public readonly timestamp: Date,
  ) {}
}