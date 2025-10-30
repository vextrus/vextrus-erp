import { Resolver, Mutation, Args, Query, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from '../modules/auth/auth.service';
import { LoginInput, LoginResponse } from '../dto/login.dto';
import { RegisterInput, RegisterResponse } from '../dto/register.dto';
import { RefreshTokenInput, RefreshTokenResponse } from '../dto/refresh-token.dto';
import { CurrentUser } from '../decorators/current-user.decorator';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { User } from '../modules/users/entities/user.entity';

@Resolver('Auth')
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => LoginResponse)
  async login(@Args('input') input: LoginInput): Promise<LoginResponse> {
    const loginDto = {
      email: input.email,
      password: input.password,
    };
    const result = await this.authService.login(loginDto, '127.0.0.1'); // IP would come from context in production
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        organizationId: result.user.organizationId,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  @Mutation(() => RegisterResponse)
  async register(@Args('input') input: RegisterInput): Promise<RegisterResponse> {
    const registerDto = {
      email: input.email,
      password: input.password,
      username: input.email, // Use email as username for now
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      organizationId: '00000000-0000-0000-0000-000000000000', // Default org for now
    };
    const result = await this.authService.register(registerDto);
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        organizationId: result.user.organizationId,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      message: 'Registration successful',
    };
  }

  @Mutation(() => RefreshTokenResponse)
  async refreshToken(@Args('input') input: RefreshTokenInput): Promise<RefreshTokenResponse> {
    const result = await this.authService.refreshToken({ refreshToken: input.refreshToken });
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: 900,
    };
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async logout(@CurrentUser() user: User): Promise<boolean> {
    await this.authService.logout(user.id);
    return true;
  }

  @Query(() => User, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async me(@CurrentUser() user: User): Promise<User> {
    return user;
  }

  @Query(() => Boolean)
  async validateToken(@Args('token') token: string): Promise<boolean> {
    try {
      await this.authService.validateToken(token);
      return true;
    } catch {
      return false;
    }
  }
}