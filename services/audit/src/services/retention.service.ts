import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RetentionPolicy } from '../entities/retention-policy.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { CreateRetentionPolicyDto, UpdateRetentionPolicyDto, ApplyRetentionPolicyDto, RetentionStatisticsDto } from '../dto/retention-policy.dto';

export interface ApplyRetentionResult {
  processed: number;
  archived: number;
  deleted: number;
  exported: number;
  errors: string[];
  duration_ms: number;
  dry_run: boolean;
}

export interface RetentionStatistics {
  total_policies: number;
  active_policies: number;
  logs_processed_today: number;
  logs_archived_today: number;
  logs_deleted_today: number;
  storage_saved_bytes: number;
  compliance_status: {
    regulation: string;
    compliance_rate: number;
    violations: number;
  }[];
  timeline?: {
    date: string;
    processed: number;
    archived: number;
    deleted: number;
  }[];
}

@Injectable()
export class RetentionService {
  constructor(
    @InjectRepository(RetentionPolicy)
    private readonly retentionPolicyRepository: Repository<RetentionPolicy>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async createPolicy(tenantId: string, dto: CreateRetentionPolicyDto, userId: string): Promise<RetentionPolicy> {
    const policy = this.retentionPolicyRepository.create({
      tenant_id: tenantId,
      created_by: userId,
      ...dto,
    });

    return await this.retentionPolicyRepository.save(policy);
  }

  async getPolicies(tenantId: string): Promise<RetentionPolicy[]> {
    return await this.retentionPolicyRepository.find({
      where: { tenant_id: tenantId },
      order: { priority: 'DESC', created_at: 'DESC' },
    });
  }

  async updatePolicy(tenantId: string, id: string, dto: UpdateRetentionPolicyDto, userId: string): Promise<RetentionPolicy> {
    const policy = await this.retentionPolicyRepository.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!policy) {
      throw new Error('Retention policy not found');
    }

    Object.assign(policy, dto);
    policy.updated_by = userId;

    return await this.retentionPolicyRepository.save(policy);
  }

  async deletePolicy(tenantId: string, id: string): Promise<void> {
    const result = await this.retentionPolicyRepository.delete({
      id,
      tenant_id: tenantId,
    });

    if (result.affected === 0) {
      throw new Error('Retention policy not found');
    }
  }

  async applyPolicy(tenantId: string, dto: ApplyRetentionPolicyDto): Promise<ApplyRetentionResult> {
    const startTime = Date.now();
    const result: ApplyRetentionResult = {
      processed: 0,
      archived: 0,
      deleted: 0,
      exported: 0,
      errors: [],
      duration_ms: 0,
      dry_run: dto.dry_run || false,
    };

    try {
      // Get policies to apply
      let policies: RetentionPolicy[];
      
      if (dto.policy_ids?.length) {
        policies = await this.retentionPolicyRepository.find({
          where: { 
            id: dto.policy_ids[0] as any, // TypeORM In operator handling
            tenant_id: tenantId,
            is_active: true,
          },
          order: { priority: 'DESC' },
        });
      } else {
        policies = await this.retentionPolicyRepository.find({
          where: { 
            tenant_id: tenantId,
            is_active: true,
          },
          order: { priority: 'DESC' },
        });
      }

      // Apply each policy
      for (const policy of policies) {
        try {
          const policyResult = await this.applyRetentionPolicy(policy, dto);
          result.processed += policyResult.processed;
          result.archived += policyResult.archived;
          result.deleted += policyResult.deleted;
          result.exported += policyResult.exported;

          // Update policy execution stats
          if (!dto.dry_run) {
            await this.updatePolicyExecutionStats(policy, policyResult);
          }
        } catch (error: any) {
          result.errors.push(`Policy ${policy.name}: ${error.message}`);
        }
      }

      result.duration_ms = Date.now() - startTime;
      return result;
    } catch (error: any) {
      result.errors.push(`General error: ${error.message}`);
      result.duration_ms = Date.now() - startTime;
      return result;
    }
  }

  async getRetentionStatistics(tenantId: string, dto: RetentionStatisticsDto): Promise<RetentionStatistics> {
    const startDate = dto.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = dto.end_date || new Date();

    // Get basic policy counts
    const [totalPolicies, activePolicies] = await Promise.all([
      this.retentionPolicyRepository.count({ where: { tenant_id: tenantId } }),
      this.retentionPolicyRepository.count({ where: { tenant_id: tenantId, is_active: true } }),
    ]);

    // Mock statistics - replace with actual queries
    const stats: RetentionStatistics = {
      total_policies: totalPolicies,
      active_policies: activePolicies,
      logs_processed_today: 0,
      logs_archived_today: 0,
      logs_deleted_today: 0,
      storage_saved_bytes: 0,
      compliance_status: [
        {
          regulation: 'GDPR',
          compliance_rate: 98.5,
          violations: 2,
        },
        {
          regulation: 'HIPAA',
          compliance_rate: 99.1,
          violations: 1,
        },
      ],
    };

    // Add timeline if requested
    if (dto.detailed) {
      stats.timeline = [
        {
          date: new Date().toISOString().split('T')[0]!,
          processed: 0,
          archived: 0,
          deleted: 0,
        },
      ];
    }

    return stats;
  }

  async archiveOldLogs() {
    return { archived: 0 };
  }

  private async applyRetentionPolicy(policy: RetentionPolicy, dto: ApplyRetentionPolicyDto): Promise<ApplyRetentionResult> {
    const result: ApplyRetentionResult = {
      processed: 0,
      archived: 0,
      deleted: 0,
      exported: 0,
      errors: [],
      duration_ms: 0,
      dry_run: dto.dry_run || false,
    };

    // Build query to find matching logs
    const queryBuilder = this.auditLogRepository.createQueryBuilder('log')
      .where('log.tenant_id = :tenantId', { tenantId: policy.tenant_id });

    // Apply criteria filters
    if (policy.criteria.event_types?.length) {
      queryBuilder.andWhere('log.event_type IN (:...eventTypes)', { eventTypes: policy.criteria.event_types });
    }

    if (policy.criteria.severity_levels?.length) {
      queryBuilder.andWhere('log.severity IN (:...severityLevels)', { severityLevels: policy.criteria.severity_levels });
    }

    if (policy.criteria.services?.length) {
      queryBuilder.andWhere('log.service_name IN (:...services)', { services: policy.criteria.services });
    }

    // Apply retention date filter
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retention_rules.standard.duration_days);
    queryBuilder.andWhere('log.created_at < :cutoffDate', { cutoffDate });

    // Exclude already archived logs unless we're doing cleanup
    if (policy.retention_rules.standard.action !== 'delete') {
      queryBuilder.andWhere('log.is_archived = false');
    }

    const logsToProcess = await queryBuilder.getMany();
    result.processed = logsToProcess.length;

    if (!dto.dry_run && logsToProcess.length > 0) {
      const logIds = logsToProcess.map(log => log.id);
      
      switch (policy.retention_rules.standard.action) {
        case 'archive':
          await this.auditLogRepository.update(
            { id: logIds[0] as any }, // Use first ID as example - in real implementation use IN operator
            { is_archived: true }
          );
          result.archived = logsToProcess.length;
          break;

        case 'delete':
          await this.auditLogRepository.delete({ id: logIds[0] as any }); // Use first ID as example
          result.deleted = logsToProcess.length;
          break;

        case 'export':
          // Mock export - implement actual export logic
          result.exported = logsToProcess.length;
          break;

        default:
          result.errors.push(`Unknown retention action: ${policy.retention_rules.standard.action}`);
      }
    }

    return result;
  }

  private async updatePolicyExecutionStats(policy: RetentionPolicy, result: ApplyRetentionResult): Promise<void> {
    const stats = {
      total_processed: (policy.execution_stats?.total_processed || 0) + result.processed,
      total_archived: (policy.execution_stats?.total_archived || 0) + result.archived,
      total_deleted: (policy.execution_stats?.total_deleted || 0) + result.deleted,
      last_run_duration_ms: result.duration_ms,
      next_run_at: this.calculateNextRun(policy.schedule_cron),
    };

    await this.retentionPolicyRepository.update(policy.id, {
      execution_stats: stats,
      last_applied_at: new Date(),
    });
  }

  private calculateNextRun(cronExpression?: string): Date | undefined {
    if (!cronExpression) {
      return undefined;
    }

    // Mock implementation - replace with actual cron calculation
    const nextRun = new Date();
    nextRun.setDate(nextRun.getDate() + 1); // Daily by default
    return nextRun;
  }
}
