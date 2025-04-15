import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as Sentry from '@sentry/nestjs';

import { AppModule } from './app.module';
// import { ENV_KEYS, NODE_ENV } from './utils/config/config.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // const configService = app.get<ConfigService>(ConfigService);
  // const env = configService.get<NodeEnv>(ENV_KEYS.NODE_ENV);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

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

  await app.listen(3000);
}

bootstrap().catch((error) => {
  console.error(error);
  Sentry.captureException(error);
  process.exit(1);
});
