<!--
  Countdown sits in the live-event banner, on a dark background, in light text. Each example puts it on the
  same dark backdrop. Screens pass a Date: `<Countdown class="font-heading" :target-date="new Date(event.start)" />`.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
import Countdown from './countdown.vue';

// Fixed to the minute the page opens, so the examples always count down.
const inThreeDays = new Date(Date.now() + ((3 * 24 + 5) * 60 + 42) * 60 * 1000).toISOString();
const inFiveMinutes = new Date(Date.now() + 5 * 60 * 1000 + 30 * 1000).toISOString();
</script>

<template>
  <Example name="Default">
    <div class="bg-midnight-950 rounded-2xl px-6 py-4">
      <Countdown target-date="2026-12-05T17:00:00Z" />
    </div>
  </Example>

  <Example name="DaysAway">
    <div class="bg-midnight-950 rounded-2xl px-6 py-4 font-heading">
      <Countdown :target-date="inThreeDays" />
    </div>
  </Example>

  <Example name="StartingSoon">
    <div class="bg-midnight-950 rounded-2xl px-6 py-4 font-heading">
      <Countdown :target-date="inFiveMinutes" />
    </div>
  </Example>

  <Example name="Started">
    <div class="bg-midnight-950 rounded-2xl px-6 py-4 font-heading">
      <Countdown target-date="2026-11-01T17:00:00Z" />
    </div>
  </Example>
</template>
