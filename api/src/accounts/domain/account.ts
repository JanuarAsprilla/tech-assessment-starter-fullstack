import { AccountCode } from './account-code.js';
import { AccountLevel } from './account-level.js';
import {
  InvalidAccountNameError,
  InvalidAccountParentError,
} from './errors.js';
import type { Nature } from './nature.js';

export const NAME_MAX_LENGTH = 120;

interface NewClassProps {
  readonly code: AccountCode;
  readonly name: string;
  readonly nature: Nature;
}

interface NewChildProps {
  readonly code: AccountCode;
  readonly name: string;
}

/**
 * Entidad inmutable. Los constructores estáticos garantizan los invariantes:
 * una clase define su naturaleza y el resto la hereda de su padre directo.
 */
export class Account {
  private constructor(
    readonly code: AccountCode,
    readonly name: string,
    readonly nature: Nature,
  ) {}

  static createClass({ code, name, nature }: NewClassProps): Account {
    if (code.level !== AccountLevel.Class) {
      throw new InvalidAccountParentError(
        'Solo las clases (1 dígito) se crean sin cuenta padre.',
      );
    }

    return new Account(code, validateName(name), nature);
  }

  static createChild(parent: Account, { code, name }: NewChildProps): Account {
    if (!code.parent()?.equals(parent.code)) {
      throw new InvalidAccountParentError(
        `El código ${code.value} no es hijo directo de la cuenta ${parent.code.value}.`,
      );
    }

    return new Account(code, validateName(name), parent.nature);
  }
}

function validateName(raw: string): string {
  const name = raw.trim();

  if (name.length === 0) {
    throw new InvalidAccountNameError('El nombre es obligatorio.');
  }
  if (name.length > NAME_MAX_LENGTH) {
    throw new InvalidAccountNameError(
      `El nombre no puede superar ${NAME_MAX_LENGTH} caracteres.`,
    );
  }

  return name;
}
