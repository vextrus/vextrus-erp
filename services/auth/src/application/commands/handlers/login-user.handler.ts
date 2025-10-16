import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { LoginUserCommand } from '../login-user.command';
import { UserAggregate } from '../../../domain/aggregates/user.aggregate';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../modules/users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@CommandHandler(LoginUserCommand)
export class LoginUserHandler implements ICommandHandler<LoginUserCommand> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: LoginUserCommand): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    userId: string;
  }> {
    const { email, password, ipAddress, userAgent } = command;

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.isLocked) {
      throw new ForbiddenException('Account is locked');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Increment failed login attempts
      user.failedLoginAttempts++;
      
      if (user.failedLoginAttempts >= 5) {
        user.isLocked = true;
        user.lockedAt = new Date();
      }
      
      await this.userRepository.save(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create aggregate from existing user
    const userAggregate = new UserAggregate(user.id);
    
    // Process successful login
    userAggregate.login(ipAddress, userAgent);

    // Reset failed login attempts
    user.failedLoginAttempts = 0;
    user.lastLoginAt = new Date();
    
    // Generate tokens
    const payload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      roleId: user.roleId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('jwt.accessTokenExpiresIn', '15m'),
    });

    const refreshTokenSecret = this.configService.get<string>('jwt.refreshTokenSecret');
    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      {
        expiresIn: this.configService.get<string>('jwt.refreshTokenExpiresIn', '7d'),
        secret: refreshTokenSecret || 'default-refresh-secret',
      },
    );

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days for refresh token

    // Issue refresh token through aggregate
    userAggregate.issueRefreshToken(refreshToken, expiresAt);

    // Save user state
    await this.userRepository.save(user);

    // Publish domain events
    const events = userAggregate.getUncommittedEvents();
    events.forEach(event => this.eventBus.publish(event));
    userAggregate.markEventsAsCommitted();

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      userId: user.id,
    };
  }
}