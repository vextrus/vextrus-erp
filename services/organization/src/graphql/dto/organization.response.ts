import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Organization } from '../../entities/organization.entity';

@ObjectType()
export class PaginatedOrganizationResponse {
  @Field(() => [Organization])
  items: Organization[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;
}
