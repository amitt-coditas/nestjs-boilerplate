import { Module } from '@nestjs/common';

import { GlobalHttpExceptionFilter } from './http-exception.filter';

import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [LoggerModule],
  providers: [GlobalHttpExceptionFilter],
  exports: [GlobalHttpExceptionFilter],
})
export class HttpExceptionFilterModule {}
