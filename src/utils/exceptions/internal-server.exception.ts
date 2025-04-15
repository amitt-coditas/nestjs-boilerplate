import { HttpStatus } from '@nestjs/common';

import { AppException } from './app.exception';

export class InternalServerException extends AppException {
  constructor(message = 'Internal server error') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, 'INTERNAL_SERVER_ERROR');
  }
}
