<script setup lang="ts">
import type { SystemCatalog } from '../../../../tooling/systems/catalog'
import { systemAddress } from '../utils/pages'
import SystemActions from './SystemActions.vue'

// Systems as cards or as list rows, by the shared preference. The card or
// row opens the system; its "…" menu shows on hover or keyboard focus, and
// always on touch screens.
const props = defineProps<{
  systems: SystemCatalog[]
  label: string
  archived?: boolean
}>()
const { t } = useI18n()
const view = useCollectionView()
const manifest = await useManifest()

const defaultSystem = computed(() => manifest.value.defaultSystem)
const usage = (system: SystemCatalog) =>
  t(
    'systems.usedBy',
    manifest.value.prototypes.filter(({ systemId }) => systemId === system.id)
      .length,
  )
const description = (system: SystemCatalog) =>
  system.summary ?? t('systems.genericDescription')
</script>

<template>
  <ul
    :aria-label="props.label"
    :class="[
      view === 'cards'
        ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
        : 'divide-y divide-default rounded-lg border border-default',
      props.archived && 'opacity-70',
    ]"
  >
    <li
      v-for="system in props.systems"
      :key="system.id"
      :class="[
        'group relative flex gap-3',
        view === 'cards'
          ? 'min-h-36 flex-col rounded-lg border border-default p-4 hover:bg-elevated/50'
          : 'items-center px-4 py-2.5 hover:bg-elevated/50',
      ]"
    >
      <div class="flex min-w-0 items-center gap-2 pr-8">
        <UIcon name="i-lucide-shapes" class="size-4 shrink-0 text-muted" />
        <ULink
          :to="systemAddress(system.id)"
          class="truncate text-sm font-medium text-highlighted outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-primary"
        >
          {{ system.label }}
        </ULink>
        <UBadge
          v-if="system.id === defaultSystem"
          :label="t('systems.default')"
          color="neutral"
          variant="subtle"
          size="sm"
        />
      </div>
      <p v-if="view === 'cards'" class="line-clamp-3 flex-1 text-sm text-muted">
        {{ description(system) }}
      </p>
      <p :class="['text-xs text-muted', view === 'list' && 'ml-auto shrink-0']">
        {{ usage(system) }}
      </p>
      <div
        :class="[
          'z-10 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100',
          view === 'cards' ? 'absolute top-3 right-3' : 'relative',
        ]"
      >
        <SystemActions :system="system" />
      </div>
    </li>
  </ul>
</template>
