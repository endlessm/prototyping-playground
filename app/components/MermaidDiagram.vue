<script setup lang="ts">
import { renderMermaid } from '../utils/mermaid'

// A Mermaid diagram drawn from its text, in the studio's colours for the
// current colour mode. The previous drawing stays while a new one renders,
// saying it is updating; invalid text shows Mermaid's message instead. A
// render that never finishes gives up after 15 seconds. In a document it
// sits in the text; `fit` fills its container (a diagram's page), and
// `compact` is the smaller preview embedded in documents.
const props = defineProps<{
  source?: string
  fit?: boolean
  compact?: boolean
  /** Newer text is on its way: the drawing says it is updating. */
  stale?: boolean
}>()
const { t } = useI18n()
const colorMode = useColorMode()
const id = `mermaid-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

const TIME_LIMIT_MS = 15_000
const svg = ref<string>()
const error = ref<string>()
const rendering = ref(false)
const timedOut = ref(false)
let renders = 0

// The theme's colours are read when drawing, so a stylesheet changed while
// the studio runs draws the diagram again.
const theme = ref(0)
if (import.meta.hot) {
  const hot = import.meta.hot
  const changed = () => theme.value++
  hot.on('vite:afterUpdate', changed)
  onScopeDispose(() => hot.off('vite:afterUpdate', changed))
}

watch(
  () => [props.source ?? '', colorMode.value === 'dark', theme.value] as const,
  async ([source, dark]) => {
    const render = ++renders
    rendering.value = true
    timedOut.value = false
    // Mermaid can't be stopped; a render past the limit is ignored instead.
    const deadline = setTimeout(() => {
      if (render !== renders) return
      ++renders
      rendering.value = false
      timedOut.value = true
    }, TIME_LIMIT_MS)
    try {
      // Mermaid replaces any element with the id it draws with.
      const drawn = await renderMermaid(source, `${id}-${render}`, dark)
      if (render !== renders) return
      svg.value = drawn
      error.value = undefined
    } catch (failure) {
      if (render !== renders) return
      svg.value = undefined
      error.value = failure instanceof Error ? failure.message : String(failure)
    } finally {
      clearTimeout(deadline)
      if (render === renders) rendering.value = false
    }
  },
  { immediate: true },
)
onScopeDispose(() => ++renders)

const filling = computed(() => props.fit || props.compact)
const state = computed(() =>
  error.value ? 'error' : svg.value ? 'ready' : 'loading',
)
const notice = computed(() =>
  timedOut.value
    ? t('markdown.diagramTimeout')
    : svg.value && (rendering.value || props.stale)
      ? t('markdown.diagramUpdating')
      : undefined,
)
</script>

<template>
  <figure
    class="min-w-0"
    :class="
      filling
        ? [
            'not-prose flex h-full min-h-0 flex-1 flex-col gap-2',
            compact ? 'p-3' : 'p-6',
          ]
        : 'my-6 rounded-lg border border-default bg-default p-4'
    "
    :data-diagram-state="state"
    :data-diagram-freshness="notice ? 'stale' : 'current'"
  >
    <figcaption v-if="notice" role="status" class="text-xs text-muted">
      {{ notice }}
    </figcaption>
    <!-- Mermaid's SVG, rendered with its strict security level. -->
    <!-- eslint-disable vue/no-v-html -->
    <div
      v-if="svg"
      :class="
        filling
          ? 'relative min-h-0 min-w-0 flex-1 overflow-hidden [&_svg]:absolute [&_svg]:inset-0 [&_svg]:size-full! [&_svg]:max-w-none!'
          : 'overflow-x-auto [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full'
      "
      v-html="svg"
    />
    <!-- eslint-enable vue/no-v-html -->
    <div v-else-if="error" role="alert" class="min-h-0 overflow-auto">
      <p class="text-sm font-medium text-highlighted">
        {{ t('markdown.diagramError') }}
      </p>
      <pre
        class="mt-2 overflow-x-auto text-xs whitespace-pre-wrap text-muted"
        >{{ error }}</pre>
    </div>
    <p v-else-if="!timedOut" role="status" class="text-sm text-muted">
      {{ t('markdown.diagramRendering') }}
    </p>
  </figure>
</template>
