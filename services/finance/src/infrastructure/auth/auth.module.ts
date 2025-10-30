import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

/**
 * Auth Module
 *
 * Provides authentication infrastructure including JWT guard.
 * Imports HttpModule to enable HttpService injection in JwtAuthGuard.
 *
 * This module is designed to be imported by AppModule to provide
 * authentication capabilities across the application.
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  providers: [JwtAuthGuard],
  exports: [JwtAuthGuard, HttpModule],
})
export class AuthModule {}
