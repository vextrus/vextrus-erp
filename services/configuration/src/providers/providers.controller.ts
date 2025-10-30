import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';

@ApiTags('providers')
@Controller('providers')
export class ProvidersController {
  constructor(private readonly service: ProvidersService) {}

  @Get()
  async getProviders() {
    return this.service.getProviders();
  }
}
