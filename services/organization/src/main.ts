import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

import * as express from 'express';

async function bootstrap() {
  const logger = new Logger('Organization-Service');
  const app = await NestFactory.create(AppModule);

  // Explicitly add Express body parsing middleware
  // Required for Apollo Sandbox landing page to work properly
  const httpAdapter = app.getHttpAdapter();
  if (httpAdapter.getType() === 'express') {
    const expressApp = httpAdapter.getInstance();
    expressApp.use(express.json());
    expressApp.use(express.urlencoded({ extended: true }));
  }
  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT', 3016);

  app.enableCors();

  await app.listen(port);
  logger.log(`Organization Service is running on port ${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start Organization Service:', error);
  process.exit(1);
});