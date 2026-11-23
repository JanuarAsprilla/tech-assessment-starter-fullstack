import { screen, waitFor, within } from '@testing-library/react'
import { sampleTree } from '../../test/fixtures'
import { apiError, json, stubApi } from '../../test/mock-api'
import { renderWithClient } from '../../test/render'
import { AccountsPage } from './AccountsPage'
import type { AccountNode } from './types'

const serverError = () =>
  json(
    { code: 'INTERNAL_ERROR', message: 'Ocurrió un error inesperado. Intenta de nuevo.', errors: [] },
    500,
  )

function removeNode(nodes: readonly AccountNode[], code: string): AccountNode[] {
  return nodes
    .filter((node) => node.code !== code)
    .map((node) => ({ ...node, children: removeNode(node.children, code) }))
}

describe('AccountsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('loading the catalog', () => {
    it('announces the loading state and then shows the tree', async () => {
      stubApi(() => json(sampleTree()))
      renderWithClient(<AccountsPage />)

      const catalog = screen.getByRole('region', { name: 'Estructura' })
      expect(within(catalog).getByRole('status')).toHaveTextContent('Cargando el catálogo…')
      expect(await screen.findByRole('tree')).toBeInTheDocument()
      expect(within(catalog).queryByRole('status')).not.toBeInTheDocument()
    })

    it('explains the failure and lets the user retry', async () => {
      let healthy = false
      stubApi(() => (healthy ? json(sampleTree()) : serverError()))
      const { user } = renderWithClient(<AccountsPage />)

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Ocurrió un error inesperado. Intenta de nuevo.',
      )

      healthy = true
      await user.click(screen.getByRole('button', { name: 'Reintentar' }))

      expect(await screen.findByRole('tree')).toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('invites the user to create the first class when the catalog is empty', async () => {
      stubApi(() => json([]))
      renderWithClient(<AccountsPage />)

      expect(
        await screen.findByText('El catálogo está vacío. Crea la primera clase con el formulario.'),
      ).toBeInTheDocument()
      expect(screen.queryByRole('tree')).not.toBeInTheDocument()
    })
  })

  describe('deleting', () => {
    async function openDeleteDialogFor(
      user: ReturnType<typeof renderWithClient>['user'],
      name: string,
      code: string,
    ) {
      await screen.findByRole('tree')
      await user.click(screen.getByText(name))
      await user.click(screen.getByRole('button', { name: `Eliminar ${code} ${name}` }))
      return screen.getByRole('dialog', { name: `Eliminar cuenta ${code}` })
    }

    it('deletes an account after confirming and refreshes the tree', async () => {
      let tree = sampleTree()
      stubApi(({ method, path }) => {
        if (method === 'DELETE') {
          tree = removeNode(tree, path.split('/').pop() ?? '')
          return new Response(null, { status: 204 })
        }
        return json(tree)
      })
      const { user } = renderWithClient(<AccountsPage />)

      const dialog = await openDeleteDialogFor(user, 'Caja menor', '110510')
      expect(within(dialog).getByText(/Caja menor/)).toBeInTheDocument()
      await user.click(within(dialog).getByRole('button', { name: 'Eliminar cuenta' }))

      await waitFor(() => expect(screen.queryByText('Caja menor')).not.toBeInTheDocument())
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('keeps the dialog open and explains why when the account has children', async () => {
      stubApi(({ method }) =>
        method === 'DELETE'
          ? apiError(
              409,
              'ACCOUNT_HAS_CHILDREN',
              'No se puede eliminar la cuenta 1105 porque tiene cuentas hijas.',
            )
          : json(sampleTree()),
      )
      const { user } = renderWithClient(<AccountsPage />)

      const dialog = await openDeleteDialogFor(user, 'Caja', '1105')
      await user.click(within(dialog).getByRole('button', { name: 'Eliminar cuenta' }))

      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        'No se puede eliminar la cuenta 1105 porque tiene cuentas hijas.',
      )
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByRole('treeitem', { name: /^1105 Caja$/, hidden: true })).toBeInTheDocument()

      await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('does not touch the API when the user cancels', async () => {
      const fetchMock = stubApi(() => json(sampleTree()))
      const { user } = renderWithClient(<AccountsPage />)

      const dialog = await openDeleteDialogFor(user, 'Caja menor', '110510')
      await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

      expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('creating', () => {
    it('prefills the code of a child from the tree and moves the focus to the form', async () => {
      stubApi(() => json(sampleTree()))
      const { user } = renderWithClient(<AccountsPage />)

      await screen.findByRole('tree')
      await user.click(screen.getByText('Caja', { selector: '.account-tree__name' }))
      await user.click(screen.getByRole('button', { name: 'Agregar hija de 1105 Caja' }))

      const code = screen.getByRole('textbox', { name: 'Código' })
      expect(code).toHaveValue('1105')
      expect(code).toHaveFocus()
    })

    it('shows a new account in the tree without reloading the page', async () => {
      let tree = sampleTree()
      stubApi(({ method, body }) => {
        if (method === 'POST') {
          const input = body as { code: string; name: string; nature: 'credit' }
          tree = [
            ...tree,
            { ...input, level: 'class', acceptsMovements: true, children: [] },
          ]
          return json({ ...input, level: 'class' }, 201)
        }
        return json(tree)
      })
      const { user } = renderWithClient(<AccountsPage />)

      await screen.findByRole('tree')
      await user.type(screen.getByRole('textbox', { name: 'Código' }), '3')
      await user.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Patrimonio')
      await user.click(screen.getByRole('radio', { name: 'Crédito' }))
      await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

      expect(await screen.findByRole('treeitem', { name: /^3 Patrimonio$/ })).toBeInTheDocument()
    })
  })
})
