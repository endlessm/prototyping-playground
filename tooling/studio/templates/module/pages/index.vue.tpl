<script setup lang="ts">
// The page at /__ID__. Change it, or replace it.
const module = useStudioModule('__ID__')
</script>

<template>
  <UDashboardPanel id="__ID__">
    <template #header>
      <UDashboardNavbar :title="module?.label" />
    </template>
    <template #body>
      <p class="text-muted">{{ module?.description }}</p>
    </template>
  </UDashboardPanel>
</template>
