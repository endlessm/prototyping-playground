<script setup lang="ts">
import s from './ui.module.css'

defineProps<{ error?: boolean }>()
</script>

<template>
  <span :class="[s.chip, error && s.chipError]">
    <slot />
    <span>×</span>
  </span>
</template>
