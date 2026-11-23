import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import { DomainError } from '../domain/errors.js';
import { RequestValidationError, type ApiErrorBody } from './api-error.js';

interface HttpFailure {
  readonly status: number;
  readonly body: ApiErrorBody;
}

const STATUS_BY_DOMAIN_CODE: Readonly<Record<string, number>> = {
  INVALID_ACCOUNT_CODE: HttpStatus.BAD_REQUEST,
  INVALID_ACCOUNT_NAME: HttpStatus.BAD_REQUEST,
  INVALID_ACCOUNT_PARENT: HttpStatus.BAD_REQUEST,
  INVALID_ACCOUNT_NATURE: HttpStatus.BAD_REQUEST,
  ACCOUNT_NOT_FOUND: HttpStatus.NOT_FOUND,
  ACCOUNT_CODE_ALREADY_EXISTS: HttpStatus.CONFLICT,
  ACCOUNT_HAS_CHILDREN: HttpStatus.CONFLICT,
  PARENT_NOT_FOUND: HttpStatus.UNPROCESSABLE_ENTITY,
};

const CLIENT_ERRORS: Readonly<
  Record<number, { code: string; message: string }>
> = {
  [HttpStatus.NOT_FOUND]: {
    code: 'NOT_FOUND',
    message: 'El recurso solicitado no existe.',
  },
  [HttpStatus.PAYLOAD_TOO_LARGE]: {
    code: 'PAYLOAD_TOO_LARGE',
    message: 'La solicitud es demasiado grande.',
  },
  [HttpStatus.TOO_MANY_REQUESTS]: {
    code: 'TOO_MANY_REQUESTS',
    message: 'Demasiadas solicitudes. Intenta de nuevo en un momento.',
  },
};

const BAD_REQUEST = {
  code: 'BAD_REQUEST',
  message: 'La solicitud no es válida.',
};

/**
 * Único punto donde los errores se convierten en HTTP. Los de negocio y los de
 * validación conservan su mensaje; cualquier otro error devuelve un 500
 * genérico y su detalle se registra solo en el servidor.
 */
@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, body } = this.toHttpFailure(exception);

    response.status(status).json(body);
  }

  private toHttpFailure(exception: unknown): HttpFailure {
    if (exception instanceof DomainError) {
      return {
        status: STATUS_BY_DOMAIN_CODE[exception.code] ?? HttpStatus.BAD_REQUEST,
        body: {
          code: exception.code,
          message: exception.message,
          errors: [
            { field: exception.field ?? null, message: exception.message },
          ],
        },
      };
    }

    if (exception instanceof RequestValidationError) {
      return { status: HttpStatus.BAD_REQUEST, body: exception.body };
    }

    const clientStatus = clientErrorStatus(exception);
    if (clientStatus !== null) {
      const { code, message } = CLIENT_ERRORS[clientStatus] ?? BAD_REQUEST;
      return { status: clientStatus, body: { code, message, errors: [] } };
    }

    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception.stack : String(exception),
    );
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        code: 'INTERNAL_ERROR',
        message: 'Ocurrió un error inesperado. Intenta de nuevo.',
        errors: [],
      },
    };
  }
}

/** Estado 4xx de excepciones de Nest o del parser del cuerpo; `null` si no es un error del cliente. */
function clientErrorStatus(exception: unknown): number | null {
  const status =
    exception instanceof HttpException
      ? exception.getStatus()
      : (exception as { status?: unknown } | null)?.status;

  return typeof status === 'number' && status >= 400 && status < 500
    ? status
    : null;
}
