<script setup lang="ts">
import s from './ui.module.css'

defineProps<{ selected?: boolean }>()
</script>

<template>
  <div :class="[s.card, s.stack, selected && s.selected]"><slot /></div>
</template>
