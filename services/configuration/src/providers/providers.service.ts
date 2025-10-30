import { Injectable } from '@nestjs/common';

@Injectable()
export class ProvidersService {
  async getProviders() {
    return {
      cache: 'redis',
      database: 'postgres',
      messaging: 'kafka',
    };
  }
}
