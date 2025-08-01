import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

import { AWSModule } from '@utils/aws/aws.module';
import {
  DatabaseConfigModule,
  LoggerModule,
  HttpExceptionFilterModule,
  RedisModule,
  ConfigModule,
  CacheModule,
  SwaggerSetupService,
  TwilioModule,
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
    EventEmitterModule.forRoot(),
    DatabaseConfigModule,
    HttpExceptionFilterModule,
    RedisModule,
    AWSModule,
    TwilioModule,

    // Modules
    RoleModule,
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    SwaggerSetupService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
  ],
})
export class AppModule {}
