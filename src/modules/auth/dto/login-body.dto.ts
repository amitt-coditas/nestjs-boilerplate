import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { LoginMetadataDto } from './login-metadata.dto';

export class LoginBodyDto extends LoginMetadataDto {
  @ApiProperty({
    description: 'The password of the user',
    example: 'password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class SSOLoginBodyDto extends LoginMetadataDto {
  @ApiProperty({
    description: 'The ID token from the Google login',
    example: '1234567890',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
