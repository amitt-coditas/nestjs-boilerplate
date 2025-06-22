import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'The first name of the user',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  fname: string;

  @ApiProperty({
    description: 'The last name of the user',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  lname: string;

  @ApiProperty({
    description: 'The phone number of the user',
    example: '+919876543210',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'The email of the user',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'The password of the user',
    example: 'password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
