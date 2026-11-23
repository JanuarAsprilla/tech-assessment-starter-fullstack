import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { sampleTree } from '../../../test/fixtures'
import { AccountTree } from './AccountTree'

function setup() {
  const onAddChild = vi.fn()
  const onRequestDelete = vi.fn()
  const user = userEvent.setup()

  render(
    <AccountTree
      nodes={sampleTree()}
      onAddChild={onAddChild}
      onRequestDelete={onRequestDelete}
    />,
  )

  return { user, onAddChild, onRequestDelete }
}

const item = (name: RegExp) => screen.getByRole('treeitem', { name })
const maybeItem = (name: RegExp) => screen.queryByRole('treeitem', { name })

describe('AccountTree', () => {
  describe('structure', () => {
    it('renders every account as a treeitem inside a labelled tree', () => {
      setup()

      expect(screen.getByRole('tree', { name: 'Catálogo de cuentas' })).toBeInTheDocument()
      expect(screen.getAllByRole('treeitem')).toHaveLength(8)
    })

    it('exposes the depth of each account to assistive technology', () => {
      setup()

      expect(item(/^1 Activo$/)).toHaveAttribute('aria-level', '1')
      expect(item(/^1105 Caja$/)).toHaveAttribute('aria-level', '3')
      expect(item(/^110505 Caja general$/)).toHaveAttribute('aria-level', '4')
    })

    it('marks branches as expandable and leaves as plain items', () => {
      setup()

      expect(item(/^1105 Caja$/)).toHaveAttribute('aria-expanded', 'true')
      expect(item(/^110505 Caja general$/)).not.toHaveAttribute('aria-expanded')
    })

    it('states nature and level in words, never by color alone', () => {
      setup()

      expect(screen.getAllByText('Débito')).toHaveLength(5)
      expect(screen.getAllByText('Crédito')).toHaveLength(3)
      expect(screen.getAllByText('Clase')).toHaveLength(2)
      expect(screen.getAllByText('Subcuenta')).toHaveLength(2)
    })

    it('keeps a single item in the tab order', () => {
      setup()

      const tabbable = screen
        .getAllByRole('treeitem')
        .filter((element) => element.getAttribute('tabindex') === '0')

      expect(tabbable).toHaveLength(1)
    })
  })

  describe('selection', () => {
    it('selects nothing on its own, not even when an item receives focus', () => {
      setup()

      act(() => item(/^1 Activo$/).focus())

      expect(item(/^1 Activo$/)).toHaveFocus()
      expect(screen.queryByRole('button', { name: /^(Eliminar|Agregar hija)/ })).not.toBeInTheDocument()
      expect(screen.queryByText(/cuentas hijas|admite movimientos/)).not.toBeInTheDocument()
    })

    it('selects an account once the user navigates to it with the keyboard', async () => {
      const { user } = setup()
      item(/^1 Activo$/).focus()

      await user.keyboard('{ArrowDown}')

      expect(screen.getByRole('button', { name: 'Eliminar 11 Disponible' })).toBeInTheDocument()
    })

    it('selects an account when the user clicks it', async () => {
      const { user } = setup()

      await user.click(screen.getByText('Pasivo'))

      expect(screen.getByRole('button', { name: 'Eliminar 2 Pasivo' })).toBeInTheDocument()
    })
  })

  describe('expand and collapse', () => {
    const markerOf = (name: string) =>
      screen.getByText(name).closest('.account-tree__row')!.querySelector('.account-tree__marker')!

    it('collapses a branch when its chevron is clicked and opens it again', async () => {
      const { user } = setup()

      await user.click(markerOf('Disponible'))
      expect(item(/^11 Disponible$/)).toHaveAttribute('aria-expanded', 'false')
      expect(maybeItem(/^1105 Caja$/)).not.toBeInTheDocument()

      await user.click(markerOf('Disponible'))
      expect(item(/^11 Disponible$/)).toHaveAttribute('aria-expanded', 'true')
      expect(maybeItem(/^1105 Caja$/)).toBeInTheDocument()
    })

    it('only selects a branch when its row is clicked, so its children stay visible', async () => {
      const { user } = setup()

      await user.click(screen.getByText('Disponible'))

      expect(item(/^11 Disponible$/)).toHaveAttribute('aria-expanded', 'true')
      expect(maybeItem(/^1105 Caja$/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Eliminar 11 Disponible' })).toBeInTheDocument()
    })

    it('collapses and expands everything from the toolbar', async () => {
      const { user } = setup()

      await user.click(screen.getByRole('button', { name: 'Contraer todo' }))
      expect(screen.getAllByRole('treeitem')).toHaveLength(2)

      await user.click(screen.getByRole('button', { name: 'Expandir todo' }))
      expect(screen.getAllByRole('treeitem')).toHaveLength(8)
    })
  })

  describe('keyboard', () => {
    it('moves through the visible accounts with the arrow keys', async () => {
      const { user } = setup()
      item(/^1 Activo$/).focus()

      await user.keyboard('{ArrowDown}')
      expect(item(/^11 Disponible$/)).toHaveFocus()

      await user.keyboard('{ArrowUp}')
      expect(item(/^1 Activo$/)).toHaveFocus()
    })

    it('jumps to the first and last visible account with Home and End', async () => {
      const { user } = setup()
      item(/^1105 Caja$/).focus()

      await user.keyboard('{End}')
      expect(item(/^2105 Bancos nacionales$/)).toHaveFocus()

      await user.keyboard('{Home}')
      expect(item(/^1 Activo$/)).toHaveFocus()
    })

    it('ArrowLeft collapses an open branch and then moves to the parent', async () => {
      const { user } = setup()
      item(/^11 Disponible$/).focus()

      await user.keyboard('{ArrowLeft}')
      expect(item(/^11 Disponible$/)).toHaveAttribute('aria-expanded', 'false')

      await user.keyboard('{ArrowLeft}')
      expect(item(/^1 Activo$/)).toHaveFocus()
    })

    it('ArrowRight opens a closed branch and then enters its first child', async () => {
      const { user } = setup()
      item(/^11 Disponible$/).focus()
      await user.keyboard('{ArrowLeft}')

      await user.keyboard('{ArrowRight}')
      expect(item(/^11 Disponible$/)).toHaveAttribute('aria-expanded', 'true')

      await user.keyboard('{ArrowRight}')
      expect(item(/^1105 Caja$/)).toHaveFocus()
    })

    it('toggles a branch with Enter', async () => {
      const { user } = setup()
      item(/^11 Disponible$/).focus()

      await user.keyboard('{Enter}')

      expect(item(/^11 Disponible$/)).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('actions', () => {
    it('offers actions only for the active account', async () => {
      const { user } = setup()
      expect(screen.queryByRole('button', { name: /^Eliminar/ })).not.toBeInTheDocument()

      await user.click(screen.getByText('Caja general'))

      expect(
        screen.getByRole('button', { name: 'Eliminar 110505 Caja general' }),
      ).toBeInTheDocument()
      expect(screen.getAllByRole('button', { name: /^Eliminar/ })).toHaveLength(1)
    })

    it('explains what the active account can do', async () => {
      const { user } = setup()

      await user.click(screen.getByText('Caja general'))
      expect(screen.getByText('Sin cuentas hijas: admite movimientos.')).toBeInTheDocument()

      await user.click(screen.getByText('Caja', { selector: '.account-tree__name' }))
      expect(screen.getByText('Tiene cuentas hijas: solo las agrupa.')).toBeInTheDocument()
    })

    it('does not offer to add children below a subaccount', async () => {
      const { user } = setup()

      await user.click(screen.getByText('Caja general'))

      expect(screen.queryByRole('button', { name: /^Agregar hija/ })).not.toBeInTheDocument()
    })

    it('asks to add a child to the active account', async () => {
      const { user, onAddChild } = setup()

      await user.click(screen.getByText('Disponible'))
      await user.click(screen.getByRole('button', { name: 'Agregar hija de 11 Disponible' }))

      expect(onAddChild).toHaveBeenCalledWith(expect.objectContaining({ code: '11' }))
    })

    it('does not change what is expanded when an action is pressed', async () => {
      const { user } = setup()

      await user.click(screen.getByText('Disponible'))
      await user.click(screen.getByRole('button', { name: 'Agregar hija de 11 Disponible' }))

      expect(item(/^11 Disponible$/)).toHaveAttribute('aria-expanded', 'true')
      expect(maybeItem(/^1105 Caja$/)).toBeInTheDocument()
    })

    it('asks to delete the active account', async () => {
      const { user, onRequestDelete } = setup()

      await user.click(screen.getByText('Caja menor'))
      await user.click(screen.getByRole('button', { name: 'Eliminar 110510 Caja menor' }))

      expect(onRequestDelete).toHaveBeenCalledWith(expect.objectContaining({ code: '110510' }))
    })

    it('asks to delete the focused account with the Delete key', async () => {
      const { user, onRequestDelete } = setup()
      item(/^110505 Caja general$/).focus()

      await user.keyboard('{Delete}')

      expect(onRequestDelete).toHaveBeenCalledWith(expect.objectContaining({ code: '110505' }))
    })

    it('keeps the actions inside the row of the account they belong to', async () => {
      const { user } = setup()

      await user.click(screen.getByText('Caja menor'))

      const row = item(/^110510 Caja menor$/)
      expect(
        within(row).getByRole('button', { name: 'Eliminar 110510 Caja menor' }),
      ).toBeInTheDocument()
    })
  })
})
