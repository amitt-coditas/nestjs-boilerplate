import { ROLES } from '../../role/constants/roles.enum';

export class TokenPayloadDto {
  email: string;
  userId: string;
  role: ROLES;
}
