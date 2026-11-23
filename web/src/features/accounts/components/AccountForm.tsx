import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { FancyButton } from '@/components/ui/fancy-button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
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
    <form className="w-full" onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="account-code">Código</FieldLabel>
          <Input
            id="account-code"
            ref={codeRef}
            className="font-mono tracking-widest tabular-nums"
            value={values.code}
            onChange={handleText('code')}
            inputMode="numeric"
            autoComplete="off"
            maxLength={CODE_MAX_LENGTH}
            aria-invalid={errors.code ? true : undefined}
            aria-describedby={describedBy('code', 'account-code-hint')}
          />
          <FieldDescription id="account-code-hint">{codeHint(values.code)}</FieldDescription>
          {errors.code && <FieldError id="account-code-error">{errors.code}</FieldError>}
        </Field>

        <Field>
          <FieldLabel htmlFor="account-name">Nombre</FieldLabel>
          <Input
            id="account-name"
            ref={nameRef}
            value={values.name}
            onChange={handleText('name')}
            autoComplete="off"
            maxLength={NAME_MAX_LENGTH}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy('name')}
          />
          {errors.name && <FieldError id="account-name-error">{errors.name}</FieldError>}
        </Field>

        {showNature && (
          <FieldSet aria-describedby={describedBy('nature')}>
            <FieldLegend>Naturaleza</FieldLegend>
            <div className="grid grid-cols-2 gap-2">
              {NATURES.map((nature, index) => (
                <label
                  key={nature}
                  className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-input bg-white px-3 text-base transition-colors has-checked:border-primary has-checked:bg-primary/5 has-focus-visible:outline-3 has-focus-visible:outline-ring"
                >
                  <input
                    type="radio"
                    name="nature"
                    value={nature}
                    ref={index === 0 ? natureRef : undefined}
                    checked={values.nature === nature}
                    onChange={() => update('nature', nature)}
                    className="size-4 accent-primary"
                  />
                  {NATURE_LABELS[nature]}
                </label>
              ))}
            </div>
            {errors.nature && <FieldError id="account-nature-error">{errors.nature}</FieldError>}
          </FieldSet>
        )}

        {generalError && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {generalError}
          </p>
        )}

        <FancyButton
          type="submit"
          size="lg"
          className="w-full"
          disabled={mutation.isPending}
          aria-busy={mutation.isPending || undefined}
        >
          {mutation.isPending ? 'Creando…' : 'Crear cuenta'}
        </FancyButton>

        <p role="status" className="min-h-6 text-sm font-semibold text-primary">
          {created ? `Cuenta ${created.code} creada.` : ''}
        </p>
      </FieldGroup>
    </form>
  )
}
