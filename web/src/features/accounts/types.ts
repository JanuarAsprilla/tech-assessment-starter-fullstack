export const NATURES = ['debit', 'credit'] as const
export type Nature = (typeof NATURES)[number]

export type AccountLevel = 'class' | 'group' | 'account' | 'subaccount'

/** Cuenta tal como la devuelve la API al crear. */
export interface AccountView {
  readonly code: string
  readonly name: string
  readonly nature: Nature
  readonly level: AccountLevel
}

/** Nodo del árbol del catálogo. */
export interface AccountNode extends AccountView {
  /** Solo las cuentas sin hijas admiten movimientos contables. */
  readonly acceptsMovements: boolean
  readonly children: readonly AccountNode[]
}

export interface CreateAccountInput {
  readonly code: string
  readonly name: string
  /** Solo se envía para una clase; el resto la hereda. */
  readonly nature?: Nature
}

export interface FieldError {
  /** Campo al que corresponde el error, o `null` si es general. */
  readonly field: string | null
  readonly message: string
}
