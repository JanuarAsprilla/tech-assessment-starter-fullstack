import type { AccountRepository } from '../domain/account-repository.js';
import { buildAccountTree } from './account-tree.js';
import type { AccountNode } from './account-view.js';

export class GetCatalogTree {
  constructor(private readonly accounts: AccountRepository) {}

  async execute(): Promise<AccountNode[]> {
    return buildAccountTree(await this.accounts.findAll());
  }
}
