import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';

import {
  SwaggerSetupService,
  GlobalHttpExceptionFilter,
  CustomValidationPipe,
  ENV_KEYS,
  ResponseInterceptor,
  LoggerService,
} from '@utils/index';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
  const port = configService.get<number>(ENV_KEYS.PORT) || 3000;
  const logger = LoggerService.forClass('');
  // const env = configService.get<NODE_ENV>(ENV_KEYS.NODE_ENV) || NODE_ENV.DEV;

  const filter = app.get(GlobalHttpExceptionFilter);
  app.useGlobalFilters(filter);
  app.useGlobalPipes(new CustomValidationPipe());
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.enableCors({
    credentials: true,
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: '*',
  });

  // Sentry
  // if (env === NODE_ENV.PROD || env === NODE_ENV.QA) {
  //   Sentry.init({
  //     dsn: configService.getOrThrow<string>(ENV_KEYS.SENTRY_DSN),
  //     integrations: [nodeProfilingIntegration()],
  //     tracesSampleRate: 1.0,
  //     profilesSampleRate: 1.0,
  //     ignoreErrors: [], // Modify as per the needs
  //   });
  // }

  // Setup Swagger
  const swaggerSetupService = app.get(SwaggerSetupService);
  swaggerSetupService.setupSwagger(app);

  await app.listen(port).then(() => {
    logger.info(bootstrap.name, 'Server is running on port', { port });
  });
}

bootstrap().catch((error) => {
  console.error(error);
  Sentry.captureException(error);
  process.exit(1);
});
