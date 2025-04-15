import { HttpStatus } from '@nestjs/common';

import { AppException } from './app.exception';

export class NotFoundException extends AppException {
  constructor(resource: string = 'Resource') {
    const message = `${resource} not found`;
    super(message, HttpStatus.NOT_FOUND, 'NOT_FOUND');
  }
}
