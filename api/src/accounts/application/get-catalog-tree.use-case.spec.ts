import { Account } from '../domain/account.js';
import { AccountCode } from '../domain/account-code.js';
import { Nature } from '../domain/nature.js';
import { InMemoryAccountRepository } from '../infrastructure/in-memory-account-repository.js';
import { sampleAccounts } from '../infrastructure/sample-accounts.js';
import { GetCatalogTree } from './get-catalog-tree.use-case.js';

describe('GetCatalogTree', () => {
  it('returns an empty tree for an empty catalog', async () => {
    const tree = await new GetCatalogTree(
      new InMemoryAccountRepository(),
    ).execute();

    expect(tree).toEqual([]);
  });

  it('nests every account under its parent', async () => {
    const tree = await new GetCatalogTree(
      new InMemoryAccountRepository(sampleAccounts()),
    ).execute();

    expect(tree.map((node) => node.code)).toEqual(['1', '2']);
    const [asset] = tree;
    expect(asset.children.map((node) => node.code)).toEqual(['11']);
    expect(asset.children[0].children.map((node) => node.code)).toEqual([
      '1105',
    ]);
    expect(
      asset.children[0].children[0].children.map((node) => node.code),
    ).toEqual(['110505', '110510']);
  });

  it('exposes name, nature and level on every node', async () => {
    const tree = await new GetCatalogTree(
      new InMemoryAccountRepository(sampleAccounts()),
    ).execute();

    expect(tree[1]).toMatchObject({
      code: '2',
      name: 'Pasivo',
      nature: Nature.Credit,
      level: 'class',
    });
    expect(tree[1].children[0].children[0]).toMatchObject({
      code: '2105',
      nature: Nature.Credit,
      level: 'account',
    });
  });

  it('marks only the accounts without children as accepting movements', async () => {
    const tree = await new GetCatalogTree(
      new InMemoryAccountRepository(sampleAccounts()),
    ).execute();

    const cashGeneral = tree[0].children[0].children[0].children[0];
    expect(cashGeneral.code).toBe('110505');
    expect(cashGeneral.acceptsMovements).toBe(true);
    expect(tree[0].acceptsMovements).toBe(false);
    expect(tree[0].children[0].children[0].acceptsMovements).toBe(false);
  });

  it('orders siblings by code regardless of insertion order', async () => {
    const asset = Account.createClass({
      code: AccountCode.create('1'),
      name: 'Activo',
      nature: Nature.Debit,
    });
    const group = (raw: string) =>
      Account.createChild(asset, {
        code: AccountCode.create(raw),
        name: `Grupo ${raw}`,
      });

    const tree = await new GetCatalogTree(
      new InMemoryAccountRepository([group('13'), asset, group('11')]),
    ).execute();

    expect(tree[0].children.map((node) => node.code)).toEqual(['11', '13']);
  });
});
