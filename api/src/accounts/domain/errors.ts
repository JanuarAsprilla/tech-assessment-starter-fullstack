/**
 * Base de los errores de negocio. Lleva un `code` estable y, si aplica, el
 * `field` al que corresponde, para que las capas externas los traduzcan
 * (HTTP, UI) sin que el dominio conozca ninguna de ellas.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = new.target.name;
    this.field = field;
  }
}

export class InvalidAccountCodeError extends DomainError {
  readonly code = 'INVALID_ACCOUNT_CODE';

  constructor(message: string) {
    super(message, 'code');
  }
}

export class InvalidAccountNameError extends DomainError {
  readonly code = 'INVALID_ACCOUNT_NAME';

  constructor(message: string) {
    super(message, 'name');
  }
}

export class InvalidAccountParentError extends DomainError {
  readonly code = 'INVALID_ACCOUNT_PARENT';

  constructor(message: string) {
    super(message, 'code');
  }
}
