// Requests to the local dev server, with messages a person can act on.

export class StudioRequestError extends Error {
  constructor(
    /** `unavailable`, `invalid_response`, `http_error` or the server's code. */
    readonly code: string,
    message: string,
    readonly status?: number,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'StudioRequestError'
  }
}

export async function requestJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, init)
  } catch (cause) {
    throw new StudioRequestError(
      'unavailable',
      'Studio could not be reached. Check that the dev server is running.',
      undefined,
      { cause },
    )
  }
  let reply: unknown
  try {
    reply = await response.json()
  } catch (cause) {
    throw new StudioRequestError(
      'invalid_response',
      `Studio returned an unreadable reply (HTTP ${response.status}).`,
      response.status,
      { cause },
    )
  }
  if (!response.ok) {
    const { error, code } = (reply ?? {}) as { error?: unknown; code?: unknown }
    throw new StudioRequestError(
      typeof code === 'string' && code ? code : 'http_error',
      typeof error === 'string' && error
        ? error
        : `Studio request failed (HTTP ${response.status}).`,
      response.status,
    )
  }
  return reply as T
}
