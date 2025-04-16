import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { RoleModule } from '../modules/role/role.module';
import { UserModule } from '../modules/user/user.module';
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
    RoleModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
