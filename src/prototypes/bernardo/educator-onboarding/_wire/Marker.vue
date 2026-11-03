<script setup lang="ts">
import { computed } from 'vue'
import { notes } from './notes'
import s from './wire.module.css'

// A numbered design note: hover or focus to read it.
const props = defineProps<{ flow: number; n: number }>()

const note = computed(() => notes[props.flow]?.[props.n - 1] ?? '')
</script>

<template>
  <span :class="s.marker" tabindex="0" :aria-label="`Note ${n}: ${note}`">
    {{ n }}
    <span :class="s.tip" role="tooltip">{{ note }}</span>
  </span>
</template>
