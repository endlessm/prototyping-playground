<script setup lang="ts">
import s from './ui.module.css'

// One row of Facts: label, value, and the action in the default slot.
defineProps<{ label: string; value: string }>()
</script>

<template>
  <div :class="s.fact">
    <span>{{ label }}</span>
    <span>{{ value }}</span>
    <span><slot /></span>
  </div>
</template>
