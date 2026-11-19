<script setup lang="ts">
import type {
  PreviewMessage,
  PreviewProps,
  PreviewState,
} from '../../../../tooling/preview/protocol'
import { usePreviewFrame } from '../../prototypes/composables/usePreviewFrame'

// The frame a system's own rendering shows in: its preview document in a
// same-origin iframe as tall as its content, with the loading and error
// messages over it. Shared by a component page's examples and the Lab's
// Playground stage, which differ in their sizes, their words and what they
// do with the measured content (`fit`, after each change in size, and
// `load`, after each load of the document).
const props = withDefaults(
  defineProps<{
    systemId: string
    /** The preview document's ID for it. */
    artifact: string
    title: string
    /** A playground's props, sent by message; examples have none. */
    props?: PreviewProps
    minHeight: number
    /** Room for an error and the start of its detail. */
    errorHeight: number
    loadingText: string
    errorText: string
    /** Sizes the frame from `--frame-height`, its content's height. */
    frameClass?: string
  }>(),
  { props: undefined, frameClass: 'h-(--frame-height)' },
)
type View = Window & typeof globalThis
const emit = defineEmits<{
  fit: [view: View, app: HTMLElement]
  load: [view: View]
  state: [state: PreviewState]
  message: [message: PreviewMessage]
}>()

const { previewDocument } = await useSystems()
const frame = useTemplateRef('frame')
const boundary = useTemplateRef('boundary')
const { src, state, detail, shown } = usePreviewFrame({
  frame,
  boundary,
  document: previewDocument(props.systemId),
  artifact: () => props.artifact,
  props: props.props ? () => props.props! : undefined,
  onMessage: (message) => emit('message', message),
})
watch(state, (next) => emit('state', next), { immediate: true })

// The document is on the studio's origin, so its content can be measured.
const height = ref(props.minHeight)
let observer: ResizeObserver | undefined
function measure() {
  observer?.disconnect()
  const view = frame.value?.contentWindow as View | null
  const app = view?.document.getElementById('app')
  if (!view || !app) return
  const fit = () => {
    const bottom = app.getBoundingClientRect().bottom + view.scrollY
    height.value = Math.max(props.minHeight, Math.ceil(bottom))
    emit('fit', view, app)
  }
  observer = new view.ResizeObserver(fit)
  observer.observe(app)
  fit()
  emit('load', view)
}
onBeforeUnmount(() => observer?.disconnect())

const wanted = computed(() =>
  state.value === 'error'
    ? Math.max(height.value, props.errorHeight)
    : height.value,
)
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
      :class="[frameClass, { invisible: state === 'error' }]"
      :style="{ '--frame-height': `${wanted}px` }"
      @load="measure"
    />
    <p
      v-if="state === 'loading' && !shown"
      role="status"
      class="absolute inset-0 bg-default p-4 text-sm text-muted"
    >
      {{ loadingText }}
    </p>
    <div
      v-else-if="state === 'error'"
      role="alert"
      class="absolute inset-0 overflow-auto bg-default p-4 text-sm"
    >
      <p class="text-default">{{ errorText }}</p>
      <pre
        v-if="detail"
        class="mt-2 font-mono text-xs whitespace-pre-wrap text-muted"
        >{{ detail }}</pre>
    </div>
  </div>
</template>
