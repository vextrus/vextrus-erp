import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export interface CurrentUserContext {
  id: string;
  email?: string;
  username?: string;
  organizationId?: string;
}

/**
 * Decorator to extract current authenticated user from GraphQL context
 *
 * Usage in resolver:
 * @Query()
 * @UseGuards(GqlAuthGuard)
 * async me(@CurrentUser() user: CurrentUserContext) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): CurrentUserContext => {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    return request.user;
  },
);
