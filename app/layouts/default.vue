<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const studio = useStudioConfig()
const modules = useStudioModules()
const { t } = useI18n()

function railItems(position: 'top' | 'bottom'): NavigationMenuItem[] {
  return modules
    .flatMap(({ label, rail }) =>
      rail?.position === position ? [{ label, rail }] : [],
    )
    .sort((a, b) => a.rail.order - b.rail.order)
    .map(({ label, rail }) => ({ label, icon: rail.icon, to: rail.to }))
}
const top = railItems('top')
const bottom = railItems('bottom')
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar collapsible resizable>
      <template #header>
        <NuxtLink to="/" class="truncate font-semibold text-highlighted">
          {{ studio.name }}
        </NuxtLink>
      </template>
      <UNavigationMenu
        :items="top"
        orientation="vertical"
        :aria-label="t('rail.label')"
      />
      <template v-if="bottom.length" #footer>
        <UNavigationMenu
          :items="bottom"
          orientation="vertical"
          :aria-label="t('rail.more')"
          class="w-full"
        />
      </template>
    </UDashboardSidebar>
    <slot />
  </UDashboardGroup>
</template>
