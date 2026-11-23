import { ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { RequestValidationError, type FieldError } from './api-error.js';

const UNKNOWN_FIELD_MESSAGE = 'Este campo no está permitido.';

/** Rechaza campos desconocidos y devuelve un error por campo, con la forma común de la API. */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (errors) =>
      new RequestValidationError({
        code: 'VALIDATION_ERROR',
        message: 'Hay datos inválidos en la solicitud.',
        errors: errors.map(toFieldError),
      }),
  });
}

function toFieldError(error: ValidationError): FieldError {
  const constraints = error.constraints ?? {};
  const message =
    'whitelistValidation' in constraints
      ? UNKNOWN_FIELD_MESSAGE
      : (Object.values(constraints)[0] ?? 'El valor no es válido.');

  return { field: error.property ?? null, message };
}
