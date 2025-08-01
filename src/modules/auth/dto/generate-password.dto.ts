import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GeneratePasswordDto {
  @ApiProperty({ description: 'The password to generate' })
  @IsNotEmpty()
  @IsString()
  password: string;
}
