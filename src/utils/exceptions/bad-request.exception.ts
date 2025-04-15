import { HttpStatus } from '@nestjs/common';

import { AppException } from './app.exception';

export class BadRequestException extends AppException {
  constructor(message = 'Bad request') {
    super(message, HttpStatus.BAD_REQUEST, 'BAD_REQUEST');
  }
}
