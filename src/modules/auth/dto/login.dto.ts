import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { OS_TYPES } from '@utils/index';

import { LoginBodyDto } from './login-body.dto';

export class LoginDto extends LoginBodyDto {
  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsEnum(OS_TYPES)
  @IsNotEmpty()
  os: OS_TYPES;

  @IsString()
  @IsNotEmpty()
  fcmToken: string;
}
