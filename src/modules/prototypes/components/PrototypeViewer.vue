<script setup lang="ts">
import AppNotFound from '../../../../app/components/AppNotFound.vue'
import AppSectionNav from '../../../../app/components/AppSectionNav.vue'
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../../../app/composables/useManifest'
import PrototypeFiles from './PrototypeFiles.vue'
import PrototypeHeader from './PrototypeHeader.vue'

// A prototype's frame: its header (title, system, "…" menu), its file tree in the
// section panel, and the open artifact beside it. A view's named states are
// listed under it, each opening at its own address. An unknown prototype,
// or an unknown artifact in a known one, is not found; the prototype keeps
// its navigation around it.
defineProps<{
  prototype: ManifestPrototype | undefined
  artifacts: ManifestArtifact[]
  notFound?: boolean
}>()

const route = useRoute()
const current = computed(() =>
  typeof route.params.artifactId === 'string'
    ? route.params.artifactId
    : undefined,
)
</script>

<template>
  <AppSectionNav v-if="prototype" :label="prototype.title">
    <template #header>
      <PrototypeHeader :prototype="prototype" />
    </template>
    <PrototypeFiles
      :prototype="prototype"
      :artifacts="artifacts"
      :current="current"
    />
  </AppSectionNav>
  <UDashboardPanel id="prototype-artifact">
    <template #body>
      <AppNotFound v-if="!prototype || notFound" />
      <slot v-else />
    </template>
  </UDashboardPanel>
</template>
