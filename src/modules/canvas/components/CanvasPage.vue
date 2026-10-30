<script setup lang="ts">
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../../../app/composables/useManifest'
import CanvasScene from './CanvasScene.vue'

// A canvas's page: the canvas, filling the page. Each canvas opens in a
// fresh editor; nothing carries over from the previous one.
defineProps<{
  prototype: ManifestPrototype
  artifact: ManifestArtifact
}>()
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <CanvasScene
      :key="artifact.id"
      :prototype="prototype"
      :artifact="artifact"
    />
  </div>
</template>
