import { ObjectType, Field } from '@nestjs/graphql';
import { ExportJob } from '../entities/export-job.entity';
import { PageInfo } from './import-job-connection.dto';

@ObjectType()
export class ExportJobEdge {
  @Field()
  cursor: string;

  @Field(() => ExportJob)
  node: ExportJob;
}

@ObjectType()
export class ExportJobConnection {
  @Field(() => [ExportJobEdge])
  edges: ExportJobEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field()
  totalCount: number;
}