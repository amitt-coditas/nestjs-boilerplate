import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class SendEmailSupportRequestDto {
  @ApiProperty({
    description: 'The email address of the user',
    example: 'test@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The body of the email',
    example: 'This is a test email',
  })
  @IsNotEmpty()
  @IsString()
  body: string;
}
