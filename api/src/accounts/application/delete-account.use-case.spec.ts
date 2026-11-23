import { AccountCode } from '../domain/account-code.js';
import {
  AccountHasChildrenError,
  AccountNotFoundError,
  InvalidAccountCodeError,
} from '../domain/errors.js';
import { InMemoryAccountRepository } from '../infrastructure/in-memory-account-repository.js';
import { sampleAccounts } from '../infrastructure/sample-accounts.js';
import { DeleteAccount } from './delete-account.use-case.js';

describe('DeleteAccount', () => {
  let repository: InMemoryAccountRepository;
  let deleteAccount: DeleteAccount;

  beforeEach(() => {
    repository = new InMemoryAccountRepository(sampleAccounts());
    deleteAccount = new DeleteAccount(repository);
  });

  it('deletes an account that has no children', async () => {
    await deleteAccount.execute({ code: '110510' });

    expect(
      await repository.findByCode(AccountCode.create('110510')),
    ).toBeNull();
  });

  it.each(['1', '11', '1105'])(
    'rejects deleting %s because it has children',
    async (raw) => {
      await expect(deleteAccount.execute({ code: raw })).rejects.toThrow(
        AccountHasChildrenError,
      );
      expect(
        await repository.findByCode(AccountCode.create(raw)),
      ).not.toBeNull();
    },
  );

  it('rejects deleting an account that does not exist', async () => {
    await expect(deleteAccount.execute({ code: '3' })).rejects.toThrow(
      AccountNotFoundError,
    );
  });

  it('rejects an invalid code', async () => {
    await expect(deleteAccount.execute({ code: 'abc' })).rejects.toThrow(
      InvalidAccountCodeError,
    );
  });

  it('allows deleting a parent once its children are gone', async () => {
    await deleteAccount.execute({ code: '110505' });
    await deleteAccount.execute({ code: '110510' });
    await deleteAccount.execute({ code: '1105' });

    expect(await repository.findByCode(AccountCode.create('1105'))).toBeNull();
  });
});
