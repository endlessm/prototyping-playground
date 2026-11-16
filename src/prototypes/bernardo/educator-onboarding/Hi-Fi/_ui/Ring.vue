<script setup lang="ts">
import { computed } from 'vue'
import s from './ui.module.css'

// A small two-part ring: how many earned the certificate (green) against how many stopped partway (grey), with
// the share in the middle. Each arc names itself on hover; the counts are written beside the ring as well.
const props = defineProps<{ done: number; rest: number }>()

const R = 18
const C = 2 * Math.PI * R
const GAP = 3
const total = computed(() => props.done + props.rest)
const share = computed(() => (total.value ? props.done / total.value : 0))
const arcs = computed(() => {
  const done = share.value * C
  return [
    { tone: 'done', length: Math.max(0, done - GAP), offset: 0, title: `${props.done} earned the certificate` },
    { tone: 'rest', length: Math.max(0, C - done - GAP), offset: -done, title: `${props.rest} stopped partway` },
  ].filter((arc) => arc.length > 0)
})
</script>

<template>
  <svg
    :class="s.ring"
    viewBox="0 0 48 48"
    role="img"
    :aria-label="`${done} of ${total} earned the certificate`"
  >
    <g transform="rotate(-90 24 24)">
      <circle
        v-for="arc in arcs"
        :key="arc.tone"
        cx="24"
        cy="24"
        :r="R"
        fill="none"
        stroke-width="6"
        :class="s[`ring-${arc.tone}`]"
        :stroke-dasharray="`${arc.length} ${C - arc.length}`"
        :stroke-dashoffset="arc.offset"
      >
        <title>{{ arc.title }}</title>
      </circle>
    </g>
    <text x="24" y="24" text-anchor="middle" dominant-baseline="central">{{ Math.round(share * 100) }}%</text>
  </svg>
</template>
