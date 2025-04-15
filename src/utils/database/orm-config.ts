import { join } from 'path';

import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';

import { ENV_KEYS } from '../config/config.module';

const logger = new Logger('TypeORMInitializer');
const configService = new ConfigService();

const env = configService.get<string>(ENV_KEYS.NODE_ENV) || 'dev';
const envIsDevLocal = env === 'dev-local';

const migrationsDir = join(__dirname, '../database/migrations/*{.ts,.js}');
const entitiesDir = join(__dirname, '/../../**/*.entity{.ts,.js}');

export const ormConfig: DataSourceOptions = {
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: +configService.get('DB_PORT'),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_DATABASE_NAME'),
  entities: [entitiesDir],
  migrations: [migrationsDir],
  migrationsRun: false,
  synchronize: false,

  ...(envIsDevLocal
    ? {}
    : {
        ssl: {
          rejectUnauthorized: false,
        },
      }),
};

export const dbConnector = new DataSource(ormConfig);
dbConnector
  .initialize()
  .then(() => {
    logger.log('Database connected');
  })
  .catch((error) => {
    logger.error('Error connecting to database', error);
  });
