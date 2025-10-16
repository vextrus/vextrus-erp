import { Resolver, Query, Mutation, Args, ID, ResolveReference } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Customer } from '../entities/customer.entity';
import { CustomerService } from '../services/customer.service';
import { CreateCustomerInput, UpdateCustomerInput, CustomerFilterInput } from './dto/customer.input';
import { JwtAuthGuard, TenantContext, CurrentTenant } from '../auth';
import { PaginatedCustomerResponse } from './dto/customer.response';

@Resolver(() => Customer)
export class CustomerResolver {
  constructor(private readonly customerService: CustomerService) {}

  @ResolveReference()
  async __resolveReference(reference: { __typename: string; id: string }): Promise<Customer> {
    // For federation, we need to bypass tenant context
    // The reference.id should be sufficient to identify the entity uniquely
    return this.customerService.findOneForFederation(reference.id);
  }

  @Query(() => PaginatedCustomerResponse, { name: 'customers' })
  @UseGuards(JwtAuthGuard)
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @Args('filter', { nullable: true }) filter?: CustomerFilterInput,
    @Args('page', { type: () => Number, defaultValue: 1 }) page?: number,
    @Args('limit', { type: () => Number, defaultValue: 20 }) limit?: number,
  ): Promise<PaginatedCustomerResponse> {
    return this.customerService.findAll(tenant.id, {
      ...filter,
      page,
      limit,
    });
  }

  @Query(() => Customer, { name: 'customer' })
  @UseGuards(JwtAuthGuard)
  async findOne(
    @CurrentTenant() tenant: TenantContext,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Customer> {
    return this.customerService.findOne(tenant.id, id);
  }

  @Query(() => Customer, { name: 'customerByCode', nullable: true })
  @UseGuards(JwtAuthGuard)
  async findByCode(
    @CurrentTenant() tenant: TenantContext,
    @Args('code') code: string,
  ): Promise<Customer> {
    return this.customerService.findByCode(tenant.id, code);
  }

  @Query(() => Customer, { name: 'customerByTin', nullable: true })
  @UseGuards(JwtAuthGuard)
  async findByTin(
    @CurrentTenant() tenant: TenantContext,
    @Args('tin') tin: string,
  ): Promise<Customer> {
    return this.customerService.findByTin(tenant.id, tin);
  }

  @Mutation(() => Customer, { name: 'createCustomer' })
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Args('input') input: CreateCustomerInput,
  ): Promise<Customer> {
    const mappedInput = {
      ...input,
      address: this.mapAddressInput(input.address),
    };
    return this.customerService.create(tenant.id, mappedInput);
  }

  @Mutation(() => Customer, { name: 'updateCustomer' })
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentTenant() tenant: TenantContext,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateCustomerInput,
  ): Promise<Customer> {
    const mappedInput = {
      ...input,
      address: input.address ? this.mapAddressInput(input.address) : undefined,
    };
    return this.customerService.update(tenant.id, id, mappedInput);
  }

  @Mutation(() => Boolean, { name: 'deleteCustomer' })
  @UseGuards(JwtAuthGuard)
  async remove(
    @CurrentTenant() tenant: TenantContext,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    await this.customerService.remove(tenant.id, id);
    return true;
  }

  @Query(() => Boolean, { name: 'validateTin' })
  @UseGuards(JwtAuthGuard)
  async validateTin(
    @Args('tin') tin: string,
  ): Promise<boolean> {
    const result = await this.customerService.validateTin(tin);
    return result.valid;
  }

  @Query(() => Boolean, { name: 'validateNid' })
  @UseGuards(JwtAuthGuard)
  async validateNid(
    @Args('nid') nid: string,
  ): Promise<boolean> {
    const result = await this.customerService.validateNid(nid);
    return result.valid;
  }

  private mapAddressInput(addressInput: any) {
    return {
      line1: addressInput.street1,
      line2: addressInput.street2,
      area: addressInput.city,
      district: addressInput.district,
      division: addressInput.division,
      postal_code: addressInput.postalCode,
      country: addressInput.country || 'Bangladesh',
    };
  }
}