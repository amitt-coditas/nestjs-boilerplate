import { LogLevel } from '@nestjs/common';

import { NODE_ENV } from './config/config.module';

export const getLogLevels = (env: NODE_ENV): LogLevel[] => {
  let logLevel = [] as LogLevel[];
  switch (env) {
    case NODE_ENV.DEV:
    case NODE_ENV.DEV_LOCAL:
      logLevel = ['debug', 'verbose', 'log', 'error', 'warn'];
      break;

    case NODE_ENV.QA:
      logLevel = ['debug', 'log', 'error', 'warn'];
      break;

    case NODE_ENV.PROD:
      logLevel = ['log', 'error', 'warn'];
      break;

    default:
      logLevel = ['log', 'error', 'warn'];
      break;
  }

  return logLevel;
};
