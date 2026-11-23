import { screen, waitFor } from '@testing-library/react'
import { apiError, json, stubApi } from '../../../test/mock-api'
import { renderWithClient } from '../../../test/render'
import { AccountForm } from './AccountForm'

const field = (name: string) => screen.getByRole('textbox', { name })
const submit = () => screen.getByRole('button', { name: 'Crear cuenta' })

describe('AccountForm', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('validation before sending', () => {
    it('shows the errors, focuses the first invalid field and never calls the API', async () => {
      const fetchMock = stubApi(() => json({}))
      const { user } = renderWithClient(<AccountForm />)

      await user.click(submit())

      expect(screen.getByText('El código es obligatorio.')).toBeInTheDocument()
      expect(screen.getByText('El nombre es obligatorio.')).toBeInTheDocument()
      expect(field('Código')).toHaveAttribute('aria-invalid', 'true')
      expect(field('Código')).toHaveFocus()
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('links each error to its field for screen readers', async () => {
      stubApi(() => json({}))
      const { user } = renderWithClient(<AccountForm />)

      await user.click(submit())

      expect(field('Nombre')).toHaveAccessibleDescription('El nombre es obligatorio.')
    })

    it('clears the error of a field as soon as the user edits it', async () => {
      stubApi(() => json({}))
      const { user } = renderWithClient(<AccountForm />)
      await user.click(submit())

      await user.type(field('Nombre'), 'Caja')

      expect(screen.queryByText('El nombre es obligatorio.')).not.toBeInTheDocument()
      expect(field('Nombre')).not.toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('nature', () => {
    it('asks for the nature only when the code is a class', async () => {
      stubApi(() => json({}))
      const { user } = renderWithClient(<AccountForm />)
      expect(screen.queryByRole('group', { name: 'Naturaleza' })).not.toBeInTheDocument()

      await user.type(field('Código'), '1')
      expect(screen.getByRole('group', { name: 'Naturaleza' })).toBeInTheDocument()

      await user.type(field('Código'), '1')
      expect(screen.queryByRole('group', { name: 'Naturaleza' })).not.toBeInTheDocument()
    })

    it('requires choosing it for a class', async () => {
      stubApi(() => json({}))
      const { user } = renderWithClient(<AccountForm />)

      await user.type(field('Código'), '3')
      await user.type(field('Nombre'), 'Patrimonio')
      await user.click(submit())

      expect(screen.getByText('Elige la naturaleza de la clase.')).toBeInTheDocument()
    })
  })

  describe('creating', () => {
    it('sends the nature of a class, confirms and clears the form', async () => {
      const created = { code: '3', name: 'Patrimonio', nature: 'credit', level: 'class' }
      const fetchMock = stubApi(() => json(created, 201))
      const onCreated = vi.fn()
      const { user } = renderWithClient(<AccountForm onCreated={onCreated} />)

      await user.type(field('Código'), '3')
      await user.type(field('Nombre'), 'Patrimonio')
      await user.click(screen.getByRole('radio', { name: 'Crédito' }))
      await user.click(submit())

      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Cuenta 3 creada.'))
      expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
        code: '3',
        name: 'Patrimonio',
        nature: 'credit',
      })
      expect(onCreated).toHaveBeenCalledWith(created)
      expect(field('Código')).toHaveValue('')
      expect(field('Nombre')).toHaveValue('')
    })

    it('omits the nature for a child account, which inherits it', async () => {
      const fetchMock = stubApi(() =>
        json({ code: '110515', name: 'Caja principal', nature: 'debit', level: 'subaccount' }, 201),
      )
      const { user } = renderWithClient(<AccountForm />)

      await user.type(field('Código'), '110515')
      await user.type(field('Nombre'), 'Caja principal')
      await user.click(submit())

      await waitFor(() => expect(fetchMock).toHaveBeenCalled())
      expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
        code: '110515',
        name: 'Caja principal',
      })
    })

    it('disables the button and says so while the request is in flight', async () => {
      stubApi(() => new Promise<Response>(() => undefined))
      const { user } = renderWithClient(<AccountForm />)

      await user.type(field('Código'), '1105')
      await user.type(field('Nombre'), 'Caja')
      await user.click(submit())

      const pending = await screen.findByRole('button', { name: 'Creando…' })
      expect(pending).toBeDisabled()
    })
  })

  describe('errors returned by the API', () => {
    it('shows them next to the field they belong to', async () => {
      stubApi(() =>
        apiError(409, 'ACCOUNT_CODE_ALREADY_EXISTS', 'Ya existe una cuenta con el código 1105.', 'code'),
      )
      const { user } = renderWithClient(<AccountForm />)

      await user.type(field('Código'), '1105')
      await user.type(field('Nombre'), 'Otra caja')
      await user.click(submit())

      await waitFor(() => expect(field('Código')).toHaveAttribute('aria-invalid', 'true'))
      expect(field('Código')).toHaveAccessibleDescription(
        /Ya existe una cuenta con el código 1105\./,
      )
      expect(field('Código')).toHaveFocus()
    })

    it('keeps what the user typed so they can fix it', async () => {
      stubApi(() => apiError(422, 'PARENT_NOT_FOUND', 'La cuenta padre 31 no existe.', 'code'))
      const { user } = renderWithClient(<AccountForm />)

      await user.type(field('Código'), '3105')
      await user.type(field('Nombre'), 'Capital')
      await user.click(submit())

      await screen.findByText('La cuenta padre 31 no existe.')
      expect(field('Código')).toHaveValue('3105')
      expect(field('Nombre')).toHaveValue('Capital')
    })

    it('announces an error that has no field as an alert', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
      const { user } = renderWithClient(<AccountForm />)

      await user.type(field('Código'), '1105')
      await user.type(field('Nombre'), 'Caja')
      await user.click(submit())

      expect(await screen.findByRole('alert')).toHaveTextContent(/No se pudo conectar/)
    })
  })

  describe('code helper', () => {
    it('prefills the code and can take the focus when it is a child of another account', () => {
      stubApi(() => json({}))
      renderWithClient(<AccountForm initialCode="1105" focusOnMount />)

      expect(field('Código')).toHaveValue('1105')
      expect(field('Código')).toHaveFocus()
    })

    it('explains the level of the code being typed', async () => {
      stubApi(() => json({}))
      const { user } = renderWithClient(<AccountForm />)
      expect(field('Código')).toHaveAccessibleDescription(/1, 2, 4 o 6 dígitos/)

      await user.type(field('Código'), '110515')

      expect(field('Código')).toHaveAccessibleDescription('Subcuenta dentro de 1105.')
    })
  })
})
