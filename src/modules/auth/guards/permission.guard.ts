import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PERMIT_ROLES_KEY } from '@utils/index';

import { ROLES } from '../../role/constants/roles.enum';
import { User } from '../../user/entities/user.entity';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    const role = this.reflector.get<ROLES[]>(
      PERMIT_ROLES_KEY,
      context.getHandler(),
    );

    if (!role || role.length === 0) {
      return true;
    }

    const user = context
      .switchToHttp()
      .getRequest<Request & { user: User }>().user;
    return user.role.name && role.includes(user.role.name);
  }
}
