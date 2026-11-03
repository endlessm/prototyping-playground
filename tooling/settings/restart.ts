import { IDENTITY_TAG } from '../restart/names.ts'

// The dev server that served a page names itself in this meta tag.
export const INSTANCE_META = IDENTITY_TAG

// A system change's status screen still uses the rule below; a restart's
// screen is the restart handoff's (`../restart/handoff.ts`).
//
// A change that restarts the dev server (Settings, a module switch, a system
// change, `yarn studio configure`, an edit to the configuration) is done only
// on a page from another dev server than the one that took it. On Linux,
// Nuxt starts the new server on the same port while the old one keeps
// answering until the new one is ready, so a reload once the new one answers
// may still reach the old one; its page loads again, since after that
// nothing else would. Self-contained: the scripts that run before the
// application carry its source, and read the tag once the document is
// parsed, as it comes after them. The application passes `own`, the instance
// its modules name: on Linux a page from the new server may still run modules
// from the outgoing one.
export function devServer(meta: string, own = '') {
  const servedBy = () =>
    own ||
    (document.querySelector(`meta[name="${meta}"]`)?.getAttribute('content') ??
      '')
  return {
    /** The instance of the dev server that served this page, or its application. */
    servedBy,
    /** Whether this page came from another dev server than `from`. */
    since: (from: string) => Boolean(from && servedBy() && servedBy() !== from),
    /**
     * Loads the page again once another dev server than `from` (any, when
     * empty) answers twice in a row, as long as `waiting()` holds: on Linux
     * a new server may itself restart right away. Once per page, whoever
     * asks first.
     */
    reloadFrom(from: string, base: string, waiting: () => boolean) {
      const root = document.documentElement
      if (root.dataset.studioReloading) return
      root.dataset.studioReloading = from || 'any'
      let last = ''
      const timer = setInterval(async () => {
        if (!waiting()) {
          delete root.dataset.studioReloading
          return clearInterval(timer)
        }
        try {
          const response = await fetch(`${base}_studio/settings`, {
            cache: 'no-store',
          })
          const { instance } = await response.json()
          if (!response.ok || !instance || instance === from) return
          if (instance !== last) {
            last = instance
            return
          }
          clearInterval(timer)
          location.reload()
        } catch {
          // Between servers.
        }
      }, 500)
    },
    /**
     * While `waiting()` holds, loads the page again if its application
     * doesn't start: a module failed to load, or a minute went by. Between
     * two servers a page can get its document from one and fail to get its
     * modules from either, and nothing else would load it again.
     */
    awaitApplication(base: string, waiting: () => boolean) {
      const root = document.documentElement
      const stalled = () => waiting() && !root.dataset.studioApp
      const failed = (event: Event) => {
        if (
          event.type === 'error' &&
          event.target !== window &&
          !(event.target instanceof HTMLScriptElement)
        )
          return
        if (stalled()) this.reloadFrom('', base, stalled)
      }
      addEventListener('error', failed, true)
      addEventListener('unhandledrejection', failed)
      setTimeout(() => {
        if (stalled()) this.reloadFrom('', base, stalled)
      }, 60_000)
    },
  }
}
export type DevServer = ReturnType<typeof devServer>

/** This page's dev server, as source for the scripts that run before the application. */
export const studioServerSource = `(${devServer.toString()})(${JSON.stringify(INSTANCE_META)})`
