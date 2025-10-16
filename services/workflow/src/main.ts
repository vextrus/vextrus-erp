import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

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

  // Set global API prefix
  app.setGlobalPrefix('api/v1', {
    exclude: ['/graphql', 'health', 'health/ready', 'health/live'],
  });

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Workflow Service')
    .setDescription('Workflow orchestration service using Temporal')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Workflows')
    .addTag('Tasks')
    .addTag('Templates')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3011;
  await app.listen(port);
  console.log(`Workflow service is running on: http://localhost:${port}`);
  console.log(`API documentation: http://localhost:${port}/api`);
  console.log(`GraphQL endpoint: http://localhost:${port}/graphql`);
}
bootstrap().catch((error) => {
  console.error('Failed to start workflow service:', error);
  process.exit(1);
});