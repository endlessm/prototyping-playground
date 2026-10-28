// After a new deployment, an open page (or a cached HTML response) can still
// reference script files that no longer exist. This recovery reloads the page
// once, at most once a minute, and never while offline. It runs as an inline
// script before the entry module, because the entry may be the missing file.

/* eslint-disable @typescript-eslint/no-explicit-any -- runs as plain browser JavaScript */
export function installDeploymentRecovery(
  win: any,
  base: string,
  message: string,
) {
  const parameter = '_studio_reload'
  const key = `studio:deployment-recovery:${base}`
  const cooldown = 60_000
  let recovering = false
  function recover() {
    if (recovering || win.navigator.onLine === false) return false
    const url = new URL(win.location.href)
    const now = Date.now()
    let previous = Number(url.searchParams.get(parameter)) || 0
    try {
      previous = Math.max(
        previous,
        Number(win.sessionStorage.getItem(key)) || 0,
      )
    } catch {
      // Storage may be unavailable. The URL still bounds retries.
    }
    if (previous && now - previous < cooldown) return false
    recovering = true
    try {
      win.sessionStorage.setItem(key, String(now))
    } catch {
      // The URL parameter below is the fallback.
    }
    url.searchParams.set(parameter, String(now))
    win.location.replace(url.href)
    return true
  }
  win.addEventListener('vite:preloadError', (event: any) => {
    if (recover()) event.preventDefault()
  })
  win.addEventListener(
    'error',
    (event: any) => {
      const script = event.target
      if (
        script?.tagName !== 'SCRIPT' ||
        script.type !== 'module' ||
        !script.src
      )
        return
      const asset = new URL(script.src, win.location.href)
      const site = new URL(base, win.location.origin)
      if (
        asset.origin !== site.origin ||
        !asset.pathname.startsWith(`${site.pathname}_nuxt/`)
      )
        return
      if (!recover()) {
        const root = win.document.getElementById('__nuxt')
        if (root && !root.hasChildNodes()) root.textContent = message
      }
    },
    true,
  )
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** The inline script that installs the recovery, for the built page's head. */
export function deploymentRecoveryScript(base: string, message: string) {
  // Type stripping and bundling leave the function's body as plain
  // JavaScript, and its parameters are passed as JSON.
  return `(${installDeploymentRecovery.toString()})(window,${JSON.stringify(base)},${JSON.stringify(message)});`
}
