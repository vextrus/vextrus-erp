import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Ip,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

// Commands
import { RegisterUserCommand } from '../../application/commands/register-user.command';
import { LoginUserCommand } from '../../application/commands/login-user.command';
import { RefreshTokenCommand } from '../../application/commands/refresh-token.command';

// Queries
import { GetUserByIdQuery } from '../../application/queries/get-user-by-id.query';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    const command = new RegisterUserCommand(
      registerDto.email,
      registerDto.username,
      registerDto.password,
      registerDto.firstName || '',
      registerDto.lastName || '',
      registerDto.organizationId || 'demo',
      undefined, // roleId can be assigned later
      registerDto.phone,
      'en',
    );

    const result = await this.commandBus.execute(command);
    return {
      message: 'User registered successfully',
      userId: result.userId
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const command = new LoginUserCommand(
      loginDto.email,
      loginDto.password,
      ip,
      userAgent || 'Unknown',
    );
    
    return this.commandBus.execute(command);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const command = new RefreshTokenCommand(
      refreshTokenDto.refreshToken,
      ip,
      userAgent || 'Unknown',
    );
    
    return this.commandBus.execute(command);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user info' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@Request() req: any) {
    const query = new GetUserByIdQuery(req.user.id);
    return this.queryBus.execute(query);
  }
}