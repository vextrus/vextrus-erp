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

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Set global prefix with GraphQL exclusion
  app.setGlobalPrefix('api', { exclude: ['/graphql'] });

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Import/Export Service')
    .setDescription('Data import and export operations for Vextrus ERP')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('import-export')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'import-export',
        brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
      },
      consumer: {
        groupId: 'import-export-consumer',
      },
    },
  });

  await app.startAllMicroservices();

  const port = process.env.APP_PORT || process.env.PORT || 3007;
  await app.listen(port, '0.0.0.0');
  console.log(`Import/Export Service is running on: http://localhost:${port}`);
  console.log(`API Documentation: http://localhost:${port}/api/docs`);
  console.log(`GraphQL Playground: http://localhost:${port}/graphql`);
}

bootstrap();