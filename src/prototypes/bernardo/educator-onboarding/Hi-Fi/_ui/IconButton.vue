<script setup lang="ts">
// A small round button with a Lucide icon, such as the pencil beside a name.
defineProps<{ label: string; icon: string }>()
defineEmits<{ click: [] }>()
</script>

<template>
  <UTooltip :text="label">
    <UButton
      :icon="icon"
      :aria-label="label"
      color="neutral"
      variant="ghost"
      @click="$emit('click')"
    />
  </UTooltip>
</template>
