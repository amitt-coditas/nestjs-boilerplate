import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import { RedisService } from './redis.service';

@Module({
  providers: [
    {
      provide: 'REDIS',
      inject: [ConfigService],
      useFactory: () => {
        const redis = new Redis({
          // host: configService.getOrThrow<string>(ENV_KEYS.REDIS_HOST),
          // port: +configService.getOrThrow<string>(ENV_KEYS.REDIS_PORT),
          // username: configService.get<string>(ENV_KEYS.REDIS_USERNAME),
          // password: configService.get<string>(ENV_KEYS.REDIS_PASSWORD),
          connectTimeout: 10000,
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 1000, 5000);
            return delay;
          },
          maxRetriesPerRequest: 3,
        });

        return redis;
      },
    },
    RedisService,
  ],
  exports: ['REDIS', RedisService],
})
export class RedisModule {}
