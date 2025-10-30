import { AggregateRoot } from '@nestjs/cqrs';
import { UserRegisteredEvent } from '../events/user-registered.event';
import { UserLoggedInEvent } from '../events/user-logged-in.event';
import { UserPasswordChangedEvent } from '../events/user-password-changed.event';
import { UserProfileUpdatedEvent } from '../events/user-profile-updated.event';
import { UserLockedEvent } from '../events/user-locked.event';
import { UserUnlockedEvent } from '../events/user-unlocked.event';
import { RefreshTokenIssuedEvent } from '../events/refresh-token-issued.event';
import { RefreshTokenRevokedEvent } from '../events/refresh-token-revoked.event';
import { UserId } from '../value-objects/user-id.value-object';
import { Email } from '../value-objects/email.value-object';
import { HashedPassword } from '../value-objects/hashed-password.value-object';
import { UserProfile } from '../value-objects/user-profile.value-object';
import { RefreshToken } from '../value-objects/refresh-token.value-object';

export interface UserState {
  id: UserId;
  email: Email;
  password: HashedPassword;
  profile: UserProfile;
  isLocked: boolean;
  failedLoginAttempts: number;
  refreshTokens: RefreshToken[];
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  version: number;
}

export class UserAggregate extends AggregateRoot {
  private state!: UserState;

  constructor(id?: string) {
    super();
    if (id) {
      this.state = {
        id: new UserId(id),
        email: null as any,
        password: null as any,
        profile: null as any,
        isLocked: false,
        failedLoginAttempts: 0,
        refreshTokens: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 0,
      };
    }
  }

  static create(
    email: string,
    hashedPassword: string,
    profile: {
      firstName: string;
      lastName: string;
      phoneNumber?: string;
      preferredLanguage?: string;
    },
    organizationId: string,
    roleId: string,
  ): UserAggregate {
    const aggregate = new UserAggregate();
    const userId = UserId.generate();
    
    aggregate.state = {
      id: userId,
      email: new Email(email),
      password: new HashedPassword(hashedPassword),
      profile: new UserProfile(
        profile.firstName,
        profile.lastName,
        profile.phoneNumber,
        profile.preferredLanguage || 'en',
      ),
      isLocked: false,
      failedLoginAttempts: 0,
      refreshTokens: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 0,
    };

    aggregate.apply(
      new UserRegisteredEvent(
        userId.value,
        email,
        profile.firstName,
        profile.lastName,
        organizationId,
        roleId,
        profile.phoneNumber,
        profile.preferredLanguage,
      ),
    );

    return aggregate;
  }

  login(ipAddress: string, userAgent: string): void {
    if (this.state.isLocked) {
      throw new Error('User account is locked');
    }

    this.state.failedLoginAttempts = 0;
    this.state.lastLoginAt = new Date();
    this.state.updatedAt = new Date();

    this.apply(
      new UserLoggedInEvent(
        this.state.id.value,
        ipAddress,
        userAgent,
        new Date(),
      ),
    );
  }

  issueRefreshToken(token: string, expiresAt: Date): void {
    const refreshToken = new RefreshToken(token, expiresAt);
    this.state.refreshTokens.push(refreshToken);
    this.state.updatedAt = new Date();

    this.apply(
      new RefreshTokenIssuedEvent(
        this.state.id.value,
        token,
        expiresAt,
      ),
    );
  }

  revokeRefreshToken(token: string): void {
    const tokenIndex = this.state.refreshTokens.findIndex(
      (t) => t.token === token,
    );

    if (tokenIndex === -1) {
      throw new Error('Refresh token not found');
    }

    this.state.refreshTokens.splice(tokenIndex, 1);
    this.state.updatedAt = new Date();

    this.apply(
      new RefreshTokenRevokedEvent(
        this.state.id.value,
        token,
        new Date(),
      ),
    );
  }

  changePassword(newHashedPassword: string): void {
    this.state.password = new HashedPassword(newHashedPassword);
    this.state.updatedAt = new Date();
    this.state.refreshTokens = [];

    this.apply(
      new UserPasswordChangedEvent(
        this.state.id.value,
        new Date(),
      ),
    );
  }

  updateProfile(profile: Partial<{
    firstName: string;
    lastName: string;
    phoneNumber: string;
    preferredLanguage: string;
  }>): void {
    if (profile.firstName !== undefined) {
      this.state.profile.firstName = profile.firstName;
    }
    if (profile.lastName !== undefined) {
      this.state.profile.lastName = profile.lastName;
    }
    if (profile.phoneNumber !== undefined) {
      this.state.profile.phoneNumber = profile.phoneNumber;
    }
    if (profile.preferredLanguage !== undefined) {
      this.state.profile.preferredLanguage = profile.preferredLanguage;
    }

    this.state.updatedAt = new Date();

    this.apply(
      new UserProfileUpdatedEvent(
        this.state.id.value,
        profile,
        new Date(),
      ),
    );
  }

  recordFailedLogin(): void {
    this.state.failedLoginAttempts++;
    this.state.updatedAt = new Date();

    if (this.state.failedLoginAttempts >= 5) {
      this.lock('Too many failed login attempts');
    }
  }

  lock(reason: string): void {
    if (this.state.isLocked) {
      return;
    }

    this.state.isLocked = true;
    this.state.updatedAt = new Date();

    this.apply(
      new UserLockedEvent(
        this.state.id.value,
        reason,
        new Date(),
      ),
    );
  }

  unlock(): void {
    if (!this.state.isLocked) {
      return;
    }

    this.state.isLocked = false;
    this.state.failedLoginAttempts = 0;
    this.state.updatedAt = new Date();

    this.apply(
      new UserUnlockedEvent(
        this.state.id.value,
        new Date(),
      ),
    );
  }

  getState(): UserState {
    return { ...this.state };
  }

  getId(): string {
    return this.state.id.value;
  }

  getEmail(): string {
    return this.state.email.value;
  }

  getPasswordHash(): string {
    return this.state.password.value;
  }

  isAccountLocked(): boolean {
    return this.state.isLocked;
  }

  getVersion(): number {
    return this.state.version;
  }

  override loadFromHistory(events: any[]): void {
    events.forEach((event) => this.applyEvent(event));
  }

  markEventsAsCommitted(): void {
    this.commit();
  }

  private applyEvent(_event: any): void {
    this.state.version++;
    this.state.updatedAt = new Date();
  }
}