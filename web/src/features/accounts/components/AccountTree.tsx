import { useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { LEVEL_LABELS, NATURE_LABELS } from '../labels'
import type { AccountNode } from '../types'
import './account-tree.css'

interface AccountTreeProps {
  readonly nodes: readonly AccountNode[]
  readonly onAddChild: (parent: AccountNode) => void
  readonly onRequestDelete: (node: AccountNode) => void
}

interface VisibleItem {
  readonly node: AccountNode
  readonly parentCode: string | null
}

/** Cuentas visibles en orden de lectura, saltando las ramas contraídas. */
function flattenVisible(
  nodes: readonly AccountNode[],
  collapsed: ReadonlySet<string>,
  parentCode: string | null = null,
): VisibleItem[] {
  return nodes.flatMap((node) => [
    { node, parentCode },
    ...(collapsed.has(node.code) ? [] : flattenVisible(node.children, collapsed, node.code)),
  ])
}

function collectBranchCodes(nodes: readonly AccountNode[]): string[] {
  return nodes.flatMap((node) =>
    node.children.length > 0 ? [node.code, ...collectBranchCodes(node.children)] : [],
  )
}

function withToggled(set: ReadonlySet<string>, code: string): Set<string> {
  const next = new Set(set)
  if (next.has(code)) next.delete(code)
  else next.add(code)
  return next
}

/**
 * Árbol accesible (patrón WAI-ARIA "tree"): un solo elemento en el orden de
 * tabulación, navegación con flechas y acciones solo para la cuenta activa.
 */
export function AccountTree({ nodes, onAddChild, onRequestDelete }: AccountTreeProps) {
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set())
  const [activeCode, setActiveCode] = useState<string | null>(null)
  const itemRefs = useRef(new Map<string, HTMLLIElement>())

  const visible = useMemo(() => flattenVisible(nodes, collapsed), [nodes, collapsed])
  const tabStopCode = visible.some(({ node }) => node.code === activeCode)
    ? activeCode
    : (visible[0]?.node.code ?? null)

  const focusItem = (code: string | undefined) => {
    if (code !== undefined) itemRefs.current.get(code)?.focus()
  }

  const toggle = (code: string) => setCollapsed((current) => withToggled(current, code))

  function handleKeyDown(event: KeyboardEvent<HTMLLIElement>, node: AccountNode) {
    if (event.target !== event.currentTarget) return

    const index = visible.findIndex((item) => item.node.code === node.code)
    const isBranch = node.children.length > 0
    const isCollapsed = collapsed.has(node.code)

    switch (event.key) {
      case 'ArrowDown':
        focusItem(visible[index + 1]?.node.code)
        break
      case 'ArrowUp':
        focusItem(visible[index - 1]?.node.code)
        break
      case 'Home':
        focusItem(visible[0]?.node.code)
        break
      case 'End':
        focusItem(visible[visible.length - 1]?.node.code)
        break
      case 'ArrowRight':
        if (isBranch && isCollapsed) toggle(node.code)
        else if (isBranch) focusItem(visible[index + 1]?.node.code)
        break
      case 'ArrowLeft':
        if (isBranch && !isCollapsed) toggle(node.code)
        else focusItem(visible[index]?.parentCode ?? undefined)
        break
      case 'Enter':
      case ' ':
        if (isBranch) toggle(node.code)
        break
      case 'Delete':
        onRequestDelete(node)
        break
      default:
        return
    }
    event.preventDefault()
  }

  function renderNode(node: AccountNode, level: number) {
    const isBranch = node.children.length > 0
    const isCollapsed = collapsed.has(node.code)
    const isActive = node.code === tabStopCode && node.code === activeCode
    const labelId = `account-label-${node.code}`

    return (
      <li
        key={node.code}
        ref={(element) => {
          if (element) itemRefs.current.set(node.code, element)
          else itemRefs.current.delete(node.code)
        }}
        role="treeitem"
        aria-level={level}
        aria-expanded={isBranch ? !isCollapsed : undefined}
        aria-labelledby={labelId}
        tabIndex={node.code === tabStopCode ? 0 : -1}
        className="account-tree__item"
        onFocus={(event) => {
          if (event.target === event.currentTarget) setActiveCode(node.code)
        }}
        onKeyDown={(event) => handleKeyDown(event, node)}
      >
        <div
          className="account-tree__row"
          data-active={isActive || undefined}
          style={{ '--level': level } as CSSProperties}
          onClick={() => {
            setActiveCode(node.code)
            itemRefs.current.get(node.code)?.focus()
          }}
        >
          {/* Solo puntero: con teclado se expande con las flechas, Enter o la barra de herramientas. */}
          <span
            className="account-tree__marker"
            data-branch={isBranch || undefined}
            data-open={(isBranch && !isCollapsed) || undefined}
            aria-hidden="true"
            onClick={
              isBranch
                ? (event) => {
                    event.stopPropagation()
                    setActiveCode(node.code)
                    toggle(node.code)
                  }
                : undefined
            }
          />
          <span id={labelId} className="account-tree__label">
            <span className="account-tree__code">{node.code}</span>{' '}
            <span className="account-tree__name">{node.name}</span>
          </span>
          <span className="account-tree__leader" aria-hidden="true" />
          <span className={`account-tree__nature account-tree__nature--${node.nature}`}>
            {NATURE_LABELS[node.nature]}
          </span>
          <span className="account-tree__level">{LEVEL_LABELS[node.level]}</span>
        </div>

        {isActive && (
          <div className="account-tree__detail" style={{ '--level': level } as CSSProperties}>
            <p>
              {node.acceptsMovements
                ? 'Sin cuentas hijas: admite movimientos.'
                : 'Tiene cuentas hijas: solo las agrupa.'}
            </p>
            <div className="account-tree__actions">
              {node.level !== 'subaccount' && (
                <button
                  type="button"
                  className="button button--quiet"
                  aria-label={`Agregar hija de ${node.code} ${node.name}`}
                  onClick={() => onAddChild(node)}
                >
                  Agregar hija
                </button>
              )}
              <button
                type="button"
                className="button button--quiet button--danger"
                aria-label={`Eliminar ${node.code} ${node.name}`}
                onClick={() => onRequestDelete(node)}
              >
                Eliminar
              </button>
            </div>
          </div>
        )}

        {isBranch && !isCollapsed && (
          <ul role="group" className="account-tree__group">
            {node.children.map((child) => renderNode(child, level + 1))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <div className="account-tree">
      <div className="account-tree__toolbar">
        <button type="button" className="button button--quiet" onClick={() => setCollapsed(new Set())}>
          Expandir todo
        </button>
        <button
          type="button"
          className="button button--quiet"
          onClick={() => setCollapsed(new Set(collectBranchCodes(nodes)))}
        >
          Contraer todo
        </button>
      </div>
      <ul role="tree" aria-label="Catálogo de cuentas" className="account-tree__list">
        {nodes.map((node) => renderNode(node, 1))}
      </ul>
    </div>
  )
}
