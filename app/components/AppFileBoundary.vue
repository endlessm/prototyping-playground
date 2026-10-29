<script setup lang="ts">
import AppFileError from './AppFileError.vue'

// Keeps a crash in one file's page inside that page, with its error to copy.
</script>

<template>
  <NuxtErrorBoundary>
    <slot />
    <template #error="{ error }">
      <AppFileError :error="error" />
    </template>
  </NuxtErrorBoundary>
</template>
