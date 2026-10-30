// A failed GitHub lookup is indistinguishable from an unregistered person.
// Retry negative results on the next request instead of freezing them for
// the entire server session. Known identities still avoid repeated CLI work.
export function identityCache(resolve: () => { key: string | null }) {
  let cached: string | undefined
  return {
    read() {
      if (cached) return cached
      const value = resolve()
      const json = JSON.stringify(value)
      if (value.key) cached = json
      return json
    },
    clear() { cached = undefined },
  }
}
