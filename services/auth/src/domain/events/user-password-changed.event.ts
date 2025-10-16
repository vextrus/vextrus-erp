export class UserPasswordChangedEvent {
  constructor(
    public readonly userId: string,
    public readonly timestamp: Date,
  ) {}
}