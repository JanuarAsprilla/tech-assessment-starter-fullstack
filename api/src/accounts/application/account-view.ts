import type { Account } from '../domain/account.js';
import type { AccountLevel } from '../domain/account-level.js';
import type { Nature } from '../domain/nature.js';

/** Lo que la capa de aplicación expone hacia afuera: datos planos, nunca entidades. */
export interface AccountView {
  readonly code: string;
  readonly name: string;
  readonly nature: Nature;
  readonly level: AccountLevel;
}

export interface AccountNode extends AccountView {
  /** Solo las cuentas sin hijas admiten movimientos contables. */
  readonly acceptsMovements: boolean;
  readonly children: readonly AccountNode[];
}

export function toAccountView(account: Account): AccountView {
  return {
    code: account.code.value,
    name: account.name,
    nature: account.nature,
    level: account.code.level,
  };
}
