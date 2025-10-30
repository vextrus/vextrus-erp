import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export interface CurrentUserContext {
  id: string;
  userId: string;        // Alias for id for clarity
  tenantId: string;      // Required for multi-tenancy
  email?: string;
  username?: string;
  organizationId?: string;
  role?: string;
}

/**
 * Decorator to extract authenticated user from GraphQL or HTTP context
 *
 * Usage in GraphQL resolver:
 * @Query(() => Invoice)
 * @UseGuards(JwtAuthGuard)
 * async myInvoices(@CurrentUser() user: CurrentUserContext) {
 *   return this.invoiceService.findByUserId(user.id);
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): CurrentUserContext => {
    const type = context.getType();

    if (type === 'http') {
      const request = context.switchToHttp().getRequest();
      return request.user;
    } else {
      // GraphQL context
      const ctx = GqlExecutionContext.create(context);
      const request = ctx.getContext().req;
      return request.user;
    }
  },
);
