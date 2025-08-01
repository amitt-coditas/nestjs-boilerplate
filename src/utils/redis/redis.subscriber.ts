import { forwardRef, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Redis from 'ioredis';

import { LoggerService } from '@utils/index';

@Injectable()
export class RedisSubscriber implements OnModuleInit {
  private readonly logger: LoggerService;

  constructor(
    @Inject(forwardRef(() => 'REDIS'))
    private readonly redisClient: Redis,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger = LoggerService.forClass(this.constructor.name);
  }

  onModuleInit() {
    // this.logger.debug(this.onModuleInit.name, 'Initializing Redis subscriber');
    // For later use
    // try {
    //   await this.redisClient.config(
    //     'SET',
    //     'notify-keyspace-events',
    //     'Ex',
    //     (err) => {
    //       if (err) {
    //         this.logger.error(
    //           this.onModuleInit.name,
    //           'Error setting notify-keyspace-events',
    //           err,
    //         );
    //       }
    //     },
    //   );
    //   await this.redisClient.subscribe(
    //     EVENTS.REDIS_KEY_EVENT_EXPIRED,
    //     (err) => {
    //       if (err) {
    //         this.logger.error(
    //           this.onModuleInit.name,
    //           'Error subscribing to expired key event',
    //           err,
    //         );
    //       }
    //     },
    //   );
    //   this.redisClient.on('message', (channel, message) => {
    //     this.logger.debug(
    //       this.onModuleInit.name,
    //       'Received message from channel',
    //       { channel, message },
    //     );
    //     this.eventEmitter.emit(EVENTS.REDIS_KEY_EXPIRED, { key: message });
    //   });
    // } catch (error) {
    //   this.logger.error(
    //     this.onModuleInit.name,
    //     'Error initializing Redis subscriber',
    //     error,
    //   );
    // }
  }
}
