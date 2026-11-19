<script setup lang="ts">
import { roleIllustrations } from './illustrations'

// Teams tab, empty, exploration "Crew Orbit": Crew turned up. The people circle the Team's controller on a tilted
// lane, passing in front of it and behind it, over a wash of the brand's colours, and the controller's buttons press
// in turn as if someone were playing. The art is decorative. The words under the title and the card's actions come in
// through the slots, so they stay the page's own line and buttons, and the controller leans in while one of those
// buttons is hovered or focused.
const TURN = 30
const PHASE = 0.08

// The Team illustration (`illustrations/place-team.svg`) is drawn in the template so each of its keys can press.
const PAD =
  'M14.5 13h19c6.6 0 10.6 5.2 11.3 12.4l.7 8.3c.4 4.6-4.4 7-7.8 3.8L33 33H15l-4.7 4.5c-3.4 3.2-8.2.8-7.8-3.8l.7-8.3C3.9 18.2 7.9 13 14.5 13z'
const keys = [
  { x: 33, y: 21.6, fill: '#6556f0', shine: 0.5 },
  { x: 38, y: 26.6, fill: '#f6339a', shine: 0.5 },
  { x: 28, y: 26.6, fill: '#1d293d', shine: 0.35 },
]

// One lap: left, front, right, back. A rider's place on it sets how near it looks and whether it passes in front of
// the controller. The same values are its resting pose when motion is reduced.
const riders = [
  roleIllustrations.teamOwner,
  roleIllustrations.facilitator,
  roleIllustrations.teamManager,
  null,
  roleIllustrations.cohortOwner,
  roleIllustrations.learner,
].map((src, i, all) => {
  const lap = (i / all.length + PHASE) % 1
  return {
    src,
    style: {
      '--at': `${(-lap * TURN).toFixed(2)}s`,
      '--near': (1 + 0.2 * Math.sin(lap * 2 * Math.PI)).toFixed(3),
      offsetDistance: `${(lap * 100).toFixed(2)}%`,
      zIndex: lap < 0.5 ? 3 : 1,
    },
  }
})

const colours = ['var(--color-orange-400)', 'var(--color-cornflower-400)', '#f6339a', 'var(--color-sky-500)']

const sparks = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * 2 * Math.PI + 0.3
  const reach = i % 2 ? 124 : 88
  return {
    '--tx': `${Math.round(Math.cos(angle) * reach * 1.5)}px`,
    '--ty': `${Math.round(Math.sin(angle) * reach * 0.7)}px`,
    '--spin': `${Math.round((angle * 180) / Math.PI) + 90}deg`,
    '--c': colours[i % colours.length],
    '--w': i % 3 ? '7px' : '5px',
    '--h': i % 3 ? '7px' : '12px',
  }
})

const twinkles = [
  { x: 9, y: 26, s: 6 },
  { x: 20, y: 80, s: 4 },
  { x: 31, y: 10, s: 5 },
  { x: 72, y: 88, s: 5 },
  { x: 84, y: 16, s: 6 },
  { x: 93, y: 64, s: 4 },
].map((t, i) => ({
  '--x': `${t.x}%`,
  '--y': `${t.y}%`,
  '--s': `${t.s}px`,
  '--c': colours[i % colours.length],
  '--t': `${1.8 + (i % 3) * 0.5}s`,
  '--d': `${i * 0.35}s`,
}))
</script>

<template>
  <div class="te-pop">
    <div class="te-aura" aria-hidden="true">
      <span class="te-haze te-haze-a" />
      <span class="te-haze te-haze-b" />
      <span class="te-haze te-haze-c" />
    </div>

    <div class="te-stage" aria-hidden="true">
      <span v-for="(t, i) in twinkles" :key="i" class="te-twinkle" :style="t" />
      <div class="te-orbit">
        <span class="te-lane te-lane-far" />
        <span class="te-lane" />
        <span v-for="(r, i) in riders" :key="i" class="te-rider" :style="r.style">
          <span class="te-face">
            <img v-if="r.src" :src="r.src" alt="" />
            <span v-else class="te-seat"><UIcon name="i-lucide-plus" class="size-4" /></span>
          </span>
        </span>
        <span class="te-hub">
          <span class="te-hub-glow" />
          <span v-for="(s, i) in sparks" :key="i" class="te-spark" :style="s" />
          <span class="te-hub-tile">
            <span class="te-hub-pulse" />
            <span class="te-hub-pulse te-hub-pulse-late" />
            <svg class="te-pad" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <clipPath id="te-pad-clip"><path :d="PAD" /></clipPath>
              <rect x="9.4" y="10.4" width="9.6" height="6" rx="2.6" fill="#ca3500" />
              <rect x="29" y="10.4" width="9.6" height="6" rx="2.6" fill="#ca3500" />
              <path :d="PAD" fill="#dd5200" />
              <g clip-path="url(#te-pad-clip)"><path :d="PAD" fill="#ff6900" transform="translate(0 -1.8)" /></g>
              <path d="M14.5 13h19c3.7 0 6.6 1.6 8.5 4.3H6c1.9-2.7 4.8-4.3 8.5-4.3z" fill="#ffb86a" />
              <path d="M12.4 15h6.2" fill="none" stroke="#ffffff" stroke-width="0.9" stroke-linecap="round" opacity="0.6" />
              <circle cx="14" cy="25.4" r="5.2" fill="#dd5200" />
              <circle cx="14" cy="24.8" r="4" fill="#ffffff" />
              <circle cx="14" cy="24.8" r="2" fill="#e2e8f0" />
              <rect x="20.9" y="20.2" width="2.6" height="1.4" rx=".7" fill="#dd5200" />
              <rect x="24.5" y="20.2" width="2.6" height="1.4" rx=".7" fill="#dd5200" />
              <circle v-for="k in keys" :key="`rim-${k.x}`" :cx="k.x" :cy="k.y + 0.6" r="2.9" fill="#dd5200" />
              <g v-for="(k, i) in keys" :key="k.x" :class="['te-key', `te-key-${i + 1}`]">
                <circle :cx="k.x" :cy="k.y" r="2.7" :fill="k.fill" />
                <circle :cx="k.x - 0.8" :cy="k.y - 0.8" r=".8" fill="#ffffff" :opacity="k.shine" />
              </g>
            </svg>
          </span>
        </span>
      </div>
    </div>

    <div class="te-copy">
      <p class="te-title text-highlighted">No Teams yet</p>
      <p class="text-sm text-muted"><slot name="lead" /></p>
      <div class="te-action"><slot /></div>
    </div>
  </div>
</template>

<style scoped>
.te-pop {
  position: relative;
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  padding: 16px 20px 40px;
  text-align: center;
}

.te-aura {
  position: absolute;
  inset: 0;
  pointer-events: none;
  mask-image: linear-gradient(to bottom, #000 30%, transparent 84%);
  animation: te-fade 800ms ease-out backwards;
}

.te-haze {
  position: absolute;
  left: 50%;
  border-radius: 9999px;
}

.te-haze-a {
  top: -110px;
  width: 560px;
  height: 340px;
  margin-left: -470px;
  background: radial-gradient(closest-side, rgb(101 86 240 / 0.3), transparent);
  animation: te-drift 11s ease-in-out infinite alternate;
}

.te-haze-b {
  top: -70px;
  width: 520px;
  height: 320px;
  margin-left: -70px;
  background: radial-gradient(closest-side, rgb(255 137 4 / 0.24), transparent);
  animation: te-drift 13s ease-in-out -4s infinite alternate-reverse;
}

.te-haze-c {
  top: 70px;
  width: 380px;
  height: 220px;
  margin-left: -190px;
  background: radial-gradient(closest-side, rgb(246 51 154 / 0.12), transparent);
  animation: te-drift 9s ease-in-out -2s infinite alternate;
}

.te-stage {
  position: relative;
  width: 100%;
  max-width: 620px;
  height: 208px;
}

.te-twinkle {
  position: absolute;
  top: var(--y);
  left: var(--x);
  width: var(--s);
  height: var(--s);
  border-radius: 9999px;
  background: var(--c);
  animation: te-twinkle var(--t) ease-in-out var(--d) infinite alternate;
}

.te-orbit {
  --lane-w: 420px;
  --lane-h: 116px;
  --lane-path: path('M 0,58 a 210,58 0 1,0 420,0 a 210,58 0 1,0 -420,0');
  --rider: 46px;
  --hub: 96px;

  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--lane-w);
  height: var(--lane-h);
  margin: calc(var(--lane-h) / -2 + 6px) 0 0 calc(var(--lane-w) / -2);
  animation: te-bloom 760ms cubic-bezier(0.34, 1.4, 0.64, 1) backwards;
}

.te-lane {
  position: absolute;
  inset: 0;
  border: 1.5px dashed var(--color-cornflower-300);
  border-radius: 50%;
}

.te-lane-far {
  inset: -30px -84px;
  border-color: var(--color-cornflower-200);
  opacity: 0.7;
}

.te-rider {
  position: absolute;
  top: 0;
  left: 0;
  width: var(--rider);
  height: var(--rider);
  offset-path: var(--lane-path);
  offset-rotate: 0deg;
  animation:
    te-ride v-bind('`${TURN}s`') linear infinite,
    te-depth v-bind('`${TURN}s`') linear infinite;
  animation-delay: var(--at);
}

/* The lane's offset is applied inside the rider's own scale, so nearness is scaled one level down. */
.te-face {
  display: block;
  width: 100%;
  height: 100%;
  transform: scale(var(--near));
  animation: te-near v-bind('`${TURN}s`') ease-in-out var(--at) infinite;
}

.te-rider img,
.te-seat {
  display: flex;
  width: 100%;
  height: 100%;
  border-radius: 9999px;
}

/* The role art is a circle with a margin of a sixteenth of its box around it. A white backing turns that margin into
   the face's white rim, tight against the circle, where a ring outside the box left a see-through gap between them. */
.te-rider img {
  background: #fff;
  box-shadow: 0 10px 18px -8px rgb(15 12 36 / 0.4);
}

.te-seat {
  align-items: center;
  justify-content: center;
  border: 1.5px dashed var(--color-cornflower-400);
  background: rgb(255 255 255 / 0.8);
  color: var(--color-cornflower-500);
}

.te-hub {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  width: var(--hub);
  height: var(--hub);
  margin: calc(var(--hub) / -2 - 8px) 0 0 calc(var(--hub) / -2);
  animation: te-pop 620ms cubic-bezier(0.34, 1.56, 0.64, 1) 80ms backwards;
}

.te-hub-glow {
  position: absolute;
  inset: -60%;
  border-radius: 9999px;
  background: radial-gradient(closest-side, rgb(255 137 4 / 0.38), rgb(101 86 240 / 0.14) 62%, transparent);
  opacity: 0.85;
  transition: opacity 240ms ease-out;
  animation: te-swell 3.6s ease-in-out infinite alternate;
}

.te-spark {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--w);
  height: var(--h);
  margin: calc(var(--h) / -2) 0 0 calc(var(--w) / -2);
  border-radius: 9999px;
  background: var(--c);
  opacity: 0;
  animation: te-burst 1000ms cubic-bezier(0.16, 0.84, 0.3, 1) 360ms both;
}

.te-hub-tile {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 28px;
  background: #fff;
  box-shadow:
    0 1px 2px rgb(15 12 36 / 0.08),
    0 18px 36px -12px rgb(255 105 0 / 0.5),
    0 10px 24px -10px rgb(101 86 240 / 0.45);
  transition: scale 240ms cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: te-float 4.4s ease-in-out infinite alternate;
}

.te-pad {
  width: 62%;
  height: 62%;
  animation: te-wiggle 2.8s ease-in-out infinite alternate;
}

.te-key {
  transform-box: fill-box;
  transform-origin: center;
  animation: te-press 2.4s ease-in-out infinite;
}

.te-key-2 {
  animation-delay: 0.3s;
}

.te-key-3 {
  animation-delay: 0.6s;
}

.te-hub-pulse {
  position: absolute;
  inset: 0;
  border: 2px solid var(--color-orange-400);
  border-radius: inherit;
  opacity: 0;
  animation: te-pulse 2.8s ease-out 900ms infinite;
}

.te-hub-pulse-late {
  border-color: var(--color-cornflower-400);
  animation-delay: 2300ms;
}

.te-pop:has(.te-action :is(a, button):is(:hover, :focus-visible)) .te-hub-tile {
  scale: 1.1;
}

.te-pop:has(.te-action :is(a, button):is(:hover, :focus-visible)) .te-hub-glow {
  opacity: 1;
}

.te-copy {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  max-width: 448px;
  text-wrap: balance;
}

.te-copy > * {
  animation: te-rise 460ms ease-out backwards;
}

.te-title {
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
  animation-delay: 420ms;
}

.te-copy > :nth-child(2) {
  animation-delay: 500ms;
}

.te-action {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
  animation-delay: 580ms;
}

@container (max-width: 540px) {
  .te-stage {
    height: 176px;
  }

  .te-orbit {
    --lane-w: 270px;
    --lane-h: 92px;
    --lane-path: path('M 0,46 a 135,46 0 1,0 270,0 a 135,46 0 1,0 -270,0');
    --rider: 38px;
    --hub: 84px;
  }

  .te-lane-far {
    inset: -24px -56px;
  }

  .te-twinkle {
    display: none;
  }
}

@container (max-width: 340px) {
  .te-stage {
    height: 156px;
  }

  .te-orbit {
    --lane-w: 180px;
    --lane-h: 76px;
    --lane-path: path('M 0,38 a 90,38 0 1,0 180,0 a 90,38 0 1,0 -180,0');
    --rider: 30px;
    --hub: 72px;
  }

  .te-lane-far {
    display: none;
  }
}

@keyframes te-ride {
  from {
    offset-distance: 0%;
  }

  to {
    offset-distance: 100%;
  }
}

@keyframes te-near {
  0%,
  50%,
  100% {
    transform: scale(1);
  }

  25% {
    transform: scale(1.2);
  }

  75% {
    transform: scale(0.8);
  }
}

@keyframes te-depth {
  0%,
  49.9% {
    z-index: 3;
  }

  50%,
  100% {
    z-index: 1;
  }
}

@keyframes te-bloom {
  from {
    opacity: 0;
    scale: 0.35;
  }
}

@keyframes te-pop {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
}

@keyframes te-burst {
  0% {
    opacity: 0;
    transform: translate(0, 0) rotate(var(--spin)) scale(0.3);
  }

  15%,
  65% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translate(var(--tx), var(--ty)) rotate(var(--spin)) scale(1);
  }
}

@keyframes te-float {
  from {
    transform: translateY(-4px);
  }

  to {
    transform: translateY(4px);
  }
}

@keyframes te-wiggle {
  from {
    transform: rotate(-5deg);
  }

  to {
    transform: rotate(5deg);
  }
}

@keyframes te-press {
  0%,
  24%,
  100% {
    transform: scale(1);
  }

  12% {
    transform: scale(1.5);
  }
}

@keyframes te-pulse {
  from {
    opacity: 0.7;
    transform: scale(1);
  }

  70%,
  to {
    opacity: 0;
    transform: scale(1.6);
  }
}

@keyframes te-swell {
  from {
    transform: scale(0.92);
  }

  to {
    transform: scale(1.12);
  }
}

@keyframes te-drift {
  from {
    transform: translate(-18px, -6px) scale(1);
  }

  to {
    transform: translate(22px, 10px) scale(1.08);
  }
}

@keyframes te-twinkle {
  from {
    opacity: 0.15;
    transform: scale(0.6);
  }

  to {
    opacity: 0.9;
    transform: scale(1);
  }
}

@keyframes te-fade {
  from {
    opacity: 0;
  }
}

@keyframes te-rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .te-pop *,
  .te-pop *::after {
    animation: none !important;
    transition: none !important;
  }
}
</style>
