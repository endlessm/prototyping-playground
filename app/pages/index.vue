<script setup lang="ts">
const studio = useStudioConfig()
const { me, firstName } = useMe()
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar :title="studio.name" />
    </template>
    <template #body>
      <p v-if="me.key" class="text-highlighted">
        {{ $t('home.greeting', { name: firstName }) }}
      </p>
      <p class="text-muted">{{ studio.tagline }}</p>
    </template>
  </UDashboardPanel>
</template>
