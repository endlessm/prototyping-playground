<script setup lang="ts">
import { previewAddress } from '../../../../../tooling/preview/protocol'
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../../../../app/composables/useManifest'
import ViewPreview from './ViewPreview.vue'

// A view's page: its preview, filling the page, under a link that opens the
// preview document on its own in a new tab (a fresh runtime, for people and
// browser tools). A prototype whose system was deleted can't render its
// views: they wait for a rebuild.
const props = defineProps<{
  prototype: ManifestPrototype
  artifact: ManifestArtifact
}>()

const { t } = useI18n()
const { previewDocument } = await useSystems()
const document = computed(() => previewDocument(props.prototype.systemId))
const standalone = computed(() =>
  previewAddress(document.value, props.artifact.id),
)
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
    <div class="flex items-center justify-end gap-1 px-4 py-2 sm:px-6">
      <UButton
        :to="standalone"
        external
        target="_blank"
        icon="i-lucide-external-link"
        size="sm"
        :label="t('prototypes.openInTab')"
      />
    </div>
    <ViewPreview
      :key="document"
      :prototype="prototype"
      :artifact="artifact"
      :document="document"
    />
  </div>
</template>
