<script setup lang="ts">
import { usePreviewFrame } from '../../prototypes/composables/usePreviewFrame'

// Something a system renders itself, in its own look: one example of a
// component page, or the system's own Overview content. It shows in the
// system's preview document, in a frame as tall as its content, so pop-ups
// stay inside it. One that fails shows its error in its place, and nothing
// else on the page breaks. It updates by itself when its file changes.
const props = defineProps<{
  systemId: string
  /** The preview document's ID for it. */
  artifact: string
  title: string
}>()

const MIN_HEIGHT = 96
const { t } = useI18n()
const { previewDocument } = await useSystems()
const frame = useTemplateRef('frame')
const boundary = useTemplateRef('boundary')
const { src, state, detail, shown } = usePreviewFrame({
  frame,
  boundary,
  document: previewDocument(props.systemId),
  artifact: () => props.artifact,
})

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
      :style="{ height: `${height}px` }"
      @load="measure"
    />
    <p
      v-if="state === 'loading' && !shown"
      role="status"
      class="absolute inset-0 bg-default p-4 text-sm text-muted"
    >
      {{ t('systems.component.exampleLoading') }}
    </p>
    <div
      v-else-if="state === 'error'"
      role="alert"
      class="absolute inset-0 overflow-auto bg-default p-4 text-sm"
    >
      <p class="text-default">{{ t('systems.component.exampleError') }}</p>
      <pre
        v-if="detail"
        class="mt-2 font-mono text-xs whitespace-pre-wrap text-muted"
        >{{ detail }}</pre>
    </div>
  </div>
</template>
