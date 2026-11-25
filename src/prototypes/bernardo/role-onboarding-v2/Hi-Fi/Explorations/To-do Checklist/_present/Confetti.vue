<script setup lang="ts">
import { ref } from 'vue'
import { reduced } from './motion'

// The celebrated checklist's burst, on the page so no card clips it.
const COLORS = ['var(--ui-primary)', 'var(--ui-secondary)', 'var(--ui-success)', 'var(--ui-warning)', 'var(--ui-info)']

interface Piece {
  id: number
  round: boolean
  style: Record<string, string>
}
let nextId = 0
const pieces = ref<Piece[]>([])

function burst(from: Element, count = 16, reach = 46) {
  if (reduced()) return
  const at = from.getBoundingClientRect()
  const made = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6
    const distance = reach * (0.55 + Math.random() * 0.6)
    return {
      id: nextId++,
      round: Math.random() > 0.5,
      style: {
        left: `${at.left + at.width / 2}px`,
        top: `${at.top + at.height / 2}px`,
        '--dx': `${Math.cos(angle) * distance}px`,
        '--dy': `${Math.sin(angle) * distance - reach * 0.25}px`,
        '--rot': `${Math.round(Math.random() * 540 - 270)}deg`,
        '--delay': `${Math.round(Math.random() * 60)}ms`,
        background: COLORS[i % COLORS.length]!,
      },
    }
  })
  pieces.value.push(...made)
  const ids = new Set(made.map((p) => p.id))
  setTimeout(() => (pieces.value = pieces.value.filter((p) => !ids.has(p.id))), 1000)
}

defineExpose({ burst })
</script>

<template>
  <Teleport to="body">
    <div v-if="pieces.length" aria-hidden="true" class="cf-layer">
      <span v-for="p in pieces" :key="p.id" class="cf-piece" :class="{ 'is-round': p.round }" :style="p.style" />
    </div>
  </Teleport>
</template>

<style scoped>
.cf-layer {
  position: fixed;
  inset: 0;
  z-index: 60;
  overflow: hidden;
  pointer-events: none;
}
.cf-piece {
  position: absolute;
  width: 8px;
  height: 4px;
  border-radius: 1px;
  opacity: 0;
  animation: cf-burst 800ms cubic-bezier(0.15, 0.7, 0.3, 1) var(--delay) forwards;
}
.cf-piece.is-round {
  width: 6px;
  height: 6px;
  border-radius: 999px;
}
@keyframes cf-burst {
  0% { opacity: 1; transform: translate(-50%, -50%) rotate(0); }
  70% { opacity: 1; }
  100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy) + 14px)) rotate(var(--rot)); }
}
</style>
