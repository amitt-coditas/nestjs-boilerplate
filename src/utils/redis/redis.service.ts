import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

import { LoggerService } from '@utils/index';

@Injectable()
export class RedisService {
  private readonly logger: LoggerService;

  constructor(
    @Inject(forwardRef(() => 'REDIS')) private readonly redisClient: Redis,
  ) {
    this.logger = LoggerService.forClass(this.constructor.name);
  }

  /**
   * Checks if the Redis connection is healthy
   * @returns {Promise<boolean>} True if connection is healthy, false otherwise
   */
  async isHealthy(): Promise<boolean> {
    this.logger.debug(this.isHealthy.name, 'Checking Redis connection health');

    try {
      const ping = await this.redisClient.ping();
      return ping === 'PONG';
    } catch (error) {
      this.logger.error(
        this.isHealthy.name,
        'Redis health check failed',
        error,
      );
      return false;
    }
  }

  /**
   * Retrieves a value from Redis by key.
   * @param {string} key - The key to retrieve.
   * @returns {Promise<string | null>} The value associated with the key, or null if not found.
   */
  async get(key: string): Promise<string | null> {
    this.logger.debug(this.get.name, 'Getting value for key', { key });

    try {
      return await this.redisClient.get(key);
    } catch (error) {
      this.logger.throwServiceError(
        this.get.name,
        error,
        'Error getting value for key',
      );
    }
  }

  /**
   * Sets a key-value pair in Redis.
   * @param {string} key - The key to set.
   * @param {string} value - The value to set.
   * @returns {Promise<'OK'>} A promise that resolves to 'OK' if successful.
   */
  async set(key: string, value: string): Promise<'OK'> {
    this.logger.debug(this.set.name, 'Setting value for key', { key });

    try {
      return await this.redisClient.set(key, value);
    } catch (error) {
      this.logger.throwServiceError(
        this.set.name,
        error,
        'Error setting value for key',
      );
    }
  }

  /**
   * Sets a key-value pair in Redis with an expiration time.
   * @param {string} key - The key to set.
   * @param {string} value - The value to set.
   * @param {number} seconds - The expiration time in seconds.
   * @returns {Promise<'OK'>} A promise that resolves to 'OK' if successful.
   */
  async setex(key: string, value: string, seconds: number): Promise<'OK'> {
    this.logger.debug(this.setex.name, 'Setting value for key', {
      key,
      seconds,
    });

    try {
      return await this.redisClient.setex(key, seconds, value);
    } catch (error) {
      this.logger.throwServiceError(
        this.setex.name,
        error,
        'Error setting value with expiration for key',
      );
    }
  }

  /**
   * Deletes a key from Redis.
   * @param {string} key - The key to delete.
   * @returns {Promise<number>} A promise that resolves to the number of keys that were removed.
   */
  async del(key: string): Promise<number> {
    this.logger.debug(this.del.name, 'Deleting key', { key });

    try {
      return await this.redisClient.del(key);
    } catch (error) {
      this.logger.throwServiceError(
        this.del.name,
        error,
        'Failed to delete key',
      );
    }
  }

  /**
   * Retrieves the remaining time to live (TTL) of a key in seconds.
   * @param {string} key - The key to check.
   * @returns {Promise<number>} The TTL of the key in seconds.
   * Returns -2 if the key does not exist, and -1 if the key exists but has no associated expiration time.
   */
  async ttl(key: string): Promise<number> {
    this.logger.debug(this.ttl.name, 'Getting TTL for key', { key });

    try {
      return await this.redisClient.ttl(key);
    } catch (error) {
      this.logger.throwServiceError(
        this.ttl.name,
        error,
        'Failed to get TTL from Redis',
      );
    }
  }
}
