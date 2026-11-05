<script setup lang="ts">
// Solid marks a state that needs attention, outline a role; plain is neutral.
defineProps<{ tone?: 'solid' | 'outline' }>()
</script>

<template>
  <UBadge
    :color="tone === 'solid' ? 'primary' : tone === 'outline' ? 'secondary' : 'neutral'"
    variant="soft"
  >
    <slot />
  </UBadge>
</template>
