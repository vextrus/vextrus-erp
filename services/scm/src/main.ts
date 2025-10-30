import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('SCM-Service');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT', 3018);

  app.enableCors();

  await app.listen(port);
  logger.log(`SCM Service is running on port ${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start SCM Service:', error);
  process.exit(1);
});