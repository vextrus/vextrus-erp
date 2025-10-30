import { Request } from 'express';

declare module 'express' {
  export interface Request {
    user?: any;
    userId?: string;
    userRole?: string;
    tenantId?: string;
  }
}