import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginBodyDto {
  @IsEmail()
  email?: string;

  @IsString()
  phone?: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
