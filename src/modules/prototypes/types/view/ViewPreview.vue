<script setup lang="ts">
import {
  acceptsPreview,
  PREVIEW_CHANNEL,
  PREVIEW_VERSION,
  previewAddress,
  type HostMessage,
  type PreviewPhase,
  type PreviewState,
} from '../../../../../tooling/preview/protocol'
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../../../../app/composables/useManifest'
import ViewEmpty from './ViewEmpty.vue'
import ViewError from './ViewError.vue'

// A view renders in its system's preview document, a same-origin iframe
// that holds only the system's app. The frame stays while the person moves
// between views of the prototype: the studio tells the document which view
// to show, and the document keeps the outgoing one until the next is ready.
// The document reports how rendering went and whether it shows the latest
// saved source; this page says so in the studio's own words.
const props = defineProps<{
  prototype: ManifestPrototype
  artifact: ManifestArtifact
  /** The preview document's address, without its query. */
  document: string
}>()

const { t } = useI18n()
const SLOW_MS = 200
const SILENT_MS = 15_000

const session =
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
// Fixed for the frame's life: later views travel by message, not address.
const src = previewAddress(props.document, props.artifact.id, session)
const frame = useTemplateRef('frame')
const boundary = useTemplateRef('boundary')
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
    artifact: props.artifact.id,
    kind: 'configure',
  }
  frame.value?.contentWindow?.postMessage(message, location.origin)
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
  boundary.value?.dispatchEvent(
    new CustomEvent(name, {
      bubbles: true,
      detail: { session, runtime, artifact: props.artifact.id, ...extra },
    }),
  )

watch(
  () => props.artifact.id,
  () => {
    opening()
    configure()
  },
)

useEventListener(window, 'message', (event: MessageEvent) => {
  if (
    !acceptsPreview(
      event,
      frame.value?.contentWindow ?? null,
      location.origin,
      {
        session,
        runtime,
        artifact: props.artifact.id,
      },
    )
  )
    return
  const message = event.data
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

const shortFile = computed(() => {
  const folder = props.prototype.folder
  return props.artifact.file.slice(folder.lastIndexOf('/') + 1)
})
const { copy, copied } = useClipboard({ copiedDuring: 1500, legacy: true })
</script>

<template>
  <div
    ref="boundary"
    class="relative flex min-h-0 flex-1 flex-col"
    :data-preview-session="session"
    :data-preview-artifact="artifact.id"
    :data-preview-state="state"
    :data-preview-phase="phase"
    :data-preview-freshness="freshness"
  >
    <iframe
      ref="frame"
      data-preview-frame
      :src="src"
      :title="artifact.title"
      :data-preview-state="state"
      class="min-h-0 w-full flex-1 rounded-md border border-default bg-white"
      :class="{ hidden: state === 'error' || state === 'empty' }"
    />
    <ViewError v-if="state === 'error'" :detail="detail" />
    <ViewEmpty
      v-else-if="state === 'empty'"
      :file="artifact.file"
      :short-file="shortFile"
    />
    <div
      v-if="silent"
      role="status"
      class="absolute inset-x-0 bottom-0 rounded-b-md border-t border-default bg-default p-3 text-sm"
    >
      {{ t('view.silent') }}
    </div>
    <div
      v-else-if="state === 'loading' && slow"
      role="status"
      class="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-md border-t border-default bg-default p-3 text-sm"
    >
      {{ shown ? t('view.opening') : t('view.loading') }}
    </div>
    <div
      v-else-if="state === 'ready' && freshness === 'stale'"
      role="status"
      class="absolute inset-x-0 bottom-0 max-h-1/2 space-y-2 overflow-auto rounded-b-md border-t border-default bg-default p-3 text-sm"
    >
      <p>
        {{ t('view.outOfDate') }}
        <template v-if="phase === 'error'">{{
          t('view.couldNotRender')
        }}</template>
        <template v-else-if="phase === 'updating'">{{
          t('view.updating')
        }}</template>
      </p>
      <template v-if="phase === 'error' && phaseDetail">
        <pre
          class="overflow-auto rounded-md bg-muted p-2 text-xs whitespace-pre-wrap text-muted"
          >{{ phaseDetail }}</pre>
        <UButton
          size="xs"
          color="neutral"
          variant="outline"
          :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
          :label="copied ? t('view.copied') : t('view.copyError')"
          @click="copy(phaseDetail)"
        />
      </template>
    </div>
  </div>
</template>
