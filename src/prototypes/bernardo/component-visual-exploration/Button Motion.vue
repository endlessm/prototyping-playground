<!-- @studio-id k6b0jat4mrx13hch -->
<script setup lang="ts">
type Phase = 'idle' | 'busy' | 'done'

const variations = [
  {
    id: 'press',
    name: 'Press',
    does: 'The button shrinks a little while it is pressed.',
    spec: 'Press: scale 0.97, 160ms ease-out',
    fits: 'Every button. The quiet default.',
  },
  {
    id: 'lift',
    name: 'Lift',
    does: 'It rises with a soft shadow on hover and sinks when pressed.',
    spec: 'Hover: 1px up and shadow, 200ms. Press: 1px down, 100ms',
    fits: 'The main action of a card or a landing page. Too busy for toolbars.',
  },
  {
    id: 'squish',
    name: 'Squish',
    does: 'It squashes when pressed and springs back with a small wobble.',
    spec: 'Press: scale 1.04 by 0.9, 100ms. Release: spring, bounce 0.5',
    fits: 'Playful moments for learners, like starting a game or claiming a badge.',
  },
  {
    id: 'nudge',
    name: 'Icon nudge',
    does: 'On hover the icon moves the way the action goes. Pressing still shrinks the button.',
    spec: 'Hover: arrow 3px forward, plus a quarter turn, 200ms ease-out',
    fits: 'Buttons that move forward or add something.',
  },
  {
    id: 'confirm',
    name: 'Confirm',
    does: 'The label changes in place from the action to progress to done. The button keeps its size.',
    spec: 'Click: labels crossfade with a 2px blur, 200ms',
    fits: 'Actions that take a moment: save, send, submit.',
  },
] as const

const samples = [
  { props: { label: 'Continue', color: 'primary', variant: 'solid', trailingIcon: 'i-lucide-arrow-right' } },
  { props: { label: 'Cancel', color: 'neutral', variant: 'outline' } },
  { props: { label: 'Add learner', color: 'secondary', variant: 'soft', leadingIcon: 'i-lucide-plus' } },
  { props: { icon: 'i-lucide-plus', 'aria-label': 'Add', color: 'neutral', variant: 'ghost' }, flat: true },
  {
    props: {
      label: 'Get started',
      color: 'primary',
      variant: 'solid',
      size: 'xl',
      trailingIcon: 'i-lucide-arrow-right',
    },
  },
] as const

const phases: Phase[] = ['idle', 'busy', 'done']

const confirmButtons = [
  {
    id: 'save',
    color: 'primary',
    variant: 'solid',
    size: 'md',
    labels: { idle: 'Save changes', busy: 'Saving', done: 'Saved' },
  },
  {
    id: 'invite',
    color: 'neutral',
    variant: 'outline',
    size: 'md',
    labels: { idle: 'Send invite', busy: 'Sending', done: 'Invite sent' },
  },
  {
    id: 'submit',
    color: 'primary',
    variant: 'solid',
    size: 'xl',
    labels: { idle: 'Submit project', busy: 'Submitting', done: 'Submitted' },
  },
] as const

type ConfirmButton = (typeof confirmButtons)[number]

const slow = ref(false)
const phaseOf = reactive<Record<ConfirmButton['id'], Phase>>({ save: 'idle', invite: 'idle', submit: 'idle' })
const announcement = ref('')
const timers = new Set<ReturnType<typeof setTimeout>>()

function later(run: () => void, delay: number) {
  const timer = setTimeout(() => {
    timers.delete(timer)
    run()
  }, delay)
  timers.add(timer)
}

function confirm(button: ConfirmButton) {
  if (phaseOf[button.id] !== 'idle') return
  phaseOf[button.id] = 'busy'
  later(() => {
    phaseOf[button.id] = 'done'
    announcement.value = button.labels.done
    later(() => {
      phaseOf[button.id] = 'idle'
    }, 1800)
  }, 1400)
}

// Labels already shown leave upward and the ones to come wait below, so the change reads as progress.
function position(button: ConfirmButton, phase: Phase) {
  const distance = phases.indexOf(phase) - phases.indexOf(phaseOf[button.id])
  if (distance === 0) return 'now'
  return distance < 0 ? 'past' : 'next'
}

onBeforeUnmount(() => timers.forEach(clearTimeout))
</script>

<template>
  <div class="motion min-h-screen bg-default p-6 text-default" :style="{ '--speed': slow ? 5 : 1 }">
    <header class="mb-6 flex flex-wrap items-start justify-between gap-6">
      <div>
        <h1 class="text-lg font-semibold text-highlighted">Button motion</h1>
        <p class="mt-1 text-sm text-muted">Five ways a button can respond. Hover, press and click each row.</p>
      </div>
      <USwitch v-model="slow" label="Slow motion" description="Plays the motion 5 times slower." />
    </header>

    <ol class="divide-y divide-default border-y border-default">
      <li
        v-for="(variation, index) in variations"
        :key="variation.id"
        class="grid gap-x-10 gap-y-4 py-6 lg:grid-cols-[22rem_1fr] lg:items-center"
      >
        <div>
          <h2 class="text-sm font-semibold text-highlighted">{{ index + 1 }}. {{ variation.name }}</h2>
          <p class="mt-1 text-sm text-muted">{{ variation.does }}</p>
          <p class="mt-2 text-xs text-muted">
            <span class="font-medium text-default">Fits:</span>
            {{ variation.fits }}
          </p>
          <p class="mt-1 text-xs text-dimmed">{{ variation.spec }}</p>
        </div>

        <div class="flex flex-wrap items-center gap-4" :class="`v-${variation.id}`">
          <template v-if="variation.id === 'confirm'">
            <UButton
              v-for="button in confirmButtons"
              :key="button.id"
              class="motion-button"
              :color="button.color"
              :variant="button.variant"
              :size="button.size"
              :aria-disabled="phaseOf[button.id] === 'busy' || undefined"
              @click="confirm(button)"
            >
              <span class="grid">
                <span
                  v-for="phase in phases"
                  :key="phase"
                  class="phase col-start-1 row-start-1 flex items-center justify-center"
                  :class="button.size === 'xl' ? 'gap-2' : 'gap-1.5'"
                  :data-position="position(button, phase)"
                  :aria-hidden="phase !== phaseOf[button.id]"
                >
                  <UIcon
                    v-if="phase === 'busy'"
                    name="i-lucide-loader-circle"
                    class="animate-spin"
                    :class="button.size === 'xl' ? 'size-6' : 'size-5'"
                  />
                  <UIcon
                    v-else-if="phase === 'done'"
                    name="i-lucide-check"
                    class="check"
                    :class="button.size === 'xl' ? 'size-6' : 'size-5'"
                  />
                  {{ button.labels[phase] }}
                </span>
              </span>
            </UButton>
            <span class="sr-only" role="status">{{ announcement }}</span>
          </template>

          <template v-else>
            <UButton
              v-for="(sample, sampleIndex) in samples"
              :key="sampleIndex"
              v-bind="sample.props"
              class="motion-button"
              :class="{ 'motion-flat': 'flat' in sample }"
              :ui="{ leadingIcon: 'motion-lead', trailingIcon: 'motion-trail' }"
            />
          </template>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.motion {
  --speed: 1;
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  /* A spring of 300ms with bounce 0.5, sampled over the 660ms it takes to settle. */
  --spring: linear(
    0,
    0.08,
    0.268,
    0.5,
    0.725,
    0.912,
    1.046,
    1.127,
    1.16,
    1.158,
    1.133,
    1.097,
    1.059,
    1.026,
    1,
    0.984,
    0.975,
    0.973,
    0.976,
    0.982,
    0.988,
    0.994,
    0.998,
    1.002,
    1.004,
    1.004,
    1.004,
    1.003,
    1.002,
    1.001,
    1.001,
    1,
    1
  );
  /* Nuxt UI's own colour transition, restated because setting `transition` replaces it. */
  --tint: color 150ms, background-color 150ms, border-color 150ms;
}

.v-press :deep(.motion-button),
.v-nudge :deep(.motion-button),
.v-confirm :deep(.motion-button) {
  transition:
    transform calc(160ms * var(--speed)) var(--ease-out),
    var(--tint);
}

.v-press :deep(.motion-button:active:not(:disabled)),
.v-nudge :deep(.motion-button:active:not(:disabled)),
.v-confirm :deep(.motion-button:active:not([aria-disabled='true'])) {
  transform: scale(0.97);
}

.v-lift :deep(.motion-button) {
  position: relative;
  transition:
    transform calc(200ms * var(--speed)) var(--ease-out),
    var(--tint);
}

/* Keeps the pointer over the button while it moves, so the hover never flickers at its edge. */
.v-lift :deep(.motion-button)::before {
  content: '';
  position: absolute;
  inset: -2px;
}

/* The shadow fades in on its own layer: animating opacity is cheaper than animating box-shadow. */
.v-lift :deep(.motion-button)::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
  opacity: 0;
  pointer-events: none;
  transition: opacity calc(200ms * var(--speed)) var(--ease-out);
}

.v-lift :deep(.motion-flat)::after {
  display: none;
}

@media (hover: hover) and (pointer: fine) {
  .v-lift :deep(.motion-button:hover:not(:disabled)) {
    transform: translateY(-1px);
  }

  .v-lift :deep(.motion-button:hover:not(:disabled))::after {
    opacity: 1;
  }

  .v-nudge :deep(.motion-button:hover:not(:disabled) .motion-trail) {
    transform: translateX(3px);
  }

  .v-nudge :deep(.motion-button:hover:not(:disabled) .motion-lead) {
    transform: rotate(90deg);
  }
}

.v-lift :deep(.motion-button:active:not(:disabled)) {
  transform: translateY(1px);
  transition:
    transform calc(100ms * var(--speed)) var(--ease-out),
    var(--tint);
}

.v-lift :deep(.motion-button:active:not(:disabled))::after {
  opacity: 0;
  transition-duration: calc(100ms * var(--speed));
}

.v-squish :deep(.motion-button) {
  transition:
    transform calc(660ms * var(--speed)) var(--spring),
    var(--tint);
}

.v-squish :deep(.motion-button:active:not(:disabled)) {
  transform: scale(1.04, 0.9);
  transition:
    transform calc(100ms * var(--speed)) var(--ease-out),
    var(--tint);
}

.v-nudge :deep(.motion-lead),
.v-nudge :deep(.motion-trail) {
  transition: transform calc(200ms * var(--speed)) var(--ease-out);
}

.phase {
  opacity: 0;
  filter: blur(2px);
  transform: translateY(6px);
  transition:
    opacity calc(200ms * var(--speed)) ease,
    filter calc(200ms * var(--speed)) ease,
    transform calc(200ms * var(--speed)) var(--ease-out);
}

.phase[data-position='past'] {
  transform: translateY(-6px);
}

.phase[data-position='now'] {
  opacity: 1;
  filter: none;
  transform: none;
}

.check {
  clip-path: inset(0 100% 0 0);
  transition: clip-path calc(250ms * var(--speed)) var(--ease-out);
}

.phase[data-position='now'] .check {
  clip-path: inset(0);
  transition-delay: calc(100ms * var(--speed));
}

/* Reduced motion keeps the colour, shadow and label fades and drops everything that moves. */
@media (prefers-reduced-motion: reduce) {
  .motion :deep(.motion-button),
  .motion :deep(.motion-button:hover),
  .motion :deep(.motion-button:active),
  .motion :deep(.motion-lead),
  .motion :deep(.motion-trail) {
    transform: none !important;
  }

  .phase {
    filter: none;
    transform: none !important;
  }

  .check {
    clip-path: none;
  }
}
</style>
