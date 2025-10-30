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
import { PolicyService } from '../services/policy.service';
import { StoragePolicy } from '../entities/storage-policy.entity';
import { CreateStoragePolicyDto, UpdateStoragePolicyDto, ApplyPolicyDto, PolicyAnalyticsDto } from '../dto/storage-policy.dto';

@ApiTags('Storage Policies')
@Controller('policies')
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a storage policy' })
  @ApiResponse({ status: 201, description: 'Policy created successfully' })
  async createPolicy(
    @Body() dto: CreateStoragePolicyDto,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<StoragePolicy> {
    return await this.policyService.createPolicy(tenantId, dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all storage policies' })
  async listPolicies(
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<StoragePolicy[]> {
    return await this.policyService.getPolicies(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific storage policy' })
  async getPolicy(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<StoragePolicy> {
    return await this.policyService['findPolicyByIdAndTenant'](id, tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a storage policy' })
  async updatePolicy(
    @Param('id') id: string,
    @Body() dto: UpdateStoragePolicyDto,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<StoragePolicy> {
    return await this.policyService.updatePolicy(tenantId, id, dto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a storage policy' })
  async deletePolicy(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<void> {
    await this.policyService.deletePolicy(tenantId, id);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Apply a storage policy' })
  async applyPolicy(
    @Body() dto: ApplyPolicyDto,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<{ affected: number; results?: any[] }> {
    return await this.policyService.applyPolicy(tenantId, dto);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get policy analytics' })
  async getPolicyAnalytics(
    @Query() dto: PolicyAnalyticsDto,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<any> {
    return await this.policyService.getPolicyAnalytics(tenantId, dto);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a storage policy' })
  async activatePolicy(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<StoragePolicy> {
    return await this.policyService.updatePolicy(tenantId, id, { is_active: true }, userId);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a storage policy' })
  async deactivatePolicy(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<StoragePolicy> {
    return await this.policyService.updatePolicy(tenantId, id, { is_active: false }, userId);
  }

  @Post(':id/set-default')
  @ApiOperation({ summary: 'Set policy as default' })
  async setDefaultPolicy(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<StoragePolicy> {
    const policy = await this.policyService['findPolicyByIdAndTenant'](id, tenantId);
    
    // Unset current default
    await this.policyService['policyRepository'].update(
      { tenant_id: tenantId, is_default: true },
      { is_default: false }
    );

    policy.is_default = true;
    policy.updated_by = userId;
    
    return await this.policyService['policyRepository'].save(policy);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Preview policy effects without applying' })
  async previewPolicy(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<{ affected_files: number; estimated_savings: number }> {
    const result = await this.policyService.applyPolicy(tenantId, {
      policy_id: id,
      dry_run: true,
    });

    return {
      affected_files: result.affected,
      estimated_savings: 0, // Would calculate based on policy type
    };
  }

  @Post('batch/apply')
  @ApiOperation({ summary: 'Apply multiple policies in batch' })
  async applyBatchPolicies(
    @Body() dto: { policy_ids: string[]; dry_run?: boolean },
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<{ total_affected: number; by_policy: Record<string, number> }> {
    const results: Record<string, number> = {};
    let totalAffected = 0;

    for (const policyId of dto.policy_ids) {
      try {
        const result = await this.policyService.applyPolicy(tenantId, {
          policy_id: policyId,
          dry_run: dto.dry_run,
        });
        results[policyId] = result.affected;
        totalAffected += result.affected;
      } catch (error: any) {
        results[policyId] = 0;
      }
    }

    return {
      total_affected: totalAffected,
      by_policy: results,
    };
  }
}