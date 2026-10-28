<script setup lang="ts">
const studio = useStudioConfig()
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar :title="studio.name" />
    </template>
    <template #body>
      <p class="text-muted">{{ studio.tagline }}</p>
    </template>
  </UDashboardPanel>
</template>
