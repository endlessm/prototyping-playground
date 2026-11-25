<script setup lang="ts">
import { useTimestamp } from '@vueuse/core'

const SECOND_IN_MS = 1000
const MINUTE_IN_MS = SECOND_IN_MS * 60
const HOUR_IN_MS = MINUTE_IN_MS * 60
const DAY_IN_MS = HOUR_IN_MS * 24

const props = defineProps<{
  targetDate: Date
}>()

const nowTimestamp = useTimestamp({ interval: 1000 })
const timeRemaining = computed(
  () => props.targetDate.getTime() - nowTimestamp.value,
)
const daysRemaining = computed(() =>
  Math.max(0, Math.floor(timeRemaining.value / DAY_IN_MS)),
)
const hoursRemaining = computed(() =>
  Math.max(0, Math.floor((timeRemaining.value % DAY_IN_MS) / HOUR_IN_MS)),
)
const minutesRemaining = computed(() =>
  Math.max(0, Math.floor((timeRemaining.value % HOUR_IN_MS) / MINUTE_IN_MS)),
)
const secondsRemaining = computed(() =>
  Math.max(0, Math.floor((timeRemaining.value % MINUTE_IN_MS) / SECOND_IN_MS)),
)
</script>

<template>
  <div class="flex items-center gap-2.5">
    <span class="flex">
      <span class="text-slate-50 font-bold min-w-[2ch] text-right">{{
        String(daysRemaining).padStart(2, '0')
      }}</span>
      <span class="text-slate-100/75 font-normal">D</span>
    </span>
    <span class="flex">
      <span class="text-slate-50 font-bold min-w-[2ch] text-right">{{
        String(hoursRemaining).padStart(2, '0')
      }}</span>
      <span class="text-slate-100/75 font-normal">H</span>
    </span>
    <span class="flex">
      <span class="text-slate-50 font-bold min-w-[2ch] text-right">{{
        String(minutesRemaining).padStart(2, '0')
      }}</span>
      <span class="text-slate-100/75 font-normal">M</span>
    </span>
    <span class="flex">
      <span class="text-slate-50 font-bold min-w-[2ch] text-right">{{
        String(secondsRemaining).padStart(2, '0')
      }}</span>
      <span class="text-slate-100/75 font-normal">S</span>
    </span>
  </div>
</template>
