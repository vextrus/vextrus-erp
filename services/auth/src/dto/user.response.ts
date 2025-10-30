import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class UserResponse {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  username: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field()
  organizationId: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  roleId?: string;

  @Field()
  status: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}