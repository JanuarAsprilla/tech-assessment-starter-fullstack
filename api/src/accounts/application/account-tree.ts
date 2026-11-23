import type { Account } from '../domain/account.js';
import { AccountLevel } from '../domain/account-level.js';
import { toAccountView, type AccountNode } from './account-view.js';

/** Convierte la lista plana en un árbol anidado con los hermanos ordenados por código. */
export function buildAccountTree(accounts: readonly Account[]): AccountNode[] {
  const childrenByParent = groupByParentCode(accounts);

  const toNode = (account: Account): AccountNode => {
    const children = (childrenByParent.get(account.code.value) ?? []).map(
      toNode,
    );
    return {
      ...toAccountView(account),
      acceptsMovements: children.length === 0,
      children,
    };
  };

  return sortByCode(
    accounts.filter((account) => account.code.level === AccountLevel.Class),
  ).map(toNode);
}

function groupByParentCode(
  accounts: readonly Account[],
): Map<string, Account[]> {
  const groups = new Map<string, Account[]>();

  for (const account of accounts) {
    const parentCode = account.code.parent()?.value;
    if (parentCode === undefined) continue;

    groups.set(parentCode, [...(groups.get(parentCode) ?? []), account]);
  }

  for (const [parentCode, siblings] of groups) {
    groups.set(parentCode, sortByCode(siblings));
  }

  return groups;
}

function sortByCode(accounts: readonly Account[]): Account[] {
  return [...accounts].sort((a, b) => a.code.value.localeCompare(b.code.value));
}
