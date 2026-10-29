/// <reference types="vite/client" />
// Runs inside the preview document: mounts the view named in the address
// with the system's app factory, and tells the studio around it how it went.
// The studio can switch the document to another view of the same system; the
// outgoing view stays on screen, inert, until the next one is ready. In
// development the document also says whether what it shows matches the
// saved source. It imports nothing of the studio.
import type { App, Component } from 'vue'
import {
  acceptsHost,
  PREVIEW_CHANNEL,
  PREVIEW_VERSION,
  readAddress,
  type PreviewMessage,
  type PreviewPhase,
  type PreviewState,
} from '../protocol.ts'
import { COMPILE_ROUTE } from '../constants.ts'

interface View {
  /** Absolute path, with forward slashes. */
  file: string
  title: string
  /** None while the view is empty. */
  load: (() => Promise<{ default?: Component }>) | null
}

interface MountOptions {
  create: (options: {
    component: Component
    props?: Record<string, unknown>
  }) => App
  views: Record<string, View>
}

type Outgoing = PreviewMessage extends infer M
  ? M extends PreviewMessage
    ? Omit<M, 'channel' | 'version' | 'session' | 'runtime' | 'artifact'>
    : never
  : never

const MAX_DETAIL = 8192
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
  const runtime = randomId()
  const root = document.documentElement
  const host = document.getElementById('app')!
  let artifact = address.artifact
  let render = 0
  let sequence = 0
  let state: PreviewState = 'loading'
  let phase: PreviewPhase = 'current'
  // What is on screen: the view, its app and the file it came from.
  let shown: {
    artifact: string
    app: App
    box: HTMLElement
    file: string
  } | null = null

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
    try {
      component = (await view.load()).default
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
    const box = document.createElement('div')
    box.hidden = true
    host.append(box)
    let failed = ''
    const app = create({ component })
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
    shown = { artifact: id, app, box, file: view.file }
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

  // Views added, renamed, emptied or written since the document loaded.
  window.addEventListener('studio:views', () => {
    const view = artifact ? views[artifact] : undefined
    const current = shown?.artifact === artifact ? shown.file : null
    if (state === 'loading') return
    if (state !== 'ready' || !view || view.file !== current) void show(artifact)
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
    hot.on('studio:file', ({ files }: { files: string[] }) => {
      if (state === 'error') return location.reload()
      if (state !== 'ready' || !shown || !files.includes(shown.file)) return
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
