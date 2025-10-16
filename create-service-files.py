import os
import json

services = [
    {"name": "finance", "port": 3014, "display": "Finance"},
    {"name": "hr", "port": 3015, "display": "HR"},
    {"name": "organization", "port": 3016, "display": "Organization"},
    {"name": "project-management", "port": 3017, "display": "Project-Management"},
    {"name": "scm", "port": 3018, "display": "SCM"}
]

main_template = """import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('{{DISPLAY}}-Service');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT', {{PORT}});

  app.enableCors();

  await app.listen(port);
  logger.log(`{{DISPLAY}} Service is running on port ${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start {{DISPLAY}} Service:', error);
  process.exit(1);
});"""

app_module_template = """import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TerminusModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}"""

health_controller_template = """import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthCheckResult } from '@nestjs/terminus';

@Controller()
export class HealthController {
  constructor(private health: HealthCheckService) {}

  @Get('health')
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([]);
  }

  @Get('ready')
  ready(): string {
    return 'OK';
  }

  @Get('live')
  live(): string {
    return 'OK';
  }
}"""

tsconfig_template = """{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}"""

nest_cli_template = """{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}"""

for service in services:
    service_dir = f"services/{service['name']}"
    src_dir = f"{service_dir}/src"

    # Create directories
    os.makedirs(src_dir, exist_ok=True)

    # Create main.ts
    main_content = main_template.replace("{{DISPLAY}}", service["display"]).replace("{{PORT}}", str(service["port"]))
    with open(f"{src_dir}/main.ts", "w") as f:
        f.write(main_content)

    # Create app.module.ts
    with open(f"{src_dir}/app.module.ts", "w") as f:
        f.write(app_module_template)

    # Create health.controller.ts
    with open(f"{src_dir}/health.controller.ts", "w") as f:
        f.write(health_controller_template)

    # Create tsconfig.json
    with open(f"{service_dir}/tsconfig.json", "w") as f:
        f.write(tsconfig_template)

    # Create nest-cli.json
    with open(f"{service_dir}/nest-cli.json", "w") as f:
        f.write(nest_cli_template)

    print(f"[OK] Created files for {service['display']} service")

print("\nAll service files created successfully!")