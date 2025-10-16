import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RetentionService } from '../services/retention.service';
import { RetentionPolicy } from '../entities/retention-policy.entity';
import {
  CreateRetentionPolicyDto,
  UpdateRetentionPolicyDto,
  ApplyRetentionPolicyDto,
  RetentionStatisticsDto,
} from '../dto/retention-policy.dto';

@ApiTags('Retention')
@Controller('audit/retention')
export class RetentionController {
  constructor(private readonly retentionService: RetentionService) {}

  @Post('policies')
  @ApiOperation({ summary: 'Create retention policy' })
  async createPolicy(
    @Body() dto: CreateRetentionPolicyDto,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<RetentionPolicy> {
    return await this.retentionService.createPolicy(tenantId, dto, userId);
  }

  @Get('policies')
  @ApiOperation({ summary: 'List retention policies' })
  async listPolicies(
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<RetentionPolicy[]> {
    return await this.retentionService.getPolicies(tenantId);
  }

  @Put('policies/:id')
  @ApiOperation({ summary: 'Update retention policy' })
  async updatePolicy(
    @Param('id') id: string,
    @Body() dto: UpdateRetentionPolicyDto,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<RetentionPolicy> {
    return await this.retentionService.updatePolicy(tenantId, id, dto, userId);
  }

  @Delete('policies/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete retention policy' })
  async deletePolicy(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<void> {
    await this.retentionService.deletePolicy(tenantId, id);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Apply retention policies' })
  async applyPolicies(
    @Body() dto: ApplyRetentionPolicyDto,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<any> {
    return await this.retentionService.applyPolicy(tenantId, dto);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get retention statistics' })
  async getStatistics(
    @Query() dto: RetentionStatisticsDto,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<any> {
    return await this.retentionService.getRetentionStatistics(tenantId, dto);
  }
}