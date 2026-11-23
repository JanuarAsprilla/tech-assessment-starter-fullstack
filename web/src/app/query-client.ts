import { QueryClient } from '@tanstack/react-query'

const STALE_TIME_MS = 30_000

/** Fábrica, no singleton: cada prueba crea su propio cliente y no comparte caché. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: 1, refetchOnWindowFocus: false, staleTime: STALE_TIME_MS },
      mutations: { retry: false },
    },
  })
}
