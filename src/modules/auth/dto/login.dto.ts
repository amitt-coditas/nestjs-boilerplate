import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { LoginMetadataDto } from './login-metadata.dto';

import { LOGIN_TYPE } from '../constants/login-type.enum';

export class LoginRequestDto extends OmitType(LoginMetadataDto, ['loginType']) {
  @ApiProperty({
    description: 'The email of the user',
    example: 'test@test.com',
  })
  @IsEmail()
  @IsNotEmpty()
  emailOrPhone: string;

  @ApiProperty({
    description: 'The password of the user',
    example: 'password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
export class LoginBodyDto extends OmitType(LoginRequestDto, [
  'os',
  'deviceId',
]) {}

export class SocialLoginRequestDto extends LoginMetadataDto {
  @ApiProperty({
    description: 'The ID token from the social login provider',
    example: '1234567890',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;

  @ApiProperty({
    description: 'The login type',
    example: LOGIN_TYPE.GOOGLE,
  })
  @IsEnum(LOGIN_TYPE)
  @IsNotEmpty()
  loginType: LOGIN_TYPE;
}

export class SocialLoginBodyDto extends OmitType(SocialLoginRequestDto, [
  'os',
  'deviceId',
]) {}

export class LoginResponseDto {
  accessToken: string;
  accessTokenExpiry: Date;
  refreshToken: string;
  refreshTokenExpiry: Date;
}
