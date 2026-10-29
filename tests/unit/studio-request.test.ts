import { afterEach, describe, expect, test, vi } from 'vitest'
import { StudioRequestError, requestJson } from '../../app/utils/studioRequest'

const reply = (body: string, status = 200) =>
  vi.fn(async () => new Response(body, { status }))

afterEach(() => {
  vi.unstubAllGlobals()
})

async function failure(promise: Promise<unknown>) {
  try {
    await promise
  } catch (error) {
    return error as StudioRequestError
  }
  throw new Error('The request succeeded')
}

describe('requests to the local studio', () => {
  test('[SH-12] a reply is read as JSON', async () => {
    vi.stubGlobal('fetch', reply('{"saved":true}'))
    expect(await requestJson('/_studio/x')).toEqual({ saved: true })
  })

  test('[SH-12] an unreachable server says to check the dev server', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      }),
    )
    const error = await failure(requestJson('/_studio/x'))
    expect(error).toBeInstanceOf(StudioRequestError)
    expect(error.code).toBe('unavailable')
    expect(error.message).toBe(
      'Studio could not be reached. Check that the dev server is running.',
    )
  })

  test('[SH-12] an unreadable reply names the HTTP status', async () => {
    vi.stubGlobal('fetch', reply('<html>', 502))
    const error = await failure(requestJson('/_studio/x'))
    expect(error.message).toBe(
      'Studio returned an unreadable reply (HTTP 502).',
    )
    expect(error.status).toBe(502)
  })

  test('[SH-12] a refusal gives the server’s own message, or the HTTP status', async () => {
    vi.stubGlobal(
      'fetch',
      reply('{"error":"Only Admins can do that.","code":"forbidden"}', 403),
    )
    const refused = await failure(requestJson('/_studio/x'))
    expect(refused.message).toBe('Only Admins can do that.')
    expect(refused.code).toBe('forbidden')

    vi.stubGlobal('fetch', reply('{}', 500))
    const failed = await failure(requestJson('/_studio/x'))
    expect(failed.message).toBe('Studio request failed (HTTP 500).')
    expect(failed.code).toBe('http_error')
  })
})
