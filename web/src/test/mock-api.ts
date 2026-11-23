interface MockRequest {
  readonly method: string
  readonly path: string
  readonly body: unknown
}

type Handler = (request: MockRequest) => Response | Promise<Response>

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function apiError(
  status: number,
  code: string,
  message: string,
  field: string | null = null,
): Response {
  return json({ code, message, errors: [{ field, message }] }, status)
}

/** Sustituye `fetch` por un manejador, para probar la UI sin servidor. */
export function stubApi(handler: Handler) {
  const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
    const url = new URL(String(input))
    const raw = init?.body
    return handler({
      method: init?.method ?? 'GET',
      path: url.pathname,
      body: typeof raw === 'string' ? (JSON.parse(raw) as unknown) : undefined,
    })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}
