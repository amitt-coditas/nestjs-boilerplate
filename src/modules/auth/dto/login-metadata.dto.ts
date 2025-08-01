import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';

import { OS_TYPES } from '@utils/index';

import { LOGIN_TYPE } from '../constants/login-type.enum';

export class LoginMetadataDto {
  @ApiProperty({
    description: 'The login type',
    example: LOGIN_TYPE.GOOGLE,
  })
  @IsEnum(LOGIN_TYPE)
  @IsNotEmpty()
  loginType: LOGIN_TYPE;

  @ApiProperty({
    description: 'The latitude of the user',
    example: 123.456,
  })
  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @ApiProperty({
    description: 'The longitude of the user',
    example: 123.456,
  })
  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @ApiProperty({
    description: 'The device ID of the user',
    example: '1234567890',
  })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({
    description: 'The OS of the user',
    example: 'ios',
  })
  @IsEnum(OS_TYPES)
  @IsNotEmpty()
  os: OS_TYPES;

  // @ApiProperty({
  //   description: 'The FCM token of the user',
  //   example: '1234567890',
  // })
  // @IsString()
  // @IsNotEmpty()
  // fcmToken: string;
}
