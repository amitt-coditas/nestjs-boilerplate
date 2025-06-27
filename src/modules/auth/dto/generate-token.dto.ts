import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { LoginMetadataDto } from './login-metadata.dto';

import { SSO_TYPES } from '../constants/sso-type.enum';

export class GenerateTokenDto extends LoginMetadataDto {
  @ApiProperty({
    description: 'The SSO type of the user',
    example: SSO_TYPES.GOOGLE,
  })
  @IsEnum(SSO_TYPES)
  @IsOptional()
  ssoType?: SSO_TYPES;

  @ApiProperty({
    description: 'The SSO ID of the user',
    example: '1234567890',
  })
  @IsString()
  @IsOptional()
  ssoId?: string;
}
