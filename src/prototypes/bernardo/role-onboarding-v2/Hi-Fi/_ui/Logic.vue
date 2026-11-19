<script setup lang="ts">
import { PrototypeLink } from '#studio/prototype'
import Marker from './Marker.vue'

// The walkthrough's routing box: what happens after an action, each outcome linking to the screen it leads to. It is
// walkthrough chrome (dashed cornflower), not part of the app.
defineProps<{ title: string; rows: { label: string; to?: string }[]; flow?: number; note?: number }>()
</script>

<template>
  <div class="flex flex-col gap-1.5 rounded-2xl border border-dashed border-secondary-500 bg-secondary-50/50 px-3.5 pt-3 pb-3.5 text-left">
    <p class="mb-1 flex items-center justify-between gap-2 text-[11px] font-semibold tracking-wider text-secondary-700 uppercase">
      {{ title }}
      <Marker v-if="flow !== undefined && note" :flow="flow" :n="note" />
    </p>
    <template v-for="row in rows" :key="row.label">
      <PrototypeLink
        v-if="row.to"
        :to="row.to"
        class="block rounded-lg border border-default bg-white px-3 py-2 text-sm text-default no-underline hover:bg-elevated/50"
      >
        {{ row.label }}
      </PrototypeLink>
      <span v-else class="block rounded-lg border border-default bg-white px-3 py-2 text-sm text-default">{{ row.label }}</span>
    </template>
  </div>
</template>
