import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateOtpDto {
  @ApiProperty({
    description: 'The email or phone of the user',
    example: 'test@example.com',
  })
  @IsNotEmpty()
  @IsString()
  emailOrPhone: string;
}

export class VerifySmsOtpDto {
  @ApiProperty({
    description: 'The phone number of the user',
    example: '+2348123456789',
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'The OTP to verify',
    example: '123456',
  })
  @IsNotEmpty()
  @IsString()
  otp: string;
}

export class VerifyEmailOtpDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'test@example.com',
  })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({
    description: 'The OTP to verify',
    example: '123456',
  })
  @IsNotEmpty()
  @IsString()
  otp: string;
}
