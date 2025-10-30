import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { StoragePolicy, PolicyType, PolicyScope } from '../entities/storage-policy.entity';
import { File, FileStatus } from '../entities/file.entity';
import { CreateStoragePolicyDto, UpdateStoragePolicyDto, ApplyPolicyDto, PolicyAnalyticsDto } from '../dto/storage-policy.dto';
import { StorageService } from './storage.service';

@Injectable()
export class PolicyService {
  private readonly logger = new Logger(PolicyService.name);

  constructor(
    @InjectRepository(StoragePolicy)
    private policyRepository: Repository<StoragePolicy>,
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    private storageService: StorageService,
  ) {}

  async createPolicy(tenantId: string, dto: CreateStoragePolicyDto, userId: string): Promise<StoragePolicy> {
    const existingPolicy = await this.policyRepository.findOne({
      where: {
        tenant_id: tenantId,
        name: dto.name,
      },
    });

    if (existingPolicy) {
      throw new BadRequestException('Policy with this name already exists');
    }

    const policy = this.policyRepository.create({
      tenant_id: tenantId,
      name: dto.name,
      description: dto.description,
      policy_type: dto.policy_type,
      scope: dto.scope,
      scope_id: dto.scope_id,
      rules: dto.rules,
      conditions: dto.conditions,
      actions: dto.actions,
      priority: dto.priority || 0,
      is_active: dto.is_active !== false,
      is_default: dto.is_default || false,
      created_by: userId,
    });

    if (dto.is_default) {
      await this.policyRepository.update(
        { tenant_id: tenantId, is_default: true },
        { is_default: false }
      );
    }

    return await this.policyRepository.save(policy);
  }

  async updatePolicy(
    tenantId: string,
    policyId: string,
    dto: UpdateStoragePolicyDto,
    userId: string
  ): Promise<StoragePolicy> {
    const policy = await this.findPolicyByIdAndTenant(policyId, tenantId);

    Object.assign(policy, {
      ...dto,
      updated_by: userId,
    });

    return await this.policyRepository.save(policy);
  }

  async deletePolicy(tenantId: string, policyId: string): Promise<void> {
    const policy = await this.findPolicyByIdAndTenant(policyId, tenantId);

    if (policy.is_default) {
      throw new BadRequestException('Cannot delete default policy');
    }

    await this.policyRepository.remove(policy);
  }

  async getPolicies(tenantId: string): Promise<StoragePolicy[]> {
    return await this.policyRepository.find({
      where: { tenant_id: tenantId },
      order: { priority: 'DESC', created_at: 'ASC' },
    });
  }

  async applyPolicy(tenantId: string, dto: ApplyPolicyDto): Promise<{ affected: number; results?: any[] }> {
    const policy = await this.findPolicyByIdAndTenant(dto.policy_id, tenantId);

    if (!policy.is_active) {
      throw new BadRequestException('Policy is not active');
    }

    const results: any[] = [];
    let affected = 0;

    switch (policy.policy_type) {
      case PolicyType.RETENTION:
        affected = await this.applyRetentionPolicy(policy, dto);
        break;
      case PolicyType.LIFECYCLE:
        affected = await this.applyLifecyclePolicy(policy, dto);
        break;
      case PolicyType.ARCHIVE:
        affected = await this.applyArchivePolicy(policy, dto);
        break;
      case PolicyType.QUOTA:
        const quotaResult = await this.checkQuotaPolicy(policy, dto);
        results.push(quotaResult);
        affected = quotaResult.violations ? quotaResult.violations.length : 0;
        break;
    }

    policy.last_applied_at = new Date();
    policy.statistics = {
      ...policy.statistics,
      files_affected: affected,
      last_run_duration_ms: Date.now(),
    };
    await this.policyRepository.save(policy);

    return { affected, results: dto.dry_run ? results : undefined };
  }

  @Cron('0 0 * * *') // Run daily at midnight
  async applyScheduledPolicies(): Promise<void> {
    this.logger.log('Starting scheduled policy application');

    const policies = await this.policyRepository.find({
      where: { is_active: true },
      order: { priority: 'DESC' },
    });

    for (const policy of policies) {
      try {
        await this.applyPolicy(policy.tenant_id, {
          policy_id: policy.id,
          dry_run: false,
          force: false,
        });
      } catch (error: any) {
        this.logger.error(`Failed to apply policy ${policy.id}:`, error);
      }
    }
  }

  private async applyRetentionPolicy(policy: StoragePolicy, dto: ApplyPolicyDto): Promise<number> {
    const rules = policy.rules.retention;
    if (!rules) return 0;

    const cutoffDate = new Date();
    if (rules.days) cutoffDate.setDate(cutoffDate.getDate() - rules.days);
    if (rules.months) cutoffDate.setMonth(cutoffDate.getMonth() - rules.months);
    if (rules.years) cutoffDate.setFullYear(cutoffDate.getFullYear() - rules.years);

    const query = this.fileRepository.createQueryBuilder('file')
      .where('file.tenant_id = :tenantId', { tenantId: policy.tenant_id })
      .andWhere('file.created_at < :cutoffDate', { cutoffDate })
      .andWhere('file.status = :status', { status: FileStatus.ACTIVE });

    this.applyPolicyConditions(query, policy.conditions);

    const files = await query.getMany();

    if (dto.dry_run) {
      return files.length;
    }

    for (const file of files) {
      switch (rules.action) {
        case 'delete':
          await this.storageService.deleteFile(file.id, false);
          break;
        case 'archive':
          file.status = FileStatus.ARCHIVED;
          await this.fileRepository.save(file);
          break;
        case 'move':
          // Move to specified destination
          if (rules.destination) {
            file.parent_folder_id = rules.destination;
            await this.fileRepository.save(file);
          }
          break;
      }
    }

    return files.length;
  }

  private async applyLifecyclePolicy(policy: StoragePolicy, dto: ApplyPolicyDto): Promise<number> {
    const rules = policy.rules.lifecycle;
    if (!rules) return 0;

    let affected = 0;

    // Handle transitions
    if (rules.transitions) {
      for (const transition of rules.transitions) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - transition.days);

        const query = this.fileRepository.createQueryBuilder('file')
          .where('file.tenant_id = :tenantId', { tenantId: policy.tenant_id })
          .andWhere('file.created_at < :cutoffDate', { cutoffDate })
          .andWhere('file.status = :status', { status: FileStatus.ACTIVE });

        this.applyPolicyConditions(query, policy.conditions);

        const files = await query.getMany();
        affected += files.length;

        if (!dto.dry_run) {
          // Apply storage class transition
          for (const file of files) {
            file.metadata = {
              ...file.metadata,
              custom: {
                ...file.metadata?.custom,
                storage_class: transition.storage_class,
              }
            };
            await this.fileRepository.save(file);
          }
        }
      }
    }

    // Handle expiration
    if (rules.expiration) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() - rules.expiration.days);

      const query = this.fileRepository.createQueryBuilder('file')
        .where('file.tenant_id = :tenantId', { tenantId: policy.tenant_id })
        .andWhere('file.created_at < :expirationDate', { expirationDate })
        .andWhere('file.status = :status', { status: FileStatus.ACTIVE });

      this.applyPolicyConditions(query, policy.conditions);

      const files = await query.getMany();
      affected += files.length;

      if (!dto.dry_run) {
        for (const file of files) {
          await this.storageService.deleteFile(file.id, false);
        }
      }
    }

    return affected;
  }

  private async applyArchivePolicy(policy: StoragePolicy, dto: ApplyPolicyDto): Promise<number> {
    const rules = policy.rules.archive;
    if (!rules) return 0;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - rules.after_days);

    const query = this.fileRepository.createQueryBuilder('file')
      .where('file.tenant_id = :tenantId', { tenantId: policy.tenant_id })
      .andWhere('file.updated_at < :cutoffDate', { cutoffDate })
      .andWhere('file.status = :status', { status: FileStatus.ACTIVE });

    this.applyPolicyConditions(query, policy.conditions);

    const files = await query.getMany();

    if (!dto.dry_run) {
      for (const file of files) {
        file.status = FileStatus.ARCHIVED;
        file.metadata = {
          ...file.metadata,
          custom: {
            ...file.metadata?.custom,
            storage_class: rules.storage_class,
            retrieval_tier: rules.retrieval_tier,
          }
        };
        await this.fileRepository.save(file);
      }
    }

    return files.length;
  }

  private async checkQuotaPolicy(policy: StoragePolicy, dto: ApplyPolicyDto): Promise<any> {
    const rules = policy.rules.quota;
    if (!rules) return { violations: [] };

    const violations: any[] = [];

    if (policy.scope === PolicyScope.TENANT) {
      const stats = await this.fileRepository.createQueryBuilder('file')
        .select('SUM(file.size)', 'total_size')
        .addSelect('COUNT(file.id)', 'total_files')
        .where('file.tenant_id = :tenantId', { tenantId: policy.tenant_id })
        .andWhere('file.status = :status', { status: FileStatus.ACTIVE })
        .getRawOne();

      const totalSizeGB = parseInt(stats.total_size) / (1024 * 1024 * 1024);

      if (rules.max_storage_gb && totalSizeGB > rules.max_storage_gb) {
        violations.push({
          type: 'storage_exceeded',
          current: totalSizeGB,
          limit: rules.max_storage_gb,
        });
      }

      if (rules.max_files && parseInt(stats.total_files) > rules.max_files) {
        violations.push({
          type: 'file_count_exceeded',
          current: parseInt(stats.total_files),
          limit: rules.max_files,
        });
      }

      if (rules.warning_threshold && rules.max_storage_gb) {
        const usagePercent = (totalSizeGB / rules.max_storage_gb) * 100;
        if (usagePercent > rules.warning_threshold) {
          // Send notification
          this.sendQuotaWarning(policy, usagePercent);
        }
      }
    }

    return { violations, stats: dto.dry_run ? violations : undefined };
  }

  private applyPolicyConditions(query: any, conditions: any): void {
    if (!conditions) return;

    if (conditions.file_types && conditions.file_types.length > 0) {
      query.andWhere('file.mime_type IN (:...types)', { types: conditions.file_types });
    }

    if (conditions.min_size_mb) {
      const minSize = conditions.min_size_mb * 1024 * 1024;
      query.andWhere('file.size >= :minSize', { minSize });
    }

    if (conditions.max_size_mb) {
      const maxSize = conditions.max_size_mb * 1024 * 1024;
      query.andWhere('file.size <= :maxSize', { maxSize });
    }

    if (conditions.tags && conditions.tags.length > 0) {
      query.andWhere('file.tags && :tags', { tags: conditions.tags });
    }

    if (conditions.created_before) {
      query.andWhere('file.created_at < :createdBefore', { createdBefore: conditions.created_before });
    }

    if (conditions.accessed_before) {
      query.andWhere('file.updated_at < :accessedBefore', { accessedBefore: conditions.accessed_before });
    }
  }

  private async sendQuotaWarning(policy: StoragePolicy, usagePercent: number): Promise<void> {
    if (policy.actions?.notifications) {
      this.logger.warn(`Quota warning for policy ${policy.id}: ${usagePercent.toFixed(2)}% used`);
      // Implement actual notification sending
    }
  }

  private async findPolicyByIdAndTenant(policyId: string, tenantId: string): Promise<StoragePolicy> {
    const policy = await this.policyRepository.findOne({
      where: { id: policyId, tenant_id: tenantId },
    });

    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    return policy;
  }

  async getPolicyAnalytics(tenantId: string, dto: PolicyAnalyticsDto): Promise<any> {
    const query = this.policyRepository.createQueryBuilder('policy')
      .where('policy.tenant_id = :tenantId', { tenantId });

    if (dto.policy_ids && dto.policy_ids.length > 0) {
      query.andWhere('policy.id IN (:...ids)', { ids: dto.policy_ids });
    }

    if (dto.start_date) {
      query.andWhere('policy.last_applied_at >= :startDate', { startDate: dto.start_date });
    }

    if (dto.end_date) {
      query.andWhere('policy.last_applied_at <= :endDate', { endDate: dto.end_date });
    }

    const policies = await query.getMany();

    const analytics = {
      total_policies: policies.length,
      active_policies: policies.filter(p => p.is_active).length,
      by_type: {},
      by_scope: {},
      total_files_affected: 0,
      total_storage_saved_gb: 0,
    };

    for (const policy of policies) {
      // Group by type
      if (!analytics.by_type[policy.policy_type]) {
        analytics.by_type[policy.policy_type] = 0;
      }
      analytics.by_type[policy.policy_type]++;

      // Group by scope
      if (!analytics.by_scope[policy.scope]) {
        analytics.by_scope[policy.scope] = 0;
      }
      analytics.by_scope[policy.scope]++;

      // Aggregate statistics
      if (policy.statistics) {
        analytics.total_files_affected += policy.statistics.files_affected || 0;
        analytics.total_storage_saved_gb += policy.statistics.storage_saved_gb || 0;
      }
    }

    return analytics;
  }
}