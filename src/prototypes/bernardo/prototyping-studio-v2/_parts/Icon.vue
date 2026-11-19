<script setup lang="ts">
import { ICONS } from './icons'

// A Lucide icon as inline SVG, named as in ./icons.ts.
withDefaults(defineProps<{ name: string; size?: number }>(), { size: 16 })
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    class="icon"
    v-html="ICONS[name]"
  />
</template>

<style scoped>
.icon {
  flex-shrink: 0;
}
</style>
