// Whether Home opens the welcome. The dev server claims it on the profile
// of whoever is working, so it opens once per contributor per studio, in
// any browser. Before registration, or when the profile can't be written,
// the browser remembers instead, per studio and person. A profile whose
// flag is broken never falls back: the welcome stays closed until it's
// fixed.

export const CLAIM_ROUTE = '_studio/modules/onboarding/claim'

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>
type Request = (url: string, init: RequestInit) => Promise<Response>

const storageKey = (base: string, key: string | null) =>
  `design-studio:welcome:${base}:${key ?? 'unregistered'}`

/** Whether the browser has shown it already, and remembers it from now on. */
function shownBefore(name: string, storage: Storage) {
  try {
    if (storage.getItem(name) === 'shown') return true
    storage.setItem(name, 'shown')
  } catch {
    // Storage may be off; then it opens on each first visit.
  }
  return false
}

/**
 * Asks the dev server whether to open the welcome for the contributor
 * `key` (null before registration) of the studio at `base`.
 */
export async function opensWelcome(
  base: string,
  key: string | null,
  request: Request = fetch,
  storage: Storage = localStorage,
): Promise<boolean> {
  let response: Response
  let body: unknown
  try {
    response = await request(`${base}${CLAIM_ROUTE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'claim' }),
    })
    body = await response.json()
  } catch {
    return !shownBefore(storageKey(base, key), storage)
  }
  if (response.status === 422) return false
  if (!response.ok) return !shownBefore(storageKey(base, key), storage)
  const show = (body as { show?: unknown } | null)?.show
  if (show === null) return !shownBefore(storageKey(base, key), storage)
  if (typeof show !== 'boolean')
    throw new Error('The studio answered the welcome claim without "show".')
  return show
}
