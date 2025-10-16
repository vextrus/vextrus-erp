import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { SharedModule } from '../../shared/shared.module';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { EventStoreModule } from '../../infrastructure/event-store/event-store.module';
import { GraphQLFederationConfig } from '../../config/graphql-federation.config';

// GraphQL Resolvers
import { AuthResolver } from '../../resolvers/auth.resolver';
import { UserResolver } from '../../resolvers/user.resolver';

// Commands
import { RegisterUserHandler } from '../../application/commands/handlers/register-user.handler';
import { LoginUserHandler } from '../../application/commands/handlers/login-user.handler';
import { RefreshTokenHandler } from '../../application/commands/handlers/refresh-token.handler';

// Queries
import { GetUserByIdHandler } from '../../application/queries/handlers/get-user-by-id.handler';

// Event Handlers
import { UserRegisteredHandler } from '../../application/events/handlers/user-registered.handler';

// Entities
import { User } from '../users/entities/user.entity';

const CommandHandlers = [
  RegisterUserHandler,
  LoginUserHandler,
  RefreshTokenHandler,
];

const QueryHandlers = [
  GetUserByIdHandler,
];

const EventHandlers = [
  UserRegisteredHandler,
];

@Module({
  imports: [
    UsersModule,
    SharedModule,
    PassportModule,
    CqrsModule,
    EventStoreModule,
    TypeOrmModule.forFeature([User]),
    GraphQLModule.forRootAsync<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      imports: [ConfigModule],
      useClass: GraphQLFederationConfig,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.access.secret', 'vextrus_jwt_access_secret_dev_2024'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.access.expiresIn', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    RefreshTokenStrategy,
    AuthResolver,
    UserResolver,
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
  exports: [AuthService],
})
export class AuthModule {}