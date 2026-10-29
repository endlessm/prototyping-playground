<script setup lang="ts">
import types from '#studio/file-types'
import type { NavigationMenuItem } from '@nuxt/ui'
import AppNotFound from '../../../../app/components/AppNotFound.vue'
import AppSectionNav from '../../../../app/components/AppSectionNav.vue'
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../../../app/composables/useManifest'

// A prototype's frame: its navigation in the section panel, and the open
// artifact beside it. An unknown prototype, or an unknown artifact in a
// known one, is not found; the prototype keeps its navigation around it.
const props = defineProps<{
  prototype: ManifestPrototype | undefined
  artifacts: ManifestArtifact[]
  notFound?: boolean
}>()

const { t } = useI18n()
const { systemOf } = await useSystems()

const system = computed(() => {
  if (!props.prototype) return ''
  const found = systemOf(props.prototype.systemId)
  if (found === null) return t('prototypes.noSystem')
  return found ? found.label : t('prototypes.systemUnavailable')
})

const items = computed<NavigationMenuItem[]>(() =>
  props.artifacts.map((artifact) => ({
    label: artifact.title,
    icon: types[artifact.type]?.icon ?? undefined,
    to: `/prototypes/${props.prototype!.id}/artifacts/${artifact.id}`,
  })),
)
</script>

<template>
  <AppSectionNav v-if="prototype" :label="prototype.title">
    <template #header>
      <div class="flex min-w-0 flex-col gap-0.5">
        <h1 class="truncate text-sm font-semibold text-highlighted">
          {{ prototype.title }}
        </h1>
        <p class="truncate text-xs text-muted">
          {{ t('prototypes.system', { name: system }) }}
        </p>
      </div>
    </template>
    <UNavigationMenu
      :items="items"
      orientation="vertical"
      :aria-label="prototype.title"
    />
  </AppSectionNav>
  <UDashboardPanel id="prototype-artifact">
    <template #body>
      <AppNotFound v-if="!prototype || notFound" />
      <slot v-else />
    </template>
  </UDashboardPanel>
</template>
