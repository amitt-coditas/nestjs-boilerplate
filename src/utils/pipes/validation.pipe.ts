import {
  Injectable,
  ValidationPipe as NestValidationPipe,
  ValidationError,
} from '@nestjs/common';

import { ValidationException } from '../exceptions/';
import { ValidationFieldError } from '../types/app.types';

@Injectable()
export class CustomValidationPipe extends NestValidationPipe {
  constructor() {
    super({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors: ValidationError[]): ValidationException => {
        const formattedErrors: ValidationFieldError[] = errors.map((err) => ({
          field: err.property,
          errors: Object.values(err.constraints || {}),
        }));
        return new ValidationException(formattedErrors);
      },
    });
  }
}
