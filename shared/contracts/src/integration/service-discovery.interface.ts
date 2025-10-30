export interface ServiceInstance {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: 'http' | 'https' | 'grpc';
  version: string;
  metadata?: Record<string, any>;
  weight?: number;
  healthy: boolean;
}

export interface DiscoveryOptions {
  version?: string;
  tags?: string[];
  loadBalancing?: 'round-robin' | 'random' | 'weighted' | 'least-connections';
  onlyHealthy?: boolean;
  timeout?: number;
}

export interface IServiceDiscovery {
  /**
   * Discover service instances by name
   */
  discover(serviceName: string, options?: DiscoveryOptions): Promise<ServiceInstance[]>;
  
  /**
   * Get a single service instance (with load balancing)
   */
  pickInstance(serviceName: string, options?: DiscoveryOptions): Promise<ServiceInstance | null>;
  
  /**
   * Watch for service changes
   */
  watch(serviceName: string, callback: (instances: ServiceInstance[]) => void): () => void;
  
  /**
   * Get service endpoint URL
   */
  getServiceUrl(serviceName: string, path?: string, options?: DiscoveryOptions): Promise<string | null>;
  
  /**
   * Check if service is available
   */
  isServiceAvailable(serviceName: string): Promise<boolean>;
  
  /**
   * Get all available services
   */
  listServices(): Promise<string[]>;
  
  /**
   * Refresh service cache
   */
  refresh(): Promise<void>;
}