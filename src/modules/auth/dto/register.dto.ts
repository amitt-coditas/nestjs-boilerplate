import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { GeneratePasswordDto } from './generate-password.dto';

export class RegisterRequestDto extends GeneratePasswordDto {
  @ApiProperty({
    description: 'The first name of the user',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  fname: string;

  @ApiProperty({
    description: 'The last name of the user',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  lname: string;

  @ApiProperty({
    description: 'The email or phone number of the user',
    example: '+919876543210',
  })
  @IsString()
  @IsNotEmpty()
  emailOrPhone: string;
}

export class RegisterAfterSocialLoginRequestDto extends OmitType(
  RegisterRequestDto,
  ['password'],
) {}

export class RegisterResponseDto {
  userId: string;
  phone: string;
  phoneVerified: boolean;
  email: string;
  emailVerified: boolean;
}
