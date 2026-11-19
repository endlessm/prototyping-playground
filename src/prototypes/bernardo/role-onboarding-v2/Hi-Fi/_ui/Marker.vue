<script setup lang="ts">
import { computed } from 'vue'
import { notes } from '../../_wire/notes'

// A numbered design note, read on hover or focus. Hi-Fi shares the Lo-Fi notes: the flows and their reasons are the
// same, only the drawing changes. Dashed cornflower marks it as walkthrough chrome, not part of the app.
const props = defineProps<{ flow: number; n: number }>()

const note = computed(() => notes[props.flow]?.[props.n - 1] ?? '')
</script>

<template>
  <span
    class="group relative inline-flex size-5 flex-none cursor-help items-center justify-center rounded-full border border-dashed border-secondary-500 bg-white align-middle font-sans text-[11px] leading-none font-semibold tracking-normal text-secondary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
    tabindex="0"
    :aria-label="`Note ${n}: ${note}`"
  >
    {{ n }}
    <span
      role="tooltip"
      class="absolute top-6.5 -left-2 z-30 hidden w-75 rounded-2xl border border-default bg-white px-3.5 py-3 text-left text-[13px] leading-5 font-normal text-default shadow-lg group-hover:block group-focus:block"
    >
      {{ note }}
    </span>
  </span>
</template>
