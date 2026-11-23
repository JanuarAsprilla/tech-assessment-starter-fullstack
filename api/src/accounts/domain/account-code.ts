import {
  CODE_LENGTH_BY_LEVEL,
  LEVELS_TOP_DOWN,
  MAX_CODE_LENGTH,
  levelForCodeLength,
  type AccountLevel,
} from './account-level.js';
import { InvalidAccountCodeError } from './errors.js';

const NUMERIC_CODE = /^\d+$/;

/**
 * Value object inmutable. Concentra la regla "la longitud del código define
 * el nivel" y la derivación del padre, para que no se repitan en otras capas.
 */
export class AccountCode {
  private constructor(
    readonly value: string,
    readonly level: AccountLevel,
  ) {}

  static create(raw: string): AccountCode {
    const value = raw.trim();

    if (!NUMERIC_CODE.test(value)) {
      throw new InvalidAccountCodeError(
        'El código debe contener solo dígitos.',
      );
    }

    const level =
      value.length <= MAX_CODE_LENGTH
        ? levelForCodeLength(value.length)
        : undefined;
    if (!level) {
      throw new InvalidAccountCodeError(
        'El código debe tener 1, 2, 4 o 6 dígitos (clase, grupo, cuenta o subcuenta).',
      );
    }

    return new AccountCode(value, level);
  }

  /** Código del nivel inmediatamente superior, o `null` si es una clase. */
  parent(): AccountCode | null {
    const parentLevel =
      LEVELS_TOP_DOWN[LEVELS_TOP_DOWN.indexOf(this.level) - 1];
    if (!parentLevel) return null;

    return new AccountCode(
      this.value.slice(0, CODE_LENGTH_BY_LEVEL[parentLevel]),
      parentLevel,
    );
  }

  equals(other: AccountCode): boolean {
    return this.value === other.value;
  }

  isDescendantOf(other: AccountCode): boolean {
    return (
      this.value.length > other.value.length &&
      this.value.startsWith(other.value)
    );
  }
}
