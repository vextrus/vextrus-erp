export class RefreshTokenRevokedEvent {
  constructor(
    public readonly userId: string,
    public readonly token: string,
    public readonly timestamp: Date,
  ) {}
}