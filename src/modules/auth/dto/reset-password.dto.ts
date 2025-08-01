import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResetForgotPasswordDto {
  @ApiProperty({
    description: 'The new password of the user',
    example: 'password',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'The old password of the user',
    example: 'password',
  })
  @IsNotEmpty()
  @IsString()
  oldPassword: string;

  @ApiProperty({
    description: 'The new password of the user',
    example: 'password',
  })
  @IsNotEmpty()
  @IsString()
  newPassword: string;
}
