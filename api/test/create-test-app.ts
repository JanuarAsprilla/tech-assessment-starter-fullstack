import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test, type TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

export const ALLOWED_ORIGIN = 'http://localhost:5173';

type Customize = (builder: TestingModuleBuilder) => TestingModuleBuilder;

/** Levanta la app con la misma configuración que producción. */
export async function createTestApp(
  customize: Customize = (builder) => builder,
): Promise<NestExpressApplication> {
  const builder = Test.createTestingModule({ imports: [AppModule] });
  const moduleRef = await customize(builder).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>();
  configureApp(app, { webOrigin: ALLOWED_ORIGIN });
  await app.init();

  return app;
}
