import { startTelemetry } from './telemetry/telemetry'; // MUST BE FIRST IMPORT!
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  // Initialize OpenTelemetry BEFORE creating the app
  startTelemetry();

  const app = await NestFactory.create(AppModule);

  // Explicitly add Express body parsing middleware to the underlying Express app.
  // This ensures req.body is properly initialized (even to an empty object for GETs)
  // before Apollo Server's middleware runs, preventing the "req.body is not set" error.
  const httpAdapter = app.getHttpAdapter();
  if (httpAdapter.getType() === 'express') {
    const expressApp = httpAdapter.getInstance();
    expressApp.use(express.json());
    expressApp.use(express.urlencoded({ extended: true }));
  }

  // Get config service
  const configService = app.get(ConfigService);

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
    origin: configService.get<string>('cors.origin', 'http://localhost:3000'),
    credentials: configService.get<boolean>('cors.credentials', true),
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Vextrus ERP - Master Data Management')
    .setDescription('API for managing master data including customers, vendors, products, and chart of accounts')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-Tenant-ID', in: 'header' }, 'tenantId')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Global prefix (exclude GraphQL endpoint)
  app.setGlobalPrefix('api/v1', {
    exclude: ['graphql'],
  });

  // Enable graceful shutdown hooks for production
  app.enableShutdownHooks();

  const port = configService.get<number>('app.port') || process.env.APP_PORT || 3009;
  await app.listen(port, '0.0.0.0');
  
  console.log(`Master Data Service is running on: http://localhost:${port}`);
  console.log(`API Documentation: http://localhost:${port}/api/docs`);
  console.log(`GraphQL Sandbox: http://localhost:${port}/graphql`);
}
bootstrap();