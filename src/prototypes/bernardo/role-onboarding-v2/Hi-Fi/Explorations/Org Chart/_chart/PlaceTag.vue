<script setup lang="ts">
import type { Level } from '../../../../_wire/world'

// The small tag naming what a place is, a Team or a Cohort. The Organization has none: it is the top of everything.
defineProps<{ level: Level }>()
</script>

<template>
  <UBadge
    v-if="level !== 'Organization'"
    :color="level === 'Team' ? 'secondary' : 'warning'"
    variant="subtle"
    size="sm"
    class="px-1.5 py-0 text-[10px] leading-4 font-semibold tracking-wide uppercase"
  >
    {{ level }}
  </UBadge>
</template>
