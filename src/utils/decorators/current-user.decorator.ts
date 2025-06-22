import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { User } from '../../modules/user/entities/user.entity';

/**
 * Decorator that injects the current user into the request object
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User => {
    return context.switchToHttp().getRequest<Request & { user: User }>().user;
  },
);
