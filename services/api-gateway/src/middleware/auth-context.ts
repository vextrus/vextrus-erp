export interface AuthContext {
  token?: string;
  tenantId?: string;
  userId?: string;
  roles?: string[];
  headers: Record<string, any>;
}