import { Module } from '@nestjs/common';

import { GlobalHttpExceptionFilter } from './http-exception.filter';

@Module({
  providers: [GlobalHttpExceptionFilter],
  exports: [GlobalHttpExceptionFilter],
})
export class HttpExceptionFilterModule {}
