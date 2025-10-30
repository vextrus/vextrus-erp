export interface ServiceMetadata {
  name: string;
  version: string;
  description?: string;
  endpoints: ServiceEndpoint[];
  dependencies?: string[];
  healthCheck?: string;
  tags?: string[];
}

export interface ServiceEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description?: string;
  version?: string;
  deprecated?: boolean;
}

export interface ServiceRegistration {
  id: string;
  instanceId: string;
  metadata: ServiceMetadata;
  host: string;
  port: number;
  protocol: 'http' | 'https' | 'grpc';
  registeredAt: Date;
  lastHeartbeat: Date;
  status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown';
}

export interface IServiceRegistry {
  /**
   * Register a service instance
   */
  register(registration: Omit<ServiceRegistration, 'id' | 'registeredAt' | 'lastHeartbeat'>): Promise<ServiceRegistration>;
  
  /**
   * Deregister a service instance
   */
  deregister(instanceId: string): Promise<void>;
  
  /**
   * Update service heartbeat
   */
  heartbeat(instanceId: string): Promise<void>;
  
  /**
   * Get all registered services
   */
  getServices(): Promise<ServiceRegistration[]>;
  
  /**
   * Get service by name
   */
  getServiceByName(name: string): Promise<ServiceRegistration[]>;
  
  /**
   * Get service by instance ID
   */
  getServiceById(instanceId: string): Promise<ServiceRegistration | null>;
  
  /**
   * Update service status
   */
  updateStatus(instanceId: string, status: ServiceRegistration['status']): Promise<void>;
}