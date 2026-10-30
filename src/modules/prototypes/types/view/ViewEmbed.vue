<script setup lang="ts">
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../../../../app/composables/useManifest'
import { usePreviewFrame } from '../../composables/usePreviewFrame'

// A view embedded in a document: its desktop layout, 1440 px wide, scaled to
// the embed's width and cropped to its height. It is a picture only: no
// clicks, no keyboard focus, hidden from screen readers, and it can't
// navigate. It updates when its source changes, like the view's own page.
const props = defineProps<{
  prototype: ManifestPrototype
  artifact: ManifestArtifact
  width: number
  height: number
}>()

const VIEWPORT_WIDTH = 1440
const { t } = useI18n()
const { previewDocument } = await useSystems()
const frame = useTemplateRef('frame')
const boundary = useTemplateRef('boundary')
const { src, state, shown } = usePreviewFrame({
  frame,
  boundary,
  document: previewDocument(props.prototype.systemId),
  artifact: () => props.artifact.id,
})
const scale = computed(() => props.width / VIEWPORT_WIDTH)
</script>

<template>
  <div
    v-if="prototype.systemMissing"
    class="flex items-center justify-center bg-elevated p-4 text-center text-sm text-muted"
    :style="{ width: `${width}px`, height: `${height}px` }"
    :data-preview-artifact="artifact.id"
  >
    {{
      t('prototypes.rebuildNeeded.embed', {
        system: prototype.systemMissing.label,
      })
    }}
  </div>
  <div
    v-else
    ref="boundary"
    class="relative overflow-hidden bg-default"
    :style="{ width: `${width}px`, height: `${height}px` }"
    :data-preview-artifact="artifact.id"
    :data-preview-state="state"
  >
    <div
      aria-hidden="true"
      inert
      class="pointer-events-none absolute top-0 left-0 origin-top-left"
      :style="{
        width: `${VIEWPORT_WIDTH}px`,
        height: `${height / scale}px`,
        transform: `scale(${scale})`,
      }"
    >
      <iframe
        ref="frame"
        data-preview-frame
        :src="src"
        :title="artifact.title"
        tabindex="-1"
        class="size-full border-0 bg-white"
        :class="{ invisible: state === 'error' }"
      />
    </div>
    <p
      v-if="state === 'loading' && !shown"
      role="status"
      class="absolute inset-0 p-4 text-sm text-muted"
    >
      {{ t('embed.loading') }}
    </p>
    <p
      v-else-if="state === 'error'"
      role="alert"
      class="absolute inset-0 p-4 text-sm text-default"
    >
      {{ t('embed.viewError') }}
    </p>
  </div>
</template>
