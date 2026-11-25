<!--
  The app's own Countdown (components/Event/Countdown.vue), copied unchanged: days, hours, minutes and seconds to an
  event's start, ticking every second, in light text for the live-event banner. Screens import
  `~/components/Event/Countdown.vue` and pass a Date; this file takes the start as text so the Playground can set it.
-->
<script setup lang="ts">
import { computed } from 'vue';
import Countdown from '~/components/Event/Countdown.vue';

const props = withDefaults(
  defineProps<{
    /**
     * When the event starts, as an ISO date and time (`2026-12-05T17:00:00Z`). Screens pass a `Date` as
     * `:target-date`. A time already past shows all zeros.
     */
    targetDate?: string;
  }>(),
  { targetDate: '2026-12-05T17:00:00Z' },
);

const target = computed(() => new Date(props.targetDate));
</script>

<template>
  <Countdown :target-date="target" />
</template>
