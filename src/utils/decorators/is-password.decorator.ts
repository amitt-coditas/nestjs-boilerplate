import { applyDecorators } from '@nestjs/common';
import { IsString, MaxLength, Matches, MinLength } from 'class-validator';

export const IsPassword = () =>
  applyDecorators(
    IsString({ message: 'Password must be a string' }),
    MinLength(8, { message: 'Password must be at least 8 characters long' }),
    MaxLength(128, { message: 'Password must be at most 128 characters long' }),
    Matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/,
      {
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      },
    ),
  );
