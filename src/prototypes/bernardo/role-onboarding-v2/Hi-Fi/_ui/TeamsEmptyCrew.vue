<script setup lang="ts">
import { placeIllustrations, roleIllustrations } from './illustrations'

// Teams tab, empty, exploration "Crew": the Team's tile waits in the middle while the people who will fill it gather
// around it. The art is decorative. The words under the title and the card's actions come in through the slots, so
// they stay the page's own line and buttons. `hub` swaps the Team's art in the middle tile.
const { hub = placeIllustrations.Team } = defineProps<{ hub?: string }>()

const crew = [
  { src: roleIllustrations.teamOwner, x: -96, y: 10, size: 48, delay: 160, far: false },
  { src: roleIllustrations.teamManager, x: 96, y: -8, size: 48, delay: 240, far: false },
  { src: roleIllustrations.facilitator, x: -172, y: -14, size: 40, delay: 320, far: true },
  { src: roleIllustrations.learner, x: 172, y: 14, size: 40, delay: 400, far: true },
]
const seats = [
  { x: -238, y: 12, delay: 480 },
  { x: 238, y: -10, delay: 560 },
]
const orbits = [
  { size: 156, turn: 70 },
  { size: 300, turn: -110 },
  { size: 444, turn: 150 },
]
</script>

<template>
  <div class="te-crew">
    <div class="te-stage" aria-hidden="true">
      <div class="te-orbits">
        <span
          v-for="o in orbits"
          :key="o.size"
          class="te-orbit"
          :style="{ '--size': `${o.size}px`, '--turn': `${Math.abs(o.turn)}s`, '--way': o.turn < 0 ? 'reverse' : 'normal' }"
        />
      </div>
      <span
        v-for="s in seats"
        :key="s.x"
        class="te-seat"
        :style="{ '--x': `${s.x}px`, '--y': `${s.y}px`, '--delay': `${s.delay}ms` }"
      >
        <UIcon name="i-lucide-plus" class="size-3.5" />
      </span>
      <span
        v-for="(m, i) in crew"
        :key="m.x"
        :class="['te-member', { 'te-far': m.far }]"
        :style="{
          '--x': `${m.x}px`,
          '--y': `${m.y}px`,
          '--size': `${m.size}px`,
          '--delay': `${m.delay}ms`,
          '--float': `${4.2 + i * 0.7}s`,
        }"
      >
        <img :src="m.src" alt="" />
      </span>
      <span class="te-hub">
        <span class="te-hub-tile">
          <span class="te-hub-pulse" />
          <img :src="hub" alt="" />
        </span>
      </span>
    </div>

    <div class="te-copy">
      <p class="text-base font-semibold text-highlighted">No Teams yet</p>
      <p class="text-sm text-muted"><slot name="lead" /></p>
      <div class="te-action"><slot /></div>
    </div>
  </div>
</template>

<style scoped>
.te-crew {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 20px 40px;
  text-align: center;
}

.te-stage {
  position: relative;
  width: 100%;
  max-width: 580px;
  height: 184px;
}

.te-orbits {
  position: absolute;
  inset: 0;
  overflow: hidden;
  mask-image: radial-gradient(ellipse 50% 64% at 50% 50%, #000 45%, transparent 100%);
}

.te-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--size);
  height: var(--size);
  margin: calc(var(--size) / -2) 0 0 calc(var(--size) / -2);
  border: 1.5px dashed var(--color-cornflower-200);
  border-radius: 9999px;
  animation: te-turn var(--turn) linear infinite var(--way);
}

.te-member,
.te-seat,
.te-hub {
  position: absolute;
  top: 50%;
  left: 50%;
}

.te-member {
  width: var(--size);
  height: var(--size);
  margin: calc(var(--size) / -2) 0 0 calc(var(--size) / -2);
  transform: translate(var(--x), var(--y));
  animation: te-join 620ms cubic-bezier(0.22, 1, 0.36, 1) var(--delay) backwards;
}

/* The role art is a circle with a margin of a sixteenth of its box around it. A white backing turns that margin into
   the face's white rim, tight against the circle, where a ring outside the box left a see-through gap between them. */
.te-member img {
  width: 100%;
  height: 100%;
  border-radius: 9999px;
  background: #fff;
  box-shadow: 0 8px 16px -8px rgb(15 12 36 / 0.3);
  animation: te-float var(--float) ease-in-out infinite alternate;
}

.te-seat {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: -16px 0 0 -16px;
  border: 1.5px dashed var(--color-cornflower-300);
  border-radius: 9999px;
  color: var(--color-cornflower-400);
  transform: translate(var(--x), var(--y));
  animation:
    te-join 620ms cubic-bezier(0.22, 1, 0.36, 1) var(--delay) backwards,
    te-breathe 2.6s ease-in-out calc(var(--delay) + 620ms) infinite alternate;
}

.te-hub {
  width: 76px;
  height: 76px;
  margin: -38px 0 0 -38px;
  animation: te-pop 560ms cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}

.te-hub-tile {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 22px;
  background: #fff;
  box-shadow:
    0 1px 2px rgb(15 12 36 / 0.06),
    0 12px 28px -10px rgb(101 86 240 / 0.35);
  animation: te-float 5s ease-in-out infinite alternate;
}

.te-hub-tile img {
  width: 46px;
  height: 46px;
}

.te-hub-pulse {
  position: absolute;
  inset: 0;
  border: 2px solid var(--color-orange-300);
  border-radius: inherit;
  opacity: 0;
  animation: te-pulse 2.8s ease-out 900ms infinite;
}

.te-copy {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  max-width: 448px;
  text-wrap: balance;
}

.te-copy > * {
  animation: te-rise 420ms ease-out backwards;
}

.te-copy > :nth-child(1) {
  animation-delay: 380ms;
}

.te-copy > :nth-child(2) {
  animation-delay: 450ms;
}

.te-action {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
  animation-delay: 520ms;
}

@container (max-width: 540px) {
  .te-seat {
    display: none;
  }
}

@container (max-width: 400px) {
  .te-stage {
    height: 148px;
  }

  .te-far {
    display: none;
  }
}

@container (max-width: 250px) {
  .te-member {
    display: none;
  }
}

@keyframes te-turn {
  to {
    transform: rotate(360deg);
  }
}

@keyframes te-join {
  from {
    opacity: 0;
    transform: translate(0, 0) scale(0.4);
  }
}

@keyframes te-pop {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
}

@keyframes te-float {
  from {
    transform: translateY(-3px);
  }

  to {
    transform: translateY(3px);
  }
}

@keyframes te-breathe {
  from {
    opacity: 1;
  }

  to {
    opacity: 0.45;
  }
}

@keyframes te-pulse {
  from {
    opacity: 0.6;
    transform: scale(1);
  }

  70%,
  to {
    opacity: 0;
    transform: scale(1.45);
  }
}

@keyframes te-rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .te-crew *,
  .te-crew *::after {
    animation: none !important;
  }
}
</style>
