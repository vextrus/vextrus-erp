export class RefreshToken {
  constructor(
    public readonly token: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date = new Date(),
  ) {
    if (!token || token.trim().length === 0) {
      throw new Error('Refresh token cannot be empty');
    }
    
    if (!this.isValidJWT(token)) {
      throw new Error('Invalid refresh token format');
    }
    
    if (expiresAt <= new Date()) {
      throw new Error('Refresh token expiry must be in the future');
    }
    
    if (expiresAt <= createdAt) {
      throw new Error('Refresh token expiry must be after creation time');
    }
  }

  private isValidJWT(token: string): boolean {
    // Basic JWT format validation (three base64url segments separated by dots)
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    return jwtRegex.test(token);
  }

  isExpired(): boolean {
    return new Date() >= this.expiresAt;
  }

  getRemainingTime(): number {
    const now = new Date();
    if (now >= this.expiresAt) {
      return 0;
    }
    return this.expiresAt.getTime() - now.getTime();
  }

  equals(other: RefreshToken): boolean {
    return this.token === other.token;
  }

  toString(): string {
    // Never expose the actual token in logs
    return '[REDACTED]';
  }
}