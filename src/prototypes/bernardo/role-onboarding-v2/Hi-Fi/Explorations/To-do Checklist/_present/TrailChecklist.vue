<script setup lang="ts">
import { computed, ref } from 'vue'
import Marker from '../../../_ui/Marker.vue'
import { useChecklist, type Welcome } from './checklist'
import Confetti from './Confetti.vue'
import { BOUNCE, EASE_OUT, POP } from './motion'
import StepText from './StepText.vue'

// Trail: the first steps as a road across the whole card, like a level map. Each step is a numbered stop; ticking it
// fills the road up to the next one. The required steps lead to a flag; optional steps sit past the flag on a dashed
// road. Reaching the flag raises it and sweeps the card green from left to right; unticking pulls it back.
const props = defineProps<Welcome>()
const { checked, isOptional, allDone, isLink, flash, toggle } = useChecklist(props)

const confetti = ref<InstanceType<typeof Confetti>>()
const flag = ref<HTMLElement>()
const raised = ref(0)

const order = computed(() => {
  const all = props.steps.map((step, i) => ({ step, i }))
  return { main: all.filter((s) => !isOptional(s.i)), extra: all.filter((s) => isOptional(s.i)) }
})

function tick(i: number, event: MouseEvent) {
  const { next, completed } = toggle(i)
  if (!next) return
  confetti.value?.burst(event.currentTarget as HTMLElement, 14, 40)
  if (completed) {
    raised.value++
    setTimeout(() => flag.value && confetti.value?.burst(flag.value, 28, 80), 380)
  }
}
</script>

<template>
  <UCard :ui="{ root: 'relative', body: 'relative flex flex-col gap-6 sm:p-6' }">
    <div class="tr-wash" :class="{ 'is-on': allDone }" aria-hidden="true" />

    <div class="relative flex items-start justify-between gap-8">
      <div class="flex max-w-2xl flex-col gap-1">
        <p class="flex items-center gap-1.5 text-lg font-bold text-secondary">
          <UIcon name="i-lucide-circle-check" class="size-5" />
          Welcome, {{ name.split(' ')[0] }}
          <Marker v-if="flow !== undefined && note" :flow="flow" :n="note" class="ms-1" />
        </p>
        <p class="text-sm text-muted">{{ lead }}</p>
      </div>
      <UButton color="neutral" variant="ghost" size="sm">Dismiss</UButton>
    </div>

    <ol class="tr" :style="{ '--ease-out': EASE_OUT, '--spring-pop': POP, '--bounce': BOUNCE }">
      <template v-for="(s, n) in order.main" :key="s.step">
        <li class="tr-stop">
          <button
            type="button"
            role="checkbox"
            :aria-checked="checked[s.i]"
            :aria-label="s.step"
            class="tr-node"
            :class="{ 'is-done': checked[s.i], 'is-popping': flash === s.i }"
            @click="tick(s.i, $event)"
          >
            <span v-if="!checked[s.i]" class="tr-num">{{ n + 1 }}</span>
            <UIcon v-else name="i-lucide-check" class="size-5" />
          </button>
          <StepText
            center
            class="text-sm"
            :step="s.step"
            :checked="checked[s.i]!"
            :link="isLink(s.i) ? to : undefined"
            :action="actions?.[s.step]"
          />
        </li>
        <li class="tr-road" aria-hidden="true">
          <span class="tr-fill" :class="{ 'is-on': checked[s.i] }" :style="{ transitionDelay: checked[s.i] ? '120ms' : '0ms' }" />
        </li>
      </template>

      <li class="tr-stop">
        <span ref="flag" class="tr-node tr-flag" :class="{ 'is-done': allDone }" role="img" aria-label="Finish">
          <UIcon :key="raised" name="i-lucide-flag" class="size-5" :class="{ 'tr-wave': allDone && raised }" />
        </span>
      </li>

      <template v-for="s in order.extra" :key="s.step">
        <li class="tr-road is-dashed" aria-hidden="true" />
        <li class="tr-stop">
          <button
            type="button"
            role="checkbox"
            :aria-checked="checked[s.i]"
            :aria-label="s.step"
            class="tr-node is-extra"
            :class="{ 'is-done': checked[s.i], 'is-popping': flash === s.i }"
            @click="tick(s.i, $event)"
          >
            <UIcon :name="checked[s.i] ? 'i-lucide-check' : 'i-lucide-star'" class="size-5" />
          </button>
          <StepText
            center
            class="text-sm"
            :step="s.step"
            :checked="checked[s.i]!"
            :link="isLink(s.i) ? to : undefined"
            :action="actions?.[s.step]"
            optional
          />
        </li>
      </template>
    </ol>

    <Confetti ref="confetti" />
  </UCard>
</template>

<style scoped>
.tr-wash {
  position: absolute;
  inset: 0;
  background: color-mix(in oklab, var(--ui-success) 9%, var(--ui-bg));
  clip-path: inset(0 100% 0 0);
  transition: clip-path 420ms cubic-bezier(0.23, 1, 0.32, 1);
}
.tr-wash.is-on {
  clip-path: inset(0 0 0 0);
  transition: clip-path 800ms cubic-bezier(0.25, 0.7, 0.2, 1) 120ms;
}
.tr {
  position: relative;
  display: flex;
  align-items: flex-start;
}
.tr-stop {
  display: flex;
  flex: 0 0 200px;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.tr-stop:has(.tr-flag) {
  flex-basis: 64px;
}
.tr-road {
  position: relative;
  flex: 1;
  min-width: 32px;
  height: 6px;
  /* The road runs from one node's centre to the next, under both nodes: half a stop on each side. */
  margin: 19px -100px 0;
  border-radius: 999px;
  background: var(--ui-bg-accented);
  overflow: hidden;
}
.tr-road:has(+ .tr-stop .tr-flag) {
  margin-right: -32px;
}
.tr-road.is-dashed {
  margin-left: -32px;
  background: repeating-linear-gradient(90deg, var(--ui-border-accented) 0 8px, transparent 8px 14px);
}
.tr-fill {
  position: absolute;
  inset: 0;
  background: var(--ui-success);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 450ms var(--ease-out);
}
.tr-fill.is-on {
  transform: scaleX(1);
}
.tr-node {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 2px solid var(--ui-border-accented);
  border-radius: 999px;
  background: var(--ui-bg);
  color: var(--ui-text-muted);
  font-weight: 700;
  transition:
    background-color 250ms ease,
    border-color 250ms ease,
    color 250ms ease,
    transform 160ms var(--ease-out);
}
button.tr-node {
  cursor: pointer;
}
button.tr-node:active {
  transform: scale(0.9);
}
button.tr-node:focus-visible {
  outline: 2px solid var(--ui-primary);
  outline-offset: 3px;
}
@media (hover: hover) and (pointer: fine) {
  button.tr-node:not(.is-done):hover {
    border-color: var(--ui-success);
    color: var(--ui-success);
  }
}
.tr-node.is-extra:not(.is-done) {
  border-style: dashed;
}
.tr-node.is-done {
  border-color: var(--ui-success);
  background: var(--ui-success);
  color: #fff;
}
.tr-node.is-popping {
  animation: tr-pop 500ms var(--spring-pop);
}
@keyframes tr-pop {
  from { transform: scale(0.9) rotate(1.8deg); }
  to { transform: scale(1) rotate(0); }
}
.tr-flag {
  border-style: dashed;
}
.tr-flag.is-done {
  border-style: solid;
  animation: tr-raise 650ms var(--bounce) 380ms backwards;
}
@keyframes tr-raise {
  from { transform: scale(0.5); }
  to { transform: scale(1); }
}
.tr-wave {
  transform-origin: 20% 90%;
  animation: tr-wave 900ms ease-in-out 450ms 2;
}
@keyframes tr-wave {
  0%, 100% { transform: rotate(0); }
  30% { transform: rotate(-14deg); }
  70% { transform: rotate(8deg); }
}
@media (prefers-reduced-motion: reduce) {
  .tr-wash, .tr-wash.is-on, .tr-fill { transition: none; }
  .tr-node.is-popping, .tr-flag.is-done, .tr-wave { animation: none; }
}
</style>
