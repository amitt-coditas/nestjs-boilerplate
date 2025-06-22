import { join } from 'path';

import { ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';

import { ENV_KEYS, NODE_ENV } from '../config/config.module';

export const createOrmConfig = (
  configService: ConfigService,
): DataSourceOptions => {
  const env = configService.get<string>(ENV_KEYS.NODE_ENV) || 'dev';
  const envIsDevLocal = env === 'dev-local';

  const migrationsDir = join(__dirname, '../database/migrations/*{.ts,.js}');
  const entitiesDir = join(__dirname, '/../../**/*.entity{.ts,.js}');

  return {
    type: 'postgres',
    host: configService.getOrThrow<string>(ENV_KEYS.DB_HOST),
    port: Number(configService.getOrThrow<string>(ENV_KEYS.DB_PORT)),
    username: configService.getOrThrow<string>(ENV_KEYS.DB_USERNAME),
    password: configService.getOrThrow<string>(ENV_KEYS.DB_PASSWORD),
    database: configService.getOrThrow<string>(ENV_KEYS.DB_NAME),
    entities: [entitiesDir],
    migrations: [migrationsDir],
    migrationsRun: false,
    synchronize:
      configService.get<NODE_ENV>(ENV_KEYS.NODE_ENV) !== NODE_ENV.PROD,

    ...(envIsDevLocal
      ? {}
      : {
          ssl: {
            rejectUnauthorized: false,
          },
        }),
  };
};
