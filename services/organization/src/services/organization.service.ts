import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    private readonly dataSource: DataSource,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  async create(createOrganizationDto: CreateOrganizationDto): Promise<Organization> {
    // Check if slug already exists
    const existing = await this.organizationRepository.findOne({
      where: { slug: createOrganizationDto.slug },
    });

    if (existing) {
      throw new ConflictException(`Organization with slug '${createOrganizationDto.slug}' already exists`);
    }

    // Set default settings if not provided
    const defaultSettings = {
      timezone: 'Asia/Dhaka',
      currency: 'BDT',
      language: 'en',
      fiscalYear: {
        start: '01-07',
        end: '30-06',
      },
      dateFormat: 'DD/MM/YYYY',
      numberFormat: 'en-BD',
    };

    const organization = this.organizationRepository.create({
      ...createOrganizationDto,
      settings: { ...defaultSettings, ...createOrganizationDto.settings },
    });

    return await this.organizationRepository.save(organization);
  }

  async findAll(params?: {
    isActive?: boolean;
    type?: string;
    subscriptionPlan?: string;
  }): Promise<Organization[]> {
    const query = this.organizationRepository.createQueryBuilder('org');

    if (params?.isActive !== undefined) {
      query.andWhere('org.isActive = :isActive', { isActive: params.isActive });
    }

    if (params?.type) {
      query.andWhere('org.type = :type', { type: params.type });
    }

    if (params?.subscriptionPlan) {
      query.andWhere('org.subscriptionPlan = :plan', { plan: params.subscriptionPlan });
    }

    return await query.getMany();
  }

  async findOne(id: string): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { id },
      relations: ['divisions'],
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID '${id}' not found`);
    }

    return organization;
  }

  async findBySlug(slug: string): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { slug },
      relations: ['divisions'],
    });

    if (!organization) {
      throw new NotFoundException(`Organization with slug '${slug}' not found`);
    }

    return organization;
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto): Promise<Organization> {
    const organization = await this.findOne(id);

    // If slug is being updated, check for conflicts
    if (updateOrganizationDto.slug && updateOrganizationDto.slug !== organization.slug) {
      const existing = await this.organizationRepository.findOne({
        where: { slug: updateOrganizationDto.slug },
      });

      if (existing) {
        throw new ConflictException(`Organization with slug '${updateOrganizationDto.slug}' already exists`);
      }
    }

    // Merge settings if provided
    if (updateOrganizationDto.settings) {
      updateOrganizationDto.settings = {
        ...organization.settings,
        ...updateOrganizationDto.settings,
      };
    }

    Object.assign(organization, updateOrganizationDto);
    return await this.organizationRepository.save(organization);
  }

  async remove(id: string): Promise<void> {
    const organization = await this.findOne(id);
    await this.organizationRepository.remove(organization);
  }

  async setTenantContext(tenantId: string, userId?: string): Promise<void> {
    // Set PostgreSQL session variables for RLS
    await this.dataSource.query(`SELECT set_config('app.tenant_id', $1, false)`, [tenantId]);
    
    if (userId) {
      await this.dataSource.query(`SELECT set_config('app.user_id', $1, false)`, [userId]);
    }
  }

  async getTenantContext(): Promise<{ tenantId?: string; userId?: string }> {
    const results = await this.dataSource.query(`
      SELECT 
        current_setting('app.tenant_id', true) as tenant_id,
        current_setting('app.user_id', true) as user_id
    `);

    return {
      tenantId: results[0]?.tenant_id,
      userId: results[0]?.user_id,
    };
  }
}