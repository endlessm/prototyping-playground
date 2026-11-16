<script setup lang="ts">
// The screens' tooltip: Nuxt UI's UTooltip, opening quickly above the element it describes. The default tooltip is
// one truncated line, so these wrap to let a sentence fit.
defineProps<{ text: string }>()
</script>

<template>
  <UTooltip
    :text="text"
    :delay-duration="150"
    :content="{ side: 'top', sideOffset: 6 }"
    arrow
    :ui="{ content: 'z-50 h-auto max-w-80 py-1.5', text: 'whitespace-normal leading-snug' }"
  >
    <slot />
  </UTooltip>
</template>
