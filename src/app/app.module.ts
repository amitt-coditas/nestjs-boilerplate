import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import {
  CacheModule,
  ConfigModule,
  DatabaseConfigModule,
  LoggerModule,
  HttpExceptionFilterModule,
} from '@utils/index';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from '../modules/auth/auth.module';
import { JwtAuthGuard, PermissionGuard } from '../modules/auth/guards';
import { RoleModule } from '../modules/role/role.module';
import { UserModule } from '../modules/user/user.module';

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
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
  ],
})
export class AppModule {}
