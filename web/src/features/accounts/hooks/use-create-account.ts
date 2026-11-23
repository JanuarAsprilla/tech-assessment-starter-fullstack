import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createAccount } from '../api/accounts-api'
import type { ApiError } from '../api/api-error'
import type { AccountView, CreateAccountInput } from '../types'
import { accountKeys } from './account-keys'

/** Crea una cuenta y refresca el árbol, en vez de recargarlo a mano. */
export function useCreateAccount() {
  const queryClient = useQueryClient()

  return useMutation<AccountView, ApiError, CreateAccountInput>({
    mutationFn: createAccount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.tree }),
  })
}
