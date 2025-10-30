import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';

export interface GraphQLContext {
  req: Request;
  res: Response;
  tenantId: string;
  userId?: string;
  userRole?: string;
  correlationId: string;
  user?: any;
}

@Injectable()
export class ContextFactory {
  create(req: Request, res: Response): GraphQLContext {
    const tenantId = req.headers['x-tenant-id'] as string || 'default';
    const correlationId = (req.headers['x-correlation-id'] ||
                          req.headers['x-request-id'] ||
                          this.generateCorrelationId()) as string;

    return {
      req,
      res,
      tenantId,
      userId: req.user?.id,
      userRole: req.user?.role,
      correlationId,
      user: req.user,
    };
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}