import { Injectable, NestMiddleware, BadRequestException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface TenantRequest extends Request {
  tenantId: string;
  tenantContext?: {
    id: string;
    name?: string;
    dbSchema?: string;
  };
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  use(req: TenantRequest, res: Response, next: NextFunction) {
    const tenantId = this.extractTenantId(req);

    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }

    if (!this.isValidTenantId(tenantId)) {
      throw new BadRequestException('Invalid Tenant ID format');
    }

    req.tenantId = tenantId;
    req.tenantContext = {
      id: tenantId,
      dbSchema: `tenant_${tenantId}`,
    };

    this.logger.debug(`Processing request for tenant: ${tenantId}`);

    next();
  }

  private extractTenantId(req: Request): string | undefined {
    // Check multiple sources for tenant ID
    return (
      req.headers['x-tenant-id'] as string ||
      req.headers['tenant-id'] as string ||
      req.query['tenantId'] as string ||
      req.body?.tenantId ||
      process.env.DEFAULT_TENANT_ID
    );
  }

  private isValidTenantId(tenantId: string): boolean {
    // Validate tenant ID format (alphanumeric with hyphens, 3-50 chars)
    const tenantIdPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{2,49}$/;
    return tenantIdPattern.test(tenantId);
  }
}