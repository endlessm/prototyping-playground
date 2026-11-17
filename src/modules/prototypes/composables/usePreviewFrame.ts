import type { Ref } from 'vue'
import {
  acceptsPreview,
  PREVIEW_CHANNEL,
  PREVIEW_VERSION,
  previewAddress,
  type HostBody,
  type HostMessage,
  type PreviewMessage,
  type PreviewPhase,
  type PreviewProps,
  type PreviewState,
} from '../../../../tooling/preview/protocol'

const SLOW_MS = 200
const SILENT_MS = 15_000

/**
 * The studio's side of one preview frame: a same-origin iframe of the
 * system's preview document that shows one view at a time. The studio tells
 * the document which view to show when it is ready (and again when the view
 * changes), and hears how rendering went and whether it shows the latest
 * saved source. Used by a view's page and by views embedded in documents.
 * A component's playground also sends the props to mount it with, after
 * each `ready` and whenever they change, without reloading the document.
 * Other host messages, such as a Breakdown's highlight, go the same way.
 */
export function usePreviewFrame(options: {
  frame: Readonly<Ref<HTMLIFrameElement | null>>
  /** Where lifecycle and state events are announced, bubbling. */
  boundary: Readonly<Ref<HTMLElement | null>>
  /** The preview document's address, without its query. */
  document: string
  artifact: () => string
  /** Messages other than status and lifecycle, such as navigation. */
  onMessage?: (message: PreviewMessage) => void
  /** A playground's props; a key that is undefined takes its default. */
  props?: () => PreviewProps
  /** Further host messages, sent after each `ready` and whenever they change. */
  messages?: () => HostBody[]
}) {
  const session =
    Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
  // Fixed for the frame's life: later views travel by message, not address.
  const src = previewAddress(options.document, options.artifact(), session)
  let runtime: string | null = null
  let render = -1
  let sequence = -1

  const state = ref<PreviewState>('loading')
  const detail = ref('')
  const phase = ref<PreviewPhase>('current')
  const phaseDetail = ref('')
  // Whether the frame has shown a view, which stays until the next is ready.
  const shown = ref(false)
  const slow = ref(false)
  const silent = ref(false)
  const freshness = computed(() =>
    phase.value === 'current' ? 'current' : 'stale',
  )

  const slowTimer = useTimeoutFn(() => (slow.value = true), SLOW_MS, {
    immediate: false,
  })
  const watchdog = useTimeoutFn(() => (silent.value = true), SILENT_MS, {
    immediate: false,
  })
  const waitForPreview = () => {
    watchdog.stop()
    watchdog.start()
  }

  function configure() {
    if (!runtime) return
    const message: HostMessage = {
      channel: PREVIEW_CHANNEL,
      version: PREVIEW_VERSION,
      session,
      runtime,
      artifact: options.artifact(),
      kind: 'configure',
    }
    options.frame.value?.contentWindow?.postMessage(message, location.origin)
    sendProps()
    sendMessages()
  }

  function sendMessages() {
    if (!runtime || !options.messages) return
    for (const body of options.messages()) {
      const message = {
        channel: PREVIEW_CHANNEL,
        version: PREVIEW_VERSION,
        session,
        runtime,
        artifact: options.artifact(),
        ...(JSON.parse(JSON.stringify(body)) as HostBody),
      } as HostMessage
      options.frame.value?.contentWindow?.postMessage(message, location.origin)
    }
  }

  function sendProps() {
    if (!runtime || !options.props) return
    // Through JSON: plain values only, without Vue's proxies, which can't
    // be posted, and without undefined keys.
    const props = JSON.parse(JSON.stringify(options.props())) as PreviewProps
    const message: HostMessage = {
      channel: PREVIEW_CHANNEL,
      version: PREVIEW_VERSION,
      session,
      runtime,
      artifact: options.artifact(),
      kind: 'props',
      props,
    }
    options.frame.value?.contentWindow?.postMessage(message, location.origin)
  }

  function opening() {
    state.value = 'loading'
    detail.value = ''
    phase.value = 'current'
    render = -1
    sequence = -1
    slow.value = false
    slowTimer.stop()
    slowTimer.start()
    waitForPreview()
  }

  const announce = (name: string, extra: Record<string, unknown>) =>
    options.boundary.value?.dispatchEvent(
      new CustomEvent(name, {
        bubbles: true,
        detail: { session, runtime, artifact: options.artifact(), ...extra },
      }),
    )

  watch(options.artifact, () => {
    opening()
    configure()
  })
  if (options.props) watch(options.props, sendProps, { deep: true })
  if (options.messages) watch(options.messages, sendMessages, { deep: true })

  useEventListener(window, 'message', (event: MessageEvent) => {
    if (
      !acceptsPreview(
        event,
        options.frame.value?.contentWindow ?? null,
        location.origin,
        { session, runtime, artifact: options.artifact() },
      )
    )
      return
    const message = event.data as PreviewMessage
    silent.value = false
    if (message.kind === 'ready') {
      // A new load of the document, the first or after it reloaded.
      runtime = message.runtime
      opening()
      configure()
      return
    }
    if (message.kind === 'lifecycle') {
      if (message.sequence <= sequence) return
      sequence = message.sequence
      phase.value = message.phase
      phaseDetail.value = message.detail
      announce('studio:artifact-lifecycle', {
        phase: message.phase,
        freshness: freshness.value,
      })
      return
    }
    if (message.kind !== 'status') {
      options.onMessage?.(message)
      return
    }
    if (message.render < render) return
    render = message.render
    state.value = message.state
    detail.value = message.detail
    if (message.state === 'loading') waitForPreview()
    else {
      watchdog.stop()
      slowTimer.stop()
      slow.value = false
      shown.value = message.state === 'ready'
    }
    announce('studio:preview-state', {
      state: message.state,
      render: message.render,
    })
  })

  onMounted(opening)

  return {
    session,
    src,
    state,
    detail,
    phase,
    phaseDetail,
    shown,
    slow,
    silent,
    freshness,
  }
}
