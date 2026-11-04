<script setup lang="ts">
import AppFileError from '../../../../app/components/AppFileError.vue'
import MermaidDiagram from '../../../../app/components/MermaidDiagram.vue'
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../../../app/composables/useManifest'
import { useArtifactSurfaceProvider } from '../../../../app/composables/useArtifactSurface'
import { createDiagramSurface } from '../types/diagram/diagramSurface'

// A diagram's page: the `.mermaid` or `.mmd` file drawn filling the page.
// Saving the file draws it again in place, the previous drawing staying
// until the new one is ready. Invalid Mermaid shows its message, and the
// source still opens from the file tree's menu or ⌘' / Ctrl+' to repair it.
const props = defineProps<{
  prototype: ManifestPrototype
  artifact: ManifestArtifact
}>()

const { text, error, updating } = useArtifactText(
  () => props.prototype,
  () => props.artifact,
)

// Tools over the page, such as comments, read the drawing through this.
const root = useTemplateRef<HTMLElement>('root')
const surface = computed(() =>
  root.value ? createDiagramSurface(root.value) : null,
)
useArtifactSurfaceProvider(() => surface.value)
</script>

<template>
  <div ref="root" class="flex h-full min-h-0 flex-col p-4 sm:p-6">
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
