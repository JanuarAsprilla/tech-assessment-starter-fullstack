import { ApiError } from './api-error'
import { createAccount, deleteAccount, fetchCatalogTree } from './accounts-api'

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const conflictBody = {
  code: 'ACCOUNT_CODE_ALREADY_EXISTS',
  message: 'Ya existe una cuenta con el código 1105.',
  errors: [{ field: 'code', message: 'Ya existe una cuenta con el código 1105.' }],
}

describe('accounts api', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('fetchCatalogTree', () => {
    it('returns the tree sent by the server', async () => {
      const tree = [{ code: '1', name: 'Activo', children: [] }]
      fetchMock.mockResolvedValue(jsonResponse(tree))

      await expect(fetchCatalogTree()).resolves.toEqual(tree)
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/accounts/tree',
        expect.objectContaining({ method: 'GET' }),
      )
    })
  })

  describe('createAccount', () => {
    it('posts the account as JSON and returns the created one', async () => {
      const created = { code: '3', name: 'Patrimonio', nature: 'credit', level: 'class' }
      fetchMock.mockResolvedValue(jsonResponse(created, 201))

      await expect(
        createAccount({ code: '3', name: 'Patrimonio', nature: 'credit' }),
      ).resolves.toEqual(created)

      const [, init] = fetchMock.mock.calls[0]
      expect(init?.method).toBe('POST')
      expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json')
      expect(JSON.parse(String(init?.body))).toEqual({
        code: '3',
        name: 'Patrimonio',
        nature: 'credit',
      })
    })

    it('exposes the field errors of the API so the form can show them', async () => {
      fetchMock.mockResolvedValue(jsonResponse(conflictBody, 409))

      const error = await createAccount({ code: '1105', name: 'Caja' }).catch(
        (e: unknown) => e,
      )

      expect(error).toBeInstanceOf(ApiError)
      expect(error).toMatchObject({ status: 409, code: 'ACCOUNT_CODE_ALREADY_EXISTS' })
      expect((error as ApiError).fieldMessages()).toEqual({
        code: 'Ya existe una cuenta con el código 1105.',
      })
    })
  })

  describe('deleteAccount', () => {
    it('sends DELETE with the code encoded in the path', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

      await expect(deleteAccount('110505')).resolves.toBeUndefined()
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3000/accounts/110505',
        expect.objectContaining({ method: 'DELETE' }),
      )
    })

    it('encodes unsafe characters so they cannot alter the path', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

      await deleteAccount('1/../x')

      expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/accounts/1%2F..%2Fx')
    })

    it('surfaces the conflict when the account has children', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(
          {
            code: 'ACCOUNT_HAS_CHILDREN',
            message: 'No se puede eliminar la cuenta 1105 porque tiene cuentas hijas.',
            errors: [{ field: null, message: 'No se puede eliminar la cuenta 1105 porque tiene cuentas hijas.' }],
          },
          409,
        ),
      )

      await expect(deleteAccount('1105')).rejects.toMatchObject({
        status: 409,
        code: 'ACCOUNT_HAS_CHILDREN',
        message: 'No se puede eliminar la cuenta 1105 porque tiene cuentas hijas.',
      })
    })
  })

  describe('failures outside the API contract', () => {
    it('turns a network failure into a readable error', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

      const error = await fetchCatalogTree().catch((e: unknown) => e)

      expect(error).toBeInstanceOf(ApiError)
      expect(error).toMatchObject({ status: 0, code: 'NETWORK_ERROR' })
      expect((error as ApiError).message).toMatch(/conectar/i)
    })

    it('does not trust an error body that is not JSON', async () => {
      fetchMock.mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 }))

      const error = await fetchCatalogTree().catch((e: unknown) => e)

      expect(error).toMatchObject({ status: 502, code: 'UNKNOWN_ERROR' })
      expect((error as ApiError).message).not.toContain('html')
      expect((error as ApiError).fieldMessages()).toEqual({})
    })

    it('ignores a JSON error body with an unexpected shape', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ boom: true }, 500))

      const error = await fetchCatalogTree().catch((e: unknown) => e)

      expect(error).toMatchObject({ status: 500, code: 'UNKNOWN_ERROR' })
    })
  })
})
