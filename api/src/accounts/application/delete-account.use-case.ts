import { AccountCode } from '../domain/account-code.js';
import type { AccountRepository } from '../domain/account-repository.js';
import {
  AccountHasChildrenError,
  AccountNotFoundError,
} from '../domain/errors.js';

export interface DeleteAccountInput {
  readonly code: string;
}

export class DeleteAccount {
  constructor(private readonly accounts: AccountRepository) {}

  async execute({ code: rawCode }: DeleteAccountInput): Promise<void> {
    const code = AccountCode.create(rawCode);

    if (!(await this.accounts.findByCode(code))) {
      throw new AccountNotFoundError(code.value);
    }
    if (await this.accounts.hasChildren(code)) {
      throw new AccountHasChildrenError(code.value);
    }

    await this.accounts.delete(code);
  }
}
