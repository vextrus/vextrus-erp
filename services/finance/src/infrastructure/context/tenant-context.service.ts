import { Injectable, Scope } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId: string;
  userId?: string;
  correlationId?: string;
  dbSchema?: string;
}

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private static asyncLocalStorage = new AsyncLocalStorage<TenantContext>();

  static run<T>(context: TenantContext, fn: () => T): T {
    return this.asyncLocalStorage.run(context, fn);
  }

  static get(): TenantContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  static getTenantId(): string {
    const context = this.get();
    if (!context?.tenantId) {
      throw new Error('Tenant context not found');
    }
    return context.tenantId;
  }

  static getUserId(): string | undefined {
    return this.get()?.userId;
  }

  static getCorrelationId(): string | undefined {
    return this.get()?.correlationId;
  }

  static getDbSchema(): string {
    const context = this.get();
    return context?.dbSchema || `tenant_${context?.tenantId || 'default'}`;
  }

  private context: TenantContext | null = null;

  setContext(context: TenantContext): void {
    this.context = context;
    TenantContextService.run(context, () => {});
  }

  getTenantId(): string {
    if (!this.context?.tenantId) {
      throw new Error('Tenant ID not set in context');
    }
    return this.context.tenantId;
  }

  getUserId(): string | undefined {
    return this.context?.userId;
  }

  getCorrelationId(): string | undefined {
    return this.context?.correlationId;
  }

  getDbSchema(): string {
    return this.context?.dbSchema || `tenant_${this.context?.tenantId || 'default'}`;
  }

  getContext(): TenantContext {
    if (!this.context) {
      throw new Error('Tenant context not initialized');
    }
    return this.context;
  }
}