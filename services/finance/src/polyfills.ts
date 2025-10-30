/**
 * Polyfills for Node.js built-in modules
 * Required for @nestjs/graphql which expects crypto as a global
 */
import * as crypto from 'crypto';

// Make crypto available globally for @nestjs/graphql
if (typeof (globalThis as any).crypto === 'undefined') {
  (globalThis as any).crypto = crypto;
}