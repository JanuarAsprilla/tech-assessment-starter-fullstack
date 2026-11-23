import type { FieldError } from '../types'

const NETWORK_MESSAGE =
  'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'
const UNKNOWN_MESSAGE = 'No se pudo completar la operación. Inténtalo de nuevo.'

interface ApiErrorInit {
  readonly status: number
  readonly code: string
  readonly message: string
  readonly errors?: readonly FieldError[]
}

/** Error de la API con la forma `{ code, message, errors }` o una falla de red. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly errors: readonly FieldError[]

  constructor({ status, code, message, errors = [] }: ApiErrorInit) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.errors = errors
  }

  /** Primer mensaje por campo, listo para mostrarlo junto a cada control. */
  fieldMessages(): Record<string, string> {
    const messages: Record<string, string> = {}
    for (const { field, message } of this.errors) {
      if (field !== null && !(field in messages)) messages[field] = message
    }
    return messages
  }

  static network(): ApiError {
    return new ApiError({ status: 0, code: 'NETWORK_ERROR', message: NETWORK_MESSAGE })
  }

  static unknown(status: number): ApiError {
    return new ApiError({ status, code: 'UNKNOWN_ERROR', message: UNKNOWN_MESSAGE })
  }

  /** Lee el cuerpo de una respuesta fallida sin confiar en su forma. */
  static async fromResponse(response: Response): Promise<ApiError> {
    const body: unknown = await response.json().catch(() => null)
    return ApiError.fromBody(response.status, body)
  }

  static fromBody(status: number, body: unknown): ApiError {
    if (!isRecord(body) || typeof body.code !== 'string' || typeof body.message !== 'string') {
      return ApiError.unknown(status)
    }

    const errors = Array.isArray(body.errors) ? body.errors.filter(isFieldError) : []
    return new ApiError({ status, code: body.code, message: body.message, errors })
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isFieldError(value: unknown): value is FieldError {
  return (
    isRecord(value) &&
    typeof value.message === 'string' &&
    (typeof value.field === 'string' || value.field === null)
  )
}
