import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { DataMapperService } from '../services/data-mapper.service';
import { CreateMappingDto } from '../dto/create-mapping.dto';
import { UpdateMappingDto } from '../dto/update-mapping.dto';
import { MappingType } from '../entities/data-mapping.entity';

@ApiTags('mappings')
@Controller('mappings')
export class MappingController {
  constructor(private readonly mapperService: DataMapperService) {}

  @Post()
  @ApiOperation({ summary: 'Create data mapping' })
  async createMapping(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CreateMappingDto,
  ) {
    return this.mapperService.createMapping(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get data mappings' })
  @ApiQuery({ name: 'entity_type', required: false })
  @ApiQuery({ name: 'mapping_type', required: false, enum: MappingType })
  @ApiQuery({ name: 'is_template', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMappings(
    @Headers('x-tenant-id') tenantId: string,
    @Query('entity_type') entityType?: string,
    @Query('mapping_type') mappingType?: MappingType,
    @Query('is_template') isTemplate?: boolean,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.mapperService.getMappings(tenantId, {
      entityType,
      mappingType,
      isTemplate,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get mapping by ID' })
  async getMapping(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.mapperService.getMapping(tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update data mapping' })
  async updateMapping(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMappingDto,
  ) {
    return this.mapperService.updateMapping(tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete data mapping' })
  async deleteMapping(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.mapperService.deleteMapping(tenantId, id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate mapping' })
  async duplicateMapping(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body('name') name: string,
  ) {
    return this.mapperService.duplicateMapping(tenantId, id, name);
  }

  @Post('test')
  @ApiOperation({ summary: 'Test mapping with sample data' })
  async testMapping(
    @Headers('x-tenant-id') tenantId: string,
    @Body() data: { mapping_id: string; sample_data: any },
  ) {
    return this.mapperService.testMapping(
      tenantId,
      data.mapping_id,
      data.sample_data,
    );
  }

  @Get('templates/library')
  @ApiOperation({ summary: 'Get mapping templates library' })
  async getTemplateLibrary() {
    return this.mapperService.getTemplateLibrary();
  }
}