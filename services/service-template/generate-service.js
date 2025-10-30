#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const serviceName = process.argv[2];
if (!serviceName) {
  console.error('Please provide a service name');
  console.log('Usage: node generate-service.js <service-name>');
  process.exit(1);
}

const serviceDir = path.join(__dirname, '..', serviceName);

// Create directory structure
const dirs = [
  '',
  'src',
  'src/config',
  'src/database',
  'src/database/migrations',
  'src/domain',
  'src/domain/aggregates',
  'src/domain/entities',
  'src/domain/value-objects',
  'src/domain/events',
  'src/domain/specifications',
  'src/application',
  'src/application/commands',
  'src/application/commands/handlers',
  'src/application/queries',
  'src/application/queries/handlers',
  'src/application/events',
  'src/application/events/handlers',
  'src/infrastructure',
  'src/infrastructure/repositories',
  'src/infrastructure/event-store',
  'src/modules',
  'src/shared',
  'test',
  'test/unit',
  'test/integration',
  'test/e2e',
];

dirs.forEach(dir => {
  const fullPath = path.join(serviceDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Package.json template
const packageJson = {
  name: `@vextrus/${serviceName}`,
  version: '1.0.0',
  description: `${serviceName} service for Vextrus ERP`,
  scripts: {
    'build': 'nest build',
    'start': 'nest start',
    'start:dev': 'nest start --watch',
    'start:debug': 'nest start --debug --watch',
    'start:prod': 'node dist/main',
    'test': 'jest',
    'test:watch': 'jest --watch',
    'test:cov': 'jest --coverage',
    'test:debug': 'node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand',
    'test:e2e': 'jest --config ./test/jest-e2e.json',
  },
  dependencies: {
    '@nestjs/common': '^10.4.8',
    '@nestjs/core': '^10.4.8',
    '@nestjs/cqrs': '^10.2.9',
    '@nestjs/platform-express': '^10.4.8',
    '@nestjs/swagger': '^7.4.2',
    '@nestjs/typeorm': '^10.0.2',
    '@nestjs/config': '^3.3.0',
    '@nestjs/microservices': '^10.4.8',
    'typeorm': '^0.3.21',
    'pg': '^8.13.1',
    'kafkajs': '^2.2.4',
    'ioredis': '^5.4.1',
    'class-transformer': '^0.5.1',
    'class-validator': '^0.14.1',
    'rxjs': '^7.8.1',
    'reflect-metadata': '^0.2.2',
  },
  devDependencies: {
    '@nestjs/cli': '^10.4.8',
    '@nestjs/schematics': '^10.2.3',
    '@nestjs/testing': '^10.4.8',
    '@types/jest': '^29.5.14',
    '@types/node': '^22.10.0',
    '@types/express': '^5.0.0',
    '@swc/core': '^1.9.3',
    '@swc/jest': '^0.2.37',
    'jest': '^29.7.0',
    'source-map-support': '^0.5.21',
    'ts-jest': '^29.2.5',
    'ts-loader': '^9.5.1',
    'ts-node': '^10.9.2',
    'tsconfig-paths': '^4.2.0',
    'typescript': '^5.7.0',
  },
};

fs.writeFileSync(
  path.join(serviceDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

// tsconfig.json
const tsConfig = {
  extends: '../../tsconfig.base.json',
  compilerOptions: {
    outDir: './dist',
    baseUrl: './',
    paths: {
      '@/*': ['src/*'],
      '@shared/*': ['../../shared/*'],
    },
  },
  include: ['src/**/*'],
  exclude: ['node_modules', 'dist', 'test', '**/*spec.ts'],
};

fs.writeFileSync(
  path.join(serviceDir, 'tsconfig.json'),
  JSON.stringify(tsConfig, null, 2)
);

// nest-cli.json
const nestConfig = {
  '$schema': 'https://json.schemastore.org/nest-cli',
  'collection': '@nestjs/schematics',
  'sourceRoot': 'src',
  'compilerOptions': {
    'deleteOutDir': true,
  },
};

fs.writeFileSync(
  path.join(serviceDir, 'nest-cli.json'),
  JSON.stringify(nestConfig, null, 2)
);

// Main.ts template
const mainTemplate = `import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // Global prefix
  app.setGlobalPrefix('api/v1');
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  
  // CORS
  app.enableCors({
    origin: configService.get<string>('cors.origin', '*'),
    credentials: true,
  });
  
  // Swagger
  const config = new DocumentBuilder()
    .setTitle('${serviceName} Service')
    .setDescription('${serviceName} service API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  
  const port = configService.get<number>('port', 3000);
  await app.listen(port);
  
  console.log(\`${serviceName} service is running on port \${port}\`);
}

bootstrap();
`;

fs.writeFileSync(path.join(serviceDir, 'src', 'main.ts'), mainTemplate);

// App module template
const appModuleTemplate = `import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    CqrsModule,
    DatabaseModule,
    // Add your modules here
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
`;

fs.writeFileSync(path.join(serviceDir, 'src', 'app.module.ts'), appModuleTemplate);

// Configuration template
const configTemplate = `export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    username: process.env.DATABASE_USER || 'vextrus_user',
    password: process.env.DATABASE_PASSWORD || 'vextrus_pass',
    database: process.env.DATABASE_NAME || 'vextrus_erp',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    groupId: process.env.KAFKA_GROUP_ID || '${serviceName}-service',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
});
`;

fs.writeFileSync(
  path.join(serviceDir, 'src', 'config', 'configuration.ts'),
  configTemplate
);

// Database module template
const databaseModuleTemplate = `import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: false, // Use migrations in production
        logging: process.env.NODE_ENV === 'development',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
`;

fs.writeFileSync(
  path.join(serviceDir, 'src', 'database', 'database.module.ts'),
  databaseModuleTemplate
);

// Sample aggregate template
const aggregateTemplate = `import { AggregateRoot } from '@vextrus/kernel';

export class ${serviceName}Aggregate extends AggregateRoot {
  private state: any;

  constructor(id?: string) {
    super();
    // Initialize aggregate state
  }

  getId(): string {
    // Return aggregate ID
    return '';
  }

  // Add your domain methods here
}
`;

fs.writeFileSync(
  path.join(serviceDir, 'src', 'domain', 'aggregates', `${serviceName}.aggregate.ts`),
  aggregateTemplate
);

// Jest config
const jestConfig = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': '@swc/jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

fs.writeFileSync(
  path.join(serviceDir, 'jest.config.js'),
  `module.exports = ${JSON.stringify(jestConfig, null, 2)};`
);

// .gitignore
const gitignore = `# Dependencies
node_modules/

# Build output
dist/
build/

# IDE
.idea/
.vscode/
*.swp
*.swo

# Environment
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.nyc_output/

# OS files
.DS_Store
Thumbs.db
`;

fs.writeFileSync(path.join(serviceDir, '.gitignore'), gitignore);

console.log(`✅ Service template '${serviceName}' created successfully!`);
console.log(`📁 Location: ${serviceDir}`);
console.log(`\n🚀 Next steps:`);
console.log(`   1. cd services/${serviceName}`);
console.log(`   2. npm install`);
console.log(`   3. npm run start:dev`);