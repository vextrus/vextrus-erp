export type HealthStatus = 'healthy' | 'unhealthy' | 'degraded';

export interface HealthCheckResult {
  status: HealthStatus;
  message?: string;
  timestamp: Date;
  duration?: number;
  details?: Record<string, any>;
}

export interface ComponentHealth {
  name: string;
  status: HealthStatus;
  message?: string;
  responseTime?: number;
  lastChecked: Date;
  metadata?: Record<string, any>;
}

export interface SystemHealth {
  status: HealthStatus;
  version: string;
  uptime: number;
  timestamp: Date;
  components: ComponentHealth[];
  metrics?: {
    cpu?: number;
    memory?: number;
    diskSpace?: number;
    requestsPerSecond?: number;
    errorRate?: number;
  };
}

export interface IHealthCheck {
  /**
   * Perform health check
   */
  check(): Promise<HealthCheckResult>;
  
  /**
   * Get detailed system health
   */
  getSystemHealth(): Promise<SystemHealth>;
  
  /**
   * Check specific component health
   */
  checkComponent(componentName: string): Promise<ComponentHealth>;
  
  /**
   * Register health check handler
   */
  registerCheck(name: string, handler: () => Promise<HealthCheckResult>): void;
  
  /**
   * Unregister health check handler
   */
  unregisterCheck(name: string): void;
  
  /**
   * Check if system is ready to handle requests
   */
  isReady(): Promise<boolean>;
  
  /**
   * Check if system is alive (basic health)
   */
  isAlive(): Promise<boolean>;
}

export interface IHealthIndicator {
  /**
   * Get health indicator name
   */
  getName(): string;
  
  /**
   * Check health status
   */
  checkHealth(): Promise<ComponentHealth>;
  
  /**
   * Get health indicator priority (lower = higher priority)
   */
  getPriority(): number;
  
  /**
   * Check if indicator is critical
   */
  isCritical(): boolean;
}