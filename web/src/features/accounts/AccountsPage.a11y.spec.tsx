import { screen, within } from '@testing-library/react'
import axe from 'axe-core'
import { sampleTree } from '../../test/fixtures'
import { json, stubApi } from '../../test/mock-api'
import { renderWithClient } from '../../test/render'
import { AccountsPage } from './AccountsPage'

/**
 * Reglas de WCAG con axe-core sobre los estados clave. El contraste de color queda fuera
 * porque jsdom no calcula estilos reales: se mide aparte con los colores de los tokens.
 */
async function violationsIn(container: HTMLElement): Promise<string[]> {
  const results = await axe.run(container, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    rules: { 'color-contrast': { enabled: false } },
  })

  return results.violations.map(
    ({ id, help, nodes }) => `${id}: ${help} → ${nodes.map((node) => node.target.join(' ')).join(' | ')}`,
  )
}

describe('AccountsPage accessibility (axe)', () => {
  beforeEach(() => {
    stubApi(() => json(sampleTree()))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('has no violations in the default state', async () => {
    const { container } = renderWithClient(<AccountsPage />)
    await screen.findByRole('tree')

    expect(await violationsIn(container)).toEqual([])
  })

  it('has no violations while the catalog is loading', async () => {
    const { container } = renderWithClient(<AccountsPage />)

    expect(await violationsIn(container)).toEqual([])
    await screen.findByRole('tree')
  })

  it('has no violations when the form shows validation errors', async () => {
    const { container, user } = renderWithClient(<AccountsPage />)
    await screen.findByRole('tree')
    await user.type(screen.getByRole('textbox', { name: 'Código' }), '3')

    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(screen.getByText('El nombre es obligatorio.')).toBeInTheDocument()
    expect(await violationsIn(container)).toEqual([])
  })

  it('has no violations with an account selected and its actions visible', async () => {
    const { container, user } = renderWithClient(<AccountsPage />)
    await screen.findByRole('tree')

    await user.click(screen.getByText('Caja general'))

    expect(screen.getByRole('button', { name: 'Eliminar 110505 Caja general' })).toBeInTheDocument()
    expect(await violationsIn(container)).toEqual([])
  })

  it('has no violations with the delete dialog open', async () => {
    const { container, user } = renderWithClient(<AccountsPage />)
    await screen.findByRole('tree')
    await user.click(screen.getByText('Caja menor'))
    await user.click(screen.getByRole('button', { name: 'Eliminar 110510 Caja menor' }))

    const dialog = screen.getByRole('dialog', { name: 'Eliminar cuenta 110510' })

    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    expect(await violationsIn(container)).toEqual([])
  })
})
