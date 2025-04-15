import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import {
  CacheModule,
  ConfigModule,
  DatabaseConfigModule,
  LoggerModule,
  HttpExceptionFilterModule,
} from '../utils';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    CacheModule,
    ScheduleModule.forRoot(),
    DatabaseConfigModule,
    HttpExceptionFilterModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
