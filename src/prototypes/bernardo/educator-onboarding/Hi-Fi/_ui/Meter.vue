<script setup lang="ts">
import { computed } from 'vue'
import s from './ui.module.css'

// A thin part-to-whole bar: each part's share of the total, with a 2px gap between parts and the rest as the track.
// It is never read alone: the counts are always written beside it, and each part names itself on hover.
const props = defineProps<{ parts: { value: number; label: string; tone: 'done' | 'progress' | 'rest' | 'track' }[] }>()

const total = computed(() => props.parts.reduce((sum, part) => sum + part.value, 0))
</script>

<template>
  <span :class="s.meter" aria-hidden="true">
    <span
      v-for="part in parts.filter((part) => part.value > 0)"
      :key="part.label"
      :class="s[`meter-${part.tone}`]"
      :style="{ flexGrow: part.value, flexBasis: 0 }"
      :title="`${part.value} ${part.label}`"
    />
    <span v-if="!total" :class="s['meter-track']" style="flex-grow: 1" />
  </span>
</template>
