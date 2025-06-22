import { Global, Module } from '@nestjs/common';
import {
  ConfigModule as NestConfigModule,
  ConfigService,
} from '@nestjs/config';
import * as joi from 'joi';

export enum NODE_ENV {
  DEV_LOCAL = 'dev-local',
  DEV = 'dev',
  QA = 'qa',
  PROD = 'prod',
}

/* eslint-disable import/namespace */
const ENV_SCHEMA = {
  PORT: joi.number().required(),

  JWT_SECRET: joi.string().required(),
  JWT_EXPIRATION_INTERVAL_MS: joi.string().required(),
  JWT_REFRESH_SECRET: joi.string().required(),
  JWT_REFRESH_EXPIRATION_INTERVAL_MS: joi.string().required(),

  SENTRY_DSN: joi.string().required(),

  NODE_ENV: joi
    .string()
    .valid(NODE_ENV.DEV_LOCAL, NODE_ENV.DEV, NODE_ENV.QA, NODE_ENV.PROD)
    .required(),
  DB_HOST: joi.string().required(),
  DB_PORT: joi.number().required(),
  DB_USERNAME: joi.string().required(),
  DB_PASSWORD: joi.string().required(),
  DB_NAME: joi.string().required(),

  GOOGLE_CLIENT_ID: joi.string().required(),
  GOOGLE_CLIENT_SECRET: joi.string().required(),

  AWS_REGION: joi.string().required(),
  AWS_ACCESS_KEY: joi.string().required(),
  AWS_SECRET_KEY: joi.string().required(),
  AWS_BUCKET: joi.string().required(),
  SOURCE_MAIL: joi.string().required(),

  // For later use
  // REDIS_HOST: joi.string().required(),
  // REDIS_PORT: joi.number().required(),
  // REDIS_USERNAME: joi.string().required(),
  // REDIS_PASSWORD: joi.string().required(),
} as const;

const envSchema = joi.object(ENV_SCHEMA);
/* eslint-enable import/namespace */

type EnvSchemaKeys = keyof typeof ENV_SCHEMA;

export const ENV_KEYS = Object.freeze(
  Object.keys(ENV_SCHEMA).reduce(
    (acc, key) => ({ ...acc, [key]: key }),
    {} as { [K in EnvSchemaKeys]: K },
  ),
);

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      validationSchema: envSchema,
      validationOptions: {
        isGlobal: true,
      },
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
