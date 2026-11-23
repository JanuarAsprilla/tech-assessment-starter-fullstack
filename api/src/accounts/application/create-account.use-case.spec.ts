import { AccountCode } from '../domain/account-code.js';
import {
  AccountCodeAlreadyExistsError,
  InvalidAccountCodeError,
  InvalidAccountNatureError,
  ParentNotFoundError,
} from '../domain/errors.js';
import { Nature } from '../domain/nature.js';
import { InMemoryAccountRepository } from '../infrastructure/in-memory-account-repository.js';
import { sampleAccounts } from '../infrastructure/sample-accounts.js';
import { CreateAccount } from './create-account.use-case.js';

describe('CreateAccount', () => {
  let repository: InMemoryAccountRepository;
  let createAccount: CreateAccount;

  beforeEach(() => {
    repository = new InMemoryAccountRepository(sampleAccounts());
    createAccount = new CreateAccount(repository);
  });

  it('creates a class with the nature it was given', async () => {
    const created = await createAccount.execute({
      code: '3',
      name: 'Patrimonio',
      nature: Nature.Credit,
    });

    expect(created).toEqual({
      code: '3',
      name: 'Patrimonio',
      nature: Nature.Credit,
      level: 'class',
    });
    expect(await repository.findByCode(AccountCode.create('3'))).not.toBeNull();
  });

  it('creates a child that inherits the nature of its class', async () => {
    const created = await createAccount.execute({
      code: '2110',
      name: 'Proveedores',
    });

    expect(created.nature).toBe(Nature.Credit);
    expect(created.level).toBe('account');
  });

  it('creates a subaccount under an existing account', async () => {
    const created = await createAccount.execute({
      code: '110515',
      name: 'Caja principal',
    });

    expect(created.nature).toBe(Nature.Debit);
  });

  it('rejects a class without nature', async () => {
    await expect(
      createAccount.execute({ code: '3', name: 'Patrimonio' }),
    ).rejects.toThrow(InvalidAccountNatureError);
  });

  it('rejects a nature on a non-class account, because it is inherited', async () => {
    await expect(
      createAccount.execute({
        code: '2110',
        name: 'Proveedores',
        nature: Nature.Debit,
      }),
    ).rejects.toThrow(InvalidAccountNatureError);
  });

  it('rejects a code that already exists', async () => {
    await expect(
      createAccount.execute({ code: '1105', name: 'Otra caja' }),
    ).rejects.toThrow(AccountCodeAlreadyExistsError);
  });

  it('rejects an account whose parent does not exist', async () => {
    await expect(
      createAccount.execute({ code: '3105', name: 'Capital' }),
    ).rejects.toThrow(ParentNotFoundError);
  });

  it('rejects an invalid code before touching the repository', async () => {
    await expect(
      createAccount.execute({ code: '12a', name: 'Algo' }),
    ).rejects.toThrow(InvalidAccountCodeError);
  });

  it('does not persist anything when the creation fails', async () => {
    const before = (await repository.findAll()).length;

    await createAccount
      .execute({ code: '3105', name: 'Capital' })
      .catch(() => undefined);

    expect(await repository.findAll()).toHaveLength(before);
  });
});
