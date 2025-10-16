import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Headers,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { OrganizationService } from '../services/organization.service';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';
import { Organization } from '../entities/organization.entity';

@ApiTags('Organizations')
@Controller('api/v1/organizations')
@ApiHeader({
  name: 'X-Tenant-ID',
  description: 'Tenant ID for multi-tenancy',
  required: false,
})
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({ status: 201, description: 'Organization created successfully', type: Organization })
  @ApiResponse({ status: 409, description: 'Organization with this slug already exists' })
  async create(@Body() createOrganizationDto: CreateOrganizationDto): Promise<Organization> {
    return await this.organizationService.create(createOrganizationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all organizations' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'type', required: false, enum: ['construction', 'real-estate', 'both'] })
  @ApiQuery({ name: 'subscriptionPlan', required: false, enum: ['basic', 'professional', 'enterprise'] })
  @ApiResponse({ status: 200, description: 'List of organizations', type: [Organization] })
  async findAll(
    @Query('isActive') isActive?: string,
    @Query('type') type?: string,
    @Query('subscriptionPlan') subscriptionPlan?: string,
  ): Promise<Organization[]> {
    return await this.organizationService.findAll({
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      type,
      subscriptionPlan,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiResponse({ status: 200, description: 'Organization found', type: Organization })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Organization> {
    return await this.organizationService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get organization by slug' })
  @ApiResponse({ status: 200, description: 'Organization found', type: Organization })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async findBySlug(@Param('slug') slug: string): Promise<Organization> {
    return await this.organizationService.findBySlug(slug);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization' })
  @ApiResponse({ status: 200, description: 'Organization updated successfully', type: Organization })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({ status: 409, description: 'Organization with this slug already exists' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ): Promise<Organization> {
    return await this.organizationService.update(id, updateOrganizationDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete organization' })
  @ApiResponse({ status: 204, description: 'Organization deleted successfully' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.organizationService.remove(id);
  }

  @Post('context')
  @ApiOperation({ summary: 'Set tenant context for current session' })
  @ApiResponse({ status: 200, description: 'Context set successfully' })
  async setContext(
    @Body() body: { tenantId: string; userId?: string },
  ): Promise<{ message: string }> {
    await this.organizationService.setTenantContext(body.tenantId, body.userId);
    return { message: 'Tenant context set successfully' };
  }

  @Get('context/current')
  @ApiOperation({ summary: 'Get current tenant context' })
  @ApiResponse({ status: 200, description: 'Current context' })
  async getContext(): Promise<{ tenantId?: string; userId?: string }> {
    return await this.organizationService.getTenantContext();
  }
}