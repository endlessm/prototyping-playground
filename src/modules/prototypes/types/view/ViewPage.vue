<script setup lang="ts">
import { previewAddress } from '../../../../../tooling/preview/protocol'
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../../../../app/composables/useManifest'
import ViewPreview from './ViewPreview.vue'

// A view's page: its preview, a link that opens the preview document on its
// own in a new tab (a fresh runtime, for people and browser tools), and the
// artifact page's file menu.
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
  <div class="flex h-full min-h-0 flex-col gap-2">
    <div class="flex items-center justify-end gap-1">
      <UButton
        :to="standalone"
        external
        target="_blank"
        icon="i-lucide-external-link"
        size="sm"
        :label="t('prototypes.openInTab')"
      />
      <!-- The artifact page's file menu. -->
      <slot name="actions" />
    </div>
    <ViewPreview
      :key="document"
      :prototype="prototype"
      :artifact="artifact"
      :document="document"
    />
  </div>
</template>
