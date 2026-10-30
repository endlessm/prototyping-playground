<script setup lang="ts">
// /documentation opens the Manual, or Context & Skills while the Manual is
// off.
await navigateTo(
  manualEnabled() ? '/documentation/manual' : '/documentation/context/platform',
  { replace: true },
)
</script>

<template>
  <div />
</template>
