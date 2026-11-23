import type { Account } from './account.js';
import type { AccountCode } from './account-code.js';

/**
 * Puerto de persistencia. Lo define el dominio y lo implementa la capa de
 * infraestructura, de modo que cambiar de almacenamiento no toca los casos de uso.
 */
export interface AccountRepository {
  findByCode(code: AccountCode): Promise<Account | null>;
  findAll(): Promise<readonly Account[]>;
  hasChildren(code: AccountCode): Promise<boolean>;
  save(account: Account): Promise<void>;
  delete(code: AccountCode): Promise<void>;
}
