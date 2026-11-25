<script setup lang="ts">
import { EASE_OUT, POP } from './motion'

// The celebrated checklist's checkbox: the check draws itself inside the circle and pops on a tick.
withDefaults(defineProps<{ checked: boolean; label: string; popping?: boolean; size?: number }>(), { size: 20 })
defineEmits<{ toggle: [event: MouseEvent] }>()
</script>

<template>
  <button
    type="button"
    role="checkbox"
    :aria-checked="checked"
    :aria-label="label"
    class="tb"
    :style="{ '--tb-size': `${size}px`, '--ease-out': EASE_OUT, '--spring-pop': POP }"
    @click="$emit('toggle', $event)"
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      class="tb-tick"
      :class="{ 'is-checked': checked, 'is-popping': popping }"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" pathLength="1" />
    </svg>
  </button>
</template>

<style scoped>
.tb {
  display: grid;
  flex: none;
  place-items: center;
  width: var(--tb-size);
  height: var(--tb-size);
  border-radius: 999px;
  color: var(--ui-text-dimmed);
  cursor: pointer;
}
.tb:focus-visible {
  outline: 2px solid var(--ui-primary);
  outline-offset: 2px;
}
@media (hover: hover) and (pointer: fine) {
  .tb:hover {
    color: var(--ui-success);
  }
}
.tb-tick {
  width: 100%;
  height: 100%;
  transition: transform 160ms var(--ease-out), color 150ms ease;
}
.tb-tick.is-checked {
  color: var(--ui-success);
}
.tb:active > .tb-tick {
  transform: scale(0.9);
}
.tb-tick path {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  visibility: hidden;
  transition: stroke-dashoffset 150ms var(--ease-out), visibility 0s 150ms;
}
.tb-tick.is-checked path {
  stroke-dashoffset: 0;
  visibility: visible;
  transition: stroke-dashoffset 250ms var(--ease-out) 60ms, visibility 0s 60ms;
}
.tb-tick.is-popping {
  animation: tb-pop 500ms var(--spring-pop);
}
@keyframes tb-pop {
  from { transform: scale(0.9) rotate(1.8deg); }
  to { transform: scale(1) rotate(0deg); }
}
@media (prefers-reduced-motion: reduce) {
  .tb-tick.is-popping { animation: none; }
  .tb-tick path, .tb-tick.is-checked path { transition: none; }
}
</style>
