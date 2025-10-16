import { Controller, Get, Post, Body, Query, Headers } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditService } from '../services/audit.service';
import { CreateAuditLogDto } from '../dto/create-audit-log.dto';
import { SearchAuditInput } from '../dto/search-audit.input';

@ApiTags('audit')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post('log')
  async log(@Body() data: CreateAuditLogDto, @Headers('x-tenant-id') tenantId: string) {
    return this.auditService.createAuditLog(tenantId || 'system', data);
  }

  @Get('search')
  async search(@Query() query: SearchAuditInput) {
    return this.auditService.search(query);
  }
}
