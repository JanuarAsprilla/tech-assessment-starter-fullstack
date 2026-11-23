import { apiUrl } from '../../../api'
import type { AccountNode, AccountView, CreateAccountInput } from '../types'
import { ApiError } from './api-error'

/** Único punto que habla con `fetch`: convierte toda falla en un `ApiError`. */
async function send(path: string, init: RequestInit): Promise<Response> {
  let response: Response
  try {
    response = await fetch(apiUrl(path), init)
  } catch {
    throw ApiError.network()
  }

  if (!response.ok) throw await ApiError.fromResponse(response)
  return response
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    throw ApiError.unknown(response.status)
  }
}

export async function fetchCatalogTree(): Promise<AccountNode[]> {
  const response = await send('/accounts/tree', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  const body = await readJson(response)
  if (!Array.isArray(body)) throw ApiError.unknown(response.status)
  return body as AccountNode[]
}

export async function createAccount(input: CreateAccountInput): Promise<AccountView> {
  const response = await send('/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(input),
  })

  return (await readJson(response)) as AccountView
}

export async function deleteAccount(code: string): Promise<void> {
  await send(`/accounts/${encodeURIComponent(code)}`, { method: 'DELETE' })
}
