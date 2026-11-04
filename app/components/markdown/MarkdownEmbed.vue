<script setup lang="ts">
import ArtifactEmbed from '../artifacts/ArtifactEmbed.vue'

// A file of the document's prototype embedded with image syntax on its own
// line: `![Sign in](./flows/Sign in.vue)`. It is as wide as the text and
// between 220 and 440 px tall.
const props = defineProps<{ source?: string; label?: string }>()
const { t } = useI18n()
const { origin, resolve } = useMarkdownOrigin()

const figure = useTemplateRef('figure')
const { width } = useElementSize(figure)
// The frame's border takes a pixel on each side.
const inner = computed(() => Math.max(1, Math.floor(width.value) - 2))
const height = computed(() =>
  Math.round(Math.max(220, Math.min(440, inner.value * 0.6))),
)
const resolution = computed(() => resolve(props.source ?? '', 'required'))
</script>

<template>
  <!-- `data-embed` names what it embeds, for tools over the page. -->
  <figure
    ref="figure"
    class="my-6 min-w-0"
    :data-embed="source"
    :data-embed-label="label"
  >
    <ArtifactEmbed
      v-if="origin && resolution && width > 0"
      :prototype="origin.prototype"
      :resolution="resolution"
      :label="label"
      surface="document"
      :width="inner"
      :height="height"
    />
    <p v-else-if="!origin" role="status" class="p-4 text-sm text-muted">
      {{ t('embed.invalid') }}
    </p>
  </figure>
</template>
