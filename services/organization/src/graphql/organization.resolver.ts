import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Organization } from '../entities/organization.entity';
import { OrganizationService } from '../services/organization.service';
import {
  CreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationFilterInput,
} from './dto/organization.input';
import { PaginatedOrganizationResponse } from './dto/organization.response';
import { JwtAuthGuard } from '../infrastructure/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserContext } from '../infrastructure/decorators/current-user.decorator';

@Resolver(() => Organization)
export class OrganizationResolver {
  constructor(private readonly organizationService: OrganizationService) {}

  @Query(() => [Organization], { name: 'organizations' })
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Args('filter', { type: () => OrganizationFilterInput, nullable: true })
    filter?: OrganizationFilterInput,
    @CurrentUser() user?: CurrentUserContext,
  ): Promise<Organization[]> {
    return await this.organizationService.findAll(filter);
  }

  @Query(() => Organization, { name: 'organization' })
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<Organization> {
    return await this.organizationService.findOne(id);
  }

  @Query(() => Organization, { name: 'organizationBySlug' })
  @UseGuards(JwtAuthGuard)
  async findBySlug(
    @Args('slug', { type: () => String }) slug: string,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<Organization> {
    return await this.organizationService.findBySlug(slug);
  }

  @Mutation(() => Organization)
  @UseGuards(JwtAuthGuard)
  async createOrganization(
    @Args('input') input: CreateOrganizationInput,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<Organization> {
    return await this.organizationService.create(input);
  }

  @Mutation(() => Organization)
  @UseGuards(JwtAuthGuard)
  async updateOrganization(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateOrganizationInput,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<Organization> {
    return await this.organizationService.update(id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteOrganization(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: CurrentUserContext,
  ): Promise<boolean> {
    await this.organizationService.remove(id);
    return true;
  }
}
