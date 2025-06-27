import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateAccessTokenByRefreshTokenDto {
  @ApiProperty({
    description: 'The refresh token',
    example: '1234567890',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
