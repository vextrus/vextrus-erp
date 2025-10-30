import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { RefreshTokenCommand } from '../refresh-token.command';
import { UserAggregate } from '../../../domain/aggregates/user.aggregate';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../modules/users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler implements ICommandHandler<RefreshTokenCommand> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const { refreshToken } = command;

    // Verify refresh token
    let payload: any;
    const refreshTokenSecret = this.configService.get<string>('jwt.refreshTokenSecret');
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: refreshTokenSecret || 'default-refresh-secret',
      });
    } catch (error: any) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Validate token type
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    // Find user
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['organization', 'role'],
    });

    if (!user || !user.isActive || user.isLocked) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Create aggregate
    const userAggregate = new UserAggregate(user.id);

    // Revoke old refresh token
    userAggregate.revokeRefreshToken(refreshToken);

    // Generate new tokens
    const newPayload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      roleId: user.roleId,
    };

    const accessToken = this.jwtService.sign(newPayload, {
      expiresIn: this.configService.get<string>('jwt.accessTokenExpiresIn', '15m'),
    });

    const newRefreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      {
        expiresIn: this.configService.get<string>('jwt.refreshTokenExpiresIn', '7d'),
        secret: refreshTokenSecret || 'default-refresh-secret',
      },
    );

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days for refresh token

    // Issue new refresh token
    userAggregate.issueRefreshToken(newRefreshToken, expiresAt);

    // Update user last activity
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Publish domain events
    const events = userAggregate.getUncommittedEvents();
    events.forEach(event => this.eventBus.publish(event));
    userAggregate.markEventsAsCommitted();

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }
}