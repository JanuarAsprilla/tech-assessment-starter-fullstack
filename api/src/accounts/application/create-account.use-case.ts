import { Account } from '../domain/account.js';
import { AccountCode } from '../domain/account-code.js';
import type { AccountRepository } from '../domain/account-repository.js';
import {
  AccountCodeAlreadyExistsError,
  InvalidAccountNatureError,
  ParentNotFoundError,
} from '../domain/errors.js';
import type { Nature } from '../domain/nature.js';
import { toAccountView, type AccountView } from './account-view.js';

export interface CreateAccountInput {
  readonly code: string;
  readonly name: string;
  /** Obligatoria para una clase. Las demás cuentas la heredan. */
  readonly nature?: Nature;
}

export class CreateAccount {
  constructor(private readonly accounts: AccountRepository) {}

  async execute(input: CreateAccountInput): Promise<AccountView> {
    const code = AccountCode.create(input.code);

    if (await this.accounts.findByCode(code)) {
      throw new AccountCodeAlreadyExistsError(code.value);
    }

    const account = await this.build(code, input);
    await this.accounts.save(account);

    return toAccountView(account);
  }

  private async build(
    code: AccountCode,
    { name, nature }: CreateAccountInput,
  ): Promise<Account> {
    const parentCode = code.parent();

    if (parentCode === null) {
      if (!nature) {
        throw new InvalidAccountNatureError(
          'La naturaleza es obligatoria para una clase.',
        );
      }
      return Account.createClass({ code, name, nature });
    }

    if (nature) {
      throw new InvalidAccountNatureError(
        'La naturaleza solo se define en la clase; las demás cuentas la heredan.',
      );
    }

    const parent = await this.accounts.findByCode(parentCode);
    if (!parent) {
      throw new ParentNotFoundError(parentCode.value);
    }

    return Account.createChild(parent, { code, name });
  }
}
