<script setup lang="ts">
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../../../app/composables/useManifest'
import CanvasScene from './CanvasScene.vue'

// A canvas's page: the artifact page's file menu, and the canvas. Each canvas
// opens in a fresh editor; nothing carries over from the previous one.
defineProps<{
  prototype: ManifestPrototype
  artifact: ManifestArtifact
}>()
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-2">
    <div v-if="$slots.actions" class="flex items-center justify-end gap-1">
      <!-- The artifact page's file menu. -->
      <slot name="actions" />
    </div>
    <CanvasScene
      :key="artifact.id"
      :prototype="prototype"
      :artifact="artifact"
    />
  </div>
</template>
