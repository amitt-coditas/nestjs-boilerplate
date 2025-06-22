export enum OS_TYPES {
  ANDROID = 'android',
  IOS = 'ios',
  WEB = 'web',
}

export enum TIMEZONE {
  AMERICA_NEW_YORK = 'America/New_York',
  AMERICA_LOS_ANGELES = 'America/Los_Angeles',
  UTC = 'UTC',
  ASIA_KOLKATA = 'Asia/Kolkata',
}

export enum CACHE_KEYS {
  TEST_IDS = 'test_ids',
}

export enum EVENTS {
  REDIS_KEY_EVENT_EXPIRED = '__keyevent@0__:expired',
  REDIS_KEY_EVENT_DEL = '__keyevent@0__:del',

  REDIS_KEY_EXPIRED = 'redis.key.expired',
}

export enum SORTING_ORDER_ENUM {
  ASC = 'ASC',
  DESC = 'DESC',
}
