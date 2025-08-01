import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'The email or phone of the user',
    example: 'test@example.com',
  })
  @IsNotEmpty()
  @IsString()
  emailOrPhone: string;
}
