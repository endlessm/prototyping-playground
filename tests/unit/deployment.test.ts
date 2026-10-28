import { describe, expect, test } from 'vitest'
import { basePathFromEnv, publicUrlFromEnv } from '../../tooling/deployment.ts'

describe('[CL-109] hosting under a sub-path is set by environment', () => {
  test('the base path defaults to the root and always has both slashes', () => {
    expect(basePathFromEnv({})).toBe('/')
    expect(basePathFromEnv({ STUDIO_BASE_PATH: '' })).toBe('/')
    expect(basePathFromEnv({ STUDIO_BASE_PATH: '/studio' })).toBe('/studio/')
    expect(basePathFromEnv({ STUDIO_BASE_PATH: 'team/studio//' })).toBe(
      '/team/studio/',
    )
  })

  test('the public URL is an HTTP(S) site address, without its trailing slash', () => {
    expect(publicUrlFromEnv({})).toBeUndefined()
    expect(
      publicUrlFromEnv({ STUDIO_PUBLIC_URL: 'https://example.org/studio/' }),
    ).toBe('https://example.org/studio')
  })

  test('a public URL with credentials, a query, a fragment or another scheme is refused', () => {
    for (const value of [
      'ftp://example.org',
      'https://user:pass@example.org',
      'https://example.org/?a=1',
      'https://example.org/#top',
      'example.org',
    ]) {
      expect(() => publicUrlFromEnv({ STUDIO_PUBLIC_URL: value })).toThrow(
        /STUDIO_PUBLIC_URL/,
      )
    }
  })
})
