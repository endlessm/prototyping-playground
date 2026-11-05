<script setup lang="ts">
import s from './wire.module.css'

// A small square button with a glyph, such as the edit pencil beside a name.
defineProps<{ label: string }>()
defineEmits<{ click: [] }>()
</script>

<template>
  <button type="button" :class="s.iconButton" :aria-label="label" :title="label" @click="$emit('click')">
    <slot />
  </button>
</template>
