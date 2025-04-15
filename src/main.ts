import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import * as Sentry from '@sentry/nestjs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
  const env = configService.get('NODE_ENV');
  await app.listen(3000);
}

bootstrap().catch((error) => {
  console.error(error);
  Sentry.captureException(error);
  process.exit(1);
});
