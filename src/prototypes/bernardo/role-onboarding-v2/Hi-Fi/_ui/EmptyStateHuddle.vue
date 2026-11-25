<script setup lang="ts">
import CircularLoading from '~/components/Generic/CircularLoading.vue'
import { useId } from 'vue'
import type { MapRoleKey } from '../../_map/story'
import { roleIllustrations } from './illustrations'

// The empty state for a list of people's places (Teams, Cohorts, learners) that has nothing in it yet. The middle tile
// says which kind of place is waiting, `hub`: for a Team, hands come in from every side and stack, the way a team
// does before it starts, and every few seconds they press together and spring apart; for a Cohort, a classroom with
// its board and three empty seats, where the lesson is wiped and written again. Around the tile stand the people who
// will fill the place, `crew`, nearest first; the spots left over are open seats. The art is decorative. `loader` puts
// the Endless Loader in the tile instead, for the moment a place is being created in front of the same crew.
//
// The page gives the title, the line under it (the `lead` slot) and its own buttons (the default slot). A page with
// nothing to offer, such as a view-only one, leaves the buttons out. It sits flush inside a card with no padding.
const {
  title,
  crew = [],
  hub = 'hands',
} = defineProps<{
  title: string
  /** Up to six roles whose figures stand around the tile, the first two nearest to it. */
  crew?: MapRoleKey[]
  /** The art in the middle tile: hands stacking for a Team, a classroom for a Cohort, the loader while creating. */
  hub?: 'hands' | 'classroom' | 'loader'
}>()

// The figures stand on the rings drawn behind them, two to a ring: a ring's radius is its figures' distance from the
// tile, so its line runs through the middle of both. `lap` is the seconds its dashes take to go round, backwards
// when negative.
const tiers = {
  near: { radius: 106, size: 48, seat: 40, lap: 70 },
  far: { radius: 180, size: 40, seat: 36, lap: -110 },
  edge: { radius: 244, size: 36, seat: 32, lap: 150 },
}

// Where each figure sits on its ring, in degrees clockwise from the right of the tile. A few degrees off level, so
// the row doesn't read as a ruler.
const places: [tier: keyof typeof tiers, turn: number][] = [
  ['near', 175],
  ['near', -4],
  ['far', 184],
  ['far', 4],
  ['edge', 177],
  ['edge', -2],
]

const spots = places.map(([tier, turn], i) => {
  const { radius, size, seat } = tiers[tier]
  const angle = (turn * Math.PI) / 180
  const role = crew[i]
  return {
    tier,
    src: role && roleIllustrations[role],
    style: {
      '--x': `${(radius * Math.cos(angle)).toFixed(1)}px`,
      '--y': `${(radius * Math.sin(angle)).toFixed(1)}px`,
      '--size': `${role ? size : seat}px`,
      '--delay': `${160 + i * 80}ms`,
      '--float': `${4.2 + i * 0.7}s`,
    },
  }
})

const orbits = Object.entries(tiers).map(([tier, { radius, lap }]) => ({
  tier,
  style: {
    '--size': `${radius * 2}px`,
    '--turn': `${Math.abs(lap)}s`,
    '--way': lap < 0 ? 'reverse' : 'normal',
  },
}))

// One arm is drawn reaching in from the right, then turned to its own side of the tile. They stack in this order, so
// the last one's hand lies on top. The spacing is uneven on purpose: evenly spaced arms read as an emblem, not as
// people.
const arms = [
  { turn: 128, sleeve: '#314158', cuff: '#45556c', skin: '#f1bf8c', line: '#e2a66b' },
  { turn: 268, sleeve: '#f6339a', cuff: '#fb64b6', skin: '#eaa259', line: '#d88a3c' },
  { turn: 52, sleeve: '#6556f0', cuff: '#b9b2f8', skin: '#9c4f00', line: '#7c3f00' },
  { turn: 196, sleeve: '#0084d1', cuff: '#59afe1', skin: '#f5d4b2', line: '#e8bd94' },
  { turn: -18, sleeve: '#ff6900', cuff: '#ffb86a', skin: '#f1bf8c', line: '#e2a66b' },
].map((arm, i) => ({ ...arm, delay: `${140 + i * 90}ms` }))

// The short lines that flash between the arms when the hands spring apart, one in each gap.
const claps = [17, 90, 162, 232, 305].map((turn, i) => ({
  turn,
  colour: i % 2 ? 'var(--color-cornflower-400)' : 'var(--color-orange-400)',
}))

// What is written on the classroom's board, in the order the chalk draws it: a heading, three lines and two shapes.
const chalk = [
  { d: 'M24 23.5h19', colour: '#fb64b6', width: 2.8 },
  { d: 'M24 30.5h28', colour: '#ffffff', width: 2 },
  { d: 'M24 36.5h21', colour: '#ffffff', width: 2 },
  { d: 'M24 42.5h25', colour: '#ffffff', width: 2 },
  { d: 'M71 26.5a5 5 0 1 1-10 0a5 5 0 0 1 10 0z', colour: '#ffb86a', width: 2 },
  { d: 'M63 35.5h6a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z', colour: '#b9b2f8', width: 2 },
].map((mark, i) => ({ ...mark, style: { '--delay': `${560 + i * 90}ms`, '--step': `${i * 110}ms` } }))

// The classroom's three seats, each a desk with its chair in front, drawn once and moved to its place.
const desks = [
  { x: 0, chair: '#6556f0', leg: '#4f43c9', slot: '#b9b2f8' },
  { x: 24, chair: '#f6339a', leg: '#e60076', slot: '#fda5d5' },
  { x: 48, chair: '#0084d1', leg: '#0069a8', slot: '#59afe1' },
].map((desk, i) => ({ ...desk, style: { '--delay': `${260 + i * 90}ms`, '--beat': `${i * 90}ms` } }))

// Two of these can share a page, and a clip path is found by its id.
const clip = `eh-clip-${useId()}`
</script>

<template>
  <div class="eh-root">
    <div class="eh-stage" aria-hidden="true">
      <div class="eh-orbits">
        <span v-for="o in orbits" :key="o.tier" :class="['eh-orbit', `eh-${o.tier}`]" :style="o.style" />
      </div>
      <span v-for="(spot, i) in spots" :key="i" :class="['eh-spot', `eh-${spot.tier}`]" :style="spot.style">
        <span v-if="spot.src" class="eh-face"><img :src="spot.src" alt="" /></span>
        <span v-else class="eh-seat"><UIcon name="i-lucide-plus" class="size-3.5" /></span>
      </span>
      <span class="eh-hub">
        <span class="eh-hub-body">
          <span class="eh-hub-pulse" />
          <span class="eh-hub-tile">
            <span v-if="hub === 'loader'" class="eh-loader"><CircularLoading :size="64" /></span>
            <svg v-else class="eh-hands" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
              <clipPath :id="clip"><rect width="96" height="96" rx="28" /></clipPath>
              <g v-if="hub === 'classroom'" :clip-path="`url(#${clip})`">
                <rect y="79" width="96" height="17" fill="#fce7f3" />
                <g class="eh-board">
                  <rect x="14" y="12" width="68" height="41" rx="6" fill="#45556c" />
                  <rect x="17" y="15" width="62" height="35" rx="3.5" fill="#1d293d" />
                  <path
                    v-for="mark in chalk"
                    :key="mark.d"
                    class="eh-chalk"
                    :d="mark.d"
                    pathLength="1"
                    fill="none"
                    :stroke="mark.colour"
                    :stroke-width="mark.width"
                    stroke-linecap="round"
                    :style="mark.style"
                  />
                  <rect x="24" y="51.6" width="48" height="3.6" rx="1.8" fill="#314158" />
                  <rect x="30" y="49.8" width="7" height="2.4" rx="1.2" fill="#ffffff" />
                  <rect x="57" y="48.8" width="9.5" height="3.4" rx="1.2" fill="#ffb86a" />
                  <rect x="57" y="48.8" width="9.5" height="1.4" rx="0.7" fill="#ff8904" />
                </g>
                <g v-for="desk in desks" :key="desk.x" :transform="`translate(${desk.x} 0)`">
                  <g class="eh-desk" :style="desk.style">
                    <rect x="13" y="65" width="22" height="4.6" rx="2.3" fill="#ffb86a" />
                    <rect x="15" y="69" width="2.2" height="13" fill="#ff8904" />
                    <rect x="30.8" y="69" width="2.2" height="13" fill="#ff8904" />
                    <rect x="18" y="84" width="2.2" height="8" rx="1" :fill="desk.leg" />
                    <rect x="27.8" y="84" width="2.2" height="8" rx="1" :fill="desk.leg" />
                    <rect x="16.5" y="72" width="15" height="13" rx="4.5" :fill="desk.chair" />
                    <rect x="19.5" y="75" width="9" height="2" rx="1" :fill="desk.slot" />
                  </g>
                </g>
              </g>
              <g v-else :clip-path="`url(#${clip})`">
                <g class="eh-claps">
                  <path
                    v-for="c in claps"
                    :key="c.turn"
                    d="M70 48h6"
                    fill="none"
                    stroke-width="2.2"
                    stroke-linecap="round"
                    :style="{ stroke: c.colour }"
                    :transform="`rotate(${c.turn} 48 48)`"
                  />
                </g>
                <g v-for="arm in arms" :key="arm.turn" :transform="`rotate(${arm.turn} 48 48)`">
                  <g class="eh-arm" :style="{ '--delay': arm.delay }">
                    <g opacity="0.18" fill="#0f0c24" stroke="#0f0c24" stroke-width="1.8" stroke-linejoin="round">
                      <rect x="46" y="40" width="19" height="16" rx="6" />
                      <rect x="39" y="40.1" width="14" height="3.8" rx="1.9" />
                      <rect x="37.4" y="44.1" width="15" height="3.8" rx="1.9" />
                      <rect x="37.8" y="48.1" width="15" height="3.8" rx="1.9" />
                      <rect x="39.8" y="52.1" width="13" height="3.8" rx="1.9" />
                    </g>
                    <rect x="66" y="38.5" width="64" height="19" rx="4" :fill="arm.sleeve" />
                    <rect x="62" y="37.4" width="7.4" height="21.2" rx="3" :fill="arm.cuff" />
                    <ellipse cx="56.6" cy="40.6" rx="4.6" ry="3.2" :fill="arm.skin" />
                    <rect x="46" y="40" width="19" height="16" rx="6" :fill="arm.skin" />
                    <rect x="39" y="40.1" width="14" height="3.8" rx="1.9" :fill="arm.skin" />
                    <rect x="37.4" y="44.1" width="15" height="3.8" rx="1.9" :fill="arm.skin" />
                    <rect x="37.8" y="48.1" width="15" height="3.8" rx="1.9" :fill="arm.skin" />
                    <rect x="39.8" y="52.1" width="13" height="3.8" rx="1.9" :fill="arm.skin" />
                    <path
                      d="M39.6 44h9.4M38.4 48h10.6M40.2 52h8.8"
                      fill="none"
                      :stroke="arm.line"
                      stroke-width="0.9"
                      stroke-linecap="round"
                    />
                  </g>
                </g>
              </g>
            </svg>
          </span>
        </span>
      </span>
    </div>

    <div class="eh-copy">
      <p class="text-xl font-semibold text-highlighted">{{ title }}</p>
      <p v-if="$slots.lead" class="text-sm text-muted"><slot name="lead" /></p>
      <div v-if="$slots.default" class="eh-action"><slot /></div>
    </div>
  </div>
</template>

<style scoped>
.eh-root {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 20px 40px;
  text-align: center;
}

.eh-stage {
  --hub: 96px;

  position: relative;
  width: 100%;
  max-width: 580px;
  height: 220px;
}

/* The stage is as tall as the nearest ring, so that one closes around the tile. The layer reaches past the stage above
   and below, where the wider rings fade to nothing instead of being cut. */
.eh-orbits {
  position: absolute;
  inset: -20px 0;
  overflow: hidden;
  mask-image: radial-gradient(ellipse 58% 50% at 50% 50%, #000 82%, transparent 100%);
}

.eh-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--size);
  height: var(--size);
  margin: calc(var(--size) / -2) 0 0 calc(var(--size) / -2);
  border: 1.5px dashed var(--color-cornflower-200);
  border-radius: 9999px;
  animation: eh-turn var(--turn) linear infinite var(--way);
}

.eh-spot,
.eh-hub {
  position: absolute;
  top: 50%;
  left: 50%;
}

.eh-spot {
  width: var(--size);
  height: var(--size);
  margin: calc(var(--size) / -2) 0 0 calc(var(--size) / -2);
  transform: translate(var(--x), var(--y));
  animation: eh-join 620ms cubic-bezier(0.22, 1, 0.36, 1) var(--delay) backwards;
}

/* The role art is a circle with a margin of a sixteenth of its box around it. A white disc behind it turns that margin
   into the face's white rim, tight against the circle. The art itself is left unclipped, so what a figure holds (a
   flag, a pencil, a cap) reaches past the rim instead of being cut by it. */
.eh-face {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  animation: eh-float var(--float) ease-in-out infinite alternate;
}

.eh-face::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  background: #fff;
  box-shadow: 0 8px 16px -8px rgb(15 12 36 / 0.3);
}

.eh-face img {
  position: relative;
  display: block;
  width: 100%;
  max-width: none;
  height: 100%;
}

.eh-seat {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border: 1.5px dashed var(--color-cornflower-300);
  border-radius: 9999px;
  color: var(--color-cornflower-400);
  animation: eh-breathe 2.6s ease-in-out calc(var(--delay) + 620ms) infinite alternate;
}

.eh-hub {
  width: var(--hub);
  height: var(--hub);
  margin: calc(var(--hub) / -2) 0 0 calc(var(--hub) / -2);
  animation: eh-pop 560ms cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}

.eh-hub-body {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 28px;
  animation: eh-float 5s ease-in-out infinite alternate;
}

.eh-hub-tile {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: #fff;
  box-shadow:
    0 1px 2px rgb(15 12 36 / 0.06),
    0 12px 28px -10px rgb(101 86 240 / 0.35);
  transition: scale 240ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.eh-loader {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
}

.eh-hands {
  display: block;
  width: 100%;
  height: 100%;
}

/* Each arm slides in along its own direction, bottom of the pile first, then joins the shared cheer. */
.eh-arm {
  animation:
    eh-reach 640ms cubic-bezier(0.22, 1, 0.36, 1) var(--delay) backwards,
    eh-cheer 3.6s ease-in-out 1.5s infinite;
}

.eh-claps {
  opacity: 0;
  transform-origin: 48px 48px;
  animation: eh-clap 3.6s ease-out 1.5s infinite;
}

/* The board comes down and the seats come up, then the chalk writes. After that, on the tile's pulse, the seats hop
   one after the other and each mark is wiped and written again. */
.eh-board {
  animation: eh-drop 560ms cubic-bezier(0.22, 1, 0.36, 1) 140ms backwards;
}

.eh-chalk {
  stroke-dasharray: 1;
  animation:
    eh-draw 420ms ease-out var(--delay) backwards,
    eh-write 3.6s ease-in-out calc(1.5s + var(--step)) infinite;
}

.eh-desk {
  animation:
    eh-sit 560ms cubic-bezier(0.22, 1, 0.36, 1) var(--delay) backwards,
    eh-hop 3.6s ease-in-out calc(1.5s + var(--beat)) infinite;
}

.eh-hub-pulse {
  position: absolute;
  inset: 0;
  border: 2px solid var(--color-orange-300);
  border-radius: inherit;
  opacity: 0;
  animation: eh-pulse 3.6s ease-out 1.5s infinite;
}

.eh-root:has(.eh-action :is(a, button):is(:hover, :focus-visible)) .eh-hub-tile {
  scale: 1.06;
}

.eh-copy {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  max-width: 448px;
  text-wrap: balance;
}

.eh-copy > * {
  animation: eh-rise 420ms ease-out backwards;
}

.eh-copy > :nth-child(1) {
  animation-delay: 380ms;
}

.eh-copy > :nth-child(2) {
  animation-delay: 450ms;
}

.eh-action {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
  animation-delay: 520ms;
}

@container (max-width: 540px) {
  .eh-edge {
    display: none;
  }
}

@container (max-width: 400px) {
  .eh-stage {
    --hub: 84px;

    height: 148px;
  }

  /* The stage is shorter than the nearest ring here, so the ring ends before it reaches the title. */
  .eh-orbits {
    inset: -6px 0;
  }

  .eh-far {
    display: none;
  }
}

@container (max-width: 250px) {
  .eh-near {
    display: none;
  }
}

@keyframes eh-turn {
  to {
    transform: rotate(360deg);
  }
}

@keyframes eh-join {
  from {
    opacity: 0;
    transform: translate(0, 0) scale(0.4);
  }
}

@keyframes eh-pop {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
}

@keyframes eh-float {
  from {
    transform: translateY(-3px);
  }

  to {
    transform: translateY(3px);
  }
}

@keyframes eh-breathe {
  from {
    opacity: 1;
  }

  to {
    opacity: 0.45;
  }
}

@keyframes eh-reach {
  from {
    transform: translateX(72px);
  }
}

@keyframes eh-cheer {
  0%,
  60%,
  100% {
    transform: translateX(0);
  }

  68% {
    transform: translateX(-2px);
  }

  78% {
    transform: translateX(6px);
  }

  88% {
    transform: translateX(-1px);
  }
}

@keyframes eh-clap {
  0%,
  70% {
    opacity: 0;
    transform: scale(0.8);
  }

  77% {
    opacity: 1;
    transform: scale(1.05);
  }

  92%,
  100% {
    opacity: 0;
    transform: scale(1.3);
  }
}

@keyframes eh-drop {
  from {
    transform: translateY(-64px);
  }
}

@keyframes eh-sit {
  from {
    transform: translateY(36px);
  }
}

@keyframes eh-draw {
  from {
    opacity: 0;
    stroke-dashoffset: 1;
  }
}

@keyframes eh-write {
  0%,
  58%,
  88%,
  100% {
    opacity: 1;
    stroke-dashoffset: 0;
  }

  64% {
    opacity: 0;
    stroke-dashoffset: 0;
  }

  65% {
    opacity: 0;
    stroke-dashoffset: 1;
  }

  67% {
    opacity: 1;
    stroke-dashoffset: 1;
  }
}

@keyframes eh-hop {
  0%,
  66%,
  82%,
  90%,
  100% {
    transform: translateY(0);
  }

  74% {
    transform: translateY(-5px);
  }

  86% {
    transform: translateY(-1.5px);
  }
}

@keyframes eh-pulse {
  0%,
  70% {
    opacity: 0;
    transform: scale(1);
  }

  72% {
    opacity: 0.6;
    transform: scale(1);
  }

  100% {
    opacity: 0;
    transform: scale(1.45);
  }
}

@keyframes eh-rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .eh-root *,
  .eh-root *::after {
    animation: none !important;
    transition: none !important;
  }
}
</style>
