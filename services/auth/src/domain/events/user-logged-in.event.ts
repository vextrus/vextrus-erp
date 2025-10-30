export class UserLoggedInEvent {
  constructor(
    public readonly userId: string,
    public readonly ipAddress: string,
    public readonly userAgent: string,
    public readonly timestamp: Date,
  ) {}
}