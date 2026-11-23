import { useQuery } from '@tanstack/react-query'
import { fetchCatalogTree } from '../api/accounts-api'
import type { ApiError } from '../api/api-error'
import type { AccountNode } from '../types'
import { accountKeys } from './account-keys'

export function useCatalogTree() {
  return useQuery<AccountNode[], ApiError>({
    queryKey: accountKeys.tree,
    queryFn: fetchCatalogTree,
  })
}
