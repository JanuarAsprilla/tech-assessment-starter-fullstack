export const AccountLevel = {
  Class: 'class',
  Group: 'group',
  Account: 'account',
  Subaccount: 'subaccount',
} as const;

export type AccountLevel = (typeof AccountLevel)[keyof typeof AccountLevel];

/** Niveles ordenados de mayor a menor jerarquía. */
export const LEVELS_TOP_DOWN: readonly AccountLevel[] = [
  AccountLevel.Class,
  AccountLevel.Group,
  AccountLevel.Account,
  AccountLevel.Subaccount,
];

/** Longitud del código (en dígitos) que define cada nivel. */
export const CODE_LENGTH_BY_LEVEL: Readonly<Record<AccountLevel, number>> = {
  [AccountLevel.Class]: 1,
  [AccountLevel.Group]: 2,
  [AccountLevel.Account]: 4,
  [AccountLevel.Subaccount]: 6,
};

export const MAX_CODE_LENGTH = CODE_LENGTH_BY_LEVEL[AccountLevel.Subaccount];

export function levelForCodeLength(length: number): AccountLevel | undefined {
  return LEVELS_TOP_DOWN.find(
    (level) => CODE_LENGTH_BY_LEVEL[level] === length,
  );
}
