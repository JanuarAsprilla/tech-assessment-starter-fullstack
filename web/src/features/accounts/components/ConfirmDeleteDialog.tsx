import { useEffect, useRef } from 'react'
import type { ApiError } from '../api/api-error'
import type { AccountNode } from '../types'
import './confirm-delete-dialog.css'

interface ConfirmDeleteDialogProps {
  /** Cuenta a eliminar. Con `null` el diálogo está cerrado. */
  readonly node: AccountNode | null
  readonly isPending: boolean
  readonly error: ApiError | null
  readonly onConfirm: () => void
  readonly onCancel: () => void
}

/** Diálogo modal nativo: atrapa el foco, cierra con Esc y devuelve el foco a quien lo abrió. */
export function ConfirmDeleteDialog({
  node,
  isPending,
  error,
  onConfirm,
  onCancel,
}: ConfirmDeleteDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const isOpen = node !== null

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) {
      dialog.showModal()
      cancelRef.current?.focus()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  return (
    <dialog
      ref={dialogRef}
      className="confirm-delete"
      aria-labelledby="confirm-delete-title"
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      {node && (
        <div className="confirm-delete__body">
          <h2 id="confirm-delete-title">Eliminar cuenta {node.code}</h2>
          <p>
            Se eliminará <strong>{node.name}</strong> del catálogo. Esta acción no se puede
            deshacer.
          </p>

          {error && (
            <p role="alert" className="confirm-delete__error">
              {error.message}
            </p>
          )}

          <div className="confirm-delete__actions">
            <button ref={cancelRef} type="button" className="button button--quiet" onClick={onCancel}>
              Cancelar
            </button>
            <button
              type="button"
              className="button button--danger-solid"
              onClick={onConfirm}
              disabled={isPending}
              aria-busy={isPending || undefined}
            >
              {isPending ? 'Eliminando…' : 'Eliminar cuenta'}
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
