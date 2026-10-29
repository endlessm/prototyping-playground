// The client's live content and this tab's changes to it. Content carries a
// revision, so the same content arriving twice (a tab's own change, then the
// server's push of it) applies once. A tab's changes run one at a time, in
// the order they were made; a rejected change leaves the content alone.
// Framework-neutral: the studio's composables wrap it.

export interface Revisioned {
  /** Changes whenever the content does. */
  revision: string
}

export function createLiveManifest<T extends Revisioned>(initial: T) {
  let current = initial
  const listeners = new Set<(manifest: T) => void>()
  return {
    get current() {
      return current
    },
    /** Applies content if it is new; returns whether it was. */
    receive(next: T) {
      if (next.revision === current.revision) return false
      current = next
      for (const listener of listeners) listener(next)
      return true
    },
    subscribe(listener: (manifest: T) => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export type LiveManifest<T extends Revisioned> = ReturnType<
  typeof createLiveManifest<T>
>

const tabId = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

export function createMutationQueue<T extends Revisioned>(
  live: LiveManifest<T>,
) {
  let pending: Promise<unknown> = Promise.resolve()
  return {
    /** Sent with each change, so the server can tell tabs apart. */
    headers: { 'X-Studio-Tab': tabId() } as const,
    run<R extends { manifest: T }>(change: () => Promise<R>): Promise<R> {
      const operation = pending
        .catch(() => {})
        .then(async () => {
          const reply = await change()
          if (typeof reply?.manifest?.revision !== 'string')
            throw new Error('The studio’s reply is missing its content.')
          live.receive(reply.manifest)
          return reply
        })
      pending = operation
      return operation
    },
  }
}
