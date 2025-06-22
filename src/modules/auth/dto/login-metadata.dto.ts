import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginMetadataDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'test@test.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

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
  //   description: 'The OS of the user',
  //   example: 'ios',
  // })
  // @IsEnum(OS_TYPES)
  // @IsNotEmpty()
  // os: OS_TYPES;

  // @ApiProperty({
  //   description: 'The FCM token of the user',
  //   example: '1234567890',
  // })
  // @IsString()
  // @IsNotEmpty()
  // fcmToken: string;
}
