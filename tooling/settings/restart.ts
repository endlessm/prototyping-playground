// The dev server that served a page names itself in this meta tag, with the
// instance `_studio/settings` reports: a page can tell whether it came from
// the server running now.
export const INSTANCE_META = 'studio-instance'

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
  return `(${earlyRestart.toString()})(${JSON.stringify(text)},${JSON.stringify(base)})`
}

export function earlyRestart(
  text: {
    applying: string
    preparing: string
    slow: string
    reload: string
    fallback: string
  },
  base: string,
) {
  const instance = sessionStorage.getItem('design-studio:restart')
  if (!instance) return
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
  const attach = () => {
    if (!sessionStorage.getItem('design-studio:restart')) return
    for (const child of document.body.children)
      if (child instanceof HTMLElement) child.inert = true
    document.body.append(cover)
    button.focus()
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', attach)
  else attach()
  if (sessionStorage.getItem('design-studio:restart-ready')) return
  const started = Date.now()
  const timer = setInterval(async () => {
    if (
      !document.getElementById('studio-restart') &&
      document.readyState !== 'loading'
    ) {
      clearInterval(timer)
      return
    }
    const elapsed = Date.now() - started
    if (elapsed > 15000) {
      description.textContent = elapsed > 30000 ? text.slow : text.fallback
      button.hidden = false
    }
    try {
      const response = await fetch(base + '_studio/settings', {
        cache: 'no-store',
      })
      const data = await response.json()
      if (response.ok && data.instance !== instance) {
        clearInterval(timer)
        sessionStorage.setItem('design-studio:restart-ready', '1')
        location.reload()
      }
    } catch {
      /* The new server has not started yet. */
    }
  }, 500)
}
