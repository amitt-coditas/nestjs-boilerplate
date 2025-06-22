import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LoggerService } from './logger.service';

@Global()
@Module({
  providers: [
    {
      provide: LoggerService,
      useFactory: (configService: ConfigService) => {
        return new LoggerService(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: [LoggerService],
})
export class LoggerModule {}
