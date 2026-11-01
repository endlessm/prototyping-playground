<script setup lang="ts">
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../../../../app/composables/useManifest'
import ViewPreview from './ViewPreview.vue'

// A view's page: its preview, filling the page edge to edge. Its row in the
// file tree opens the preview document alone in a new tab. A prototype whose
// system was deleted can't render its views: they wait for a rebuild.
const props = defineProps<{
  prototype: ManifestPrototype
  artifact: ManifestArtifact
}>()

const { t } = useI18n()
const { previewDocument } = await useSystems()
const document = computed(() => previewDocument(props.prototype.systemId))
</script>

<template>
  <UEmpty
    v-if="prototype.systemMissing"
    icon="i-lucide-shapes"
    :title="t('prototypes.rebuildNeeded.title')"
    :description="
      t('prototypes.rebuildNeeded.description', {
        system: prototype.systemMissing.label,
      })
    "
    variant="outline"
    class="m-4 h-full justify-center sm:m-6"
  />
  <div v-else class="flex h-full min-h-0 flex-col">
    <ViewPreview
      :key="document"
      :prototype="prototype"
      :artifact="artifact"
      :document="document"
    />
  </div>
</template>
