export class UserUnlockedEvent {
  constructor(
    public readonly userId: string,
    public readonly timestamp: Date,
  ) {}
}