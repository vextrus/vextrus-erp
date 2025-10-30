import { ObjectType, Field } from '@nestjs/graphql';
import { FeatureFlag } from '../entities/feature-flag.entity';
import { PageInfo } from './configuration-connection.dto';

@ObjectType()
export class FeatureFlagEdge {
  @Field()
  cursor: string;

  @Field(() => FeatureFlag)
  node: FeatureFlag;
}

@ObjectType()
export class FeatureFlagConnection {
  @Field(() => [FeatureFlagEdge])
  edges: FeatureFlagEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field()
  totalCount: number;
}