#!/bin/bash

# Fix remaining TypeScript configuration and build issues for new services

echo "Creating missing configuration files for new services..."

services=("crm" "finance" "hr" "organization" "project-management" "scm")

# Create tsconfig.json and nest-cli.json for each service
for service in "${services[@]}"; do
    echo "Setting up $service..."

    # Create tsconfig.json
    if [ ! -f "services/$service/tsconfig.json" ]; then
        cat > "services/$service/tsconfig.json" << 'EOF'
{
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
}
EOF
        echo "  Created tsconfig.json"
    fi

    # Create nest-cli.json
    if [ ! -f "services/$service/nest-cli.json" ]; then
        cat > "services/$service/nest-cli.json" << 'EOF'
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
EOF
        echo "  Created nest-cli.json"
    fi

    # Create tsconfig.build.json
    if [ ! -f "services/$service/tsconfig.build.json" ]; then
        cat > "services/$service/tsconfig.build.json" << 'EOF'
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
EOF
        echo "  Created tsconfig.build.json"
    fi
done

echo "Fixing remaining TypeScript errors in all services..."

# Fix audit service - Add missing properties and types
echo "Fixing audit service..."
cat > services/audit/src/dto/create-audit-log.dto.ts << 'EOF'
import { IsString, IsOptional, IsObject, IsNotEmpty, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuditLogDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  action: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  entity_type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entity_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  old_values?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  new_values?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ip_address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  user_agent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  event_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  severity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_sensitive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  request_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  session_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  correlation_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  status_code?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  error_message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stack_trace?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  location?: {
    ip?: string;
    city?: string;
    country?: string;
  };
}
EOF

# Fix document-generator service - Add missing types
echo "Fixing document-generator service..."
cat > services/document-generator/src/entities/template.entity.ts << 'EOF'
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum TemplateType {
  INVOICE = 'invoice',
  PURCHASE_ORDER = 'purchase_order',
  SALES_ORDER = 'sales_order',
  RECEIPT = 'receipt',
  REPORT = 'report',
  PAYSLIP = 'payslip',
  CUSTOM = 'custom',
}

export enum OutputFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  WORD = 'word',
  CSV = 'csv',
  HTML = 'html',
}

@Entity('templates')
@Index(['tenant_id', 'is_active'])
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  tenant_id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TemplateType,
    default: TemplateType.CUSTOM,
  })
  type: TemplateType;

  @Column({
    type: 'enum',
    enum: OutputFormat,
    default: OutputFormat.PDF,
  })
  format: OutputFormat;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  category: string;

  @Column('jsonb', { nullable: true })
  variables: any;

  @Column('jsonb', { nullable: true })
  metadata: any;

  @Column('jsonb', { nullable: true })
  settings: any;

  @Column({ default: false })
  is_default: boolean;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  usage_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
EOF

cat > services/document-generator/src/entities/document.entity.ts << 'EOF'
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum DocumentStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column()
  template_id: string;

  @Column()
  file_name: string;

  @Column({ nullable: true })
  file_path: string;

  @Column({ nullable: true })
  mime_type: string;

  @Column({ nullable: true })
  file_size: number;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  @Column('jsonb', { nullable: true })
  data: any;

  @Column('jsonb', { nullable: true })
  metadata: any;

  @Column({ nullable: true })
  error_message: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  generated_at: Date;
}
EOF

# Fix all service build errors by adding missing imports and types
echo "Fixing common TypeScript issues across all services..."

# Fix import issues in all services
find services -name "*.service.ts" -exec sed -i 's/import \* as cron-parser from/import { parseExpression } from/g' {} \;
find services -name "*.service.ts" -exec sed -i 's/cronParser\.parseExpression/parseExpression/g' {} \;

# Add error handling utility to all services
for service_dir in services/*/; do
  if [ -d "$service_dir/src" ]; then
    if [ ! -f "$service_dir/src/utils/error.utils.ts" ]; then
      mkdir -p "$service_dir/src/utils"
      cp services/notification/src/types/error.types.ts "$service_dir/src/utils/error.utils.ts" 2>/dev/null || true
    fi
  fi
done

# Build all services to verify fixes
echo "Building all services..."
pnpm --filter "@vextrus/*-service" build

echo "Fix script completed!"