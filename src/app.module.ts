import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from './utils/cache/cache.module';
import { DatabaseConfigModule } from './utils/database/database-config.module';
import { LoggerModule } from './utils/logger/logger.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    CacheModule,
    ScheduleModule.forRoot(),
    DatabaseConfigModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
