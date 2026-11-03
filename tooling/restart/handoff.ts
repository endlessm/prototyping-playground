// The restart handoff: everything between "this restarts the studio" and
// "the tab is back on the dev server running now". One pending handoff per
// tab, kept in session storage so it survives reloads; one screen over the
// page; the light check; the reload rule; the finish rule; the fallback
// timers; delivering the confirmation once.
//
// It runs before the application, from the page's head script, so it
// survives Nuxt's restart; the application drives the same instance through
// `window[HANDOFF_GLOBAL]`. `restartHandoff` and `browserEnvironment` are
// self-contained: the head script carries their source.
import {
  HANDOFF_GLOBAL,
  HANDOFF_KEY,
  IDENTITY_TAG,
  LIGHT_CHECK,
} from './names.ts'

export type HandoffKind = 'restart'

/** The restart kind's words: "Applying changes". */
export interface RestartText {
  applying: string
  preparing: string
  fallback: string
  slow: string
  reload: string
}

export interface HandoffKinds {
  restart: RestartText
}

export interface StartHandoff {
  kind: HandoffKind
  /** The dev server the tab waits to leave. */
  from: string
  /** Shown once, on the page where the tab finishes. */
  confirmation?: string
  /** Whether the tab waits for `markReady` before it finishes. */
  destination?: boolean
}

export interface PendingHandoff extends StartHandoff {
  started: number
}

/** The browser, as the handoff uses it; the replay passes the real one. */
export interface HandoffEnvironment {
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
  document: Document
  clock: {
    now(): number
    setTimeout(run: () => void, ms: number): unknown
    clearTimeout(timer: unknown): void
  }
  /** The light check: the dev server answering now, or '' when none does. */
  check(): Promise<string>
  reload(): void
  reducedMotion(): boolean
  /** Calls `listener` when one of the page's scripts fails to load or run. */
  onFailure(listener: () => void): void
}

/** The application, once it has started. */
export interface HandoffApplication {
  /** The dev server its code came from; '' when it can't tell. */
  codeServer: string
  /** Shows a confirmation. */
  confirm(confirmation: string): void
}

export interface RestartHandoff {
  start(handoff: StartHandoff): void
  update(changes: Pick<StartHandoff, 'confirmation'>): void
  /** The destination is ready, on this page. */
  markReady(): void
  /** Forgets the handoff and lifts its screen, without a confirmation. */
  cancel(): void
  /** The application has started: wiring, not for callers. */
  connect(application: HandoffApplication): void
}

export interface HandoffSetup {
  kinds: HandoffKinds
  key: string
  tag: string
}

export function restartHandoff(
  env: HandoffEnvironment,
  setup: HandoffSetup,
): RestartHandoff {
  const { storage, document, clock } = env
  const read = (): PendingHandoff | null => {
    try {
      const pending = JSON.parse(storage.getItem(setup.key) || 'null')
      return pending && typeof pending === 'object' && pending.from
        ? pending
        : null
    } catch {
      return null
    }
  }
  const write = (pending: PendingHandoff) =>
    storage.setItem(setup.key, JSON.stringify(pending))
  const documentServer = () =>
    document
      .querySelector(`meta[name="${setup.tag}"]`)
      ?.getAttribute('content') ?? ''

  let screen:
    { say(words: string): void; offerReload(): void; lift(): void } | undefined
  const timers: unknown[] = []
  let leaving = false
  let awaiting = false
  let reloaded = false
  let application: HandoffApplication | undefined

  function show(pending: PendingHandoff) {
    if (screen) return
    const text = setup.kinds[pending.kind]
    if (!text) return
    const style = document.createElement('style')
    style.textContent =
      '#studio-restart{position:fixed;inset:0;z-index:2147483647;display:grid;place-content:center;text-align:center;background:#fff;color:#171717;font:16px system-ui;transition:opacity .15s}.dark #studio-restart{background:#171717;color:#fff}#studio-restart .spinner{margin:auto;width:24px;height:24px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:studio-spin 1s linear infinite}@keyframes studio-spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){#studio-restart{transition:none}#studio-restart .spinner{animation:none}}'
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
    button.type = 'button'
    button.textContent = text.reload
    button.onclick = () => env.reload()
    button.hidden = true
    cover.append(spinner, title, description, button)
    const attach = () => {
      if (!read()) return
      document.head.append(style)
      document.body.append(cover)
    }
    if (document.readyState === 'loading')
      document.addEventListener('DOMContentLoaded', attach)
    else attach()
    screen = {
      say: (words) => (description.textContent = words),
      offerReload: () => {
        button.hidden = false
      },
      lift: () => {
        cover.style.opacity = '0'
        clock.setTimeout(
          () => {
            cover.remove()
            style.remove()
          },
          env.reducedMotion() ? 0 : 150,
        )
      },
    }
  }

  // Loads the page again once another dev server than the one the tab
  // waits to leave answers the light check (any, for `anyServer`) twice in
  // a row: on Linux a new server may itself restart at once. At most once
  // per page, and only while the handoff is pending.
  function awaitServer(anyServer = false) {
    if (awaiting) return
    awaiting = true
    let last = ''
    const poll = async () => {
      if (!read() || reloaded) return
      const answer = await env.check()
      const pending = read()
      if (!pending) return
      if (answer && (anyServer || answer !== pending.from)) {
        if (answer === last) {
          reloaded = true
          return env.reload()
        }
        last = answer
      }
      timers.push(clock.setTimeout(poll, 500))
    }
    timers.push(clock.setTimeout(poll, 500))
  }

  // This page is on the server the tab waits to leave, or heard it go: it
  // loads again once another one answers, and says so after 15 and 30
  // seconds.
  function leave(pending: PendingHandoff) {
    if (leaving) return
    leaving = true
    const text = setup.kinds[pending.kind]
    const later = (ms: number, words: string) =>
      timers.push(
        clock.setTimeout(() => {
          screen?.say(words)
          screen?.offerReload()
        }, ms),
      )
    later(15_000, text.fallback)
    later(30_000, text.slow)
    awaitServer()
  }

  function finish(pending: PendingHandoff) {
    storage.removeItem(setup.key)
    for (const timer of timers) clock.clearTimeout(timer)
    screen?.lift()
    screen = undefined
    if (pending.confirmation) application?.confirm(pending.confirmation)
  }

  // The finish rule: the tab finishes only on a page whose document and
  // code both come from another server than the one it waits to leave.
  function settle() {
    const pending = read()
    if (!pending || !application || leaving) return
    const served = documentServer()
    if (
      !served ||
      served === pending.from ||
      application.codeServer === pending.from
    )
      return leave(pending)
    finish(pending)
  }

  // On every page load: a pending handoff covers the page at once. A page
  // from the server the tab waits to leave loads again once another one
  // answers.
  const resumed = read()
  if (resumed) {
    show(resumed)
    const served = documentServer()
    if (!served || served === resumed.from) leave(resumed)
  }

  return {
    start(handoff) {
      const current = read()
      const pending: PendingHandoff = current
        ? {
            ...current,
            from: handoff.from,
            confirmation: handoff.confirmation ?? current.confirmation,
          }
        : { ...handoff, started: clock.now() }
      write(pending)
      show(pending)
      leave(pending)
    },
    update(changes) {
      const current = read()
      if (current) write({ ...current, ...changes })
    },
    markReady() {},
    cancel() {
      storage.removeItem(setup.key)
      for (const timer of timers) clock.clearTimeout(timer)
      screen?.lift()
      screen = undefined
    },
    connect(started) {
      application = started
      settle()
    },
  }
}

/** The real page's browser, for the head script. `check`: the light check's address. */
export function browserEnvironment(check: string): HandoffEnvironment {
  return {
    storage: sessionStorage,
    document,
    clock: {
      now: () => Date.now(),
      setTimeout: (run, ms) => setTimeout(run, ms),
      clearTimeout: (timer) =>
        clearTimeout(timer as ReturnType<typeof setTimeout>),
    },
    async check() {
      try {
        const response = await fetch(check, { cache: 'no-store' })
        if (!response.ok) return ''
        return String((await response.json()).instance || '')
      } catch {
        // Between servers.
        return ''
      }
    },
    reload: () => location.reload(),
    reducedMotion: () => matchMedia('(prefers-reduced-motion: reduce)').matches,
    onFailure(listener) {
      const failed = (event: Event) => {
        // A stylesheet or image failing doesn't stop the application.
        if (
          event.type === 'error' &&
          event.target !== window &&
          !(event.target instanceof HTMLScriptElement)
        )
          return
        listener()
      }
      addEventListener('error', failed, true)
      addEventListener('unhandledrejection', failed)
    },
  }
}

/**
 * The head script: the page's restart handoff, resumed before the
 * application, at `window[HANDOFF_GLOBAL]`.
 */
export function handoffScript(kinds: HandoffKinds, base: string) {
  const setup: HandoffSetup = { kinds, key: HANDOFF_KEY, tag: IDENTITY_TAG }
  return `window[${JSON.stringify(HANDOFF_GLOBAL)}]=(${restartHandoff.toString()})((${browserEnvironment.toString()})(${JSON.stringify(base + LIGHT_CHECK)}),${JSON.stringify(setup)});`
}
