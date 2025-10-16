import { IsString, IsOptional, IsEnum, IsDateString, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ComplianceStandard {
  SOX = 'sox',
  GDPR = 'gdpr',
  PCI_DSS = 'pci_dss',
  HIPAA = 'hipaa',
  ISO_27001 = 'iso_27001',
  CCPA = 'ccpa',
  BANGLADESH_DIGITAL_SECURITY = 'bd_digital_security',
  BANGLADESH_ICT = 'bd_ict',
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  JSON = 'json',
  HTML = 'html',
}

export class GenerateComplianceReportDto {
  @ApiProperty({ enum: ComplianceStandard })
  @IsEnum(ComplianceStandard)
  standard: ComplianceStandard;

  @ApiProperty({ description: 'Start date for the report period' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ description: 'End date for the report period' })
  @IsDateString()
  end_date: string;

  @ApiPropertyOptional({ enum: ReportFormat, default: ReportFormat.PDF })
  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat = ReportFormat.PDF;

  @ApiPropertyOptional({ description: 'Include detailed audit logs' })
  @IsOptional()
  @IsBoolean()
  include_details?: boolean = false;

  @ApiPropertyOptional({ description: 'Include statistical analysis' })
  @IsOptional()
  @IsBoolean()
  include_statistics?: boolean = true;

  @ApiPropertyOptional({ description: 'Include compliance gaps' })
  @IsOptional()
  @IsBoolean()
  include_gaps?: boolean = true;

  @ApiPropertyOptional({ description: 'Include recommendations' })
  @IsOptional()
  @IsBoolean()
  include_recommendations?: boolean = true;

  @ApiPropertyOptional({ description: 'Specific sections to include' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sections?: string[];

  @ApiPropertyOptional({ description: 'Email addresses to send the report' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  email_recipients?: string[];

  @ApiPropertyOptional({ description: 'Encrypt the report' })
  @IsOptional()
  @IsBoolean()
  encrypt?: boolean = false;

  @ApiPropertyOptional({ description: 'Digital signature for authenticity' })
  @IsOptional()
  @IsBoolean()
  sign?: boolean = false;
}

export class ComplianceMetricsDto {
  @ApiPropertyOptional({ description: 'Compliance standards to check' })
  @IsOptional()
  @IsArray()
  @IsEnum(ComplianceStandard, { each: true })
  standards?: ComplianceStandard[];

  @ApiPropertyOptional({ description: 'Start date for metrics calculation' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date for metrics calculation' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Group metrics by period' })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'quarter', 'year'])
  group_by?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export class ComplianceViolationDto {
  @ApiProperty({ description: 'Violation type' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Severity of the violation' })
  @IsEnum(['low', 'medium', 'high', 'critical'])
  severity: 'low' | 'medium' | 'high' | 'critical';

  @ApiProperty({ description: 'Description of the violation' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Affected resources' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  affected_resources?: string[];

  @ApiPropertyOptional({ description: 'Remediation steps' })
  @IsOptional()
  @IsString()
  remediation?: string;

  @ApiPropertyOptional({ description: 'Compliance standard violated' })
  @IsOptional()
  @IsEnum(ComplianceStandard)
  standard?: ComplianceStandard;

  @ApiPropertyOptional({ description: 'Date of violation' })
  @IsOptional()
  @IsDateString()
  violation_date?: string;
}

export class DataPrivacyReportDto {
  @ApiProperty({ description: 'User ID for privacy report' })
  @IsString()
  user_id: string;

  @ApiPropertyOptional({ description: 'Include data access logs' })
  @IsOptional()
  @IsBoolean()
  include_access_logs?: boolean = true;

  @ApiPropertyOptional({ description: 'Include data processing activities' })
  @IsOptional()
  @IsBoolean()
  include_processing?: boolean = true;

  @ApiPropertyOptional({ description: 'Include data sharing records' })
  @IsOptional()
  @IsBoolean()
  include_sharing?: boolean = true;

  @ApiPropertyOptional({ description: 'Include consent history' })
  @IsOptional()
  @IsBoolean()
  include_consent?: boolean = true;

  @ApiPropertyOptional({ description: 'Date range for the report' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'Date range for the report' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ enum: ReportFormat })
  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat = ReportFormat.PDF;
}