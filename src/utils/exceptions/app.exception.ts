import { HttpException, HttpStatus } from '@nestjs/common';

import { ValidationFieldError } from '../types/app.types';

export class AppException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus,
    errorCode = 'APP_EXCEPTION',
    errors?: ValidationFieldError[],
  ) {
    super(
      {
        message,
        errorCode,
        statusCode,
        errors,
      },
      statusCode,
    );
  }
}
