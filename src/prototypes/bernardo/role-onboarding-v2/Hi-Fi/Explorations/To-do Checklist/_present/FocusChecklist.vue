<script setup lang="ts">
import { computed, ref } from 'vue'
import Marker from '../../../_ui/Marker.vue'
import { useChecklist, type Welcome } from './checklist'
import Confetti from './Confetti.vue'
import { BOUNCE, EASE_OUT, POP } from './motion'
import StepText from './StepText.vue'
import TickBox from './TickBox.vue'

// Focus: one step at a time. The open steps are a stack of cards; the top one is big, with its action, and the rest
// peek out underneath. Ticking throws the card off to the right and the next one rises. Dots under the welcome show
// every step; a green dot brings its card back. When the required steps are done the welcome's check turns green and
// bursts; once the stack is empty its plate shows a big check.
const props = defineProps<Welcome>()
const { checked, isOptional, allDone, everyDone, isLink, toggle } = useChecklist(props)

const confetti = ref<InstanceType<typeof Confetti>>()
const badge = ref<HTMLElement>()
const cheered = ref(0)

const deck = computed(() => props.steps.map((step, i) => ({ step, i })).filter((s) => !checked.value[s.i]))

function depth(n: number) {
  return {
    transform: `translateY(${n * 10}px) scale(${1 - n * 0.05})`,
    opacity: n > 2 ? 0 : 1 - n * 0.25,
    zIndex: 10 - n,
  }
}

function tick(i: number, event: MouseEvent) {
  const from = event.currentTarget as HTMLElement
  const { next, completed } = toggle(i)
  if (!next) return
  confetti.value?.burst(from, 14, 40)
  if (completed) {
    cheered.value++
    setTimeout(() => badge.value && confetti.value?.burst(badge.value, 28, 80), 250)
  }
}
</script>

<template>
  <UCard :ui="{ body: 'grid grid-cols-12 gap-8 sm:p-6' }">
    <div class="col-span-5 flex flex-col gap-2" :style="{ '--ease-out': EASE_OUT, '--spring-pop': POP, '--bounce': BOUNCE }">
      <p class="flex items-center gap-1.5 text-lg font-bold text-secondary">
        <span ref="badge" :key="cheered" class="fc-badge" :class="{ 'is-done': allDone, 'is-cheering': allDone && cheered }">
          <UIcon :name="allDone ? 'i-lucide-circle-check-big' : 'i-lucide-circle-check'" class="size-5" />
        </span>
        Welcome, {{ name.split(' ')[0] }}
        <Marker v-if="flow !== undefined && note" :flow="flow" :n="note" class="ms-1" />
      </p>
      <p class="text-sm text-muted">{{ lead }}</p>
      <div class="fc-dots">
        <button
          v-for="(step, i) in steps"
          :key="step"
          type="button"
          class="fc-dot"
          :class="{ 'is-done': checked[i], 'is-optional': isOptional(i) }"
          :disabled="!checked[i]"
          :aria-label="checked[i] ? `Bring back: ${step}` : step"
          @click="toggle(i)"
        />
      </div>
      <div class="mt-auto pt-2">
        <UButton color="neutral" variant="ghost" size="sm" class="-ms-2.5">Dismiss</UButton>
      </div>
    </div>

    <div class="col-span-7 fc-deck" :style="{ '--ease-out': EASE_OUT, '--bounce': BOUNCE }">
      <div class="fc-plate" :class="{ 'is-done': everyDone }">
        <UIcon v-if="everyDone" name="i-lucide-check" class="fc-plate-check" />
      </div>
      <TransitionGroup name="fc-card">
        <article
          v-for="(card, n) in deck"
          :key="card.step"
          class="fc-card"
          :style="depth(n)"
          :aria-hidden="n > 0 ? 'true' : undefined"
          :inert="n > 0"
        >
          <TickBox :checked="false" :label="card.step" :size="28" @toggle="tick(card.i, $event)" />
          <div class="flex min-w-0 flex-1 flex-col gap-3">
            <StepText
              class="text-base"
              :step="card.step"
              :checked="false"
              :link="isLink(card.i) ? to : undefined"
              :action="actions?.[card.step]"
              :optional="isOptional(card.i)"
            />
          </div>
        </article>
      </TransitionGroup>
    </div>

    <Confetti ref="confetti" />
  </UCard>
</template>

<style scoped>
.fc-badge {
  display: grid;
  place-items: center;
  border-radius: 999px;
  transition: color 300ms ease;
}
.fc-badge.is-done {
  color: var(--ui-success);
}
.fc-badge.is-cheering {
  animation: fc-cheer 600ms var(--bounce);
}
@keyframes fc-cheer {
  from { transform: scale(0.3) rotate(-40deg); }
  to { transform: scale(1) rotate(0); }
}
.fc-dots {
  display: flex;
  gap: 8px;
  padding-top: 8px;
}
.fc-dot {
  width: 10px;
  height: 10px;
  border: 2px solid var(--ui-border-accented);
  border-radius: 999px;
  transition: background-color 250ms ease, border-color 250ms ease, transform 160ms var(--ease-out);
}
.fc-dot.is-optional:not(.is-done) {
  border-style: dashed;
}
.fc-dot.is-done {
  border-color: var(--ui-success);
  background: var(--ui-success);
  cursor: pointer;
  animation: fc-dot 400ms var(--spring-pop);
}
.fc-dot.is-done:active {
  transform: scale(0.8);
}
.fc-dot:focus-visible {
  outline: 2px solid var(--ui-primary);
  outline-offset: 2px;
}
@keyframes fc-dot {
  from { transform: scale(0.6); }
  to { transform: scale(1); }
}

.fc-deck {
  position: relative;
  min-height: 140px;
}
.fc-plate {
  position: absolute;
  inset: 0 0 20px;
  display: grid;
  place-items: center;
  border: 2px dashed var(--ui-border);
  border-radius: 12px;
  transition: background-color 300ms ease, border-color 300ms ease;
}
.fc-plate.is-done {
  border-style: solid;
  border-color: color-mix(in oklab, var(--ui-success) 30%, transparent);
  background: color-mix(in oklab, var(--ui-success) 10%, var(--ui-bg));
}
.fc-plate-check {
  width: 48px;
  height: 48px;
  color: var(--ui-success);
  animation: fc-cheer 650ms var(--bounce) 150ms backwards;
}
.fc-card {
  position: absolute;
  inset: 0 0 20px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 20px;
  border: 1px solid var(--ui-border);
  border-radius: 12px;
  background: var(--ui-bg);
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.04), 0 6px 16px rgb(15 23 42 / 0.06);
  transform-origin: bottom center;
  transition: transform 300ms var(--ease-out), opacity 300ms var(--ease-out);
}
.fc-card-leave-active {
  transition: transform 260ms var(--ease-out), opacity 260ms var(--ease-out);
}
.fc-card-leave-to {
  opacity: 0;
  transform: translateX(60%) rotate(6deg) !important;
}
.fc-card-enter-from {
  opacity: 0;
  transform: translateY(-14px) scale(1.03) !important;
}
@media (prefers-reduced-motion: reduce) {
  .fc-card, .fc-card-leave-active, .fc-dot, .fc-plate { transition: none; }
  .fc-badge.is-cheering, .fc-dot.is-done, .fc-plate-check { animation: none; }
}
</style>
