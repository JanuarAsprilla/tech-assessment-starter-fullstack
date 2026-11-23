import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteAccount } from '../api/accounts-api'
import type { ApiError } from '../api/api-error'
import { accountKeys } from './account-keys'

/** Elimina una cuenta por código y refresca el árbol. */
export function useDeleteAccount() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: deleteAccount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.tree }),
  })
}
