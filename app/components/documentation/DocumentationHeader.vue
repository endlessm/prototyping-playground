<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

// The documentation navigation's header: its title, then tabs between the
// Manual (while the Documentation module is on) and Context & Skills.
const props = defineProps<{ current: 'manual' | 'context' }>()
const { t } = useI18n()

const tabs = computed<NavigationMenuItem[]>(() => [
  ...(manualEnabled()
    ? [
        {
          label: t('documentation.manual'),
          to: '/documentation/manual',
          active: props.current === 'manual',
        },
      ]
    : []),
  {
    label: t('documentation.context'),
    to: '/documentation/context/platform',
    active: props.current === 'context',
  },
])
</script>

<template>
  <div class="flex min-w-0 flex-1 flex-col gap-1">
    <h2 class="truncate text-sm font-semibold text-highlighted">
      {{ t('documentation.title') }}
    </h2>
    <UNavigationMenu
      :items="tabs"
      :aria-label="t('documentation.sections')"
      highlight
      variant="pill"
      class="-mx-2"
      :ui="{ link: 'px-2 py-1 text-xs' }"
    />
  </div>
</template>
