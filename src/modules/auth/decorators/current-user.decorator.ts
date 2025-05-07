import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { User } from '../../user/entities/user.entity';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User => {
    return context.switchToHttp().getRequest<Request & { user: User }>().user;
  },
);
