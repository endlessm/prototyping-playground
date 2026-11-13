<script setup lang="ts">
import { computed } from 'vue'
import { arrowHead, arrowPath, type ArrowLook, type MapArrow } from './arrows'
import { arrowStroke, strokeStyle } from './look'

// One arrow: its curve, its arrowhead and its label pill at the curve's midpoint. The look defaults to the arrow's
// kind; the timeline draws the current step's arrow as `now` and the next step's as `next`.
const props = defineProps<{ arrow: MapArrow; look?: ArrowLook; dim?: boolean }>()

const look = computed(() => props.look ?? props.arrow.kind)
const head = computed(() => (look.value === 'now' ? 9 : 8))
const line = computed(() => arrowPath(props.arrow, head.value))
const tip = computed(() => arrowHead(props.arrow, head.value))
const rect = computed(() => props.arrow.label.rect)
</script>

<template>
  <g class="arrow" :class="[look, { dim }]" :data-arrow="arrow.id" :data-step="arrow.step">
    <path class="line" :d="line" :style="strokeStyle(look)" />
    <path :d="tip" :style="{ fill: arrowStroke[look].color }" />
    <foreignObject
      v-if="look !== 'next'"
      :x="rect.x"
      :y="rect.y"
      :width="rect.width"
      :height="rect.height"
      class="label-box"
    >
      <div class="label">
        <span class="pill">
          <span class="verb">{{ arrow.label.verb }}</span>
          <span class="object">{{ arrow.label.object }}</span>
        </span>
      </div>
    </foreignObject>
  </g>
</template>

<style scoped>
.arrow {
  animation: arrow-in 360ms ease-out both;
}

/* On the children, so the fade can transition beside the group's own fade-in. */
.arrow > * {
  transition: opacity 240ms ease-out;
}

.dim > * {
  opacity: 0.22;
}

@keyframes arrow-in {
  from {
    opacity: 0;
  }
}

.line {
  fill: none;
  stroke-linecap: round;
}

.label-box {
  overflow: visible;
}

.label {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3px 8px 4px;
  white-space: nowrap;
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  box-shadow: 0 2px 6px rgb(15 23 43 / 0.06);
}

.verb {
  color: var(--ui-text-dimmed);
  font-size: 10px;
  line-height: 12px;
}

.object {
  color: var(--ui-text-highlighted);
  font-size: 11px;
  font-weight: 600;
  line-height: 14px;
}

.runs .pill {
  background: color-mix(in oklab, var(--color-cornflower-50) 40%, white);
  border-color: var(--color-cornflower-50);
}

.runs .verb,
.runs .object {
  color: var(--color-cornflower-700);
}

.now .pill {
  background: var(--color-orange-50);
  border-color: var(--color-orange-200);
}

.now .verb,
.now .object {
  color: var(--color-orange-900);
}

@media (prefers-reduced-motion: reduce) {
  .arrow {
    animation: none;
  }

  .arrow > * {
    transition: none;
  }
}
</style>
