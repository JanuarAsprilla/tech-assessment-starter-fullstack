import { useState } from 'react'
import { AccountForm } from './components/AccountForm'
import { AccountTree } from './components/AccountTree'
import { ConfirmDeleteDialog } from './components/ConfirmDeleteDialog'
import { useCatalogTree } from './hooks/use-catalog-tree'
import { useDeleteAccount } from './hooks/use-delete-account'
import type { AccountNode } from './types'
import './accounts-page.css'

interface FormDraft {
  readonly code: string
  /** Cambia cada vez que se pide agregar una hija, para reiniciar el formulario con ese código. */
  readonly token: number
}

export function AccountsPage() {
  const tree = useCatalogTree()
  const deletion = useDeleteAccount()
  const [pendingDelete, setPendingDelete] = useState<AccountNode | null>(null)
  const [draft, setDraft] = useState<FormDraft>({ code: '', token: 0 })

  function closeDialog() {
    setPendingDelete(null)
    deletion.reset()
  }

  function confirmDelete() {
    if (pendingDelete) deletion.mutate(pendingDelete.code, { onSuccess: closeDialog })
  }

  return (
    <>
      <a className="skip-link" href="#catalog-heading">
        Saltar al catálogo
      </a>

      <header className="page-header">
        <h1>Catálogo de cuentas</h1>
        <p>
          La lista jerárquica con la que se clasifican los registros contables: clases, grupos,
          cuentas y subcuentas.
        </p>
      </header>

      <main className="page-main">
        <section className="catalog" aria-labelledby="catalog-heading">
          <h2 id="catalog-heading">Estructura</h2>
          {renderCatalog()}
        </section>

        <section className="slip" aria-labelledby="slip-heading">
          <h2 id="slip-heading">Nueva cuenta</h2>
          <AccountForm key={draft.token} initialCode={draft.code} focusOnMount={draft.token > 0} />
        </section>
      </main>

      <ConfirmDeleteDialog
        node={pendingDelete}
        isPending={deletion.isPending}
        error={deletion.error}
        onConfirm={confirmDelete}
        onCancel={closeDialog}
      />
    </>
  )

  function renderCatalog() {
    if (tree.isPending) {
      return (
        <p role="status" className="catalog__message">
          Cargando el catálogo…
        </p>
      )
    }

    if (tree.isError) {
      return (
        <div role="alert" className="catalog__message catalog__message--error">
          <p>{tree.error.message}</p>
          <button type="button" className="button button--primary" onClick={() => tree.refetch()}>
            Reintentar
          </button>
        </div>
      )
    }

    if (tree.data.length === 0) {
      return (
        <p className="catalog__message">
          El catálogo está vacío. Crea la primera clase con el formulario.
        </p>
      )
    }

    return (
      <AccountTree
        nodes={tree.data}
        onAddChild={(parent) => setDraft((current) => ({ code: parent.code, token: current.token + 1 }))}
        onRequestDelete={setPendingDelete}
      />
    )
  }
}
