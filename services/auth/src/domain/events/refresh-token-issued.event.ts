export class RefreshTokenIssuedEvent {
  constructor(
    public readonly userId: string,
    public readonly token: string,
    public readonly expiresAt: Date,
    public readonly timestamp: Date = new Date(),
  ) {}
}