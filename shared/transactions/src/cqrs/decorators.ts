import { ICommand, ICommandHandler } from './command.interface';
import { IQuery, IQueryHandler } from './query.interface';

/**
 * Command handler decorator
 */
export function CommandHandler(commandType: string) {
  return function (target: any) {
    Reflect.defineMetadata('command:type', commandType, target);
    Reflect.defineMetadata('handler:type', 'command', target);
  };
}

/**
 * Query handler decorator
 */
export function QueryHandler(queryType: string) {
  return function (target: any) {
    Reflect.defineMetadata('query:type', queryType, target);
    Reflect.defineMetadata('handler:type', 'query', target);
  };
}

/**
 * Command decorator
 */
export function Command(metadata?: Record<string, any>) {
  return function (target: any) {
    Reflect.defineMetadata('command:metadata', metadata || {}, target);
  };
}

/**
 * Query decorator
 */
export function Query(metadata?: Record<string, any>) {
  return function (target: any) {
    Reflect.defineMetadata('query:metadata', metadata || {}, target);
  };
}

/**
 * Event handler decorator
 */
export function EventHandler(eventType: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const eventHandlers = Reflect.getMetadata('event:handlers', target) || [];
    eventHandlers.push({ eventType, method: propertyKey });
    Reflect.defineMetadata('event:handlers', eventHandlers, target);
  };
}

/**
 * Transactional decorator
 */
export function Transactional(options?: { isolationLevel?: string }) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const transaction = await (this as any).beginTransaction?.(options);
      
      try {
        const result = await originalMethod.apply(this, args);
        await transaction?.commit();
        return result;
      } catch (error) {
        await transaction?.rollback();
        throw error;
      }
    };
    
    return descriptor;
  };
}

/**
 * Retry decorator
 */
export function Retry(options?: { attempts?: number; delay?: number }) {
  const attempts = options?.attempts || 3;
  const delay = options?.delay || 1000;
  
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      let lastError: any;
      
      for (let i = 0; i < attempts; i++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error;
          if (i < attempts - 1) {
            await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
          }
        }
      }
      
      throw lastError;
    };
    
    return descriptor;
  };
}

/**
 * Cache decorator
 */
export function Cache(options?: { ttl?: number; key?: string }) {
  const ttl = options?.ttl || 60000;
  const cache = new Map<string, { value: any; timestamp: number }>();
  
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = options?.key || `${propertyKey}:${JSON.stringify(args)}`;
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.value;
      }
      
      const result = await originalMethod.apply(this, args);
      cache.set(cacheKey, { value: result, timestamp: Date.now() });
      return result;
    };
    
    return descriptor;
  };
}