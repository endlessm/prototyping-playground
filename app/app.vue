<script setup lang="ts">
import AppNavigationProgress from './components/AppNavigationProgress.vue'
</script>

<template>
  <UApp
    :toaster="{ position: 'bottom-right' }"
    :tooltip="{ delayDuration: 300 }"
  >
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <AppNavigationProgress />
  </UApp>
</template>
