<script setup lang="ts">
defineProps<{ label: string; checked?: boolean }>()
</script>

<template>
  <UCheckbox :label="label" :default-value="checked" />
</template>
