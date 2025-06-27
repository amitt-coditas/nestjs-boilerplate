import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';

import { OS_TYPES } from '@utils/index';

export class LoginMetadataDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'test@test.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'The OS of the user',
    example: 'ios',
  })
  @IsEnum(OS_TYPES)
  @IsNotEmpty()
  os: OS_TYPES;

  // For later authentication
  // @ApiProperty({
  //   description: 'The latitude of the user',
  //   example: 123.456,
  // })
  // @IsNumber()
  // @IsNotEmpty()
  // latitude: number;

  // @ApiProperty({
  //   description: 'The longitude of the user',
  //   example: 123.456,
  // })
  // @IsNumber()
  // @IsNotEmpty()
  // longitude: number;

  // @ApiProperty({
  //   description: 'The device ID of the user',
  //   example: '1234567890',
  // })
  // @IsString()
  // @IsNotEmpty()
  // deviceId: string;

  // @ApiProperty({
  //   description: 'The FCM token of the user',
  //   example: '1234567890',
  // })
  // @IsString()
  // @IsNotEmpty()
  // fcmToken: string;
}
