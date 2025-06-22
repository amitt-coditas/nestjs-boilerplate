import { SetMetadata } from '@nestjs/common';

import { ROLES } from '../../modules/role/constants/roles.enum';
import { PERMIT_ROLES_KEY } from '../constants/decorators.constant';

/**
 * Decorator that marks a route as public
 */
export const PermitRole = (...roles: ROLES[]) =>
  SetMetadata(PERMIT_ROLES_KEY, roles);
