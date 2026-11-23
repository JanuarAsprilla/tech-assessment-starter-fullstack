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

export class InvalidAccountNatureError extends DomainError {
  readonly code = 'INVALID_ACCOUNT_NATURE';

  constructor(message: string) {
    super(message, 'nature');
  }
}

export class AccountCodeAlreadyExistsError extends DomainError {
  readonly code = 'ACCOUNT_CODE_ALREADY_EXISTS';

  constructor(accountCode: string) {
    super(`Ya existe una cuenta con el código ${accountCode}.`, 'code');
  }
}

export class ParentNotFoundError extends DomainError {
  readonly code = 'PARENT_NOT_FOUND';

  constructor(parentCode: string) {
    super(`La cuenta padre ${parentCode} no existe.`, 'code');
  }
}

export class AccountNotFoundError extends DomainError {
  readonly code = 'ACCOUNT_NOT_FOUND';

  constructor(accountCode: string) {
    super(`La cuenta ${accountCode} no existe.`);
  }
}

export class AccountHasChildrenError extends DomainError {
  readonly code = 'ACCOUNT_HAS_CHILDREN';

  constructor(accountCode: string) {
    super(
      `No se puede eliminar la cuenta ${accountCode} porque tiene cuentas hijas.`,
    );
  }
}
