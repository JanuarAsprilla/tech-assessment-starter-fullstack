import {
  levelOfCode,
  parentCodeOf,
  requiresNature,
  validateAccountForm,
} from './account-rules'

describe('parentCodeOf', () => {
  it.each([
    ['110505', '1105'],
    ['1105', '11'],
    ['11', '1'],
  ])('returns the parent of %s', (code, parent) => {
    expect(parentCodeOf(code)).toBe(parent)
  })

  it('returns null for a class, which has no parent', () => {
    expect(parentCodeOf('1')).toBeNull()
  })

  it.each(['', '111', '12a'])('returns null for the invalid code "%s"', (code) => {
    expect(parentCodeOf(code)).toBeNull()
  })

  it('ignores surrounding whitespace', () => {
    expect(parentCodeOf(' 1105 ')).toBe('11')
  })
})

describe('levelOfCode', () => {
  it.each([
    ['1', 'class'],
    ['11', 'group'],
    ['1105', 'account'],
    ['110505', 'subaccount'],
  ])('maps %s to %s', (code, level) => {
    expect(levelOfCode(code)).toBe(level)
  })

  it.each(['', '111', '12a', '1234567', ' '])(
    'returns null for the invalid code "%s"',
    (code) => {
      expect(levelOfCode(code)).toBeNull()
    },
  )
})

describe('requiresNature', () => {
  it('is true only for a class', () => {
    expect(requiresNature('1')).toBe(true)
    expect(requiresNature('11')).toBe(false)
    expect(requiresNature('110505')).toBe(false)
  })

  it('is false while the code is still invalid', () => {
    expect(requiresNature('')).toBe(false)
    expect(requiresNature('x')).toBe(false)
  })
})

describe('validateAccountForm', () => {
  it('accepts a class with a nature', () => {
    expect(
      validateAccountForm({ code: '3', name: 'Patrimonio', nature: 'credit' }),
    ).toEqual({})
  })

  it('accepts a child account without nature', () => {
    expect(validateAccountForm({ code: '1105', name: 'Caja', nature: '' })).toEqual(
      {},
    )
  })

  it('ignores the nature on accounts that are not a class, because it is inherited', () => {
    expect(
      validateAccountForm({ code: '1105', name: 'Caja', nature: 'credit' }),
    ).toEqual({})
  })

  it('trims code and name before validating', () => {
    expect(
      validateAccountForm({ code: ' 1105 ', name: '  Caja  ', nature: '' }),
    ).toEqual({})
  })

  it.each([
    ['empty', '', 'El código es obligatorio.'],
    ['blank', '   ', 'El código es obligatorio.'],
    ['letters', '11a5', 'El código debe contener solo dígitos.'],
    ['symbols', '11-05', 'El código debe contener solo dígitos.'],
    ['three digits', '111', 'El código debe tener 1, 2, 4 o 6 dígitos.'],
    ['seven digits', '1234567', 'El código debe tener 1, 2, 4 o 6 dígitos.'],
  ])('rejects a code that is %s', (_label, code, message) => {
    expect(validateAccountForm({ code, name: 'Caja', nature: 'debit' }).code).toBe(
      message,
    )
  })

  it.each([
    ['empty', ''],
    ['blank', '    '],
  ])('rejects a %s name', (_label, name) => {
    expect(validateAccountForm({ code: '1', name, nature: 'debit' }).name).toBe(
      'El nombre es obligatorio.',
    )
  })

  it('rejects a name longer than 120 characters', () => {
    expect(
      validateAccountForm({ code: '1', name: 'a'.repeat(121), nature: 'debit' })
        .name,
    ).toBe('El nombre no puede superar 120 caracteres.')
  })

  it('requires a nature for a class', () => {
    expect(validateAccountForm({ code: '3', name: 'Patrimonio', nature: '' }).nature).toBe(
      'Elige la naturaleza de la clase.',
    )
  })

  it('reports every invalid field at once', () => {
    expect(validateAccountForm({ code: 'x', name: '', nature: '' })).toEqual({
      code: 'El código debe contener solo dígitos.',
      name: 'El nombre es obligatorio.',
    })
  })
})
