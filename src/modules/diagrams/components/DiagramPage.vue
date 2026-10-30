<script setup lang="ts">
import AppFileError from '../../../../app/components/AppFileError.vue'
import MermaidDiagram from '../../../../app/components/MermaidDiagram.vue'
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../../../app/composables/useManifest'

// A diagram's page: the `.mermaid` or `.mmd` file drawn filling the page.
// Saving the file draws it again in place, the previous drawing staying
// until the new one is ready. Invalid Mermaid shows its message, and the
// source still opens from the file menu to repair it.
const props = defineProps<{
  prototype: ManifestPrototype
  artifact: ManifestArtifact
}>()

const { text, error, updating } = useArtifactText(
  () => props.prototype,
  () => props.artifact,
)
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div v-if="$slots.actions" class="flex items-center justify-end gap-1">
      <!-- The artifact page's file menu. -->
      <slot name="actions" />
    </div>
    <div v-if="error && text === undefined" class="p-8">
      <AppFileError :error="error" />
    </div>
    <MermaidDiagram
      v-else-if="text !== undefined"
      :source="text"
      :stale="updating"
      fit
    />
  </div>
</template>
