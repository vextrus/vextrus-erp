import { Injectable } from '@nestjs/common';

@Injectable()
export class TenantConfigService {
  private configs = new Map<string, any>();

  async getConfig(tenantId: string) {
    return this.configs.get(tenantId) || {};
  }

  async setConfig(tenantId: string, config: any) {
    this.configs.set(tenantId, config);
    return config;
  }
}
