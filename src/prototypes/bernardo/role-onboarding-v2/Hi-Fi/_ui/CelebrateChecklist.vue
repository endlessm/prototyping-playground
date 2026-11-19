<script setup lang="ts">
import { PrototypeLink } from '#studio/prototype'
import { computed, onMounted, ref } from 'vue'

// The welcome card's first steps as a checklist the person ticks. A tick draws the check inside its circle, pops it, bursts confetti from it and
// strikes the step through. Ticking the last one sends a pulse and a green wave out from that checkbox until
// the box is a soft green, one step above a ticked row, with dark green steps, the box nudging and each of its checks popping in as the wave reaches it; unticking any step pulls the wave back into it. The green box is a second copy
// of the list laid over the first and clipped to a circle, so each step turns green as the wave reaches it. With
// reduced motion the colours change at once. Optional steps carry a badge and don't hold the wave back; a step with an
// action opens it from its words, while its checkbox still ticks it.
const props = defineProps<{
  steps: string[]
  done?: number
  /** Where the first step not done on arrival leads; other steps are ticked here only. */
  to?: string
  optional?: string[]
  actions?: Record<string, () => void>
}>()

const checked = ref(props.steps.map((_, i) => i < (props.done ?? 0)))
const isOptional = (i: number) => !!props.optional?.includes(props.steps[i]!)
const allDone = computed(() => checked.value.every((c, i) => c || isOptional(i)))
const isLink = (i: number) => !checked.value[i] && i === (props.done ?? 0) && !!props.to

const COLORS = ['var(--ui-primary)', 'var(--ui-secondary)', 'var(--ui-success)', 'var(--ui-warning)', 'var(--ui-info)']
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)'
// One spring for every bounce here: damping ratio 0.5, kicked from 0 towards 1, sampled into a CSS linear() easing.
// The kick sets how far it flies past 1; each later swing is about a sixth of the one before.
function spring(kick: number): string {
  const k = 0.5 / Math.sqrt(0.75)
  const end = Math.atan2(k + kick, k * kick - 1) + 2 * Math.PI
  const points = Array.from({ length: 49 }, (_, n) => {
    const angle = (n / 48) * end
    return n === 48 ? 1 : 1 + Math.exp(-k * angle) * (kick * Math.sin(angle) - Math.cos(angle))
  })
  return `linear(${points.map((point) => point.toFixed(4)).join(', ')})`
}
// Flies 4.5 times its travel past the end: the list's check, from its pressed size of 0.9 up to 1.45.
const POP = spring(10.0239)
// Flies 1.2 times its travel past the end: the box, from 0.985 up to 1.018, and the green layer's checks, from 0.6 up to 1.48.
const BOUNCE = spring(2.9043)

interface Piece {
  id: number
  style: Record<string, string>
  round: boolean
}
let nextId = 0
const bursts = ref<Record<number, Piece[]>>({})
const flash = ref<number | null>(null)

const root = ref<HTMLElement>()
let sheet: HTMLElement | undefined
const rings: HTMLElement[] = []

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

onMounted(() => {
  sheet!.style.clipPath = allDone.value ? 'circle(150% at 50% 50%)' : 'circle(0px at 50% 50%)'
})

function pieces(count: number, reach: number, from: HTMLElement): Piece[] {
  const at = from.getBoundingClientRect()
  const left = `${at.left + at.width / 2}px`
  const top = `${at.top + at.height / 2}px`
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6
    const distance = reach * (0.55 + Math.random() * 0.6)
    return {
      id: nextId++,
      round: Math.random() > 0.5,
      style: {
        left,
        top,
        '--dx': `${Math.cos(angle) * distance}px`,
        '--dy': `${Math.sin(angle) * distance - reach * 0.25}px`,
        '--rot': `${Math.round(Math.random() * 540 - 270)}deg`,
        '--delay': `${Math.round(Math.random() * 60)}ms`,
        background: COLORS[i % COLORS.length]!,
      },
    }
  })
}

function wave(from: HTMLElement, filling: boolean) {
  const box = root.value!.getBoundingClientRect()
  const dot = from.getBoundingClientRect()
  const x = dot.left + dot.width / 2 - box.left
  const y = dot.top + dot.height / 2 - box.top
  const reach = Math.hypot(Math.max(x, box.width - x), Math.max(y, box.height - y)) + 2
  const small = `circle(0px at ${x}px ${y}px)`
  const large = `circle(${reach}px at ${x}px ${y}px)`
  // A wave still travelling carries on from where it is, so a quick untick or re-tick never jumps.
  const travelling = sheet!.getAnimations()
  const start = travelling.length ? getComputedStyle(sheet!).clipPath : filling ? small : large
  travelling.forEach((animation) => animation.cancel())
  rings.forEach((ring) => ring.getAnimations().forEach((animation) => animation.cancel()))
  sheet!
    .querySelectorAll<HTMLElement>('[data-pop]')
    .forEach((icon) => icon.getAnimations().forEach((animation) => animation.cancel()))
  sheet!.style.clipPath = filling ? large : small
  if (reduced()) return

  sheet!.animate([{ clipPath: start }, { clipPath: filling ? large : small }], {
    duration: filling ? 800 : 450,
    easing: filling ? 'cubic-bezier(0.25, 0.7, 0.2, 1)' : EASE_OUT,
  })

  // The pulse: rings running ahead of the wave on the way out, and closing in behind it on the way back.
  rings.forEach((ring, n) => {
    ring.style.left = `${x}px`
    ring.style.top = `${y}px`
    const near = { width: '20px', height: '20px', borderWidth: '4px', opacity: 1 }
    const far = { width: `${reach * 2.2}px`, height: `${reach * 2.2}px`, borderWidth: '1px', opacity: 0 }
    ring.animate(filling ? [near, far] : [far, { ...near, offset: 0.8 }, { ...near, opacity: 0 }], {
      duration: filling ? 700 : 450,
      delay: n * (filling ? 110 : 60),
      easing: filling ? 'cubic-bezier(0.1, 0.7, 0.3, 1)' : EASE_OUT,
      fill: 'backwards',
    })
  })
  if (!filling) return

  // A nudge, not a jump: the whole box dips a little, swells just past its size and settles, with a green glow flaring off its edge.
  const card = root.value!.closest<HTMLElement>('.overflow-hidden') ?? root.value!
  const size = getComputedStyle(card).transform
  card.getAnimations().forEach((animation) => animation.cancel())
  card.animate(
    [
      { transform: size === 'none' ? 'scale(1)' : size, easing: EASE_OUT },
      { transform: 'scale(0.985)', offset: 0.12, easing: BOUNCE },
      { transform: 'scale(1)' },
    ],
    { duration: 750 },
  )
  card.animate(
    [
      { boxShadow: '0 0 0 0 color-mix(in oklab, var(--ui-success) 55%, transparent)' },
      { boxShadow: '0 0 0 16px color-mix(in oklab, var(--ui-success) 0%, transparent)' },
    ],
    { duration: 750, easing: 'ease-out' },
  )

  // Each check on the green layer pops in as the wave passes over it.
  sheet!.querySelectorAll<HTMLElement>('[data-pop]').forEach((icon) => {
    const at = icon.getBoundingClientRect()
    const distance = Math.hypot(at.left + at.width / 2 - box.left - x, at.top + at.height / 2 - box.top - y)
    icon.animate([{ transform: 'scale(0.6) rotate(-7deg)' }, { transform: 'scale(1) rotate(0deg)' }], {
      duration: 500,
      delay: (distance / reach) * 420,
      easing: BOUNCE,
      fill: 'backwards',
    })
  })
}

function toggle(i: number, event: MouseEvent) {
  const box = event.currentTarget as HTMLElement
  const wasAllDone = allDone.value
  const next = !checked.value[i]
  checked.value[i] = next
  if (allDone.value !== wasAllDone) wave(box, allDone.value)
  if (!next) {
    if (flash.value === i) flash.value = null
    return
  }
  flash.value = i
  setTimeout(() => flash.value === i && (flash.value = null), 700)
  if (reduced()) return
  bursts.value[i] = allDone.value ? pieces(28, 80, box) : pieces(16, 46, box)
  setTimeout(() => delete bursts.value[i], 1000)
}
</script>

<template>
  <div ref="root" class="relative flex flex-1 flex-col" :style="{ '--ease-out': EASE_OUT, '--spring-pop': POP }">
    <ol
      v-for="layer in ['list', 'sheet'] as const"
      :key="layer"
      :ref="layer === 'sheet' ? (el) => (sheet = (el as HTMLElement) ?? undefined) : undefined"
      class="flex flex-1 flex-col divide-y"
      :class="layer === 'sheet' ? 'pointer-events-none absolute inset-0 divide-success-200 bg-success-100' : 'divide-default'"
      :aria-hidden="layer === 'sheet' ? 'true' : undefined"
      :inert="layer === 'sheet'"
    >
      <li
        v-for="(step, i) in steps"
        :key="step"
        class="flex flex-1 items-center gap-3 px-4 py-3 text-sm transition-colors duration-500"
        :class="layer === 'list' && flash === i ? 'bg-success/10' : ''"
      >
        <template v-if="layer === 'list'">
          <button
            type="button"
            role="checkbox"
            :aria-checked="checked[i]"
            :aria-label="step"
            class="group relative grid size-5 flex-none cursor-pointer place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            @click="toggle(i, $event)"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              class="tick size-5"
              :class="[
                checked[i] ? 'is-checked text-success' : 'text-dimmed group-hover:text-success',
                flash === i ? 'is-popping' : '',
              ]"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" pathLength="1" />
            </svg>
          </button>

          <span class="relative flex-1">
            <PrototypeLink
              v-if="isLink(i)"
              :to="to!"
              class="flex items-center justify-between gap-2 font-semibold text-secondary no-underline hover:underline"
            >
              {{ step }}
              <UIcon name="i-lucide-arrow-right" class="size-4" />
            </PrototypeLink>
            <span v-else class="flex items-center justify-between gap-2">
              <button
                v-if="actions?.[step] && !checked[i]"
                type="button"
                class="cursor-pointer text-left text-default hover:underline"
                @click="actions[step]!()"
              >
                {{ step }}
              </button>
              <span v-else class="transition-colors duration-300" :class="checked[i] ? 'text-muted' : 'text-default'">
                <span class="strike" :class="{ 'is-struck': checked[i], 'is-fresh': flash === i }">{{ step }}</span>
              </span>
              <UBadge v-if="isOptional(i)" color="neutral" variant="soft" size="sm">Optional</UBadge>
            </span>
          </span>
        </template>

        <template v-else>
          <span class="grid size-5 flex-none place-items-center">
            <UIcon :name="checked[i] ? 'i-lucide-circle-check' : 'i-lucide-circle'" class="size-5 text-success-600" data-pop />
          </span>
          <span class="flex flex-1 items-center justify-between gap-2 text-success-700" :class="isLink(i) ? 'font-semibold' : ''">
            <span :class="checked[i] ? 'line-through decoration-success-700/50' : ''">{{ step }}</span>
            <UIcon v-if="isLink(i)" name="i-lucide-arrow-right" class="size-4" />
            <span v-else-if="isOptional(i)" class="rounded-md bg-success-200 px-1.5 py-0.5 text-xs font-medium">Optional</span>
          </span>
        </template>
      </li>
    </ol>

    <span
      v-for="n in 3"
      :key="n"
      :ref="(el) => el && (rings[n - 1] = el as HTMLElement)"
      aria-hidden="true"
      class="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-success opacity-0"
    />

    <!-- The confetti lives on the page, not in the box: both cards clip their content and the green layer covers the list. -->
    <Teleport to="body">
      <div
        v-if="Object.keys(bursts).length"
        aria-hidden="true"
        class="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      >
        <template v-for="(group, step) in bursts" :key="step">
          <span
            v-for="p in group"
            :key="p.id"
            class="piece absolute"
            :class="p.round ? 'size-1.5 rounded-full' : 'h-1 w-2 rounded-[1px]'"
            :style="p.style"
          />
        </template>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.tick {
  transition: transform 160ms var(--ease-out), color 150ms ease;
}
button:active > .tick {
  transform: scale(0.9);
}
.tick path {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  visibility: hidden;
  transition: stroke-dashoffset 150ms var(--ease-out), visibility 0s 150ms;
}
.tick.is-checked path {
  stroke-dashoffset: 0;
  visibility: visible;
  transition: stroke-dashoffset 250ms var(--ease-out) 60ms, visibility 0s 60ms;
}
.tick.is-popping {
  animation: pop 500ms var(--spring-pop);
}
@keyframes pop {
  from { transform: scale(0.9) rotate(1.8deg); }
  to { transform: scale(1) rotate(0deg); }
}

.strike {
  background-image: linear-gradient(
    color-mix(in oklab, currentColor 55%, transparent),
    color-mix(in oklab, currentColor 55%, transparent)
  );
  background-repeat: no-repeat;
  background-position: 0 58%;
  background-size: 0% 1px;
  transition: background-size 150ms var(--ease-out);
}
.strike.is-struck {
  background-size: 100% 1px;
  transition: background-size 350ms var(--ease-out) 80ms;
}
/* A step with an action swaps its button for this text when ticked, so the text arrives already struck. */
@starting-style {
  .strike.is-fresh { background-size: 0% 1px; }
}

.piece {
  opacity: 0;
  animation: burst 800ms cubic-bezier(0.15, 0.7, 0.3, 1) var(--delay) forwards;
}
@keyframes burst {
  0% { opacity: 1; transform: translate(-50%, -50%) rotate(0); }
  70% { opacity: 1; }
  100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy) + 14px)) rotate(var(--rot)); }
}

@media (prefers-reduced-motion: reduce) {
  .tick.is-popping, .piece { animation: none; }
  .tick path, .tick.is-checked path { transition: none; }
  .strike, .strike.is-struck { transition: none; }
  .piece { display: none; }
}
</style>
