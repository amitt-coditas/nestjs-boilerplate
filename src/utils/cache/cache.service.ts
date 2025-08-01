import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { CACHE_KEYS } from '../constants/app.constant';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get data from cache
   * @param key - The key to get the data from
   * @returns The data from cache
   */
  async get<T>(key: CACHE_KEYS): Promise<T | null> {
    return await this.cacheManager.get<T>(key);
  }

  /**
   * Set data in cache
   * @param key - The key to set the data in
   * @param value - The value to set in cache
   */
  async set<T>(key: CACHE_KEYS, value: T, ttl = 0): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  /**
   * Get data from cache or set it if it doesn't exist
   * @param key - The key to get the data from
   * @param fn - The function to get the data from
   * @param ttl - The time to live for the data
   * @returns The data from cache or the data from the function
   */
  async getOrSet<T>(
    key: CACHE_KEYS,
    fn: () => Promise<T>,
    ttl = 0,
  ): Promise<T> {
    const cachedData = await this.get<T>(key);

    if (cachedData) return cachedData;

    const item = await fn();
    await this.set(key, item, ttl);
    return item;
  }

  /**
   * Delete data from cache
   * @param key - The key to delete the data from
   */
  async delete(key: CACHE_KEYS): Promise<boolean> {
    return await this.cacheManager.del(key);
  }

  /**
   * Reset the cache
   */
  async reset(): Promise<boolean> {
    return await this.cacheManager.clear();
  }
}
