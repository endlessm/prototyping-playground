<script setup lang="ts">
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../../../app/composables/useManifest'
import CanvasEmbedScene from './CanvasEmbedScene.vue'

// A canvas embedded in a document. Another canvas starts a fresh opening;
// the same one follows its file.
defineProps<{
  prototype: ManifestPrototype
  artifact: ManifestArtifact
  width: number
  height: number
  startedAt?: number
}>()
</script>

<template>
  <CanvasEmbedScene
    :key="artifact.id"
    :prototype="prototype"
    :artifact="artifact"
    :width="width"
    :height="height"
    :started-at="startedAt"
  />
</template>
