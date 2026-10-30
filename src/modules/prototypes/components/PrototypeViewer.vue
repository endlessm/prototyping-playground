<script setup lang="ts">
import AppNotFound from '../../../../app/components/AppNotFound.vue'
import AppSectionNav from '../../../../app/components/AppSectionNav.vue'
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../../../app/composables/useManifest'
import PrototypeFiles from './PrototypeFiles.vue'
import PrototypeHeaderMenu from './PrototypeHeaderMenu.vue'

// A prototype's frame: its title, system and "…" menu, its file tree in the
// section panel, and the open artifact beside it. A view's named states are
// listed under it, each opening at its own address. An unknown prototype,
// or an unknown artifact in a known one, is not found; the prototype keeps
// its navigation around it.
const props = defineProps<{
  prototype: ManifestPrototype | undefined
  artifacts: ManifestArtifact[]
  notFound?: boolean
}>()

const { t } = useI18n()
const route = useRoute()
const { systemOf } = await useSystems()

const system = computed(() => {
  if (!props.prototype) return ''
  const found = systemOf(props.prototype.systemId)
  if (found === null) return t('prototypes.noSystem')
  return found ? found.label : t('prototypes.systemUnavailable')
})
const current = computed(() =>
  typeof route.params.artifactId === 'string'
    ? route.params.artifactId
    : undefined,
)
</script>

<template>
  <AppSectionNav v-if="prototype" :label="prototype.title">
    <template #header>
      <div class="flex min-w-0 flex-1 items-start gap-1">
        <div class="flex min-w-0 flex-1 flex-col gap-0.5">
          <h1 class="truncate text-sm font-semibold text-highlighted">
            {{ prototype.title }}
          </h1>
          <p class="truncate text-xs text-muted">
            {{ t('prototypes.system', { name: system }) }}
          </p>
        </div>
        <PrototypeHeaderMenu :prototype="prototype" />
      </div>
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
