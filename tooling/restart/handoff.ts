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

/**
 * `restart`: any restart, "Applying changes", in every tab. `system`: a
 * system change, in the tab that asked for it, in its caller's words.
 */
export type HandoffKind = 'restart' | 'system'

/** The restart kind's words: "Applying changes". */
export interface RestartText {
  applying: string
  preparing: string
  fallback: string
  slow: string
  reload: string
}

/** The system change kind's own words; its title and description are its caller's. */
export interface SystemText {
  slow: string
  reload: string
}

export interface HandoffText {
  restart: RestartText
  system: SystemText
}

/** A kind of handoff, as data: how its screen reads, looks and waits. */
export interface HandoffKindSetup {
  /** The screen's words, unless its caller gives its own. */
  title: string
  description: string
  /** Words that replace the description after a while, with Reload studio. */
  later: { after: number; words: string }[]
  /**
   * Whether `later` counts from the handoff's start, on every page and
   * across reloads, rather than from when a page starts waiting to leave
   * the server: a page that already came from the new one says nothing
   * later.
   */
  fromStart: boolean
  /** A pending handoff older than this is forgotten. */
  expires?: number
  /**
   * The studio's custom properties its screen takes its colours from, by
   * name, as they were when the handoff started: `--handoff-<name>`.
   */
  colours?: Record<string, string>
  reload: string
  /** The screen's CSS. */
  css: string
}

export type HandoffKinds = Record<HandoffKind, HandoffKindSetup>

export interface StartHandoff {
  kind: HandoffKind
  /**
   * The dev server the tab waits to leave: by default, the one this page's
   * code, or else its document, came from.
   */
  from?: string
  /** The screen's words; the kind's own when left out. */
  title?: string
  description?: string
  /** Shown once, on the page where the tab finishes. */
  confirmation?: string
  /**
   * Whether the tab waits for `markReady` before it finishes. A string
   * also names what the destination waits for, such as a system's ID, for
   * the page that loads to read with `destination()`.
   */
  destination?: boolean | string
  /**
   * Keeps this page, rather than loading it again, until `update` lifts
   * the hold: a request still in flight would be dropped, and with it what
   * the page learns from its answer.
   */
  hold?: boolean
}

export interface PendingHandoff extends StartHandoff {
  from: string
  started: number
  /** The colours captured when it started. */
  look?: Record<string, string>
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
  /** Shows a confirmation, as its kind of change shows one. */
  confirm(confirmation: string, kind: HandoffKind): void
}

export interface RestartHandoff {
  start(handoff: StartHandoff): void
  /** Changes the pending handoff's words, confirmation, destination or hold. */
  update(changes: Partial<Omit<StartHandoff, 'kind' | 'from'>>): void
  /** What the pending handoff's destination waits for, as its caller named it. */
  destination(): boolean | string | undefined
  /** The destination is ready, on this page. */
  markReady(): void
  /** Forgets the handoff and lifts its screen, without a confirmation. */
  cancel(): void
  /** The application has started: wiring, not for callers. */
  connect(application: HandoffApplication): void
  /**
   * The dev server `instance` announced that no restart is coming: a
   * handoff waiting to leave it finishes on this page. Wiring, not for
   * callers.
   */
  notRestarting(instance: string): void
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
  const parsed = () => document.readyState !== 'loading'
  const whenParsed = (run: () => void) => {
    if (parsed()) run()
    else document.addEventListener('DOMContentLoaded', run)
  }

  let screen:
    | {
        render(pending: PendingHandoff): void
        /** Counts the kind's `later` words from `since`, once per page. */
        later(since: number): void
        lift(): void
      }
    | undefined
  const timers: unknown[] = []
  let leaving = false
  let awaiting = false
  let reloaded = false
  let application: HandoffApplication | undefined
  // Whether this page's destination is ready: each page shows its own.
  let ready = false
  // Whether the server the tab waits to leave announced that no restart is
  // coming: the tab finishes on this page.
  let staying = false

  // The studio's colours now, for a kind that keeps them.
  function capture(kind: HandoffKind) {
    const colours = setup.kinds[kind]?.colours
    if (!colours) return undefined
    const style = document.defaultView!.getComputedStyle(
      document.documentElement,
    )
    const look: Record<string, string> = {}
    for (const [name, property] of Object.entries(colours))
      look[name] = style.getPropertyValue(property).trim()
    return look
  }

  // One screen, whatever the kind: the kind's data says how it reads, looks
  // and waits.
  function show(pending: PendingHandoff) {
    if (screen) return screen.render(pending)
    const kind = setup.kinds[pending.kind]
    if (!kind) return
    const style = document.createElement('style')
    style.textContent = kind.css
    const cover = document.createElement('div')
    cover.id = 'studio-restart'
    cover.setAttribute('role', 'status')
    cover.setAttribute('aria-live', 'polite')
    const card = document.createElement('div')
    card.className = 'card'
    const spinner = document.createElement('div')
    spinner.className = 'spinner'
    spinner.setAttribute('aria-hidden', 'true')
    const title = document.createElement('h1')
    const description = document.createElement('p')
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = kind.reload
    button.onclick = () => env.reload()
    button.hidden = true
    card.append(spinner, title, description, button)
    cover.append(card)
    for (const [name, value] of Object.entries(pending.look ?? {}))
      if (value) cover.style.setProperty(`--handoff-${name}`, value)
    // Once said, the later words stay, whatever the caller says next.
    let late = ''
    const render = (current: PendingHandoff) => {
      title.textContent = current.title ?? kind.title
      description.textContent =
        late || (current.description ?? kind.description)
    }
    render(pending)
    let counting = false
    const later = (since: number) => {
      if (counting) return
      counting = true
      for (const { after, words } of kind.later)
        timers.push(
          clock.setTimeout(
            () => {
              late = words
              description.textContent = words
              if (!button.hidden) return
              button.hidden = false
              button.focus()
            },
            Math.max(0, since + after - clock.now()),
          ),
        )
    }
    if (kind.fromStart) later(pending.started)
    // What the screen made inert, and only that, is restored when it lifts:
    // what the app itself had made inert stays so.
    const held: HTMLElement[] = []
    const hold = (node: Node) => {
      if (node === cover || !(node instanceof HTMLElement) || node.inert) return
      node.inert = true
      held.push(node)
    }
    // What the app adds meanwhile, such as a dialog, is held too.
    const observer = new MutationObserver((records) => {
      for (const record of records) record.addedNodes.forEach(hold)
    })
    const attach = () => {
      if (!read()) return
      document.head.append(style)
      for (const child of [...document.body.children]) hold(child)
      document.body.append(cover)
      observer.observe(document.body, { childList: true })
      // Reload studio is the one useful action; until it's offered, focus
      // waits on the screen, out of the app.
      cover.tabIndex = -1
      cover.focus()
    }
    whenParsed(attach)
    screen = {
      render,
      later,
      lift: () => {
        observer.disconnect()
        for (const element of held) element.inert = false
        cover.style.opacity = '0'
        clock.setTimeout(
          () => {
            cover.remove()
            style.remove()
          },
          env.reducedMotion() ? 0 : 160,
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
      if (answer && !pending.hold && (anyServer || answer !== pending.from)) {
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
  // loads again once another one answers.
  function leave() {
    if (leaving) return
    leaving = true
    screen?.later(clock.now())
    awaitServer()
  }

  // Forgets the handoff on this page: a later one starts afresh.
  function stop() {
    storage.removeItem(setup.key)
    for (const timer of timers.splice(0)) clock.clearTimeout(timer)
    screen?.lift()
    screen = undefined
    leaving = false
    awaiting = false
    staying = false
  }

  function finish(pending: PendingHandoff) {
    stop()
    if (pending.confirmation)
      application?.confirm(pending.confirmation, pending.kind)
  }

  // The finish rule: the tab finishes only on a page whose document and
  // code both come from another server than the one it waits to leave, or
  // once that server announced that no restart is coming.
  function settle() {
    const pending = read()
    // The identity tag comes after the head script: read once parsed.
    if (!pending || !application || !parsed()) return
    if (!staying) {
      if (leaving) return
      const served = documentServer()
      if (
        !served ||
        served === pending.from ||
        application.codeServer === pending.from
      )
        return leave()
    }
    if (pending.destination && !ready) return
    finish(pending)
  }

  // On every page load: a pending handoff covers the page at once. Once the
  // document is parsed, a page from the server the tab waits to leave loads
  // again once another one answers.
  const found = read()
  // A stale handoff never covers a later visit.
  const expires = found && setup.kinds[found.kind]?.expires
  const stale = Boolean(expires && clock.now() - found!.started > expires)
  if (stale) storage.removeItem(setup.key)
  const resumed = stale ? null : found
  if (resumed) {
    show(resumed)
    // Between two servers a page can get its document from the new one and
    // fail to get its code from either: once a script fails, or a minute
    // goes by without the application, it loads again once a server
    // answers. Listened for now: a module that fails to load says so before
    // the document is parsed.
    let arrived = false
    let failed = false
    const stalled = () => {
      if (arrived && !application && read()) awaitServer(true)
    }
    env.onFailure(() => {
      failed = true
      stalled()
    })
    whenParsed(() => {
      const served = documentServer()
      if (!served || served === resumed.from) return leave()
      arrived = true
      if (failed) stalled()
      timers.push(clock.setTimeout(stalled, 60_000))
      settle()
    })
  }

  return {
    start(handoff) {
      const current = read()
      const from = handoff.from || application?.codeServer || documentServer()
      // One handoff per tab: a later start, such as the restart the dev
      // server announces, keeps the pending one's kind, words and look.
      const pending: PendingHandoff = current
        ? {
            ...current,
            from,
            confirmation: handoff.confirmation ?? current.confirmation,
          }
        : {
            ...handoff,
            from,
            started: clock.now(),
            look: capture(handoff.kind),
          }
      staying = false
      write(pending)
      show(pending)
      leave()
    },
    update(changes) {
      const current = read()
      if (!current) return
      const pending = { ...current, ...changes }
      write(pending)
      screen?.render(pending)
    },
    destination: () => read()?.destination,
    markReady() {
      ready = true
      settle()
    },
    cancel: stop,
    connect(started) {
      application = started
      settle()
    },
    notRestarting(instance) {
      if (read()?.from !== instance) return
      staying = true
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

const RESTART_CSS =
  '#studio-restart{position:fixed;inset:0;z-index:2147483647;display:grid;place-content:center;text-align:center;background:#fff;color:#171717;font:16px system-ui;transition:opacity .15s;outline:none}.dark #studio-restart{background:#171717;color:#fff}#studio-restart .spinner{margin:auto;width:24px;height:24px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:studio-spin 1s linear infinite}@keyframes studio-spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){#studio-restart{transition:none}#studio-restart .spinner{animation:none}}'

// The studio's colours, as captured when the change started, through
// `--handoff-<name>`; the system's own colours when there are none.
const SYSTEM_CSS =
  '#studio-restart{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:24px;background:var(--handoff-background,Canvas);color:var(--handoff-foreground,CanvasText);font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;transition:opacity 160ms ease;outline:none}#studio-restart,#studio-restart *{box-sizing:border-box}#studio-restart .card{width:min(100%,420px);text-align:center}#studio-restart .spinner{width:32px;height:32px;margin:0 auto 24px;border:2px solid var(--handoff-border,GrayText);border-top-color:var(--handoff-foreground,CanvasText);border-radius:50%;animation:studio-spin 1s linear infinite}#studio-restart h1{font-size:24px;line-height:1.3;font-weight:600;margin:0 0 12px;overflow-wrap:anywhere}#studio-restart p{font-size:14px;line-height:1.6;margin:0;color:var(--handoff-muted,GrayText)}#studio-restart button{margin-top:24px;padding:8px 14px;border:1px solid var(--handoff-border,GrayText);border-radius:8px;background:transparent;color:inherit;font:inherit;cursor:pointer}@keyframes studio-spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){#studio-restart{transition:none}#studio-restart .spinner{animation:none}}'

/** The two kinds, from their words. */
export function handoffKinds(text: HandoffText): HandoffKinds {
  return {
    restart: {
      title: text.restart.applying,
      description: text.restart.preparing,
      later: [
        { after: 15_000, words: text.restart.fallback },
        { after: 30_000, words: text.restart.slow },
      ],
      fromStart: false,
      reload: text.restart.reload,
      css: RESTART_CSS,
    },
    system: {
      title: '',
      description: '',
      later: [{ after: 30_000, words: text.system.slow }],
      fromStart: true,
      expires: 120_000,
      colours: {
        background: '--ui-bg',
        foreground: '--ui-text-highlighted',
        muted: '--ui-text-muted',
        border: '--ui-border',
      },
      reload: text.system.reload,
      css: SYSTEM_CSS,
    },
  }
}

/**
 * The head script: the page's restart handoff, resumed before the
 * application, at `window[HANDOFF_GLOBAL]`.
 */
export function handoffScript(text: HandoffText, base: string) {
  const setup: HandoffSetup = {
    kinds: handoffKinds(text),
    key: HANDOFF_KEY,
    tag: IDENTITY_TAG,
  }
  return `window[${JSON.stringify(HANDOFF_GLOBAL)}]=(${restartHandoff.toString()})((${browserEnvironment.toString()})(${JSON.stringify(base + LIGHT_CHECK)}),${JSON.stringify(setup)});`
}
