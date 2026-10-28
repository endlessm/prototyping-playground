<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../../../app/composables/useManifest'

const props = defineProps<{
  prototype: ManifestPrototype | undefined
  artifacts: ManifestArtifact[]
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
    to: `/prototypes/${props.prototype!.id}/artifacts/${artifact.id}`,
  })),
)
</script>

<template>
  <UDashboardPanel
    v-if="prototype"
    id="prototype-navigation"
    :default-size="18"
    :min-size="12"
    :max-size="30"
    resizable
  >
    <template #header>
      <div class="flex flex-col gap-0.5 px-4 pt-4">
        <h1 class="truncate font-semibold text-highlighted">
          {{ prototype.title }}
        </h1>
        <p class="text-sm text-muted">
          {{ t('prototypes.system', { name: system }) }}
        </p>
      </div>
    </template>
    <template #body>
      <UNavigationMenu
        :items="items"
        orientation="vertical"
        :aria-label="prototype.title"
      />
    </template>
  </UDashboardPanel>
  <UDashboardPanel id="prototype-artifact">
    <template #body>
      <slot>
        <p v-if="!prototype" class="text-muted">
          {{ t('prototypes.notFound') }}
        </p>
      </slot>
    </template>
  </UDashboardPanel>
</template>
