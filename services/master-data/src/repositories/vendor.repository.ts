import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In, Between } from 'typeorm';
import { BaseRepository } from './base.repository';
import { Vendor, VendorType, VendorStatus, VendorCategory } from '../entities/vendor.entity';

@Injectable()
export class VendorRepository extends BaseRepository<Vendor> {
  constructor(
    @InjectRepository(Vendor)
    protected readonly repository: Repository<Vendor>
  ) {
    super(repository);
  }

  async findByTIN(tenantId: string, tin: string): Promise<Vendor | null> {
    return await this.repository.findOne({
      where: {
        tenant_id: tenantId,
        tin,
      },
    });
  }

  async findByTradeLicense(tenantId: string, licenseNo: string): Promise<Vendor | null> {
    return await this.repository.findOne({
      where: {
        tenant_id: tenantId,
        trade_license_no: licenseNo,
      },
    });
  }

  async findByStatus(
    tenantId: string,
    status: VendorStatus
  ): Promise<Vendor[]> {
    return await this.repository.find({
      where: {
        tenant_id: tenantId,
        status,
      },
      order: {
        name: 'ASC',
      },
    });
  }

  async findByType(
    tenantId: string,
    vendorType: VendorType
  ): Promise<Vendor[]> {
    return await this.repository.find({
      where: {
        tenant_id: tenantId,
        vendor_type: vendorType,
      },
      order: {
        name: 'ASC',
      },
    });
  }

  async findByCategory(
    tenantId: string,
    category: VendorCategory
  ): Promise<Vendor[]> {
    const queryBuilder = this.repository.createQueryBuilder('vendor');
    
    queryBuilder.where('vendor.tenant_id = :tenantId', { tenantId });
    queryBuilder.andWhere(':category = ANY(vendor.categories)', { category });
    queryBuilder.orderBy('vendor.name', 'ASC');
    
    return await queryBuilder.getMany();
  }

  async findApprovedVendors(tenantId: string): Promise<Vendor[]> {
    return await this.repository.find({
      where: {
        tenant_id: tenantId,
        status: VendorStatus.APPROVED,
        blacklisted: false,
        is_active: true,
      },
      order: {
        rating: 'DESC',
        name: 'ASC',
      },
    });
  }

  async findBlacklistedVendors(tenantId: string): Promise<Vendor[]> {
    return await this.repository.find({
      where: {
        tenant_id: tenantId,
        blacklisted: true,
      },
      order: {
        blacklisted_at: 'DESC',
      },
    });
  }

  async findExpiringLicenses(
    tenantId: string,
    daysAhead: number = 30
  ): Promise<Vendor[]> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysAhead);

    const queryBuilder = this.repository.createQueryBuilder('vendor');
    
    queryBuilder.where('vendor.tenant_id = :tenantId', { tenantId });
    queryBuilder.andWhere('vendor.trade_license_expiry <= :expiryDate', { expiryDate });
    queryBuilder.andWhere('vendor.trade_license_expiry >= :today', { today: new Date() });
    queryBuilder.andWhere('vendor.status = :status', { status: VendorStatus.APPROVED });
    queryBuilder.orderBy('vendor.trade_license_expiry', 'ASC');
    
    return await queryBuilder.getMany();
  }

  async findExpiringContracts(
    tenantId: string,
    daysAhead: number = 30
  ): Promise<Vendor[]> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysAhead);

    const queryBuilder = this.repository.createQueryBuilder('vendor');
    
    queryBuilder.where('vendor.tenant_id = :tenantId', { tenantId });
    queryBuilder.andWhere('vendor.contract_end_date <= :expiryDate', { expiryDate });
    queryBuilder.andWhere('vendor.contract_end_date >= :today', { today: new Date() });
    queryBuilder.andWhere('vendor.status = :status', { status: VendorStatus.APPROVED });
    queryBuilder.orderBy('vendor.contract_end_date', 'ASC');
    
    return await queryBuilder.getMany();
  }

  async searchVendors(
    tenantId: string,
    searchTerm: string,
    limit: number = 10
  ): Promise<Vendor[]> {
    const queryBuilder = this.repository.createQueryBuilder('vendor');
    
    queryBuilder.where('vendor.tenant_id = :tenantId', { tenantId });
    
    if (searchTerm) {
      queryBuilder.andWhere(
        `(
          vendor.code ILIKE :search OR
          vendor.name ILIKE :search OR
          vendor.name_bn ILIKE :search OR
          vendor.tin ILIKE :search OR
          vendor.bin ILIKE :search OR
          vendor.phone ILIKE :search OR
          vendor.email ILIKE :search
        )`,
        { search: `%${searchTerm}%` }
      );
    }
    
    queryBuilder.limit(limit);
    queryBuilder.orderBy('vendor.name', 'ASC');
    
    return await queryBuilder.getMany();
  }

  async getTopVendorsByRating(
    tenantId: string,
    limit: number = 10
  ): Promise<Vendor[]> {
    return await this.repository.find({
      where: {
        tenant_id: tenantId,
        status: VendorStatus.APPROVED,
        blacklisted: false,
      },
      order: {
        rating: 'DESC',
        quality_score: 'DESC',
      },
      take: limit,
    });
  }

  async getTopVendorsByVolume(
    tenantId: string,
    limit: number = 10
  ): Promise<Vendor[]> {
    return await this.repository.find({
      where: {
        tenant_id: tenantId,
        status: VendorStatus.APPROVED,
      },
      order: {
        total_business_amount: 'DESC',
      },
      take: limit,
    });
  }

  async getVendorsByPerformance(
    tenantId: string,
    minRating: number = 3.0,
    minDeliveryRate: number = 80,
    minQualityScore: number = 80
  ): Promise<Vendor[]> {
    const queryBuilder = this.repository.createQueryBuilder('vendor');
    
    queryBuilder.where('vendor.tenant_id = :tenantId', { tenantId });
    queryBuilder.andWhere('vendor.rating >= :minRating', { minRating });
    queryBuilder.andWhere('vendor.on_time_delivery_rate >= :minDeliveryRate', { minDeliveryRate });
    queryBuilder.andWhere('vendor.quality_score >= :minQualityScore', { minQualityScore });
    queryBuilder.andWhere('vendor.status = :status', { status: VendorStatus.APPROVED });
    queryBuilder.andWhere('vendor.blacklisted = :blacklisted', { blacklisted: false });
    queryBuilder.orderBy('vendor.rating', 'DESC');
    
    return await queryBuilder.getMany();
  }

  async updateRating(
    tenantId: string,
    vendorId: string,
    rating: number
  ): Promise<boolean> {
    const result = await this.repository.update(
      { id: vendorId, tenant_id: tenantId },
      { 
        rating,
        updated_at: new Date(),
      }
    );

    return result.affected ? result.affected > 0 : false;
  }

  async updatePerformanceMetrics(
    tenantId: string,
    vendorId: string,
    metrics: {
      onTimeDeliveryRate?: number;
      qualityScore?: number;
      totalOrders?: number;
      completedOrders?: number;
      totalBusinessAmount?: number;
    }
  ): Promise<boolean> {
    const vendor = await this.findOne(tenantId, vendorId);
    if (!vendor) {
      return false;
    }

    const updateData: any = { updated_at: new Date() };

    if (metrics.onTimeDeliveryRate !== undefined) {
      updateData.on_time_delivery_rate = metrics.onTimeDeliveryRate;
    }
    if (metrics.qualityScore !== undefined) {
      updateData.quality_score = metrics.qualityScore;
    }
    if (metrics.totalOrders !== undefined) {
      updateData.total_orders = vendor.total_orders + metrics.totalOrders;
    }
    if (metrics.completedOrders !== undefined) {
      updateData.completed_orders = vendor.completed_orders + metrics.completedOrders;
    }
    if (metrics.totalBusinessAmount !== undefined) {
      updateData.total_business_amount = vendor.total_business_amount + metrics.totalBusinessAmount;
    }

    const result = await this.repository.update(
      { id: vendorId, tenant_id: tenantId },
      updateData
    );

    return result.affected ? result.affected > 0 : false;
  }

  async approveVendor(
    tenantId: string,
    vendorId: string,
    approvedBy: string
  ): Promise<boolean> {
    const result = await this.repository.update(
      { id: vendorId, tenant_id: tenantId },
      {
        status: VendorStatus.APPROVED,
        is_verified: true,
        verified_at: new Date(),
        verified_by: approvedBy,
        updated_at: new Date(),
      }
    );

    return result.affected ? result.affected > 0 : false;
  }

  async blacklistVendor(
    tenantId: string,
    vendorId: string,
    reason: string
  ): Promise<boolean> {
    const result = await this.repository.update(
      { id: vendorId, tenant_id: tenantId },
      {
        blacklisted: true,
        blacklisted_at: new Date(),
        blacklist_reason: reason,
        status: VendorStatus.BLACKLISTED,
        updated_at: new Date(),
      }
    );

    return result.affected ? result.affected > 0 : false;
  }

  async removeFromBlacklist(
    tenantId: string,
    vendorId: string
  ): Promise<boolean> {
    const result = await this.repository.update(
      { id: vendorId, tenant_id: tenantId },
      {
        blacklisted: false,
        blacklisted_at: null,
        blacklist_reason: null,
        status: VendorStatus.APPROVED,
        updated_at: new Date(),
      }
    );

    return result.affected ? result.affected > 0 : false;
  }

  async addEvaluation(
    tenantId: string,
    vendorId: string,
    evaluation: {
      evaluated_by: string;
      score: number;
      comments?: string;
      areas: {
        quality: number;
        delivery: number;
        pricing: number;
        communication: number;
        compliance: number;
      };
    }
  ): Promise<boolean> {
    const vendor = await this.findOne(tenantId, vendorId);
    if (!vendor) {
      return false;
    }

    const evaluationHistory = vendor.evaluation_history || [];
    evaluationHistory.push({
      evaluated_at: new Date(),
      ...evaluation,
    });

    // Calculate new overall rating
    const newRating = (
      evaluation.areas.quality +
      evaluation.areas.delivery +
      evaluation.areas.pricing +
      evaluation.areas.communication +
      evaluation.areas.compliance
    ) / 5;

    const result = await this.repository.update(
      { id: vendorId, tenant_id: tenantId },
      {
        evaluation_history: evaluationHistory,
        rating: newRating,
        updated_at: new Date(),
      }
    );

    return result.affected ? result.affected > 0 : false;
  }

  async getVendorStats(tenantId: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    suspended: number;
    blacklisted: number;
    byType: Record<VendorType, number>;
    avgRating: number;
    avgDeliveryRate: number;
    avgQualityScore: number;
  }> {
    const queryBuilder = this.repository.createQueryBuilder('vendor');
    queryBuilder.where('vendor.tenant_id = :tenantId', { tenantId });

    // Get counts by status
    const statusCounts = await queryBuilder
      .select('vendor.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('vendor.status')
      .getRawMany();

    // Get counts by type
    const typeCounts = await queryBuilder
      .select('vendor.vendor_type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('vendor.vendor_type')
      .getRawMany();

    // Get averages
    const averages = await queryBuilder
      .select('AVG(vendor.rating)', 'avgRating')
      .addSelect('AVG(vendor.on_time_delivery_rate)', 'avgDeliveryRate')
      .addSelect('AVG(vendor.quality_score)', 'avgQualityScore')
      .where('vendor.tenant_id = :tenantId', { tenantId })
      .andWhere('vendor.status = :status', { status: VendorStatus.APPROVED })
      .getRawOne();

    const stats = {
      total: 0,
      pending: 0,
      approved: 0,
      suspended: 0,
      blacklisted: 0,
      byType: {} as Record<VendorType, number>,
      avgRating: parseFloat(averages?.avgRating || '0'),
      avgDeliveryRate: parseFloat(averages?.avgDeliveryRate || '0'),
      avgQualityScore: parseFloat(averages?.avgQualityScore || '0'),
    };

    statusCounts.forEach(row => {
      const count = parseInt(row.count);
      stats.total += count;
      
      switch (row.status) {
        case VendorStatus.PENDING:
          stats.pending = count;
          break;
        case VendorStatus.APPROVED:
          stats.approved = count;
          break;
        case VendorStatus.SUSPENDED:
          stats.suspended = count;
          break;
        case VendorStatus.BLACKLISTED:
          stats.blacklisted = count;
          break;
      }
    });

    typeCounts.forEach(row => {
      stats.byType[row.type as VendorType] = parseInt(row.count);
    });

    return stats;
  }
}