import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UserMetadataDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  location: string;
}
