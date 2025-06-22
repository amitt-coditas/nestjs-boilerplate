import { HttpStatus } from '@nestjs/common';

import { AppException } from './app.exception';

import { ValidationFieldError } from '../types/app.types';

export class ValidationException extends AppException {
  constructor(errors: ValidationFieldError[]) {
    super(
      'Validation failed',
      HttpStatus.BAD_REQUEST,
      'VALIDATION_ERROR',
      errors,
    );
  }
}
