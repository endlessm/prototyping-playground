<script setup lang="ts">
import { placeIllustrations, roleIllustrations } from './illustrations'

// Teams tab, empty, exploration "Path": what a Team turns into, drawn as three stops a line keeps travelling: the
// Team, its Team Owner, its Cohorts. On a wide card the words sit beside the path; on a narrow one they stack under
// it. The art is decorative. The words under the title and the card's actions come in through the slots, so they stay
// the page's own line and buttons.
const stops = [
  { label: 'Team', src: placeIllustrations.Team, tint: 'var(--color-orange-50)' },
  { label: 'Team Owner', src: roleIllustrations.teamOwner, tint: 'var(--color-orange-50)' },
  { label: 'Cohorts', src: placeIllustrations.Cohort, tint: 'var(--color-sky-50)' },
]
</script>

<template>
  <div class="te-path">
    <div class="te-split">
      <div class="te-words">
        <p class="text-lg font-semibold text-highlighted">No Teams yet</p>
        <p class="text-sm text-muted"><slot name="lead" /></p>
        <div class="te-action"><slot /></div>
      </div>

      <div class="te-track" aria-hidden="true">
        <template v-for="(stop, i) in stops" :key="stop.label">
          <span v-if="i" :class="['te-link', `te-link-${i}`]"><span /></span>
          <span :class="['te-stop', `te-stop-${i}`]" :style="{ '--tint': stop.tint, '--delay': `${120 + i * 110}ms` }">
            <span class="te-tile"><img :src="stop.src" alt="" /></span>
            <span class="te-label">{{ stop.label }}</span>
          </span>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.te-path {
  container-type: inline-size;
}

.te-split {
  display: grid;
  gap: 24px;
  padding: 12px 12px 36px;
  text-align: center;
}

.te-words {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  order: 1;
  padding: 0 8px;
  text-wrap: balance;
}

.te-words > * {
  animation: te-rise 420ms ease-out backwards;
}

.te-words > :nth-child(2) {
  animation-delay: 70ms;
}

.te-action {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
  animation-delay: 140ms;
}

.te-track {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 28px 16px 24px;
  border: 1px solid var(--ui-border);
  border-radius: 12px;
  background: var(--ui-bg);
}

.te-stop {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 80px;
  animation: te-rise 460ms ease-out var(--delay) backwards;
}

.te-tile {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--tint);
  animation: 7s ease-in-out infinite;
}

.te-tile::after {
  position: absolute;
  inset: -4px;
  border: 2px solid var(--color-cornflower-400);
  border-radius: 20px;
  content: '';
  opacity: 0;
  animation: 7s ease-out infinite;
}

.te-tile img {
  width: 36px;
  height: 36px;
}

.te-stop-0 .te-tile {
  animation-name: te-bump-0;
}

.te-stop-0 .te-tile::after {
  animation-name: te-glow-0;
}

.te-stop-1 .te-tile {
  animation-name: te-bump-1;
}

.te-stop-1 .te-tile::after {
  animation-name: te-glow-1;
}

.te-stop-2 .te-tile {
  animation-name: te-bump-2;
}

.te-stop-2 .te-tile::after {
  animation-name: te-glow-2;
}

.te-label {
  color: var(--ui-text-toned);
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  white-space: nowrap;
}

.te-link {
  position: relative;
  flex: 1 1 0;
  min-width: 12px;
  max-width: 96px;
  height: 0;
  margin: 27px -6px 0;
  border-top: 2px dashed var(--color-cornflower-200);
}

.te-link span {
  position: absolute;
  top: -2px;
  right: 0;
  left: 0;
  height: 2px;
  border-radius: 9999px;
  background: var(--color-cornflower-500);
  transform-origin: left;
  animation: 7s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}

.te-link-1 span {
  animation-name: te-draw-1;
}

.te-link-2 span {
  animation-name: te-draw-2;
}

@container (min-width: 640px) {
  .te-split {
    grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
    align-items: center;
    gap: 32px;
    padding: 12px 12px 12px 36px;
    text-align: left;
  }

  .te-words {
    align-items: flex-start;
    order: 0;
    padding: 24px 0;
  }

  .te-action {
    justify-content: flex-start;
  }

  .te-track {
    padding: 44px 24px 40px;
  }
}

@container (max-width: 300px) {
  .te-track {
    padding: 20px 8px 16px;
  }

  .te-stop {
    width: 58px;
  }

  .te-tile {
    width: 48px;
    height: 48px;
  }

  .te-link {
    margin: 23px -2px 0;
  }
}

@keyframes te-rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}

@keyframes te-draw-1 {
  0%,
  10% {
    opacity: 1;
    transform: scaleX(0);
  }

  32%,
  88% {
    opacity: 1;
    transform: scaleX(1);
  }

  96%,
  100% {
    opacity: 0;
    transform: scaleX(1);
  }
}

@keyframes te-draw-2 {
  0%,
  42% {
    opacity: 1;
    transform: scaleX(0);
  }

  64%,
  88% {
    opacity: 1;
    transform: scaleX(1);
  }

  96%,
  100% {
    opacity: 0;
    transform: scaleX(1);
  }
}

@keyframes te-bump-0 {
  0%,
  2%,
  14%,
  100% {
    transform: scale(1);
  }

  7% {
    transform: scale(1.08);
  }
}

@keyframes te-bump-1 {
  0%,
  30%,
  44%,
  100% {
    transform: scale(1);
  }

  36% {
    transform: scale(1.08);
  }
}

@keyframes te-bump-2 {
  0%,
  62%,
  76%,
  100% {
    transform: scale(1);
  }

  68% {
    transform: scale(1.08);
  }
}

@keyframes te-glow-0 {
  0%,
  2%,
  22%,
  100% {
    opacity: 0;
  }

  8% {
    opacity: 1;
  }
}

@keyframes te-glow-1 {
  0%,
  30%,
  52%,
  100% {
    opacity: 0;
  }

  37% {
    opacity: 1;
  }
}

@keyframes te-glow-2 {
  0%,
  62%,
  88%,
  100% {
    opacity: 0;
  }

  69% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .te-path *,
  .te-path *::after {
    animation: none !important;
  }
}
</style>
