import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
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

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Set global prefix with GraphQL exclusion
  app.setGlobalPrefix('api', { exclude: ['/graphql'] });

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Configuration Service')
    .setDescription('Dynamic configuration, feature flags, and tenant settings for Vextrus ERP')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('configuration')
    .addTag('feature-flags')
    .addTag('tenant-config')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Connect microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'configuration',
        brokers: process.env.KAFKA_BROKERS?.split(',') || ['kafka:9093'],
      },
      consumer: {
        groupId: 'configuration-consumer',
      },
    },
  });

  await app.startAllMicroservices();

  const port = process.env.PORT || 3004;
  await app.listen(port, '0.0.0.0');
  console.log(`Configuration Service is running on: http://localhost:${port}`);
  console.log(`API Documentation: http://localhost:${port}/api/docs`);
  // console.log(`GraphQL Playground: http://localhost:${port}/graphql`);
}

bootstrap();