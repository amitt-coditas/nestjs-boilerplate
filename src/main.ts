import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as Sentry from '@sentry/nestjs';

import {
  GlobalHttpExceptionFilter,
  CustomValidationPipe,
  ENV_KEYS,
  LoggerService,
  ResponseInterceptor,
} from '@utils/index';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
  const port = configService.get<number>(ENV_KEYS.PORT) || 3000;
  // const env = configService.get<NODE_ENV>(ENV_KEYS.NODE_ENV) || NODE_ENV.DEV;

  const logger = await app.resolve(LoggerService);

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

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('API') // Change as per the project
    .setDescription('API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port).then(() => {
    logger.info(bootstrap.name, `Application started on port ${port}`);
  });
}

bootstrap().catch((error) => {
  console.error(error);
  Sentry.captureException(error);
  process.exit(1);
});
