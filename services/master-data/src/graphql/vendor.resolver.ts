import { Resolver, Query, Mutation, Args, ID, ResolveReference } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Vendor } from '../entities/vendor.entity';
import { VendorService } from '../services/vendor.service';
import { CreateVendorInput, UpdateVendorInput, VendorFilterInput } from './dto/vendor.input';
import { JwtAuthGuard, TenantContext, CurrentTenant } from '../auth';
import { PaginatedVendorResponse } from './dto/vendor.response';

@Resolver(() => Vendor)
export class VendorResolver {
  constructor(private readonly vendorService: VendorService) {}

  @ResolveReference()
  async __resolveReference(reference: { __typename: string; id: string }): Promise<Vendor> {
    // For federation, we need to bypass tenant context
    // The reference.id should be sufficient to identify the entity uniquely
    return this.vendorService.findOneForFederation(reference.id);
  }

  @Query(() => PaginatedVendorResponse, { name: 'vendors' })
  @UseGuards(JwtAuthGuard)
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @Args('filter', { nullable: true }) filter?: VendorFilterInput,
    @Args('page', { type: () => Number, defaultValue: 1 }) page?: number,
    @Args('limit', { type: () => Number, defaultValue: 20 }) limit?: number,
  ): Promise<PaginatedVendorResponse> {
    return this.vendorService.findAll(tenant.id, {
      ...filter,
      page,
      limit,
    });
  }

  @Query(() => Vendor, { name: 'vendor' })
  @UseGuards(JwtAuthGuard)
  async findOne(
    @CurrentTenant() tenant: TenantContext,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Vendor> {
    return this.vendorService.findOne(tenant.id, id);
  }

  @Query(() => Vendor, { name: 'vendorByCode', nullable: true })
  @UseGuards(JwtAuthGuard)
  async findByCode(
    @CurrentTenant() tenant: TenantContext,
    @Args('code') code: string,
  ): Promise<Vendor> {
    return this.vendorService.findByCode(tenant.id, code);
  }

  @Query(() => Vendor, { name: 'vendorByTin', nullable: true })
  @UseGuards(JwtAuthGuard)
  async findByTin(
    @CurrentTenant() tenant: TenantContext,
    @Args('tin') tin: string,
  ): Promise<Vendor> {
    return this.vendorService.findByTIN(tenant.id, tin);
  }

  @Mutation(() => Vendor, { name: 'createVendor' })
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Args('input') input: CreateVendorInput,
  ): Promise<Vendor> {
    const mappedInput: any = {
      ...input,
      address: this.mapAddressInput(input.address),
      tenant_id: tenant.id,
      bankAccount: {
        bankName: input.bankName || '',
        branchName: input.bankBranch || '',
        accountNumber: input.bankAccountNo || '',
        accountName: input.name || '',
      },
      categories: ['GENERAL'], // Default category
    };
    return this.vendorService.create(mappedInput);
  }

  @Mutation(() => Vendor, { name: 'updateVendor' })
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentTenant() tenant: TenantContext,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateVendorInput,
  ): Promise<Vendor> {
    const mappedInput: any = {
      ...input,
    };
    // Only map address if it's provided in the input
    if (input.address) {
      mappedInput.address = this.mapAddressInput(input.address);
    }
    return this.vendorService.update(tenant.id, id, mappedInput);
  }

  @Mutation(() => Boolean, { name: 'deleteVendor' })
  @UseGuards(JwtAuthGuard)
  async remove(
    @CurrentTenant() tenant: TenantContext,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    await this.vendorService.remove(tenant.id, id);
    return true;
  }

  @Query(() => Boolean, { name: 'validateVendorTin' })
  @UseGuards(JwtAuthGuard)
  async validateTin(
    @Args('tin') tin: string,
  ): Promise<boolean> {
    // Basic TIN validation for Bangladesh (10 digits)
    const tinRegex = /^\d{10}$/;
    return tinRegex.test(tin);
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