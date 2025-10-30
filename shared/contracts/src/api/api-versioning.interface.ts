export interface ApiVersion {
  version: string;
  releaseDate: Date;
  deprecationDate?: Date;
  sunsetDate?: Date;
  changes?: VersionChange[];
  supported: boolean;
}

export interface VersionChange {
  type: 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security';
  description: string;
  breaking?: boolean;
  migration?: string;
}

export interface ApiVersioning {
  current: string;
  supported: string[];
  deprecated: string[];
  sunset: string[];
  latest: string;
  minimum: string;
}

export interface VersionedEndpoint {
  path: string;
  method: string;
  versions: EndpointVersion[];
}

export interface EndpointVersion {
  version: string;
  handler: string;
  requestSchema?: any;
  responseSchema?: any;
  deprecated?: boolean;
  documentation?: string;
}

export interface IApiVersionManager {
  /**
   * Get current API version
   */
  getCurrentVersion(): string;
  
  /**
   * Get all supported versions
   */
  getSupportedVersions(): string[];
  
  /**
   * Check if version is supported
   */
  isVersionSupported(version: string): boolean;
  
  /**
   * Get version information
   */
  getVersionInfo(version: string): ApiVersion | null;
  
  /**
   * Get migration path between versions
   */
  getMigrationPath(fromVersion: string, toVersion: string): VersionChange[];
  
  /**
   * Register new version
   */
  registerVersion(version: ApiVersion): void;
  
  /**
   * Deprecate version
   */
  deprecateVersion(version: string, deprecationDate: Date, sunsetDate?: Date): void;
}

export class ApiVersionHelper {
  /**
   * Parse version from request header or URL
   */
  static parseVersion(input: string): string | null {
    // Accept-Version: v1, v2, v1.0, v2.1
    const versionMatch = input.match(/v(\d+)(?:\.(\d+))?/);
    return versionMatch ? versionMatch[0] : null;
  }
  
  /**
   * Compare versions
   */
  static compareVersions(v1: string, v2: string): number {
    const parse = (v: string) => {
      const parts = v.replace('v', '').split('.').map(Number);
      return (parts[0] || 0) * 1000 + (parts[1] || 0);
    };
    
    const version1 = parse(v1);
    const version2 = parse(v2);
    
    return version1 - version2;
  }
  
  /**
   * Check if version is in range
   */
  static isInRange(version: string, min: string, max: string): boolean {
    return this.compareVersions(version, min) >= 0 && 
           this.compareVersions(version, max) <= 0;
  }
  
  /**
   * Get version from headers
   */
  static getVersionFromHeaders(headers: Record<string, string>): string | null {
    return headers['accept-version'] || 
           headers['api-version'] || 
           headers['x-api-version'] || 
           null;
  }
}