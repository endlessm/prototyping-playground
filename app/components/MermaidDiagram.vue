<script setup lang="ts">
import { renderMermaid } from '../utils/mermaid'

// A Mermaid diagram drawn from its text, in the studio's colours for the
// current colour mode. The previous drawing stays while a new one renders;
// invalid text shows Mermaid's message instead.
const props = defineProps<{ source?: string }>()
const { t } = useI18n()
const colorMode = useColorMode()
const id = `mermaid-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

const svg = ref<string>()
const error = ref<string>()
let renders = 0

watch(
  () => [props.source ?? '', colorMode.value === 'dark'] as const,
  async ([source, dark]) => {
    const render = ++renders
    try {
      const drawn = await renderMermaid(source, id, dark)
      if (render !== renders) return
      svg.value = drawn
      error.value = undefined
    } catch (failure) {
      if (render !== renders) return
      svg.value = undefined
      error.value = failure instanceof Error ? failure.message : String(failure)
    }
  },
  { immediate: true },
)
</script>

<template>
  <figure
    class="my-6 min-w-0 rounded-lg border border-default bg-default p-4"
    :data-diagram-state="error ? 'error' : svg ? 'ready' : 'loading'"
  >
    <!-- Mermaid's SVG, rendered with its strict security level. -->
    <!-- eslint-disable vue/no-v-html -->
    <div
      v-if="svg"
      class="overflow-x-auto [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
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
    <p v-else role="status" class="text-sm text-muted">
      {{ t('markdown.diagramRendering') }}
    </p>
  </figure>
</template>
