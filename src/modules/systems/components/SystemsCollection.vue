<script setup lang="ts">
import CollectionCard from '../../../../app/components/CollectionCard.vue'
import CollectionItems from '../../../../app/components/CollectionItems.vue'
import CollectionRow from '../../../../app/components/CollectionRow.vue'
import type { SystemCatalog } from '../../../../tooling/systems/catalog'
import { systemAddress } from '../utils/pages'
import SystemActions from './SystemActions.vue'

// Systems as cards or as list rows, by the shared preference: the name, the
// summary (or a generic line), the Default badge and how many prototypes
// use it (archived prototypes don't count), with the system's "…" menu.
const props = defineProps<{
  systems: SystemCatalog[]
  label: string
  archived?: boolean
}>()
const { t } = useI18n()
const manifest = await useManifest()

const isDefault = (system: SystemCatalog) =>
  system.id === manifest.value.defaultSystem
const usage = (system: SystemCatalog) =>
  t(
    'systems.usedBy',
    manifest.value.prototypes.filter(
      ({ systemId, status }) => systemId === system.id && status !== 'archived',
    ).length,
  )
</script>

<template>
  <CollectionItems
    :items="props.systems"
    :key-of="(system) => system.id"
    :label="props.label"
  >
    <template #card="{ item: system }">
      <CollectionCard
        :to="systemAddress(system.id)"
        icon="i-lucide-shapes"
        :title="system.label"
        :description="system.summary ?? t('systems.genericDescription')"
        :archived="props.archived"
      >
        <template #meta>
          <UBadge
            v-if="isDefault(system)"
            :label="t('systems.default')"
            color="neutral"
            variant="subtle"
            size="sm"
          />
          <span>{{ usage(system) }}</span>
        </template>
        <template #menu>
          <SystemActions :system="system" />
        </template>
      </CollectionCard>
    </template>
    <template #row="{ item: system }">
      <CollectionRow
        :to="systemAddress(system.id)"
        icon="i-lucide-shapes"
        :title="system.label"
        :meta="
          [isDefault(system) && t('systems.default'), usage(system)]
            .filter(Boolean)
            .join(' · ')
        "
        :archived="props.archived"
      >
        <template #menu>
          <SystemActions :system="system" />
        </template>
      </CollectionRow>
    </template>
  </CollectionItems>
</template>
