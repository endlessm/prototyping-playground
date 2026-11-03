// The dev server that served a page names itself in this meta tag, with the
// instance `_studio/settings` reports: a page can tell whether it came from
// the server running now.
export const INSTANCE_META = 'studio-instance'

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
          console.info(`DIAG reload from=${from} to=${instance}`) // DIAGNOSTIC
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

// Runs before the application: the cover survives a full Nuxt restart.
export function restartScript(
  text: {
    applying: string
    preparing: string
    slow: string
    reload: string
    fallback: string
  },
  base: string,
) {
  return `(${earlyRestart.toString()})(${JSON.stringify(text)},${JSON.stringify(base)},${studioServerSource})`
}

/**
 * The cover over a restarting studio, on every page until one comes from the
 * dev server that replaced the one named in `design-studio:restart`; the
 * application lifts it there once it is ready. `announced`: this page heard
 * the restart, so it loads again whichever server served it.
 */
export function earlyRestart(
  text: {
    applying: string
    preparing: string
    slow: string
    reload: string
    fallback: string
  },
  base: string,
  server: DevServer,
  announced = false,
) {
  const from = sessionStorage.getItem('design-studio:restart')
  if (!from) return
  if (document.getElementById('studio-restart')) return
  const style = document.createElement('style')
  style.textContent =
    '#studio-restart{position:fixed;inset:0;z-index:2147483647;display:grid;place-content:center;text-align:center;background:#fff;color:#171717;font:16px system-ui;transition:opacity .15s}.dark #studio-restart{background:#171717;color:#fff}#studio-restart .spinner{margin:auto;width:24px;height:24px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:studio-spin 1s linear infinite}@keyframes studio-spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){#studio-restart{transition:none}#studio-restart .spinner{animation:none}}'
  document.head.append(style)
  const cover = document.createElement('div')
  cover.id = 'studio-restart'
  cover.setAttribute('role', 'status')
  const spinner = document.createElement('div')
  spinner.className = 'spinner'
  spinner.setAttribute('aria-hidden', 'true')
  const title = document.createElement('h1')
  title.textContent = text.applying
  const description = document.createElement('p')
  description.textContent = text.preparing
  const button = document.createElement('button')
  button.textContent = text.reload
  button.onclick = () => location.reload()
  button.hidden = true
  cover.append(spinner, title, description, button)
  const pending = () => Boolean(sessionStorage.getItem('design-studio:restart'))
  // Now, before the application's modules: a failure to load them is
  // reported before the document is parsed.
  server.awaitApplication(base, pending)
  const attach = () => {
    if (!pending()) return
    for (const child of document.body.children)
      if (child instanceof HTMLElement) child.inert = true
    document.body.append(cover)
    button.focus()
    if (!announced && server.since(from)) return
    const fallback = (words: string) => () => {
      description.textContent = words
      button.hidden = false
    }
    setTimeout(fallback(text.fallback), 15000)
    setTimeout(fallback(text.slow), 30000)
    server.reloadFrom(from, base, pending)
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', attach)
  else attach()
}
