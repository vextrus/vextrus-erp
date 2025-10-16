import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FeatureFlagsService } from './feature-flags.service';

@ApiTags('feature-flags')
@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all feature flags' })
  async getAll() {
    return this.featureFlagsService.getAll();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get feature flag by key' })
  async getByKey(@Param('key') key: string) {
    return this.featureFlagsService.getByKey(key);
  }

  @Post()
  @ApiOperation({ summary: 'Create feature flag' })
  async create(@Body() data: any) {
    return this.featureFlagsService.create(data);
  }

  @Put(':key')
  @ApiOperation({ summary: 'Update feature flag' })
  async update(@Param('key') key: string, @Body() data: any) {
    return this.featureFlagsService.update(key, data);
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete feature flag' })
  async delete(@Param('key') key: string) {
    return this.featureFlagsService.delete(key);
  }
}