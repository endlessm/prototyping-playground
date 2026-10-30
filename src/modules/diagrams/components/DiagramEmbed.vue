<script setup lang="ts">
import MermaidDiagram from '../../../../app/components/MermaidDiagram.vue'
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../../../app/composables/useManifest'

// A diagram embedded in a document: a compact drawing of the whole diagram,
// sized to the embed, following its file as it is saved.
const props = defineProps<{
  prototype: ManifestPrototype
  artifact: ManifestArtifact
  width: number
  height: number
}>()
const { t } = useI18n()

const { text, error, updating } = useArtifactText(
  () => props.prototype,
  () => props.artifact,
)
</script>

<template>
  <div
    class="flex overflow-hidden bg-default"
    :style="{ width: `${width}px`, height: `${height}px` }"
    :data-preview-artifact="artifact.id"
  >
    <MermaidDiagram
      v-if="text !== undefined"
      :source="text"
      :stale="updating"
      compact
    />
    <p v-else-if="error" role="alert" class="p-4 text-xs text-muted">
      {{ t('diagram.failed') }}
    </p>
    <p v-else role="status" class="p-4 text-xs text-muted">
      {{ t('diagram.loading') }}
    </p>
  </div>
</template>
