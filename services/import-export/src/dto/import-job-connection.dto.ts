import { ObjectType, Field, Directive } from '@nestjs/graphql';
import { ImportJob } from '../entities/import-job.entity';

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
export class ImportJobEdge {
  @Field()
  cursor: string;

  @Field(() => ImportJob)
  node: ImportJob;
}

@ObjectType()
export class ImportJobConnection {
  @Field(() => [ImportJobEdge])
  edges: ImportJobEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field()
  totalCount: number;
}