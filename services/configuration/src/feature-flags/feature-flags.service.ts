import { Injectable } from '@nestjs/common';

@Injectable()
export class FeatureFlagsService {
  private flags = new Map<string, any>();

  async getAll() {
    return Array.from(this.flags.entries()).map(([key, value]) => ({
      key,
      ...value,
    }));
  }

  async getByKey(key: string) {
    return this.flags.get(key) || null;
  }

  async create(data: any) {
    const { key, ...value } = data;
    this.flags.set(key, value);
    return { key, ...value };
  }

  async update(key: string, data: any) {
    if (!this.flags.has(key)) {
      throw new Error('Feature flag not found');
    }
    this.flags.set(key, data);
    return { key, ...data };
  }

  async delete(key: string) {
    return this.flags.delete(key);
  }
}