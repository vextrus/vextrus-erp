import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Vendor } from '../../entities/vendor.entity';

@ObjectType()
export class PaginatedVendorResponse {
  @Field(() => [Vendor])
  items: Vendor[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;
}