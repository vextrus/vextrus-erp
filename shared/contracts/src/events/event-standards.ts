export enum EventVersion {
  V1 = 'v1',
  V2 = 'v2',
  V3 = 'v3'
}

export enum EventPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

export enum EventCategory {
  COMMAND = 'command',
  DOMAIN = 'domain',
  INTEGRATION = 'integration',
  SYSTEM = 'system',
  AUDIT = 'audit'
}

export interface EventNaming {
  /**
   * Domain events: <Aggregate>.<Action>
   * Example: User.Created, Order.Placed
   */
  domain: string;
  
  /**
   * Integration events: <Service>.<Entity>.<Action>
   * Example: Auth.User.Registered, Inventory.Stock.Updated
   */
  integration: string;
  
  /**
   * System events: System.<Component>.<Action>
   * Example: System.Database.Connected, System.Cache.Cleared
   */
  system: string;
}

export class EventVersioning {
  /**
   * Check if event version is compatible
   */
  static isCompatible(required: string, provided: string): boolean {
    const requiredParts = required.replace('v', '').split('.');
    const providedParts = provided.replace('v', '').split('.');
    
    // Major version must match
    if (requiredParts[0] !== providedParts[0]) {
      return false;
    }
    
    // Minor version of provided must be >= required
    if (providedParts[1] && requiredParts[1]) {
      return parseInt(providedParts[1]) >= parseInt(requiredParts[1]);
    }
    
    return true;
  }
  
  /**
   * Get next version
   */
  static getNextVersion(currentVersion: string, versionType: 'major' | 'minor' | 'patch'): string {
    const parts = currentVersion.replace('v', '').split('.').map(Number);
    
    switch (versionType) {
      case 'major':
        return `v${(parts[0] || 0) + 1}.0.0`;
      case 'minor':
        return `v${parts[0] || 0}.${(parts[1] || 0) + 1}.0`;
      case 'patch':
        return `v${parts[0] || 0}.${parts[1] || 0}.${(parts[2] || 0) + 1}`;
    }
  }
}

export interface EventSchema {
  version: string;
  schema: Record<string, any>;
  deprecated?: boolean;
  migrationPath?: string;
}

export interface EventContract {
  eventType: string;
  category: EventCategory;
  schemas: EventSchema[];
  description: string;
  producers: string[];
  consumers: string[];
  sla?: {
    maxProcessingTime?: number;
    retentionDays?: number;
    priority?: EventPriority;
  };
}