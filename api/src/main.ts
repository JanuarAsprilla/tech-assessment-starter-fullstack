import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

const DEFAULT_WEB_ORIGIN = 'http://localhost:5173';
const DEFAULT_PORT = 3000;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app, {
    webOrigin: process.env.WEB_ORIGIN ?? DEFAULT_WEB_ORIGIN,
  });
  await app.listen(process.env.PORT ?? DEFAULT_PORT);
}

await bootstrap();
