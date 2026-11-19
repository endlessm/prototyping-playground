<script setup lang="ts">
import CelebrateChecklist from './CelebrateChecklist.vue'
import Marker from './Marker.vue'

// The one-time card on top of the place a new role is about: a welcome by name, what the role is for and the first
// things to do. Its title follows the app's OnboardingCard (secondary, bold, a check icon). The first steps are a checklist the
// person ticks, celebrated on every tick and once all are done: steps done on arrival come ticked, the first open one
// links to its task screen, optional steps carry a badge, and a step with an action opens it in place.
defineProps<{
  /** The person's name; the card greets them by their first name. */
  name: string
  lead: string
  steps: string[]
  /** How many steps are done. */
  done?: number
  /** Where the first open step leads. */
  to?: string
  flow?: number
  note?: number
  /** Steps the person may skip. */
  optional?: string[]
  /** Steps that open something on this page, by step. */
  actions?: Record<string, () => void>
}>()
</script>

<template>
  <UCard :ui="{ body: 'grid grid-cols-12 gap-8 sm:p-6' }">
    <div class="col-span-5 flex flex-col gap-2">
      <p class="flex items-center gap-1.5 text-lg font-bold text-secondary">
        <UIcon name="i-lucide-circle-check" class="size-5" />
        Welcome, {{ name.split(' ')[0] }}
        <Marker v-if="flow !== undefined && note" :flow="flow" :n="note" class="ms-1" />
      </p>
      <p class="text-sm text-muted">{{ lead }}</p>
      <div class="mt-auto pt-2">
        <UButton color="neutral" variant="ghost" size="sm" class="-ms-2.5">Dismiss</UButton>
      </div>
    </div>
    <UCard variant="subtle" class="col-span-7 flex flex-col" :ui="{ body: 'flex flex-1 flex-col p-0 sm:p-0' }">
      <CelebrateChecklist :steps="steps" :done="done" :to="to" :optional="optional" :actions="actions" />
    </UCard>
  </UCard>
</template>
