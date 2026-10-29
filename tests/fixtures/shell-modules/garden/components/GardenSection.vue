<script setup lang="ts">
import AppSectionNav from '../../../../../app/components/AppSectionNav.vue'

const beds = ['Rose', 'Tulip', 'Slow', 'Flaky', 'Broken'].map((label) => ({
  label,
  to: `/garden/${label.toLowerCase()}`,
}))
</script>

<template>
  <AppSectionNav label="Garden">
    <UNavigationMenu :items="beds" orientation="vertical" />
  </AppSectionNav>
  <UDashboardPanel id="garden-bed">
    <template #body>
      <UInput placeholder="Search the garden" aria-label="Search the garden" />
      <slot />
    </template>
  </UDashboardPanel>
</template>
