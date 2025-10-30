/**
 * Shared GraphQL Schema Types
 *
 * This package provides shared GraphQL types for use across all
 * Vextrus ERP federated microservices.
 *
 * @packageDocumentation
 */

// Pagination Types
export { PageInfo } from './types/pagination.types.js';
export type { Edge, Connection } from './types/pagination.types.js';

// Re-export commonly used decorators for convenience
export { ObjectType, Field, Directive } from '@nestjs/graphql';
