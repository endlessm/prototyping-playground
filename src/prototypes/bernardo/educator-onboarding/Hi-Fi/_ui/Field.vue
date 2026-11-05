<script setup lang="ts">
import s from './ui.module.css'

// A labelled control with an optional hint or error below it. The note slot sits beside the label.
defineProps<{ label?: string; hint?: string; error?: string }>()
</script>

<template>
  <label :class="[s.stack, s.tight]">
    <span v-if="label" :class="[s.row, s.label]">
      {{ label }}
      <slot name="note" />
    </span>
    <slot />
    <span v-if="error" :class="[s.error, 'flex items-center gap-1']"><UIcon name="i-lucide-circle-alert" />{{ error }}</span>
    <span v-else-if="hint" :class="s.small">{{ hint }}</span>
  </label>
</template>
