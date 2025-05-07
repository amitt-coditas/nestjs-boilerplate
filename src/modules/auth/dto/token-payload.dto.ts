import { IsEmail, IsEnum, IsString } from 'class-validator';

import { ROLES } from '../../role/constants/roles.enum';

export class TokenPayloadDto {
  @IsEmail()
  email!: string;

  @IsString()
  userId!: string;

  @IsEnum(ROLES)
  role!: ROLES;
}
