<script setup lang="ts">
import ArtifactEmbed from '../../../../app/components/artifacts/ArtifactEmbed.vue'
import type { ManifestPrototype } from '../../../../app/composables/useManifest'
import type { ReferenceResolution } from '../../../../app/utils/artifactReference'
import { EMBED_BORDER, EMBED_HEADER_HEIGHT } from '../utils/embeds'

// One item on a canvas, drawn inside Excalidraw's embed box: a live preview
// in the shared frame, or a card. It is a picture: only its title bar (or a
// card's Open) takes pointer input; everything else falls through to the
// canvas, so the whole item moves. Far off screen it isn't painted but
// keeps running; zoomed far out a preview shows its name in large type.
const props = defineProps<{
  prototype: ManifestPrototype
  resolution: ReferenceResolution
  /** The element's size on the canvas. */
  width: number
  height: number
  /** Whether its preview is live; before that, a sized placeholder. */
  mounted: boolean
  offscreen: boolean
  overview: boolean
}>()
const { t } = useI18n()

const title = computed(() =>
  props.resolution.state === 'resolved'
    ? props.resolution.artifact.title
    : t('embed.file'),
)
</script>

<template>
  <div data-canvas-frame class="size-full [&>*]:size-full">
    <ArtifactEmbed
      :prototype="prototype"
      :resolution="resolution"
      surface="canvas"
      :width="Math.max(1, width - EMBED_BORDER)"
      :height="Math.max(1, height - EMBED_HEADER_HEIGHT - EMBED_BORDER)"
      :mounted="mounted"
      :hidden="offscreen || overview"
      inert
    >
      <div v-if="overview && !offscreen" class="canvas-overview">
        <span>{{ title }}</span>
      </div>
    </ArtifactEmbed>
  </div>
</template>
