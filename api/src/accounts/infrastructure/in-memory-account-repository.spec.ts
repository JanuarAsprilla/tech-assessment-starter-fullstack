import { AccountCode } from '../domain/account-code.js';
import { InMemoryAccountRepository } from './in-memory-account-repository.js';
import { sampleAccounts } from './sample-accounts.js';

const code = (raw: string) => AccountCode.create(raw);

describe('InMemoryAccountRepository', () => {
  let repository: InMemoryAccountRepository;

  beforeEach(() => {
    repository = new InMemoryAccountRepository(sampleAccounts());
  });

  it('returns null when the account does not exist', async () => {
    expect(await repository.findByCode(code('9'))).toBeNull();
  });

  it('finds a seeded account by code', async () => {
    const account = await repository.findByCode(code('1105'));

    expect(account?.name).toBe('Caja');
  });

  it('lists every account', async () => {
    expect(await repository.findAll()).toHaveLength(sampleAccounts().length);
  });

  it('saves a new account', async () => {
    const [asset] = sampleAccounts();
    const empty = new InMemoryAccountRepository();

    await empty.save(asset);

    expect(await empty.findByCode(code('1'))).toBe(asset);
  });

  it('replaces an account saved with the same code', async () => {
    const before = (await repository.findAll()).length;

    await repository.save((await repository.findByCode(code('1')))!);

    expect(await repository.findAll()).toHaveLength(before);
  });

  it('deletes an account by code', async () => {
    await repository.delete(code('110510'));

    expect(await repository.findByCode(code('110510'))).toBeNull();
  });

  describe('hasChildren', () => {
    it.each([
      ['1', true],
      ['11', true],
      ['1105', true],
      ['110505', false],
      ['2105', false],
    ])('reports %s -> %s', async (raw, expected) => {
      expect(await repository.hasChildren(code(raw))).toBe(expected);
    });
  });

  it('does not share state with the seed array it received', async () => {
    const seed = sampleAccounts();
    const isolated = new InMemoryAccountRepository(seed);

    await isolated.delete(code('110510'));

    expect(seed).toHaveLength(sampleAccounts().length);
  });
});
