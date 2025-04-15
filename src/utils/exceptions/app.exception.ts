import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus,
    errorCode = 'APP_EXCEPTION',
  ) {
    super({ message, errorCode, statusCode }, statusCode);
  }
}
