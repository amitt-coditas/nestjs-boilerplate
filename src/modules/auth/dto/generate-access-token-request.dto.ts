import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { LoginResponseDto } from './login.dto';

export class GenerateAccessTokenRequestDto {
  @ApiProperty({
    description: 'The refresh token',
    example: '1234567890',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class GenerateAccessTokenResponseDto extends OmitType(LoginResponseDto, [
  'refreshToken',
  'refreshTokenExpiry',
]) {}
