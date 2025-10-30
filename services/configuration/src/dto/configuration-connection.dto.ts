import { ObjectType, Field, Directive } from '@nestjs/graphql';
import { Configuration } from '../entities/configuration.entity';

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
export class ConfigurationEdge {
  @Field()
  cursor: string;

  @Field(() => Configuration)
  node: Configuration;
}

@ObjectType()
export class ConfigurationConnection {
  @Field(() => [ConfigurationEdge])
  edges: ConfigurationEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field()
  totalCount: number;
}