import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';

export class UserMetadataDto {
  @ApiProperty({
    example: 'test@example.com',
    description: 'The email address of the user',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 12.9716,
    description: 'The latitude of the user',
    required: false,
  })
  @IsNumber()
  latitude?: number;

  @ApiProperty({
    example: 77.5946,
    description: 'The longitude of the user',
    required: false,
  })
  @IsNumber()
  longitude?: number;
}
