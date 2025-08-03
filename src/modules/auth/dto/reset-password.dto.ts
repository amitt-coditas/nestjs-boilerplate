import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { IsPassword } from '@utils/decorators';

import { GeneratePasswordDto } from './generate-password.dto';

export class ResetForgotPasswordDto extends GeneratePasswordDto {}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'The old password of the user',
    example: 'OldPassword@123',
  })
  @IsNotEmpty()
  @IsString()
  oldPassword: string;

  @ApiProperty({
    description: 'The new password of the user',
    example: 'NewPassword@123',
  })
  @IsNotEmpty()
  @IsPassword()
  newPassword: string;
}
