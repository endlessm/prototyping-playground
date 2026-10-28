<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const studio = useStudioConfig()
const { t } = useI18n()

// Modules add their rail entries here (ticket 02).
const rail: NavigationMenuItem[] = []
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
        :items="rail"
        orientation="vertical"
        :aria-label="t('rail.label')"
      />
    </UDashboardSidebar>
    <slot />
  </UDashboardGroup>
</template>
