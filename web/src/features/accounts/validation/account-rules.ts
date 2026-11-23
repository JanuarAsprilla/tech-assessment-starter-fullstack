import type { AccountLevel, Nature } from '../types'

/** Espejo de las reglas del dominio en el backend. Ayuda al usuario; el servidor siempre valida. */
export const NAME_MAX_LENGTH = 120

const LEVEL_BY_CODE_LENGTH: Readonly<Record<number, AccountLevel>> = {
  1: 'class',
  2: 'group',
  4: 'account',
  6: 'subaccount',
}

const DIGITS_ONLY = /^\d+$/

export interface AccountFormValues {
  readonly code: string
  readonly name: string
  readonly nature: Nature | ''
}

export type AccountFormField = 'code' | 'name' | 'nature'
export type AccountFormErrors = Partial<Record<AccountFormField, string>>

export function levelOfCode(code: string): AccountLevel | null {
  const value = code.trim()
  if (!DIGITS_ONLY.test(value)) return null
  return LEVEL_BY_CODE_LENGTH[value.length] ?? null
}

/** Solo una clase define su naturaleza; el resto la hereda. */
export function requiresNature(code: string): boolean {
  return levelOfCode(code) === 'class'
}

export function validateAccountForm(values: AccountFormValues): AccountFormErrors {
  const errors: { -readonly [K in AccountFormField]?: string } = {}

  const codeError = validateCode(values.code.trim())
  if (codeError) errors.code = codeError

  const nameError = validateName(values.name.trim())
  if (nameError) errors.name = nameError

  if (requiresNature(values.code) && values.nature === '') {
    errors.nature = 'Elige la naturaleza de la clase.'
  }

  return errors
}

function validateCode(code: string): string | null {
  if (code === '') return 'El código es obligatorio.'
  if (!DIGITS_ONLY.test(code)) return 'El código debe contener solo dígitos.'
  if (!(code.length in LEVEL_BY_CODE_LENGTH)) {
    return 'El código debe tener 1, 2, 4 o 6 dígitos.'
  }
  return null
}

function validateName(name: string): string | null {
  if (name === '') return 'El nombre es obligatorio.'
  if (name.length > NAME_MAX_LENGTH) {
    return `El nombre no puede superar ${NAME_MAX_LENGTH} caracteres.`
  }
  return null
}
