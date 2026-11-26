<script setup lang="ts">
import { PrototypeLink } from '#studio/prototype'
import { EASE_OUT } from './motion'

// A step's words, the way the celebrated checklist shows them: the step open on arrival links to its task, a step
// with an action opens it, a ticked step is struck through.
defineProps<{
  step: string
  checked: boolean
  link?: string
  action?: () => void
  optional?: boolean
  center?: boolean
}>()
</script>

<template>
  <span class="st" :class="{ 'is-center': center }" :style="{ '--ease-out': EASE_OUT }">
    <PrototypeLink v-if="link" :to="link" class="st-link">
      {{ step }}
      <UIcon name="i-lucide-arrow-right" class="size-4 flex-none" />
    </PrototypeLink>
    <button v-else-if="action && !checked" type="button" class="st-action" @click="action()">{{ step }}</button>
    <span v-else class="st-text" :class="{ 'is-checked': checked }">
      <span class="st-strike" :class="{ 'is-struck': checked }">{{ step }}</span>
    </span>
    <UBadge v-if="optional" color="neutral" variant="soft" size="sm" class="flex-none">Optional</UBadge>
  </span>
</template>

<style scoped>
.st {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}
.st.is-center {
  flex-direction: column;
  justify-content: flex-start;
  text-align: center;
}
.st-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: var(--ui-secondary);
  text-decoration: none;
}
.st-link:hover,
.st-action:hover {
  text-decoration: underline;
}
.st-action {
  color: var(--ui-text);
  text-align: inherit;
  cursor: pointer;
}
.st-text {
  color: var(--ui-text);
  transition: color 300ms ease;
}
.st-text.is-checked {
  color: var(--ui-text-muted);
}
.st-strike {
  background-image: linear-gradient(
    color-mix(in oklab, currentColor 55%, transparent),
    color-mix(in oklab, currentColor 55%, transparent)
  );
  background-repeat: no-repeat;
  background-position: 0 58%;
  background-size: 0% 1px;
  transition: background-size 150ms var(--ease-out);
}
.st-strike.is-struck {
  background-size: 100% 1px;
  transition: background-size 350ms var(--ease-out) 80ms;
}
@media (prefers-reduced-motion: reduce) {
  .st-strike, .st-strike.is-struck { transition: none; }
}
</style>
