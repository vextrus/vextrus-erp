import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { CreateAuditLogDto } from '../dto/create-audit-log.dto';
import { CreateAuditLogInput } from '../dto/create-audit-log.input';
import { SearchAuditInput } from '../dto/search-audit.input';
import { AuditLogConnection } from '../dto/audit-log-connection.dto';
import { ElasticsearchService } from './elasticsearch.service';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  async findById(id: string): Promise<AuditLog> {
    const log = await this.auditLogRepository.findOne({ where: { id } });
    if (!log) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }
    return log;
  }

  async findByTenant(tenantId: string, limit: number, offset: number): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { tenant_id: tenantId },
      take: limit,
      skip: offset,
      order: { created_at: 'DESC' },
    });
  }

  async create(input: CreateAuditLogInput): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      ...input,
      created_at: new Date(),
      timestamp: new Date(),
    });

    const savedLog = await this.auditLogRepository.save(auditLog);

    // Index to Elasticsearch
    try {
      await this.elasticsearchService.indexAuditLog(savedLog);
    } catch (error) {
      console.error('Failed to index audit log to Elasticsearch:', error);
    }

    return savedLog;
  }

  async createAuditLog(tenantId: string, dto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      tenant_id: tenantId,
      ...dto,
      created_at: new Date(),
      timestamp: new Date(),
    });

    const savedLog = await this.auditLogRepository.save(auditLog);

    // Index to Elasticsearch
    try {
      await this.elasticsearchService.indexAuditLog(savedLog);
    } catch (error) {
      console.error('Failed to index audit log to Elasticsearch:', error);
    }

    return savedLog;
  }

  async search(input: SearchAuditInput): Promise<AuditLog[]> {
    const where: any = { tenant_id: input.tenant_id };

    if (input.user_id) where.user_id = input.user_id;
    if (input.entity_type) where.entity_type = input.entity_type;
    if (input.entity_id) where.entity_id = input.entity_id;
    if (input.event_type) where.event_type = input.event_type;
    if (input.severity) where.severity = input.severity;
    if (input.outcome) where.outcome = input.outcome;
    if (input.service_name) where.service_name = input.service_name;
    if (input.action) where.action = input.action;
    if (input.correlation_id) where.correlation_id = input.correlation_id;
    if (input.request_id) where.request_id = input.request_id;
    if (input.session_id) where.session_id = input.session_id;

    if (input.start_date && input.end_date) {
      where.created_at = Between(new Date(input.start_date), new Date(input.end_date));
    } else if (input.start_date) {
      where.created_at = MoreThan(new Date(input.start_date));
    } else if (input.end_date) {
      where.created_at = LessThan(new Date(input.end_date));
    }

    return this.auditLogRepository.find({
      where,
      take: input.limit || 100,
      skip: input.offset || 0,
      order: { created_at: 'DESC' },
    });
  }

  async findPaginated(params: {
    tenantId: string;
    first?: number;
    after?: string;
    last?: number;
    before?: string;
  }): Promise<AuditLogConnection> {
    const query = this.auditLogRepository
      .createQueryBuilder('audit_log')
      .where('audit_log.tenant_id = :tenantId', { tenantId: params.tenantId })
      .orderBy('audit_log.created_at', 'DESC');

    let limit = 10;
    let offset = 0;

    if (params.first) {
      limit = params.first;
      if (params.after) {
        const decodedCursor = Buffer.from(params.after, 'base64').toString('utf-8');
        offset = parseInt(decodedCursor, 10) + 1;
      }
    } else if (params.last) {
      limit = params.last;
      if (params.before) {
        const decodedCursor = Buffer.from(params.before, 'base64').toString('utf-8');
        const totalCount = await query.getCount();
        offset = Math.max(0, totalCount - parseInt(decodedCursor, 10) - params.last);
      }
    }

    const [items, totalCount] = await query
      .skip(offset)
      .take(limit + 1) // Fetch one extra to check for next page
      .getManyAndCount();

    const hasNextPage = items.length > limit;
    if (hasNextPage) {
      items.pop(); // Remove the extra item
    }

    const edges = items.map((item, index) => ({
      cursor: Buffer.from(`${offset + index}`).toString('base64'),
      node: item,
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: offset > 0,
        startCursor: edges[0]?.cursor || undefined,
        endCursor: edges[edges.length - 1]?.cursor || undefined,
      },
      totalCount,
    };
  }

  async archiveLogs(tenantId: string, beforeDate: Date): Promise<boolean> {
    const result = await this.auditLogRepository.update(
      {
        tenant_id: tenantId,
        created_at: LessThan(beforeDate),
        is_archived: false,
      },
      { is_archived: true }
    );
    return (result.affected ?? 0) > 0;
  }

  async deleteArchived(tenantId: string, beforeDate: Date): Promise<boolean> {
    const result = await this.auditLogRepository.delete({
      tenant_id: tenantId,
      created_at: LessThan(beforeDate),
      is_archived: true,
    });
    return (result.affected ?? 0) > 0;
  }
}
