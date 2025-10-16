import { ObjectType, Field, Directive } from '@nestjs/graphql';

/**
 * PageInfo Type - Shared across all federated services
 *
 * This type is marked with @shareable directive to allow multiple
 * services to use the same pagination structure in their connection types.
 *
 * Used by: audit, configuration, import-export, notification, and other services
 * implementing cursor-based pagination.
 */
@ObjectType()
@Directive('@shareable')
export class PageInfo {
  @Field(() => Boolean, {
    description: 'Indicates whether more edges exist following the set defined by the clients arguments',
  })
  hasNextPage: boolean;

  @Field(() => Boolean, {
    description: 'Indicates whether more edges exist prior to the set defined by the clients arguments',
  })
  hasPreviousPage: boolean;

  @Field(() => String, {
    nullable: true,
    description: 'The cursor corresponding to the first node in edges',
  })
  startCursor?: string;

  @Field(() => String, {
    nullable: true,
    description: 'The cursor corresponding to the last node in edges',
  })
  endCursor?: string;
}

/**
 * Generic Edge Type Interface
 *
 * Services can extend this to create their own edge types
 */
export interface Edge<T> {
  cursor: string;
  node: T;
}

/**
 * Generic Connection Type Interface
 *
 * Services can extend this to create their own connection types
 */
export interface Connection<T> {
  edges: Edge<T>[];
  pageInfo: PageInfo;
  totalCount?: number;
}
