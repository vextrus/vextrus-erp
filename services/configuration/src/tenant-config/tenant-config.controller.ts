import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TenantConfigService } from './tenant-config.service';

@ApiTags('tenant-config')
@Controller('tenant-config')
export class TenantConfigController {
  constructor(private readonly service: TenantConfigService) {}

  @Get(':tenantId')
  async getConfig(@Param('tenantId') tenantId: string) {
    return this.service.getConfig(tenantId);
  }

  @Post(':tenantId')
  async setConfig(@Param('tenantId') tenantId: string, @Body() config: any) {
    return this.service.setConfig(tenantId, config);
  }
}
