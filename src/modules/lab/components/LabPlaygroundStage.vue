<script setup lang="ts">
import type {
  PreviewProps,
  PreviewState,
} from '../../../../tooling/preview/protocol'
import { usePreviewFrame } from '../../prototypes/composables/usePreviewFrame'

// A component's playground: its component file, rendered alone in the
// system's preview document with the given props. New props reach the
// mounted component by message, so it updates in place and the frame never
// reloads. Props that make it throw show the error in its place until the
// next props. The frame grows with the component up to a cap, then scrolls
// inside, so pop-ups stay in it and the controls beside it stay in view.
const props = defineProps<{
  systemId: string
  /** The playground's preview ID: the catalog component's `playground`. */
  artifact: string
  title: string
  /** Plain JSON values; a key left out or undefined takes its default. */
  props: PreviewProps
}>()
const emit = defineEmits<{ state: [state: PreviewState] }>()

const MIN_HEIGHT = 160
// Room for an error and the start of its detail.
const ERROR_HEIGHT = 200
const { t } = useI18n()
const { previewDocument } = await useSystems()
const frame = useTemplateRef('frame')
const boundary = useTemplateRef('boundary')
const { src, state, detail, shown } = usePreviewFrame({
  frame,
  boundary,
  document: previewDocument(props.systemId),
  artifact: () => props.artifact,
  props: () => props.props,
})
watch(state, (next) => emit('state', next), { immediate: true })

// The document is on the studio's origin, so its content can be measured.
const height = ref(MIN_HEIGHT)
let observer: ResizeObserver | undefined
function measure() {
  observer?.disconnect()
  const view = frame.value?.contentWindow as (Window & typeof globalThis) | null
  const app = view?.document.getElementById('app')
  if (!view || !app) return
  const fit = () => {
    const bottom = app.getBoundingClientRect().bottom + view.scrollY
    height.value = Math.max(MIN_HEIGHT, Math.ceil(bottom))
  }
  observer = new view.ResizeObserver(fit)
  observer.observe(app)
  fit()
}
onBeforeUnmount(() => observer?.disconnect())

const frameHeight = computed(() => {
  const wanted =
    state.value === 'error'
      ? Math.max(height.value, ERROR_HEIGHT)
      : height.value
  return `min(${wanted}px, 70vh)`
})
</script>

<template>
  <div
    ref="boundary"
    class="relative overflow-hidden rounded-lg border border-default bg-white"
    :data-preview-artifact="artifact"
    :data-preview-state="state"
  >
    <iframe
      ref="frame"
      data-preview-frame
      :src="src"
      :title="title"
      class="block w-full border-0"
      :class="{ invisible: state === 'error' }"
      :style="{ height: frameHeight }"
      @load="measure"
    />
    <p
      v-if="state === 'loading' && !shown"
      role="status"
      class="absolute inset-0 bg-default p-4 text-sm text-muted"
    >
      {{ t('lab.stage.loading') }}
    </p>
    <div
      v-else-if="state === 'error'"
      role="alert"
      class="absolute inset-0 overflow-auto bg-default p-4 text-sm"
    >
      <p class="text-default">{{ t('lab.stage.error') }}</p>
      <pre
        v-if="detail"
        class="mt-2 font-mono text-xs whitespace-pre-wrap text-muted"
        >{{ detail }}</pre>
    </div>
  </div>
</template>
