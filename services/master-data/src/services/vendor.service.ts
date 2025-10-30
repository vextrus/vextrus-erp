import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Vendor, VendorStatus } from '../entities/vendor.entity';
import { VendorRepository } from '../repositories/vendor.repository';
import { CreateVendorDto } from '../dto/create-vendor.dto';
import { UpdateVendorDto } from '../dto/update-vendor.dto';
import { VendorQueryDto } from '../dto/vendor-query.dto';

@Injectable()
export class VendorService {
  constructor(
    @InjectRepository(Vendor)
    private vendorRepository: VendorRepository,
  ) {}

  async create(createVendorDto: CreateVendorDto & { tenant_id?: string }): Promise<Vendor> {
    try {
      return await this.vendorRepository.create({
        ...createVendorDto,
        tenant_id: createVendorDto.tenant_id,
      });
    } catch (error) {
      if (error.code === '23505') { // PostgreSQL unique constraint violation
        throw new BadRequestException('Vendor with this code already exists');
      }
      throw error;
    }
  }

  async findAll(tenantId: string, query: VendorQueryDto): Promise<any> {
    // For now, return a simple implementation
    const vendors = await this.vendorRepository.findAll(tenantId);
    const page = query.page || 1;
    const limit = query.limit || 20;
    const start = (page - 1) * limit;
    const paginatedVendors = vendors.slice(start, start + limit);

    return {
      items: paginatedVendors,
      total: vendors.length,
      page: page,
      limit: limit,
      totalPages: Math.ceil(vendors.length / limit),
    };
  }

  async findOne(tenantId: string, id: string): Promise<Vendor> {
    const vendor = await this.vendorRepository.findOne(tenantId, id);
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }
    return vendor;
  }

  /**
   * Federation-specific method that bypasses tenant check
   * Used by GraphQL federation __resolveReference resolver
   */
  async findOneForFederation(id: string): Promise<Vendor> {
    const vendor = await this.vendorRepository.findById(id);
    if (!vendor) {
      throw new NotFoundException(`Vendor ${id} not found`);
    }
    return vendor;
  }

  async findByCode(tenantId: string, code: string): Promise<Vendor> {
    const vendor = await this.vendorRepository.findByCode(tenantId, code);
    if (!vendor) {
      throw new NotFoundException(`Vendor with code ${code} not found`);
    }
    return vendor;
  }

  async findByTIN(tenantId: string, tin: string): Promise<Vendor> {
    // For now, use a simple implementation. This should be implemented in the repository
    const vendors = await this.vendorRepository.findAll(tenantId);
    const vendor = vendors.find(v => v.tin === tin);
    if (!vendor) {
      throw new NotFoundException(`Vendor with TIN ${tin} not found`);
    }
    return vendor;
  }

  async update(tenantId: string, id: string, updateVendorDto: UpdateVendorDto): Promise<Vendor> {
    const vendor = await this.findOne(tenantId, id);
    
    try {
      const updated = await this.vendorRepository.update(tenantId, id, updateVendorDto);
      if (!updated) {
        throw new NotFoundException(`Vendor with ID ${id} not found`);
      }
      return updated;
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('Vendor with this code already exists');
      }
      throw error;
    }
  }

  async activate(tenantId: string, id: string): Promise<Vendor> {
    const updated = await this.vendorRepository.update(tenantId, id, { status: VendorStatus.APPROVED });
    if (!updated) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }
    return updated;
  }

  async deactivate(tenantId: string, id: string): Promise<Vendor> {
    const updated = await this.vendorRepository.update(tenantId, id, { status: VendorStatus.INACTIVE });
    if (!updated) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }
    return updated;
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const vendor = await this.findOne(tenantId, id);
    
    // TODO: Check if vendor has related transactions/orders
    
    await this.vendorRepository.softDelete(tenantId, id);
  }

  async findApproved(tenantId: string): Promise<Vendor[]> {
    return this.vendorRepository.findAll(tenantId, {
      where: { status: VendorStatus.APPROVED }
    });
  }

  async approve(tenantId: string, id: string): Promise<Vendor> {
    const updated = await this.vendorRepository.update(tenantId, id, { status: VendorStatus.APPROVED });
    if (!updated) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }
    return updated;
  }

  async blacklist(tenantId: string, id: string, reason: string): Promise<Vendor> {
    const updated = await this.vendorRepository.update(tenantId, id, { 
      status: VendorStatus.BLACKLISTED,
      blacklist_reason: reason 
    });
    if (!updated) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }
    return updated;
  }

  async bulkImport(
    tenantId: string,
    vendors: any[]
  ): Promise<{ jobId: string; message: string }> {
    // For now, return a placeholder response
    // This would typically start a background job
    const jobId = `bulk-import-${Date.now()}`;
    
    return {
      jobId,
      message: `Bulk import job ${jobId} started for ${vendors.length} vendors`,
    };
  }
}