<script setup lang="ts">
import { computed } from 'vue'
import { arrowHead, arrowPath, type ArrowLook, type MapArrow } from './arrows'
import { arrowStroke, FADE, pillTint, strokeStyle } from './look'

// One arrow: its curve, its arrowhead and its label pill at the curve's midpoint. The look defaults to the arrow's
// kind; the timeline draws the current step's arrow as `now` and the next step's as `next`.
const props = defineProps<{ arrow: MapArrow; look?: ArrowLook; dim?: boolean }>()

const look = computed(() => props.look ?? props.arrow.kind)
const head = computed(() => (look.value === 'now' ? 9 : 8))
const line = computed(() => arrowPath(props.arrow, head.value))
const tip = computed(() => arrowHead(props.arrow, head.value))
const rect = computed(() => props.arrow.label.rect)
/** Each part fades on its own, so the fade can run beside the group's fade-in. */
/** Invitations and creations label in the page's greys; Programs and the current step in their own tint. */
const plain = computed(() => look.value === 'invite' || look.value === 'create')
const part = computed(() => [FADE, { 'opacity-22': props.dim }])
</script>

<template>
  <g class="arrow" :data-arrow="arrow.id" :data-step="arrow.step">
    <path class="line" :class="part" :d="line" :style="strokeStyle(look)" />
    <path :class="part" :d="tip" :style="{ fill: arrowStroke[look].color }" />
    <foreignObject
      v-if="look !== 'next'"
      :x="rect.x"
      :y="rect.y"
      :width="rect.width"
      :height="rect.height"
      class="overflow-visible"
      :class="part"
    >
      <div class="flex size-full items-center justify-center">
        <span
          class="flex flex-col items-center rounded-md px-1.5 py-0.5 text-xs whitespace-nowrap"
          :class="pillTint[look]"
        >
          <span class="leading-3" :class="{ 'text-dimmed': plain }">
            {{ arrow.label.verb }}
          </span>
          <span class="leading-3.5 font-medium" :class="{ 'text-toned': plain }">
            {{ arrow.label.object }}
          </span>
        </span>
      </div>
    </foreignObject>
  </g>
</template>

<style scoped>
.arrow {
  animation: arrow-in 360ms ease-out backwards;
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

@media (prefers-reduced-motion: reduce) {
  .arrow {
    animation: none;
  }
}
</style>
