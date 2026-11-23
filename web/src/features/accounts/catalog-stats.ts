import type { AccountNode } from './types'

export interface CatalogSummary {
  readonly total: number
  readonly classes: number
  readonly withMovements: number
}

/** Cuenta cuentas a cualquier profundidad, las clases y las que admiten movimientos. */
export function summarizeCatalog(nodes: readonly AccountNode[]): CatalogSummary {
  return nodes.reduce<CatalogSummary>(
    (summary, node) => {
      const inner = summarizeCatalog(node.children)
      return {
        total: summary.total + 1 + inner.total,
        classes: summary.classes + (node.level === 'class' ? 1 : 0) + inner.classes,
        withMovements:
          summary.withMovements + (node.acceptsMovements ? 1 : 0) + inner.withMovements,
      }
    },
    { total: 0, classes: 0, withMovements: 0 },
  )
}

export function describeCatalog({ total, classes, withMovements }: CatalogSummary): string {
  const accounts = `${total} ${total === 1 ? 'cuenta' : 'cuentas'}`
  const classLabel = `${classes} ${classes === 1 ? 'clase' : 'clases'}`
  const movements = `${withMovements} ${withMovements === 1 ? 'admite' : 'admiten'} movimientos`

  return `${accounts} en ${classLabel}; ${movements}.`
}
