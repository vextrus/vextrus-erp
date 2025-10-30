import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { trace } from '@opentelemetry/api';
import { UsersService } from '../users/users.service';
import { RedisService } from '../../shared/redis/redis.service';
import { KafkaService } from '../../shared/kafka/kafka.service';
import { Trace } from '../../telemetry/decorators/trace.decorator';
import { MetricsService } from '../../telemetry/metrics.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
    private kafkaService: KafkaService,
    private metricsService: MetricsService,
  ) {}

  @Trace('auth.validateUser')
  async validateUser(email: string, password: string): Promise<any> {
    const span = trace.getActiveSpan();
    span?.setAttributes({
      'user.email': email,
      'auth.method': 'password',
    });
    
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account is locked. Please try again later.');
    }

    const isValidPassword = await this.usersService.validatePassword(user, password);

    if (!isValidPassword) {
      await this.usersService.incrementFailedAttempts(user.id);
      throw new UnauthorizedException('Invalid credentials');
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  @Trace('auth.login')
  async login(loginDto: LoginDto, ip: string) {
    const timer = this.metricsService.startTimer();
    const span = trace.getActiveSpan();
    span?.setAttributes({
      'user.email': loginDto.email,
      'client.ip': ip,
    });
    
    try {
      const user = await this.validateUser(loginDto.email, loginDto.password);
      
      // Record successful login
      this.metricsService.recordLoginAttempt(loginDto.email, true);
      
      // Update last login
      await this.usersService.updateLastLogin(user.id, ip);

      // Generate tokens with timing
      const tokenTimer = this.metricsService.startTimer();
      const tokens = await this.generateTokens(user);
      const tokenDuration = tokenTimer.end();
      this.metricsService.recordTokenGenerationTime(tokenDuration, 'access');

      // Store refresh token in Redis
      await this.storeRefreshToken(user.id, tokens.refreshToken);
      
      // Record session start
      this.metricsService.recordSessionStart(`session:${user.id}:${Date.now()}`, user.id);

      // Emit login event
      await this.kafkaService.emit('auth.user.logged_in', {
        userId: user.id,
        organizationId: user.organizationId,
        timestamp: new Date(),
        ip,
      });

      // Record response time
      const duration = timer.end();
      this.metricsService.recordResponseTime('login', duration, 200);

      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          organizationId: user.organizationId,
        },
        ...tokens,
      };
    } catch (error: any) {
      // Record failed login
      this.metricsService.recordLoginAttempt(loginDto.email, false, error.message);
      this.metricsService.recordAuthError('login_failed', 'login');
      
      // Record response time even for failures
      const duration = timer.end();
      this.metricsService.recordResponseTime('login', duration, 401);
      
      throw error;
    }
  }

  @Trace('auth.register')
  async register(registerDto: RegisterDto) {
    const span = trace.getActiveSpan();
    span?.setAttributes({
      'user.email': registerDto.email,
      'user.organization': registerDto.organizationId || 'demo',
    });
    
    // Create user
    const user = await this.usersService.create({
      ...registerDto,
      organizationId: registerDto.organizationId || 'demo', // Default to demo org
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // Emit registration event
    await this.kafkaService.emit('auth.user.registered', {
      userId: user.id,
      organizationId: user.organizationId,
      timestamp: new Date(),
    });

    const { passwordHash, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  @Trace('auth.refreshToken')
  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const timer = this.metricsService.startTimer();
    
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: this.configService.get<string>('jwt.refresh.secret', 'vextrus_jwt_refresh_secret_dev_2024'),
      });

      // Check if token exists in Redis
      const storedToken = await this.redisService.get(`refresh_token:${payload.sub}`);
      
      if (!storedToken || storedToken !== refreshTokenDto.refreshToken) {
        // Record failed refresh
        this.metricsService.recordTokenRefresh(payload.sub, false);
        this.metricsService.recordAuthError('invalid_refresh_token', 'refresh');
        
        const duration = timer.end();
        this.metricsService.recordResponseTime('refresh', duration, 401);
        
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Get user
      const user = await this.usersService.findOne(payload.sub);

      // Generate new tokens with timing
      const tokenTimer = this.metricsService.startTimer();
      const tokens = await this.generateTokens(user);
      const tokenDuration = tokenTimer.end();
      this.metricsService.recordTokenGenerationTime(tokenDuration, 'refresh');

      // Update stored refresh token
      await this.storeRefreshToken(user.id, tokens.refreshToken);
      
      // Record successful refresh
      this.metricsService.recordTokenRefresh(user.id, true);
      
      // Record response time
      const duration = timer.end();
      this.metricsService.recordResponseTime('refresh', duration, 200);

      return tokens;
    } catch (error: any) {
      // Record failed refresh if not already recorded
      if (error.message !== 'Invalid refresh token') {
        this.metricsService.recordAuthError('refresh_failed', 'refresh');
      }
      
      const duration = timer.end();
      this.metricsService.recordResponseTime('refresh', duration, 401);
      
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Trace('auth.logout')
  async logout(userId: string) {
    const timer = this.metricsService.startTimer();
    
    // Remove refresh token from Redis
    await this.redisService.delete(`refresh_token:${userId}`);
    
    // Record logout and session end
    this.metricsService.recordLogout(userId);
    this.metricsService.recordSessionEnd(`session:${userId}:${Date.now()}`);

    // Emit logout event
    await this.kafkaService.emit('auth.user.logged_out', {
      userId,
      timestamp: new Date(),
    });
    
    // Record response time
    const duration = timer.end();
    this.metricsService.recordResponseTime('logout', duration, 200);

    return { message: 'Logged out successfully' };
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.access.secret', 'vextrus_jwt_access_secret_dev_2024'),
      expiresIn: this.configService.get<string>('jwt.access.expiresIn', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refresh.secret', 'vextrus_jwt_refresh_secret_dev_2024'),
      expiresIn: this.configService.get<string>('jwt.refresh.expiresIn', '7d'),
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.configService.get('jwt.access.expiresIn'),
    };
  }

  private async storeRefreshToken(userId: string, token: string) {
    const ttl = 7 * 24 * 60 * 60; // 7 days in seconds
    await this.redisService.set(`refresh_token:${userId}`, token, ttl);
  }

  @Trace('auth.validateToken')
  async validateToken(token: string): Promise<boolean> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.access.secret', 'vextrus_jwt_access_secret_dev_2024'),
      });
      return !!payload;
    } catch {
      return false;
    }
  }
}