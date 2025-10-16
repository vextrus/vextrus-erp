/**
 * Shared GraphQL Schema Types
 *
 * This package provides shared GraphQL types for use across all
 * Vextrus ERP federated microservices.
 *
 * @packageDocumentation
 */

// Pagination Types
export { PageInfo, Edge, Connection } from './types/pagination.types';

// Re-export commonly used decorators for convenience
export { ObjectType, Field, Directive } from '@nestjs/graphql';
