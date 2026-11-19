<script setup lang="ts">
import type { Tone } from './content'

withDefaults(defineProps<{ tone?: Tone }>(), { tone: 'zinc' })
</script>

<template>
  <span class="pill" :class="tone"><slot /></span>
</template>

<style scoped>
.pill {
  font-size: 10px;
  line-height: 1.5;
  font-weight: 500;
  border-radius: 4px;
  padding: 2px 6px;
  white-space: nowrap;
}
.zinc {
  background: var(--zinc-100);
  color: var(--zinc-700);
}
.amber {
  background: var(--amber-100);
  color: var(--amber-800);
}
.sky {
  background: var(--sky-100);
  color: var(--sky-800);
}
.emerald {
  background: var(--emerald-50);
  color: var(--emerald-700);
}
.violet {
  background: var(--violet-100);
  color: var(--violet-800);
}
.rose {
  background: var(--rose-100);
  color: var(--rose-800);
}
</style>
