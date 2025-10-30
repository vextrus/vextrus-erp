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

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  });

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Business Rules Engine')
    .setDescription('Business rules engine service for Bangladesh ERP')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Rules')
    .addTag('Rule Sets')
    .addTag('Evaluations')
    .addTag('Bangladesh Tax Rules')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Set global API prefix (AFTER Swagger setup, exclude GraphQL)
  app.setGlobalPrefix('api/v1', {
    exclude: ['/graphql'],
  });

  const port = process.env.PORT || 3012;
  await app.listen(port, '0.0.0.0');

  console.log(`Rules Engine service is running on: http://localhost:${port}`);
  console.log(`API documentation: http://localhost:${port}/api`);
  console.log(`Apollo Sandbox: http://localhost:${port}/graphql`);
}
bootstrap();