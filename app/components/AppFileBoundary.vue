<script setup lang="ts">
import AppFileError from './AppFileError.vue'

// Keeps a crash in one file's page inside that page, with its error to copy.
</script>

<template>
  <NuxtErrorBoundary>
    <slot />
    <template #error="{ error }">
      <AppFileError class="m-4 sm:m-6" :error="error" />
    </template>
  </NuxtErrorBoundary>
</template>
