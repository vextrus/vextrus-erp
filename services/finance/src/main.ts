import './polyfills'; // Must be first
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Explicitly add Express body parsing middleware
  // Required for Apollo Sandbox landing page to work properly
  const httpAdapter = app.getHttpAdapter();
  if (httpAdapter.getType() === 'express') {
    const expressApp = httpAdapter.getInstance();
    expressApp.use(express.json());
    expressApp.use(express.urlencoded({ extended: true }));
  }

  // Security: Add Helmet for security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Required for GraphQL Playground
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      frameguard: {
        action: 'deny',
      },
      noSniff: true,
    }),
  );

  // Security: Rate limiting - 100 requests per 15 minutes per IP
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path.startsWith('/health');
    },
  });

  // Apply rate limiter globally
  app.use(limiter);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3014);
  const isProduction = process.env.NODE_ENV === 'production';

  // Validate required environment variables in production
  if (isProduction) {
    const requiredEnvVars = [
      'DATABASE_HOST',
      'DATABASE_USERNAME',
      'DATABASE_PASSWORD',
      'DATABASE_NAME',
      'JWT_SECRET',
      'CORS_ORIGIN',
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable in production: ${envVar}`);
      }
    }
  }

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true, // Strict validation - reject unknown properties
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Enable CORS with strict origin validation
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || [];

  // In production, FAIL FAST if CORS not configured
  if (isProduction && allowedOrigins.length === 0) {
    throw new Error('CORS_ORIGIN must be configured in production');
  }

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, Postman, server-to-server)
      if (!origin) return callback(null, true);

      // In development, allow localhost variations if no CORS_ORIGIN set
      if (!isProduction && allowedOrigins.length === 0) {
        const devOrigins = ['http://localhost:3000', 'http://localhost:4200', 'http://localhost:5173'];
        if (devOrigins.includes(origin)) {
          return callback(null, true);
        }
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Correlation-ID'],
    maxAge: 86400, // 24 hours
  });

  // Global prefix
  app.setGlobalPrefix('api', {
    exclude: ['health', 'health/ready', 'health/live', 'graphql'],
  });

  await app.listen(port);

  console.log(`🚀 Finance Service is running on: http://localhost:${port}`);
  console.log(`🔥 Apollo Sandbox: http://localhost:${port}/graphql`);
  console.log(`💚 Health check: http://localhost:${port}/health`);
}

bootstrap().catch((error) => {
  console.error('Failed to start Finance Service:', error);
  process.exit(1);
});