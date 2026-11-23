import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppExceptionFilter } from './accounts/presentation/app-exception.filter.js';
import { createValidationPipe } from './accounts/presentation/validation.js';

export const JSON_BODY_LIMIT = '10kb';

export interface AppSetupOptions {
  /** Único origen autorizado por CORS. */
  readonly webOrigin: string;
}

/** Configuración compartida por `main.ts` y las pruebas e2e, para que prueben lo mismo que corre. */
export function configureApp(
  app: NestExpressApplication,
  { webOrigin }: AppSetupOptions,
): void {
  app.use(helmet());
  // Lista (no string): solo se responde el encabezado si el origen coincide.
  app.enableCors({ origin: [webOrigin] });
  app.useBodyParser('json', { limit: JSON_BODY_LIMIT });
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new AppExceptionFilter());
}
