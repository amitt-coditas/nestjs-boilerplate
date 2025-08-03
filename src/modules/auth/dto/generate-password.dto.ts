import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

import { IsPassword } from '@utils/decorators';

export class GeneratePasswordDto {
  @ApiProperty({
    description: 'Password for the account',
    example: 'Password@123',
  })
  @IsNotEmpty()
  @IsPassword()
  password: string;
}
