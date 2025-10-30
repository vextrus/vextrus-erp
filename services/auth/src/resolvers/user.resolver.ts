import { Resolver, Query, Args, ID, ResolveField, Parent, ResolveReference } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from '../modules/users/users.service';
import { User } from '../modules/users/entities/user.entity';
import { GqlAuthGuard } from '../guards/gql-auth.guard';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UsersService) {}

  @Query(() => User, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async user(@Args('id', { type: () => ID }) id: string): Promise<User> {
    return this.userService.findOne(id);
  }

  @Query(() => [User])
  @UseGuards(GqlAuthGuard)
  async users(
    @Args('organizationId', { type: () => String }) organizationId: string,
  ): Promise<User[]> {
    return this.userService.findAll(organizationId);
  }

  @Query(() => User, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async userByEmail(@Args('email') email: string): Promise<User> {
    return this.userService.findByEmail(email);
  }

  @ResolveField(() => String)
  fullName(@Parent() user: User): string {
    return `${user.firstName} ${user.lastName}`;
  }

  @ResolveReference()
  __resolveReference(reference: { __typename: string; id: string }): Promise<User> {
    return this.userService.findOne(reference.id);
  }
}