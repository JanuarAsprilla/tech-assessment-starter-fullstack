import type { AccountLevel, Nature } from './types'

export const LEVEL_LABELS: Readonly<Record<AccountLevel, string>> = {
  class: 'Clase',
  group: 'Grupo',
  account: 'Cuenta',
  subaccount: 'Subcuenta',
}

export const NATURE_LABELS: Readonly<Record<Nature, string>> = {
  debit: 'Débito',
  credit: 'Crédito',
}
