import { HttpException, HttpStatus } from '@nestjs/common';

export interface FieldError {
  /** Campo al que corresponde el error, o `null` si es general. */
  readonly field: string | null;
  readonly message: string;
}

/** Forma única de todos los errores que devuelve la API. */
export interface ApiErrorBody {
  readonly code: string;
  readonly message: string;
  readonly errors: readonly FieldError[];
}

export class RequestValidationError extends HttpException {
  constructor(readonly body: ApiErrorBody) {
    super(body, HttpStatus.BAD_REQUEST);
  }
}
