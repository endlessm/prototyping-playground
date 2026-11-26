<script setup lang="ts">
import { computed, ref } from 'vue'
import Marker from '../../../_ui/Marker.vue'
import { useChecklist, type Welcome } from './checklist'
import Confetti from './Confetti.vue'
import { BOUNCE, EASE_OUT, POP } from './motion'
import StepText from './StepText.vue'
import TickBox from './TickBox.vue'

// Dock: the welcome leaves the page and lives in a corner. It arrives open over the page's bottom right, folds into a
// pill that stays until the steps are done, and its ring fills one segment per step. Finishing folds the panel away
// and lets the pill celebrate on its own: it turns green, its check pops and it bursts.
const props = defineProps<Welcome>()
const { checked, isOptional, allDone, isLink, flash, toggle } = useChecklist(props)

const open = ref(true)
const celebrating = ref(0)
const confetti = ref<InstanceType<typeof Confetti>>()
const pill = ref<HTMLElement>()

const GAP = 6
const segments = computed(() => {
  const share = 100 / props.steps.length
  return props.steps.map((_, i) => ({
    dash: `${share - GAP} ${100 - share + GAP}`,
    offset: -(i * share + GAP / 2) + 25,
    done: checked.value[i],
    optional: isOptional(i),
  }))
})

function tick(i: number, event: MouseEvent) {
  const { next, completed } = toggle(i)
  if (!next) return
  if (!completed) {
    confetti.value?.burst(event.currentTarget as HTMLElement)
    return
  }
  confetti.value?.burst(event.currentTarget as HTMLElement)
  setTimeout(() => {
    open.value = false
    celebrating.value++
    setTimeout(() => pill.value && confetti.value?.burst(pill.value, 28, 80), 180)
  }, 650)
}
</script>

<template>
  <div class="dk" :style="{ '--ease-out': EASE_OUT, '--spring-pop': POP, '--bounce': BOUNCE }">
    <Transition name="dk-panel">
      <section v-if="open" class="dk-panel" aria-label="First steps">
        <header class="dk-head">
          <p class="flex items-center gap-1.5 text-base font-bold text-secondary">
            <UIcon name="i-lucide-circle-check" class="size-5" />
            Welcome, {{ name.split(' ')[0] }}
            <Marker v-if="flow !== undefined && note" :flow="flow" :n="note" class="ms-1" />
          </p>
          <UButton
            icon="i-lucide-chevron-down"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="Fold away"
            @click="open = false"
          />
        </header>
        <p class="px-4 text-sm text-muted">{{ lead }}</p>
        <ol class="dk-steps">
          <li v-for="(step, i) in steps" :key="step" class="dk-step" :class="{ 'is-flash': flash === i }">
            <TickBox :checked="checked[i]!" :label="step" :popping="flash === i" @toggle="tick(i, $event)" />
            <StepText
              class="flex-1 text-sm"
              :step="step"
              :checked="checked[i]!"
              :link="isLink(i) ? to : undefined"
              :action="actions?.[step]"
              :optional="isOptional(i)"
            />
          </li>
        </ol>
        <footer class="px-2 pb-2">
          <UButton color="neutral" variant="ghost" size="sm">Dismiss</UButton>
        </footer>
      </section>
    </Transition>

    <button
      ref="pill"
      type="button"
      class="dk-pill"
      :class="{ 'is-done': allDone, 'is-open': open }"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span :key="celebrating" class="dk-badge" :class="{ 'is-cheering': allDone && celebrating }">
        <svg v-if="!allDone" viewBox="0 0 36 36" class="dk-ring" aria-hidden="true">
          <circle
            v-for="(s, i) in segments"
            :key="i"
            cx="18"
            cy="18"
            r="14"
            pathLength="100"
            :stroke-dasharray="s.dash"
            :stroke-dashoffset="s.offset"
            class="dk-seg"
            :class="{ 'is-done': s.done, 'is-optional': s.optional && !s.done }"
          />
        </svg>
        <UIcon v-else name="i-lucide-check" class="size-5" />
        <span v-if="allDone && celebrating" class="dk-pulse" aria-hidden="true" />
      </span>
      <span>First steps</span>
    </button>

    <Confetti ref="confetti" />
  </div>
</template>

<style scoped>
.dk {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 40;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}
.dk-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 360px;
  padding-top: 12px;
  border: 1px solid var(--ui-border);
  border-radius: 16px;
  background: var(--ui-bg);
  box-shadow: 0 12px 32px rgb(15 23 42 / 0.14), 0 2px 6px rgb(15 23 42 / 0.06);
  transform-origin: bottom right;
}
.dk-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 0 16px;
}
.dk-steps {
  margin: 4px 12px 0;
  border: 1px solid var(--ui-border);
  border-radius: 12px;
  background: var(--ui-bg-muted);
}
.dk-step {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  transition: background-color 500ms ease;
}
.dk-step + .dk-step {
  border-top: 1px solid var(--ui-border);
}
.dk-step.is-flash {
  background: color-mix(in oklab, var(--ui-success) 10%, transparent);
}

.dk-panel-enter-active {
  transition: opacity 220ms var(--ease-out), transform 220ms var(--ease-out);
}
.dk-panel-leave-active {
  transition: opacity 160ms var(--ease-out), transform 160ms var(--ease-out);
}
.dk-panel-enter-from,
.dk-panel-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}

.dk-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 48px;
  padding: 0 18px 0 6px;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  background: var(--ui-bg);
  box-shadow: 0 6px 18px rgb(15 23 42 / 0.12);
  color: var(--ui-text-highlighted);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 300ms ease,
    color 300ms ease,
    border-color 300ms ease,
    transform 160ms var(--ease-out);
}
.dk-pill:active {
  transform: scale(0.97);
}
.dk-pill:focus-visible {
  outline: 2px solid var(--ui-primary);
  outline-offset: 2px;
}
.dk-pill.is-done {
  border-color: var(--ui-success);
  background: var(--ui-success);
  color: #fff;
}
.dk-badge {
  position: relative;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 999px;
}
.dk-pill.is-done .dk-badge {
  background: rgb(255 255 255 / 0.2);
}
.dk-badge.is-cheering {
  animation: dk-cheer 600ms var(--bounce);
}
@keyframes dk-cheer {
  from { transform: scale(0.4) rotate(-30deg); }
  to { transform: scale(1) rotate(0); }
}
.dk-pulse {
  position: absolute;
  inset: 0;
  border: 3px solid var(--ui-success);
  border-radius: 999px;
  opacity: 0;
  animation: dk-pulse 700ms cubic-bezier(0.1, 0.7, 0.3, 1);
}
@keyframes dk-pulse {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(2.6); border-width: 1px; }
}
.dk-ring {
  width: 36px;
  height: 36px;
}
.dk-seg {
  fill: none;
  stroke: var(--ui-border-accented);
  stroke-width: 4;
  stroke-linecap: round;
  transition: stroke 300ms ease;
}
.dk-seg.is-optional {
  stroke: var(--ui-border);
}
.dk-seg.is-done {
  stroke: var(--ui-success);
}

@media (prefers-reduced-motion: reduce) {
  .dk-panel-enter-active, .dk-panel-leave-active { transition: none; }
  .dk-badge.is-cheering, .dk-pulse { animation: none; }
}
</style>
