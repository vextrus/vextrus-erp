import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveReference,
} from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { AuditLog } from '../entities/audit-log.entity';
import { AuditService } from '../services/audit.service';
import { CreateAuditLogInput } from '../dto/create-audit-log.input';
import { SearchAuditInput } from '../dto/search-audit.input';
import { AuditLogConnection } from '../dto/audit-log-connection.dto';

@Resolver(() => AuditLog)
export class AuditLogResolver {
  constructor(
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  @Query(() => AuditLog, { nullable: true })
  async auditLog(@Args('id') id: string): Promise<AuditLog> {
    return this.auditService.findById(id);
  }

  @Query(() => [AuditLog])
  async auditLogs(
    @Args('tenantId') tenantId: string,
    @Args('limit', { type: () => Number, defaultValue: 100 }) limit: number,
    @Args('offset', { type: () => Number, defaultValue: 0 }) offset: number,
  ): Promise<AuditLog[]> {
    return this.auditService.findByTenant(tenantId, limit, offset);
  }

  @Query(() => [AuditLog])
  async searchAuditLogs(
    @Args('input') input: SearchAuditInput,
  ): Promise<AuditLog[]> {
    return this.auditService.search(input);
  }

  @Query(() => AuditLogConnection)
  async auditLogsPaginated(
    @Args('tenantId') tenantId: string,
    @Args('first', { type: () => Number, nullable: true }) first?: number,
    @Args('after', { nullable: true }) after?: string,
    @Args('last', { type: () => Number, nullable: true }) last?: number,
    @Args('before', { nullable: true }) before?: string,
  ): Promise<AuditLogConnection> {
    return this.auditService.findPaginated({
      tenantId,
      first,
      after,
      last,
      before,
    });
  }

  @Mutation(() => AuditLog)
  async createAuditLog(
    @Args('input') input: CreateAuditLogInput,
  ): Promise<AuditLog> {
    return this.auditService.create(input);
  }

  @Mutation(() => Boolean)
  async archiveAuditLogs(
    @Args('tenantId') tenantId: string,
    @Args('beforeDate') beforeDate: Date,
  ): Promise<boolean> {
    return this.auditService.archiveLogs(tenantId, beforeDate);
  }

  @Mutation(() => Boolean)
  async deleteArchivedLogs(
    @Args('tenantId') tenantId: string,
    @Args('beforeDate') beforeDate: Date,
  ): Promise<boolean> {
    return this.auditService.deleteArchived(tenantId, beforeDate);
  }

  @ResolveReference()
  async resolveReference(reference: {
    __typename: string;
    id: string;
  }): Promise<AuditLog> {
    return this.auditService.findById(reference.id);
  }
}