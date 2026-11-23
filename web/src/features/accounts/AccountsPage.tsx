import { BookOpenText } from 'lucide-react'
import { useState } from 'react'
import { describeCatalog, summarizeCatalog } from './catalog-stats'
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

  const summary = tree.data && tree.data.length > 0 ? summarizeCatalog(tree.data) : null

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

      <main className="grid min-h-svh w-full grid-cols-1 bg-background text-foreground motion-reduce:**:transition-none lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-2 lg:p-2">
        <div className="flex flex-col items-center justify-center px-6 py-12 sm:py-16">
          <div className="flex w-full max-w-sm flex-col gap-8">
            <header className="flex flex-col items-center gap-4 text-center">
              <div className="relative flex size-14 items-center justify-center">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 scale-125 rounded-full bg-primary/10 mask-b-from-20% mask-b-to-100%"
                />
                <div className="relative z-10 flex size-14 items-center justify-center rounded-full bg-card ring ring-primary/10 ring-inset">
                  <BookOpenText aria-hidden="true" className="size-6 text-primary" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-medium tracking-tight text-balance sm:text-4xl">
                  Catálogo de cuentas
                </h1>
                <p className="mt-2 text-base text-muted-foreground">
                  La lista jerárquica con la que se clasifican los registros contables.
                </p>
              </div>
            </header>

            <section aria-labelledby="slip-heading" className="flex flex-col gap-4">
              <h2 id="slip-heading">Nueva cuenta</h2>
              <AccountForm
                key={draft.token}
                initialCode={draft.code}
                focusOnMount={draft.token > 0}
              />
            </section>
          </div>
        </div>

        <section
          aria-labelledby="catalog-heading"
          className="relative flex flex-col overflow-hidden rounded-4xl bg-muted p-6 sm:p-10"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-linear-to-t from-primary/15 via-primary/5 to-transparent"
          />
          <div className="relative flex flex-col gap-6">
            <div>
              <h2 id="catalog-heading">Estructura</h2>
              {summary && (
                <p className="mt-1 text-sm text-muted-foreground">{describeCatalog(summary)}</p>
              )}
            </div>
            <div className="ledger-lines">{renderCatalog()}</div>
          </div>
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
