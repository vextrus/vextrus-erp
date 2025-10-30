import { ObjectType, Field, Directive } from '@nestjs/graphql';
import { AuditLog } from '../entities/audit-log.entity';

@ObjectType()
@Directive('@shareable')
export class PageInfo {
  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;

  @Field({ nullable: true })
  startCursor?: string;

  @Field({ nullable: true })
  endCursor?: string;
}

@ObjectType()
export class AuditLogEdge {
  @Field()
  cursor: string;

  @Field(() => AuditLog)
  node: AuditLog;
}

@ObjectType()
export class AuditLogConnection {
  @Field(() => [AuditLogEdge])
  edges: AuditLogEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field()
  totalCount: number;
}