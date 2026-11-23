import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { LEVEL_LABELS, NATURE_LABELS } from '../labels'
import { useCreateAccount } from '../hooks/use-create-account'
import { NATURES, type AccountView, type CreateAccountInput } from '../types'
import {
  levelOfCode,
  parentCodeOf,
  requiresNature,
  validateAccountForm,
  NAME_MAX_LENGTH,
  type AccountFormErrors,
  type AccountFormField,
  type AccountFormValues,
} from '../validation/account-rules'
import './account-form.css'

const CODE_MAX_LENGTH = 6
const FIELDS: readonly AccountFormField[] = ['code', 'name', 'nature']
const EMPTY_VALUES: AccountFormValues = { code: '', name: '', nature: '' }

interface AccountFormProps {
  /** Código con el que arranca el formulario (por ejemplo, el de la cuenta padre). */
  readonly initialCode?: string
  readonly focusOnMount?: boolean
  readonly onCreated?: (account: AccountView) => void
}

function codeHint(code: string): string {
  const level = levelOfCode(code)
  if (level === null) return 'Usa 1, 2, 4 o 6 dígitos: clase, grupo, cuenta o subcuenta.'

  const parent = parentCodeOf(code)
  return parent ? `${LEVEL_LABELS[level]} dentro de ${parent}.` : `${LEVEL_LABELS[level]}.`
}

function toInput(values: AccountFormValues): CreateAccountInput {
  const base = { code: values.code.trim(), name: values.name.trim() }
  return requiresNature(values.code) && values.nature !== ''
    ? { ...base, nature: values.nature }
    : base
}

function withoutField(errors: AccountFormErrors, field: AccountFormField): AccountFormErrors {
  const { [field]: _removed, ...rest } = errors
  return rest
}

export function AccountForm({ initialCode = '', focusOnMount = false, onCreated }: AccountFormProps) {
  const [values, setValues] = useState<AccountFormValues>({ ...EMPTY_VALUES, code: initialCode })
  const [errors, setErrors] = useState<AccountFormErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [created, setCreated] = useState<AccountView | null>(null)

  const codeRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const natureRef = useRef<HTMLInputElement>(null)
  const mutation = useCreateAccount()

  useEffect(() => {
    if (!focusOnMount) return
    const input = codeRef.current
    input?.focus()
    input?.setSelectionRange(input.value.length, input.value.length)
  }, [focusOnMount])

  const focusField = (field: AccountFormField) =>
    ({ code: codeRef, name: nameRef, nature: natureRef })[field].current?.focus()

  const showNature = requiresNature(values.code)

  function update(field: AccountFormField, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => withoutField(current, field))
    setGeneralError(null)
    setCreated(null)
  }

  const handleText = (field: 'code' | 'name') => (event: ChangeEvent<HTMLInputElement>) =>
    update(field, event.target.value)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const found = validateAccountForm(values)
    const firstInvalid = FIELDS.find((field) => found[field])
    if (firstInvalid) {
      setErrors(found)
      focusField(firstInvalid)
      return
    }

    mutation.mutate(toInput(values), {
      onSuccess: (account) => {
        setValues(EMPTY_VALUES)
        setErrors({})
        setCreated(account)
        onCreated?.(account)
      },
      onError: (error) => {
        const messages = error.fieldMessages()
        const known = FIELDS.filter((field) => messages[field])
        setErrors(Object.fromEntries(known.map((field) => [field, messages[field]])))
        setGeneralError(known.length === 0 ? error.message : null)
        if (known[0]) focusField(known[0])
      },
    })
  }

  const describedBy = (field: AccountFormField, extra?: string) =>
    [errors[field] ? `account-${field}-error` : null, extra].filter(Boolean).join(' ') || undefined

  return (
    <form className="account-form" onSubmit={handleSubmit} noValidate>
      <div className="account-form__field">
        <label htmlFor="account-code">Código</label>
        <input
          id="account-code"
          ref={codeRef}
          className="account-form__code"
          value={values.code}
          onChange={handleText('code')}
          inputMode="numeric"
          autoComplete="off"
          maxLength={CODE_MAX_LENGTH}
          aria-invalid={errors.code ? true : undefined}
          aria-describedby={describedBy('code', 'account-code-hint')}
        />
        <p id="account-code-hint" className="account-form__hint">
          {codeHint(values.code)}
        </p>
        {errors.code && (
          <p id="account-code-error" className="account-form__error">
            {errors.code}
          </p>
        )}
      </div>

      <div className="account-form__field">
        <label htmlFor="account-name">Nombre</label>
        <input
          id="account-name"
          ref={nameRef}
          value={values.name}
          onChange={handleText('name')}
          autoComplete="off"
          maxLength={NAME_MAX_LENGTH}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={describedBy('name')}
        />
        {errors.name && (
          <p id="account-name-error" className="account-form__error">
            {errors.name}
          </p>
        )}
      </div>

      {showNature && (
        <fieldset
          className="account-form__field account-form__nature"
          aria-describedby={describedBy('nature')}
        >
          <legend>Naturaleza</legend>
          <div className="account-form__choices">
            {NATURES.map((nature, index) => (
              <label key={nature} className="account-form__choice">
                <input
                  type="radio"
                  name="nature"
                  value={nature}
                  ref={index === 0 ? natureRef : undefined}
                  checked={values.nature === nature}
                  onChange={() => update('nature', nature)}
                />
                {NATURE_LABELS[nature]}
              </label>
            ))}
          </div>
          {errors.nature && (
            <p id="account-nature-error" className="account-form__error">
              {errors.nature}
            </p>
          )}
        </fieldset>
      )}

      {generalError && (
        <p role="alert" className="account-form__error account-form__error--general">
          {generalError}
        </p>
      )}

      <button
        type="submit"
        className="button button--primary"
        disabled={mutation.isPending}
        aria-busy={mutation.isPending || undefined}
      >
        {mutation.isPending ? 'Creando…' : 'Crear cuenta'}
      </button>

      <p role="status" className="account-form__success">
        {created ? `Cuenta ${created.code} creada.` : ''}
      </p>
    </form>
  )
}
