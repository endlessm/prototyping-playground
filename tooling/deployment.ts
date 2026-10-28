// Where the built site is hosted, from the environment of `yarn build`.

type Env = Record<string, string | undefined>

/** The sub-path the site is served under, such as `/studio/`. */
export function basePathFromEnv(env: Env) {
  const trimmed = (env.STUDIO_BASE_PATH ?? '').replace(/^\/+|\/+$/g, '')
  return trimmed ? `/${trimmed}/` : '/'
}

/** The site's public address, for links that must be absolute. */
export function publicUrlFromEnv(env: Env) {
  const value = env.STUDIO_PUBLIC_URL?.trim()
  if (!value) return undefined
  let url: URL | undefined
  try {
    url = new URL(value)
  } catch {
    url = undefined
  }
  if (
    !url ||
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'STUDIO_PUBLIC_URL must be an HTTP(S) site URL without credentials, a query, or a fragment.',
    )
  }
  return url.href.replace(/\/+$/, '')
}
