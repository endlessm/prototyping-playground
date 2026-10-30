/// <reference types="vite/client" />
// Runs inside the preview document: mounts the view named in the address
// with the system's app factory, and tells the studio around it how it went.
// The studio can switch the document to another view of the same system; the
// outgoing view stays on screen, inert, until the next one is ready. In
// development the document also says whether what it shows matches the
// saved source. A named state renders its view with the state's props; a
// view's `system` options reach the system's app factory, and a state's
// `system` overrides them option by option. A lo-fi view is drawn in
// grayscale with a handwritten font. Links to studio
// addresses and the studio's shortcuts go to the studio, so a view's links
// use its history. It imports nothing of the studio's app but plain
// functions.
import { reactive, type App, type Component } from 'vue'
import { isTyping, previewShortcut } from '../../../app/utils/shortcuts.ts'
import {
  acceptsHost,
  isStudioHref,
  PREVIEW_CHANNEL,
  PREVIEW_VERSION,
  readAddress,
  type PreviewMessage,
  type PreviewPhase,
  type PreviewState,
} from '../protocol.ts'
import { COMPILE_ROUTE, PREVIEW_ROUTE } from '../constants.ts'
import { THEME_QUERY } from '../theme.ts'
import { PROTOTYPE_SCOPE, type PrototypeScope } from './navigation.ts'

interface ViewModule {
  default?: Component
  states?: unknown
  system?: unknown
}

type Options = Record<string, unknown>

interface View {
  /** Absolute path, with forward slashes. */
  file: string
  title: string
  /** The prototype's permanent ID. */
  prototype: string
  /** Inside the prototype, without the extension. */
  path: string
  /** For a named state, its title. */
  state: string | null
  lofi: boolean
  /** None while the view is empty. */
  load: (() => Promise<ViewModule>) | null
}

// The lo-fi look loads with the first lo-fi view, so other documents carry
// no stylesheet of the studio's.
let lofiStyles: Promise<unknown> | undefined
const lofiLook = () =>
  (lofiStyles ??= import('./lofi.css').catch((error: unknown) => {
    lofiStyles = undefined
    throw error
  }))

const plain = (value: unknown): value is Options =>
  !!value && typeof value === 'object' && !Array.isArray(value)

/** The state titled `title` in a view's `states`, if any. */
function findState(states: unknown, title: string) {
  if (!Array.isArray(states)) return undefined
  return states.find((state) => plain(state) && state.title === title) as
    { props?: Options; system?: unknown } | undefined
}

/** The props of the state titled `title` in a view's `states`, if any. */
function stateProps(states: unknown, title: string) {
  const found = findState(states, title)
  return found && { ...(found.props ?? {}) }
}

/**
 * The system options a view or one of its states renders with: the view's
 * `export const system`, then the state's `system`, option by option.
 */
function systemOptions(exports: ViewModule, state: string | null) {
  const own = state === null ? undefined : findState(exports.states, state)
  return {
    ...(plain(exports.system) ? exports.system : {}),
    ...(plain(own?.system) ? own.system : {}),
  }
}

// Options compare by value, functions by their source, so only an edit
// that changes one rebuilds the screen.
const optionsKey = (options: Options) =>
  JSON.stringify(options, (_key, value: unknown) =>
    typeof value === 'function' ? `ƒ ${String(value)}` : value,
  )

// The studio's base path, from this document's own:
// `<base>_preview/<document>/`.
const STUDIO_BASE = import.meta.env.BASE_URL.slice(
  0,
  import.meta.env.BASE_URL.lastIndexOf(PREVIEW_ROUTE),
)
const ARTIFACT_ADDRESS = new RegExp(
  `^${STUDIO_BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}prototypes/[0-9a-z]{16}/artifacts/([0-9a-z]{16})$`,
)

interface MountOptions {
  create: (options: {
    component: Component
    props?: Record<string, unknown>
    system: Options
  }) => App
  views: Record<string, View>
}

type Outgoing = PreviewMessage extends infer M
  ? M extends PreviewMessage
    ? Omit<M, 'channel' | 'version' | 'session' | 'runtime' | 'artifact'>
    : never
  : never

const MAX_DETAIL = 8192

interface ChangedFile {
  file: string
  /** When it changed, in milliseconds since 1970. */
  at: number
}
// How long a changed view may wait for its hot update.
const CATCH_UP_MS = 2000

const randomId = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

/** The compiler's message and location, when the view failed to compile. */
async function compileDetail(artifact: string) {
  if (!import.meta.env.DEV) return ''
  try {
    const response = await fetch(
      `${import.meta.env.BASE_URL}${COMPILE_ROUTE}?artifact=${artifact}`,
    )
    const found = (await response.json()) as {
      message?: string
      file?: string
      line?: number | null
      column?: number | null
      frame?: string
    }
    if (!found.message) return ''
    const where = [found.file, found.line, found.column]
      .filter((part) => part !== null && part !== undefined)
      .join(':')
    return [where, found.message, found.frame].filter(Boolean).join('\n\n')
  } catch {
    return ''
  }
}

const describe = (error: unknown) =>
  error instanceof Error ? error.stack || error.message : String(error)

export function mountPreview({ create, views }: MountOptions) {
  const address = readAddress(location.search)
  const session = window.parent !== window ? address.session : null
  // A Theme page: the system's tokens, drawn by its own app.
  if (new URLSearchParams(location.search).has(THEME_QUERY)) {
    void import('./theme.ts').then(({ mountTheme }) =>
      mountTheme(create, session),
    )
    return
  }
  const runtime = randomId()
  const root = document.documentElement
  const host = document.getElementById('app')!
  let artifact = address.artifact
  let render = 0
  let sequence = 0
  let state: PreviewState = 'loading'
  let phase: PreviewPhase = 'current'
  // What is on screen: the view, its app, the file it came from, its system
  // options and, for a named state, the state and its live props.
  let shown: {
    artifact: string
    app: App
    box: HTMLElement
    file: string
    state: string | null
    props: Record<string, unknown>
    options: string
  } | null = null
  // Each view file's newest `states` and `system`, from its hot updates.
  const latestExports = new Map<string, ViewModule>()
  // When the latest attempt asked for its view's code: changes made before
  // that are already in what it got.
  let requestedAt = 0

  root.dataset.previewRuntime = runtime
  if (session) root.dataset.previewSession = session

  const post = (message: Outgoing) => {
    if (!session || !artifact) return
    window.parent.postMessage(
      {
        channel: PREVIEW_CHANNEL,
        version: PREVIEW_VERSION,
        session,
        runtime,
        artifact,
        ...message,
      },
      location.origin,
    )
  }

  // For agents and browser tools, the same news as attributes and events.
  const status = (next: PreviewState, attempt: number, detail = '') => {
    if (attempt !== render) return
    state = next
    root.dataset.previewArtifact = artifact ?? ''
    root.dataset.previewState = next
    window.dispatchEvent(
      new CustomEvent('studio:preview-state', {
        detail: { artifact, state: next, detail },
      }),
    )
    post({
      kind: 'status',
      state: next,
      render,
      detail: detail.slice(0, MAX_DETAIL),
    })
  }
  const lifecycle = (next: PreviewPhase, detail = '') => {
    phase = next
    root.dataset.previewPhase = next
    post({
      kind: 'lifecycle',
      sequence: ++sequence,
      phase: next,
      detail: detail.slice(0, MAX_DETAIL),
    })
  }

  const unmount = (keep?: HTMLElement) => {
    if (shown && shown.box !== keep) {
      shown.app.unmount()
      shown.box.remove()
      shown = null
    }
    for (const box of [...host.children]) if (box !== keep) box.remove()
  }

  async function show(id: string | null) {
    const attempt = ++render
    artifact = id
    status('loading', attempt)
    lifecycle('current')
    if (shown) shown.box.inert = true
    const view = id ? views[id] : undefined
    if (!id || !view) {
      unmount()
      return status('error', attempt, 'This view is not part of this preview.')
    }
    if (!view.load) {
      unmount()
      return status('empty', attempt)
    }
    let component: Component | undefined
    let module: ViewModule
    requestedAt = Date.now()
    try {
      module = await view.load()
      component = module.default
    } catch (error) {
      const detail = (await compileDetail(id)) || describe(error)
      if (attempt !== render) return
      unmount()
      return status('error', attempt, detail)
    }
    if (attempt !== render) return
    if (!component) {
      unmount()
      return status('error', attempt, `${view.title} has no component.`)
    }
    // A state's props stay reactive, so its newest props apply in place.
    const props = reactive<Record<string, unknown>>({})
    const exports = latestExports.get(view.file) ?? module
    const system = systemOptions(exports, view.state)
    if (view.state !== null) {
      const found = stateProps(exports.states, view.state)
      if (!found) {
        unmount()
        return status(
          'error',
          attempt,
          `${view.title}.vue has no state titled ${JSON.stringify(view.state)} in export const states.`,
        )
      }
      Object.assign(props, found)
    }
    if (view.lofi) {
      try {
        await lofiLook()
      } catch (error) {
        if (attempt !== render) return
        unmount()
        return status('error', attempt, describe(error))
      }
      if (attempt !== render) return
    }
    const box = document.createElement('div')
    box.hidden = true
    box.classList.toggle('lofi-view', view.lofi)
    host.append(box)
    let failed = ''
    const app = create({ component, props, system })
    app.provide(PROTOTYPE_SCOPE, scope(id, view))
    const ownError = app.config.errorHandler
    app.config.errorHandler = (error, instance, info) => {
      if (state === 'ready' && attempt === render)
        lifecycle('error', describe(error))
      else failed ||= describe(error)
      ownError?.(error, instance, info)
    }
    const ownWarning = app.config.warnHandler
    app.config.warnHandler = (message, instance, trace) => {
      if (/missing template or render function/i.test(message))
        failed ||= `${view.title} has no <template>. A view needs one to show something; add it and the preview updates by itself.`
      ownWarning?.(message, instance, trace)
    }
    try {
      app.mount(box)
    } catch (error) {
      failed ||= describe(error)
    }
    if (attempt !== render) {
      app.unmount()
      box.remove()
      return
    }
    unmount(box)
    shown = {
      artifact: id,
      app,
      box,
      file: view.file,
      state: view.state,
      props,
      options: optionsKey(system),
    }
    box.hidden = false
    if (failed) return status('error', attempt, failed)
    status('ready', attempt)
  }

  window.addEventListener('message', (event) => {
    if (
      !session ||
      !acceptsHost(event, window.parent, location.origin, { session, runtime })
    )
      return
    const next = event.data.artifact
    // Keep the address current, so a reload shows the same view.
    const url = new URL(location.href)
    url.searchParams.set('artifact', next)
    history.replaceState(history.state, '', url)
    if (next !== artifact || state === 'error') void show(next)
    else post({ kind: 'status', state, render, detail: '' })
  })

  // Views added, renamed, emptied or written since the document loaded. A
  // view switched to lo-fi or back keeps its state.
  window.addEventListener('studio:views', () => {
    const view = artifact ? views[artifact] : undefined
    const current = shown?.artifact === artifact ? shown : null
    if (state === 'loading') return
    if (
      state !== 'ready' ||
      !view ||
      !current ||
      view.file !== current.file ||
      view.state !== current.state
    )
      void show(artifact)
    else if (!view.lofi) current.box.classList.remove('lofi-view')
    else void lofiLook().then(() => current.box.classList.add('lofi-view'))
  })

  // A view's newest `states` and `system` after a hot update: new options
  // rebuild the screen; otherwise the shown state takes its new props in
  // place, or says it is gone.
  window.addEventListener('studio:exports', (event) => {
    const { file, ...exports } = (
      event as CustomEvent<{ file: string } & ViewModule>
    ).detail
    latestExports.set(file, exports)
    if (!shown || shown.file !== file) return
    if (optionsKey(systemOptions(exports, shown.state)) !== shown.options)
      return void show(artifact)
    if (shown.state === null) return
    const next = stateProps(exports.states, shown.state)
    if (!next) return void show(artifact)
    for (const key of Object.keys(shown.props))
      if (!(key in next)) Reflect.deleteProperty(shown.props, key)
    Object.assign(shown.props, next)
  })

  // What a view knows of its prototype, for its navigation helpers.
  function scope(id: string, view: View): PrototypeScope {
    const ofPrototype = () =>
      Object.entries(views).filter(
        ([, entry]) =>
          entry.prototype === view.prototype && entry.state === null,
      )
    return {
      base: STUDIO_BASE,
      prototype: view.prototype,
      current: id,
      currentView:
        ofPrototype().find(([, entry]) => entry.file === view.file)?.[0] ?? id,
      artifacts: () =>
        ofPrototype().map(([key, entry]) => ({ id: key, path: entry.path })),
      navigate: (href, options) => navigate(href, options?.replace ?? false),
    }
  }

  // Opens a studio address. In the studio, the studio opens it, so its
  // history stays right. Opened on its own, the document shows another of
  // its views in place, with its own history, and loads anything else.
  function navigate(href: string, replace: boolean) {
    if (!isStudioHref(href)) return
    if (session) return post({ kind: 'navigate', href, replace })
    const url = new URL(href, location.origin)
    const next = ARTIFACT_ADDRESS.exec(url.pathname)?.[1]
    if (!next || !views[next]) return location.assign(href)
    const own = new URL(location.href)
    own.searchParams.set('artifact', next)
    own.hash = url.hash
    if (replace) history.replaceState(null, '', own)
    else history.pushState(null, '', own)
    void show(next)
  }
  window.addEventListener('popstate', () => {
    if (session) return
    const next = readAddress(location.search).artifact
    if (next !== artifact) void show(next)
  })

  // Links in a view: `#anchors` stay in it, studio addresses go through the
  // studio, other web addresses open in a new tab. Modified clicks, downloads
  // and links a view handles itself are the browser's.
  document.addEventListener('click', (event) => {
    const anchor =
      event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>('a[href]')
        : null
    if (
      !anchor ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.shiftKey ||
      anchor.hasAttribute('download') ||
      (anchor.target && anchor.target !== '_self')
    )
      return
    const raw = anchor.getAttribute('href')!
    if (raw.startsWith('#')) {
      event.preventDefault()
      const id = raw.slice(1)
      try {
        if (id)
          document.getElementById(decodeURIComponent(id))?.scrollIntoView()
        else window.scrollTo(0, 0)
      } catch {
        // A malformed anchor.
      }
      return
    }
    const url = new URL(raw, location.href)
    if (
      url.origin === location.origin &&
      url.pathname.startsWith(STUDIO_BASE) &&
      !url.pathname.startsWith(`${STUDIO_BASE}${PREVIEW_ROUTE}`)
    ) {
      event.preventDefault()
      navigate(`${url.pathname}${url.search}${url.hash}`, false)
    } else if (url.protocol === 'http:' || url.protocol === 'https:') {
      event.preventDefault()
      window.open(url.href, '_blank', 'noopener,noreferrer')
    }
  })

  // The studio's shortcuts work while the view has focus, except while
  // typing in it. The search shortcut comes last, so a view may use it.
  const passOn = (event: KeyboardEvent) => {
    const action = previewShortcut(event)
    if (!session || !action || event.defaultPrevented || isTyping(event.target))
      return
    if (
      (action === 'source' || action === 'grid') &&
      document.querySelector(
        '[role="dialog"],[role="alertdialog"],[role="menu"]',
      )
    )
      return
    event.preventDefault()
    event.stopImmediatePropagation()
    post({ kind: 'shortcut', action })
  }
  window.addEventListener(
    'keydown',
    (event) => {
      if (previewShortcut(event) !== 'palette') passOn(event)
    },
    true,
  )
  window.addEventListener('keydown', (event) => {
    if (previewShortcut(event) === 'palette') passOn(event)
  })

  const hot = import.meta.hot
  if (hot) {
    // The server reports a failed compile to every document it serves, and
    // only after the update that needed it: an error counts when it is about
    // the shown view or a module of this document's latest update.
    let updated: string[] = []
    const ours = (file: string) =>
      file === shown?.file ||
      updated.some((path) => path.split('?')[0]!.endsWith(file))
    // When did a hot update for the shown view last arrive, and is the
    // document waiting for one.
    let updatedAt = 0
    let catchingUp: ReturnType<typeof setTimeout> | undefined
    hot.on('vite:beforeUpdate', ({ updates }) => {
      updated = updates.flatMap((update) => [update.path, update.acceptedPath])
      if (shown && ours(shown.file)) {
        updatedAt = Date.now()
        clearTimeout(catchingUp)
      }
      if (state === 'ready') lifecycle('updating')
    })
    hot.on('vite:error', ({ err }) => {
      const file = (err.loc?.file ?? err.id ?? '').split('?')[0]!
      if (state !== 'ready' || !file || !ours(file)) return
      const where = err.loc
        ? `${err.loc.file ?? err.id ?? ''}:${err.loc.line}:${err.loc.column}`
        : (err.id ?? '')
      lifecycle(
        'error',
        [where, err.message, err.frame].filter(Boolean).join('\n\n'),
      )
    })
    hot.on('vite:afterUpdate', () => {
      if (phase === 'updating') lifecycle('current')
    })
    // The studio saw files change. A view that failed tries again from
    // scratch, as the browser keeps a failed module for good. If the shown
    // view's file changed and no hot update for it follows (Vite can lose a
    // file that was removed and written again), the document says it is out
    // of date and reloads, rather than keep showing older output.
    hot.on('studio:file', ({ files }: { files: ChangedFile[] }) => {
      const news = files.filter(({ at }) => at > requestedAt)
      if (!news.length) return
      if (state === 'error') return location.reload()
      if (state !== 'ready' || !shown) return
      if (!news.some(({ file }) => file === shown!.file)) return
      if (Date.now() - updatedAt < CATCH_UP_MS) return
      lifecycle('updating')
      clearTimeout(catchingUp)
      catchingUp = setTimeout(() => location.reload(), CATCH_UP_MS)
    })
    hot.on('vite:ws:disconnect', () => lifecycle('disconnected'))
  }

  root.dataset.previewState = 'loading'
  post({ kind: 'ready' })
  void show(artifact)
}
