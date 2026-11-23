import type { Account } from '../domain/account.js';
import type { AccountCode } from '../domain/account-code.js';
import type { AccountRepository } from '../domain/account-repository.js';

/**
 * Persistencia en memoria. Es suficiente para esta entrega y, al implementar el
 * puerto del dominio, se reemplaza por una base de datos sin tocar los casos de uso.
 */
export class InMemoryAccountRepository implements AccountRepository {
  private readonly accounts = new Map<string, Account>();

  constructor(initial: readonly Account[] = []) {
    for (const account of initial) {
      this.accounts.set(account.code.value, account);
    }
  }

  findByCode(code: AccountCode): Promise<Account | null> {
    return Promise.resolve(this.accounts.get(code.value) ?? null);
  }

  findAll(): Promise<readonly Account[]> {
    return Promise.resolve([...this.accounts.values()]);
  }

  hasChildren(code: AccountCode): Promise<boolean> {
    const found = [...this.accounts.values()].some((account) =>
      account.code.parent()?.equals(code),
    );
    return Promise.resolve(found);
  }

  save(account: Account): Promise<void> {
    this.accounts.set(account.code.value, account);
    return Promise.resolve();
  }

  delete(code: AccountCode): Promise<void> {
    this.accounts.delete(code.value);
    return Promise.resolve();
  }
}
