import { SetMetadata } from '@nestjs/common';

import { ROLES } from '../../role/constants/roles.enum';
import { PERMIT_ROLES_KEY } from '../constants/decorators.constant';

export const PermitRole = (...roles: ROLES[]) =>
  SetMetadata(PERMIT_ROLES_KEY, roles);
