<script setup lang="ts">
// The heading and one-line description at the top of a system's page.
defineProps<{ title: string; description?: string }>()
</script>

<template>
  <header class="mb-8">
    <h1 class="text-3xl font-semibold tracking-tight text-highlighted">
      {{ title }}
    </h1>
    <p v-if="description" class="mt-2 text-muted">{{ description }}</p>
  </header>
</template>
